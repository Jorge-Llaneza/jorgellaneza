// Key-value storage on IndexedDB with a localStorage-shaped synchronous API.
// Every site on jorgellaneza.es shares one database ("jorgellaneza", store "kv"),
// so the root page can export/import everything. This file is copied verbatim into
// each site directory; keep the copies identical.
//
// Usage: wait for KV.ready, then KV.getItem / setItem / removeItem as with localStorage.
// Reads come from an in-memory copy loaded at startup; writes go to IndexedDB in the background.
// On first run, anything left in localStorage is moved into IndexedDB.
// It also asks for persistent storage (see `persisted` below).
(function () {
  "use strict";
  const DB_NAME = "jorgellaneza";
  const STORE = "kv";
  const cache = new Map();
  let db = null;

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

  function tx(mode, fn) {
    if (!db) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      fn(t.objectStore(STORE));
      t.oncomplete = () => resolve();
      t.onerror = t.onabort = () => reject(t.error);
    });
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

  const ready = (async () => {
    try {
      db = await open();
      await loadAll();
    } catch (e) {
      // No IndexedDB (blocked, very old browser): run in memory for this visit.
      db = null;
    }
    try { await migrate(); } catch (e) { /* leave localStorage as it was */ }
  })();

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
      return cache.has(k) ? String(cache.get(k)) : null;
    },
    setItem(k, v) {
      v = String(v);
      cache.set(k, v);
      tx("readwrite", (s) => s.put(v, k)).catch(() => {});
    },
    removeItem(k) {
      cache.delete(k);
      tx("readwrite", (s) => s.delete(k)).catch(() => {});
    },
    // Whole-database snapshot, for backups.
    all() {
      return Object.fromEntries(cache);
    },
    // Replace the whole database with a snapshot. Resolves once it is written.
    async replaceAll(data) {
      await tx("readwrite", (s) => {
        s.clear();
        Object.keys(data).forEach((k) => s.put(String(data[k]), k));
      });
      cache.clear();
      Object.keys(data).forEach((k) => cache.set(k, String(data[k])));
    },
  };
})();
