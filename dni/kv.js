// Key-value storage on IndexedDB with a localStorage-shaped synchronous API.
// Every site on jorgellaneza.es shares one database ("jorgellaneza", store "kv"),
// so the root page can export/import everything. This file is copied verbatim into
// each site directory; keep the copies identical.
//
// Usage: wait for KV.ready, then KV.getItem / setItem / removeItem as with localStorage.
// Reads come from an in-memory copy loaded at startup; writes go to IndexedDB in the background.
// On first run, anything left in localStorage is moved into IndexedDB.
// It also asks for persistent storage (see `persisted` below).
//
// Optional sync: once FIREBASE below is filled in and the user signs in with Google
// (KV.account.signIn(), offered on the root page), the keys in SYNCED (the German games and
// notes) are mirrored to Firestore under users/{uid}/kv/{key} and merged across devices, the
// newest write of each key winning. Every other key stays on this device, and the other apps
// never touch the network. IndexedDB stays what the apps read from, so everything still
// works offline.
(function () {
  "use strict";
  const DB_NAME = "jorgellaneza";
  const STORE = "kv";
  const cache = new Map();
  let db = null;

  // Firebase project for sync: Project settings > General > Your apps > Web app. These values
  // are public by design; the Firestore rules keep each user to their own documents, and only
  // the listed Google accounts may sync at all:
  //
  //   rules_version = '2';
  //   service cloud.firestore {
  //     match /databases/{database}/documents {
  //       // Who may sync. To open it to any Google account, make this `return request.auth != null;`.
  //       function allowed() {
  //         return request.auth != null
  //           && request.auth.token.email_verified == true
  //           && request.auth.token.email in ['tu-correo@gmail.com'];
  //       }
  //       match /users/{uid}/kv/{key} {
  //         allow read: if allowed() && request.auth.uid == uid;
  //         allow write: if allowed() && request.auth.uid == uid
  //           && request.resource.data.keys().hasOnly(['k', 'v', 't', 's'])
  //           && request.resource.data.k is string
  //           && (request.resource.data.v == null
  //               || (request.resource.data.v is string && request.resource.data.v.size() <= 1000000))
  //           && request.resource.data.t is int
  //           && request.resource.data.s == request.time
  //           // Older than what is stored: another device wrote later, so kv.js pulls instead.
  //           && (resource == null || request.resource.data.t > resource.data.t);
  //       }
  //     }
  //   }
  //
  // While apiKey is empty, sync is off and nothing in this file touches the network.
  const FIREBASE = { apiKey: "AIzaSyDpQA26QJJOfMqTAPtrivbm38pTa9hC3Tk", authDomain: "jorgellaneza-es.firebaseapp.com", projectId: "jorgellaneza-es", appId: "1:1001258307299:web:d59456e2cf54275d9cbfd6" };
  const SDK = "https://www.gstatic.com/firebasejs/13.2.0/";
  // Only these keys go to Firestore: aleman/sustantivos, aleman/verbos, aleman/worts and notes.
  const SYNCED = new Set(["substantive-v1", "verben-v1", "woerter-v1", "notes-trainer.v1"]);
  // Only those apps sync, plus the root page, which has the sign-in and the backup buttons.
  const SYNC = !!FIREBASE.apiKey && /^\/(index\.html)?$|^\/(aleman|notes)\//.test(location.pathname);

  function req(r) {
    return new Promise((resolve, reject) => {
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  function open() {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    return req(r);
  }

  function run(d, store, mode, fn) {
    if (!d) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const t = d.transaction(store, mode);
      fn(t.objectStore(store));
      t.oncomplete = () => resolve();
      t.onerror = t.onabort = () => reject(t.error);
    });
  }

  function tx(mode, fn) {
    return run(db, STORE, mode, fn);
  }

  async function loadAll() {
    if (!db) return;
    const t = db.transaction(STORE, "readonly").objectStore(STORE);
    const [keys, vals] = await Promise.all([req(t.getAllKeys()), req(t.getAll())]);
    keys.forEach((k, i) => cache.set(k, vals[i]));
  }

  // Move localStorage leftovers into IndexedDB. IndexedDB wins if both have a key.
  async function migrate() {
    let legacy = [];
    try {
      for (let i = 0; i < localStorage.length; i++) legacy.push(localStorage.key(i));
    } catch (e) { return; }
    if (!db) {
      // In-memory mode: still show what localStorage has, but don't move it.
      legacy.forEach((k) => cache.set(k, localStorage.getItem(k)));
      return;
    }
    if (!legacy.length) return;
    const moved = {};
    legacy.forEach((k) => {
      if (!cache.has(k)) moved[k] = localStorage.getItem(k);
    });
    await tx("readwrite", (s) => Object.keys(moved).forEach((k) => s.put(moved[k], k)));
    Object.keys(moved).forEach((k) => cache.set(k, moved[k]));
    legacy.forEach((k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } });
  }

  // ---- Sync ----
  // For each key we remember when it last changed (t, ms since epoch) and whether Firestore
  // still lacks that change (d). This lives in a second database so backups never see it,
  // along with the session ("auth") and the server time of the last pull ("since").
  const meta = { db: null, auth: null, since: 0, stamps: new Map() };
  const read = new Set(); // keys this page has read or written: a remote change to one means reloading
  const account = { state: "off", error: "", lastSync: 0 };
  let started = false;
  const DOCS = "https://firestore.googleapis.com/v1/projects/" + FIREBASE.projectId + "/databases/(default)/documents";
  const NAME = "projects/" + FIREBASE.projectId + "/databases/(default)/documents";
  const MAX = 1000000; // bytes; Firestore caps a document at 1 MiB

  async function loadMeta() {
    const r = indexedDB.open(DB_NAME + "-sync", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("meta");
    meta.db = await req(r);
    const s = meta.db.transaction("meta", "readonly").objectStore("meta");
    const [keys, vals] = await Promise.all([req(s.getAllKeys()), req(s.getAll())]);
    keys.forEach((k, i) => {
      if (k === "auth") meta.auth = vals[i];
      else if (k === "since") meta.since = vals[i];
      else if (k.startsWith("t:")) meta.stamps.set(k.slice(2), vals[i]);
    });
  }

  // entries: [key, value] pairs; an undefined value deletes the key.
  function metaPut(entries) {
    if (!entries.length) return Promise.resolve();
    return run(meta.db, "meta", "readwrite", (s) =>
      entries.forEach(([k, v]) => (v === undefined ? s.delete(k) : s.put(v, k))));
  }

  function setState(state, error) {
    account.state = state;
    account.error = error || "";
    window.dispatchEvent(new Event("kv-account"));
  }

  // Record local changes to these keys and schedule sending them.
  function touch(keys) {
    if (!meta.db) return;
    keys = keys.filter((k) => SYNCED.has(k));
    if (!keys.length) return;
    const now = Date.now();
    metaPut(keys.map((k) => {
      const m = { t: Math.max(now, ((meta.stamps.get(k) || {}).t || 0) + 1), d: 1 };
      meta.stamps.set(k, m);
      return ["t:" + k, m];
    })).catch(() => {});
    schedule();
  }

  // At most one sync every 10 s while the user keeps changing things; leaving the page sends
  // whatever is still pending.
  let timer = 0;
  function schedule() {
    if (!meta.auth || timer) return;
    timer = setTimeout(() => { timer = 0; sync(false); }, 10000);
  }

  // Firestore document ids can't contain "/" and a few other shapes; odd keys go hex-encoded.
  // The real key is also stored in the document, so the id is never decoded.
  function docId(k) {
    if (/^[\w.-]{1,400}$/.test(k) && !/^(\.\.?|__.*__)$/.test(k)) return k;
    return "~" + Array.from(new TextEncoder().encode(k), (b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Firestore timestamps carry up to nanoseconds, which Date.parse doesn't promise to read.
  const ms = (ts) => Date.parse(ts.replace(/(\.\d{3})\d+/, "$1"));

  const GONE = ["TOKEN_EXPIRED", "USER_DISABLED", "USER_NOT_FOUND", "INVALID_REFRESH_TOKEN"];

  // A fresh ID token, from the stored refresh token. The Firebase SDK is only loaded to sign
  // in; after that the REST endpoints are enough.
  async function token() {
    const a = meta.auth;
    if (a.token && a.exp > Date.now() + 60000) return a.token;
    const r = await fetch("https://securetoken.googleapis.com/v1/token?key=" + FIREBASE.apiKey, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(a.refresh),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const code = (j.error && j.error.message) || "";
      if (GONE.some((c) => code.startsWith(c))) {
        await forget();
        throw new Error("Signed out (" + code + "). Sign in again.");
      }
      throw new Error("Could not refresh the session (" + (code || r.status) + ").");
    }
    Object.assign(a, { token: j.id_token, refresh: j.refresh_token, exp: Date.now() + Number(j.expires_in) * 1000 });
    await metaPut([["auth", a]]);
    return a.token;
  }

  async function api(url, body, keepalive) {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Bearer " + (await token()), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: !!keepalive,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error("Firestore said " + r.status + ((j.error && ": " + j.error.message) || ""));
      e.status = r.status;
      throw e;
    }
    return j;
  }

  // Fetch what changed in Firestore since the last pull (everything when full) and merge it.
  // Returns the keys whose value changed here.
  async function pull(full) {
    const q = { from: [{ collectionId: "kv" }] };
    if (!full && meta.since) {
      // A minute of overlap covers writes stamped just before the last read; merging a
      // document twice is harmless.
      q.where = { fieldFilter: { field: { fieldPath: "s" }, op: "GREATER_THAN",
        value: { timestampValue: new Date(meta.since - 60000).toISOString() } } };
    }
    const rows = await api(DOCS + "/users/" + meta.auth.uid + ":runQuery", { structuredQuery: q });
    const seen = new Set(), changed = [], stamps = [], puts = [], dels = [];
    let since = meta.since;
    rows.forEach((row) => {
      if (row.readTime) since = Math.max(since, ms(row.readTime));
      const f = row.document && row.document.fields;
      if (!f || !f.k) return;
      const k = f.k.stringValue;
      if (!SYNCED.has(k)) return;
      const t = Number(f.t && f.t.integerValue) || 0;
      const v = f.v && "stringValue" in f.v ? f.v.stringValue : null;
      const local = meta.stamps.get(k) || { t: 0, d: 0 };
      seen.add(k);
      if (t < local.t) {
        // Ours is newer: make sure it goes up.
        if (!local.d) { local.d = 1; meta.stamps.set(k, local); stamps.push(["t:" + k, local]); }
        return;
      }
      const cur = cache.has(k) ? String(cache.get(k)) : null;
      if (v !== cur) {
        if (v === null) { cache.delete(k); dels.push(k); } else { cache.set(k, v); puts.push([k, v]); }
        changed.push(k);
      }
      const m = { t, d: 0 };
      meta.stamps.set(k, m);
      stamps.push(["t:" + k, m]);
    });
    if (full) {
      // Whatever only this device has goes up.
      cache.forEach((v, k) => {
        if (seen.has(k) || !SYNCED.has(k)) return;
        const m = meta.stamps.get(k) || { t: 0 };
        m.d = 1;
        meta.stamps.set(k, m);
        stamps.push(["t:" + k, m]);
      });
    }
    await tx("readwrite", (s) => {
      puts.forEach(([k, v]) => s.put(v, k));
      dels.forEach((k) => s.delete(k));
    });
    meta.since = since;
    await metaPut(stamps.concat([["since", since]]));
    return changed;
  }

  // Send up to 400 pending keys in one commit (a removed key goes up as v: null).
  // Resolves to true if more are left.
  async function push(keepalive) {
    const sent = [], writes = [];
    let more = false;
    meta.stamps.forEach((m, k) => {
      if (!m.d || !SYNCED.has(k)) return;
      if (writes.length >= 400) { more = true; return; }
      const v = cache.has(k) ? String(cache.get(k)) : null;
      if (v !== null && v.length * 3 > MAX && new Blob([v]).size > MAX) {
        console.warn("kv.js: " + k + " is over 1 MB and stays on this device only.");
        return;
      }
      sent.push([k, m.t]);
      writes.push({
        update: {
          name: NAME + "/users/" + meta.auth.uid + "/kv/" + docId(k),
          fields: {
            k: { stringValue: k },
            v: v === null ? { nullValue: null } : { stringValue: v },
            t: { integerValue: String(m.t) },
          },
        },
        updateTransforms: [{ fieldPath: "s", setToServerValue: "REQUEST_TIME" }],
      });
    });
    if (!writes.length) return false;
    await api(DOCS + ":commit", { writes }, keepalive);
    const done = [];
    sent.forEach(([k, t]) => {
      const m = meta.stamps.get(k);
      if (m && m.t === t) { m.d = 0; done.push(["t:" + k, m]); }
    });
    await metaPut(done);
    return more;
  }

  async function syncOnce(full) {
    setState("syncing");
    try {
      let changed = await pull(full || !meta.since);
      try {
        while (await push());
      } catch (e) {
        // The rules refuse writes older than what Firestore has: another device got there
        // first. Take its changes and send the rest.
        if (e.status !== 403) throw e;
        changed = changed.concat(await pull(false));
        while (await push());
      }
      account.lastSync = Date.now();
      setState("ok");
      // The app already read the old value into memory and would write it back over the
      // new one, so start it again on the merged data.
      if (started && changed.some((k) => read.has(k))) location.reload();
    } catch (e) {
      if (!meta.auth) return;
      setState(navigator.onLine === false ? "offline" : "error", e && e.message ? e.message : String(e));
    }
  }

  // Pull, then push. One run at a time; a call during a run queues one more.
  let running = null, queued = false;
  function sync(full) {
    if (!meta.auth) return Promise.resolve();
    if (running) { queued = true; return running; }
    running = (async () => {
      do { queued = false; await syncOnce(full); full = false; } while (queued && meta.auth);
      running = null;
    })();
    return running;
  }

  async function forget() {
    meta.auth = null;
    meta.since = 0;
    clearTimeout(timer);
    timer = 0;
    await metaPut([["auth", undefined], ["since", undefined]]);
    setState("signedout");
  }

  // The SDK only signs in, with nothing persisted on its side: the session it hands over
  // (uid, refresh token) is kept in the sync database and used from every site.
  let sdk = null, sdkLoading = null, auth = null;
  function loadSdk() {
    sdkLoading = sdkLoading || Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-auth.js")])
      .then(([F, A]) => {
        auth = A.initializeAuth(F.initializeApp(FIREBASE, "kv"), {
          persistence: A.inMemoryPersistence,
          popupRedirectResolver: A.browserPopupRedirectResolver,
        });
        sdk = A;
        return A;
      })
      .catch((e) => { sdkLoading = null; throw e; });
    return sdkLoading;
  }

  function signIn() {
    if (!meta.db) return Promise.reject(new Error(SYNC ? "This browser is blocking storage." : "Sync is not set up."));
    // Safari only opens the popup straight from a click, so this must not wait on anything
    // when the SDK is already loaded (KV.account.prepare()).
    if (!sdk) return loadSdk().then(signIn);
    return sdk.signInWithPopup(auth, new sdk.GoogleAuthProvider()).then(async ({ user }) => {
      const r = await user.getIdTokenResult();
      meta.auth = { uid: user.uid, email: user.email || "", refresh: user.refreshToken, token: r.token, exp: Date.parse(r.expirationTime) };
      meta.since = 0;
      await metaPut([["auth", meta.auth], ["since", undefined]]);
      await sync(true);
    });
  }

  async function signOut() {
    if (!meta.auth) return;
    await sync(false);
    await forget();
  }

  if (SYNC) {
    document.addEventListener("visibilitychange", () => {
      if (!meta.auth) return;
      if (document.visibilityState === "hidden") {
        clearTimeout(timer);
        timer = 0;
        // No time to refresh a token here; anything left goes up on the next visit.
        if (meta.auth.token && meta.auth.exp > Date.now() + 60000) push(true).catch(() => {});
      } else {
        sync(false);
      }
    });
    window.addEventListener("online", () => sync(false));
  }

  const ready = (async () => {
    try {
      db = await open();
      await loadAll();
    } catch (e) {
      // No IndexedDB (blocked, very old browser): run in memory for this visit.
      db = null;
    }
    try { await migrate(); } catch (e) { /* leave localStorage as it was */ }
    if (SYNC && db) {
      try { await loadMeta(); } catch (e) { meta.db = null; }
      if (meta.db) setState(meta.auth ? "ok" : "signedout");
      // Start the app on merged data, but don't keep it waiting on a slow network: a pull
      // that finishes later reloads the page if it changed anything the app read.
      if (meta.auth) await Promise.race([sync(false), new Promise((r) => setTimeout(r, 5000))]);
    }
  })().then(() => { started = true; });

  // Ask the browser not to evict the database under storage pressure (and, in Safari,
  // after 7 days without a visit). Firefox asks the user once; Chrome and Safari decide
  // on their own, mostly based on whether the site is installed or bookmarked.
  const persisted = ready.then(async () => {
    if (!db || !navigator.storage || !navigator.storage.persist) return false;
    try {
      return (await navigator.storage.persisted()) || (await navigator.storage.persist());
    } catch (e) {
      return false;
    }
  });

  window.KV = {
    ready,
    // false when IndexedDB is unavailable and data only lives for this visit
    get persistent() { return !!db; },
    // Resolves to true once the browser has agreed to keep the data
    persisted,
    getItem(k) {
      read.add(k);
      return cache.has(k) ? String(cache.get(k)) : null;
    },
    setItem(k, v) {
      v = String(v);
      read.add(k);
      const same = cache.get(k) === v;
      cache.set(k, v);
      tx("readwrite", (s) => s.put(v, k)).catch(() => {});
      if (!same) touch([k]);
    },
    removeItem(k) {
      const had = cache.delete(k);
      tx("readwrite", (s) => s.delete(k)).catch(() => {});
      if (had) touch([k]);
    },
    // Whole-database snapshot, for backups.
    all() {
      return Object.fromEntries(cache);
    },
    // Replace the whole database with a snapshot. Resolves once it is written.
    async replaceAll(data) {
      const keys = new Set([...cache.keys(), ...Object.keys(data)]);
      await tx("readwrite", (s) => {
        s.clear();
        Object.keys(data).forEach((k) => s.put(String(data[k]), k));
      });
      cache.clear();
      Object.keys(data).forEach((k) => cache.set(k, String(data[k])));
      touch([...keys]);
    },
    // Google sign-in and Firestore sync. state: "off" (not set up or no storage),
    // "signedout", "syncing", "ok", "offline" or "error" (see error). Every change fires
    // a "kv-account" event on window.
    account: {
      get state() { return account.state; },
      get error() { return account.error; },
      get email() { return meta.auth ? meta.auth.email : ""; },
      // ms timestamp of the last successful sync on this page, 0 if none yet
      get lastSync() { return account.lastSync; },
      // Load the sign-in code ahead of the click, so the popup isn't blocked.
      prepare() { if (meta.db && !meta.auth) loadSdk().catch(() => {}); },
      signIn,
      signOut,
      sync: () => sync(false),
    },
  };
})();
