
'use strict';

/* ───────────────────────── 1. Utilities ───────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
let RNG = Math.random;
const seedRNG = seed => { let a = seed >>> 0; RNG = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const unseedRNG = () => { RNG = Math.random; };
const pick = arr => arr[Math.floor(RNG() * arr.length)];
const randInt = (a, b) => a + Math.floor(RNG() * (b - a + 1));
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(RNG() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = s => {
  const t = Math.max(0, Math.ceil(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

// WCAG contrast helpers
const parseColor = str => {
  const m = String(str).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { r, g, b, a };
};
const relLum = ({ r, g, b }) => {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrastRatio = (a, b) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const toHex = ({ r, g, b }) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const effectiveBg = el => {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const c = parseColor(getComputedStyle(n).backgroundColor);
    if (c && c.a > 0.5) return c;
  }
  return { r: 255, g: 255, b: 255, a: 1 };
};

const Store = {
  best() { try { return Number(localStorage.getItem('uxg.best')) || 0; } catch { return 0; } },
  save(v) { try { if (v > this.best()) localStorage.setItem('uxg.best', String(v)); } catch { /* private mode */ } }
};

/* ───────────────────────── 2. Rule data ───────────────────────── */
// Every violation the player can cite. Sources point at the course units.
const CATEGORIES = [
  { id: 'contrast', group: 'Accessibility', name: 'Insufficient contrast',
    rule: 'Normal text needs at least 4.5 : 1 against its background (3 : 1 for large text). Do not trust your eyes: use the contrast probe.',
    src: 'The Human Factor · Colours' },
  { id: 'color', group: 'Accessibility', name: 'Colour-only coding',
    rule: 'About 8% of men and 1% of women have a colour deficiency. Avoid red-green, blue-yellow, green-blue and red-blue pairs, avoid bright colours on big areas, and always add a redundant code (shape, icon, text).',
    src: 'The Human Factor · Colours, Redundant codes' },
  { id: 'text', group: 'Accessibility', name: 'Text legibility',
    rule: 'Font size at least 11, proportional line spacing, no complicated fonts, and never write whole phrases in capital letters.',
    src: 'The Human Factor · Visual system restrictions' },
  { id: 'target', group: 'Accessibility', name: 'Target size and distance',
    rule: 'Fitts’ law: T = 0.1 · log₂(D / A + 1). Large targets close to the pointer are fast; small, distant ones are slow. Submenus must open next to their parent.',
    src: 'The Human Factor · Fitts’ law' },
  { id: 'keyboard', group: 'Accessibility', name: 'Keyboard and tab order',
    rule: 'Tab must walk through the controls in a logical, visual order. Expert users move between fields with the keyboard.',
    src: 'The Human Factor · GOMS (Gmail login)' },
  { id: 'status', group: 'Usability', name: 'Visibility of system status',
    rule: 'Observability: the interface shows the internal state. If the response is slow, tell the user the request is being processed (progress, percentage, time left). Changes should show immediately (synthesis).',
    src: 'Foundations · Robustness c.1 and c.3, Synthesis' },
  { id: 'realworld', group: 'Usability', name: 'Match with the real world',
    rule: 'Familiarity: use words, metaphors and concepts the user already knows. No jargon, no double negatives.',
    src: 'Foundations · Learnability a.3' },
  { id: 'control', group: 'Usability', name: 'User control and recoverability',
    rule: 'The user must be able to reach the goal after an error: cancel, undo, redo. Proportional effort: if an action is hard to undo, it must also be hard to do.',
    src: 'Foundations · Robustness c.2, STM aids' },
  { id: 'consistency', group: 'Usability', name: 'Consistency and standards',
    rule: 'A mechanism must work and be named the same way everywhere. Follow the style guide, keep one look and feel, and do not rename or move what users already know.',
    src: 'Foundations · Learnability a.4' },
  { id: 'prevention', group: 'Usability', name: 'Error prevention',
    rule: 'Make risky actions explicit: say what will happen, to what, and whether it can be reversed. Keep destructive controls away from frequent ones.',
    src: 'Foundations · Robustness, initiative in the dialog' },
  { id: 'recognition', group: 'Usability', name: 'Recognition over recall',
    rule: 'Short-term memory holds 7 ± 2 items. Never force users to remember data from a previous screen or retype it. Prefer lists, menus, visible labels, tooltips and visible shortcuts.',
    src: 'The Human Factor · Human processor (STM / LTM)' },
  { id: 'flexibility', group: 'Usability', name: 'Flexibility and customisation',
    rule: 'Let users (and the system) adapt the interface to preferences and experience, and always provide a way back to the default state.',
    src: 'Foundations · Flexibility b.4' },
  { id: 'minimal', group: 'Usability', name: 'Minimalist design, choice overload',
    rule: 'Hick’s law: decision time grows with log₂(n + 1). Every extra option costs time; group or remove what is not needed.',
    src: 'The Human Factor · Hick’s law' },
  { id: 'errors', group: 'Usability', name: 'Helpful error messages',
    rule: 'Say what went wrong in plain language, without blame, and say how to fix it. No raw codes.',
    src: 'Foundations · Robustness' },
  { id: 'prediction', group: 'Usability', name: 'Prediction and synthesis',
    rule: 'Prediction: the first experience is enough to guess what later actions will do, and the screen shows which operations are available now and what comes next. Synthesis: the system tells the user about every change it makes, ideally at once.',
    src: 'Foundations · Learnability a.1 and a.2' }
];
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const PERSONAS = [
  { who: 'Antonio, 74, retired, first time online', env: 'Home PC, small screen, unsteady mouse hand' },
  { who: 'Lucía, 29, nurse', env: 'Phone in bright daylight, one hand free' },
  { who: 'Marcos, 41, accountant, red-green colour blind', env: 'Office desktop, keyboard-first' },
  { who: 'Noa, 17, student', env: 'Phone on the bus, gives up after ten seconds' },
  { who: 'Jaime, 23, student, occasional user', env: 'Laptop in a noisy café, multitasking' }
];
const DESIGNERS = ['Dr. Quill', 'M. Okafor', 'R. Tanaka', 'S. Lindqvist', 'P. Alvarez', 'J. Whitcombe'];

/* ───────────────────── 3. Mock UI templates ─────────────────────
   Each template has:
     regions  – every element a player may cite (decoys included)
     defects  – injectable flaws: { region, cat, label, why }
     build(h) – returns HTML; h('key') tells whether a flaw is active
   Elements carry data-region so the game can map clicks to flaws.     */
const TEMPLATES = {

  login: {
    id: 'login', name: 'SecureBank staff portal', url: 'portal.securebank.example/login',
    style: ['One large primary button (at least 44 px tall) ends the form.', 'Body text is never below 12 px.'],
    regions: { form: 'Whole form (tab sequence)', title: 'Page title', error: 'Error message', username: 'Username field', password: 'Password field', remember: '“Remember me” option', forgot: '“Forgot password” link', submit: 'Sign-in button', note: 'Session notice' },
    defects: {
      allCaps: { region: 'title', cat: 'text', label: 'Title set in capitals with an ornate font', why: 'Capitals and decorative typefaces slow reading. Use sentence case and a plain proportional font.' },
      noLabel: { region: 'username', cat: 'recognition', label: 'Username field has only a placeholder', why: 'The hint vanishes as soon as the user types, so they must remember what the field is for. Keep a visible label.' },
      colorOnly: { region: 'password', cat: 'color', label: 'Invalid password is signalled only by a red border', why: 'Users with colour deficiency may miss it. Add a redundant code: an icon and a text message.' },
      lowContrast: { region: 'forgot', cat: 'contrast', label: 'Pale grey link on white (about 2 : 1)', why: 'Normal text needs 4.5 : 1. The contrast probe shows the real ratio.' },
      tinyTarget: { region: 'submit', cat: 'target', label: 'Sign-in button is a 52 × 18 px sliver', why: 'Small targets are slow to hit (Fitts’ law) and hard for unsteady hands. Primary buttons must be large.' },
      tinyText: { region: 'note', cat: 'text', label: 'Session notice in 8 px text', why: 'Font size should be at least 11, and the house guide asks for 12.' },
      cryptic: { region: 'error', cat: 'errors', label: 'Raw error code instead of an explanation', why: 'Errors must say what went wrong and how to fix it, in plain words.' },
      tabOrder: { region: 'form', cat: 'keyboard', label: 'Tab order jumps around the form', why: 'Tab goes password → button → username → … Keyboard users expect the visual order.' }
    },
    build: h => {
      const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
      return `
      <form class="m-card" data-region="form" onsubmit="return false">
        <h2 data-region="title"${h('allCaps') ? ` style="text-transform:uppercase;font-family:'Old English Text MT',UnifrakturCook,Luminari,fantasy;letter-spacing:.12em"` : ''}>Sign in to SecureBank</h2>
        <div class="m-alert" data-region="error"><b>✕</b> ${h('cryptic') ? 'Error 0x80070057 (ERR_AUTH_17)' : 'We couldn’t sign you in: that password doesn’t match this username. Check it, or reset it below.'}</div>
        <div data-region="username">
          ${h('noLabel') ? '' : '<label for="u">Username</label>'}
          <input id="u" placeholder="${h('noLabel') ? 'Username' : 'e.g. jsmith'}"${ti(3)}>
        </div>
        <div data-region="password">
          <label for="p">Password</label>
          <input id="p" type="password" value="abc" class="invalid"${ti(1)}>
          ${h('colorOnly') ? '' : '<small class="m-err">✕ Use at least 8 characters</small>'}
        </div>
        <div class="m-check" data-region="remember"><label><input type="checkbox"${ti(4)}> Remember me on this computer</label></div>
        <p><a href="#" data-region="forgot"${ti(5)}${h('lowContrast') ? ' style="color:#b8b8b8"' : ''}>Forgot your password?</a></p>
        <span data-region="submit">${h('tinyTarget')
          ? `<button class="m-btn" style="min-height:0;height:18px;width:52px;padding:0;font-size:11px"${ti(2)}>Sign in</button>`
          : `<button class="m-btn wide"${ti(2)}>Sign in</button>`}</span>
        <p data-region="note" style="margin-top:12px;font-size:${h('tinyText') ? 8 : 13}px;color:#4a5560">Sessions expire after 10 minutes of inactivity.</p>
      </form>`;
    }
  },

  delete: {
    id: 'delete', name: 'DocVault file manager', url: 'docvault.example/files',
    style: ['Cancel sits on the left, the primary action on the right.', 'Destructive actions are always called “Delete”.'],
    regions: { toolbar: 'Toolbar', sidebar: 'Folder tree', list: 'File list', dialogText: 'Dialog text', dialogButtons: 'Dialog buttons' },
    defects: {
      eraseLabel: { region: 'toolbar', cat: 'consistency', label: 'Toolbar says “Erase” where the style guide says “Delete”', why: 'Renaming a known action breaks consistency; users must relearn it.' },
      statusColor: { region: 'list', cat: 'color', label: 'Sync status shown only by green and red dots', why: 'Red and green are the classic confusable pair. Add text or a shape.' },
      doubleNeg: { region: 'dialogText', cat: 'realworld', label: 'Double-negative confirmation text', why: 'Users should read plain language. Nobody should have to solve a logic puzzle to keep a file.' },
      vague: { region: 'dialogText', cat: 'prevention', label: 'Dialog says only “Delete?”: no file name, no hint about undo', why: 'A risky action must say what will happen, to what, and whether it can be reversed.' },
      noCancel: { region: 'dialogButtons', cat: 'control', label: 'Only an “OK” button: no way out', why: 'Users need a cancel route. Control and freedom, recoverability.' },
      swapped: { region: 'dialogButtons', cat: 'consistency', label: 'Cancel and primary buttons in the wrong order', why: 'The style guide puts Cancel left and the primary action right. Moving them invites mis-clicks.' }
    },
    build: h => {
      const status = (cls, txt) => `<span class="dot ${cls}"></span>${h('statusColor') ? '' : txt}`;
      const text = h('doubleNeg')
        ? 'Do you not want to avoid keeping “Q3-report.docx”? Choose “No” to not delete it.'
        : h('vague') ? 'Delete?'
        : 'Delete “Q3-report.docx”? It moves to the Trash and can be restored for 30 days.';
      const buttons = h('noCancel')
        ? '<button class="m-btn">OK</button>'
        : h('swapped')
          ? '<button class="m-btn danger">Delete</button><button class="m-btn secondary">Cancel</button>'
          : '<button class="m-btn secondary">Cancel</button><button class="m-btn danger">Delete</button>';
      return `
      <div class="m-toolbar" data-region="toolbar">
        <button class="m-btn s">Upload</button><button class="m-btn s">Rename</button>
        <button class="m-btn s danger">${h('eraseLabel') ? 'Erase' : 'Delete'}</button>
      </div>
      <div class="m-cols">
        <ul class="m-tree" data-region="sidebar"><li>📁 Reports</li><li>📁 Invoices</li><li>📁 Archive</li></ul>
        <table class="m-table" data-region="list">
          <thead><tr><th>Name</th><th>Size</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Q3-report.docx</td><td>212 KB</td><td>${status('ok', 'Synced')}</td></tr>
            <tr><td>budget.xlsx</td><td>88 KB</td><td>${status('bad', 'Sync error')}</td></tr>
            <tr><td>logo.png</td><td>34 KB</td><td>${status('ok', 'Synced')}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="m-dialog" role="dialog" aria-label="Confirmation">
        <p data-region="dialogText">${text}</p>
        <div class="m-btnrow" data-region="dialogButtons">${buttons}</div>
      </div>`;
    }
  },

  seats: {
    id: 'seats', name: 'SkyHop check-in', url: 'skyhop.example/seats',
    style: ['Every seat state has a colour and a symbol.', 'Main buttons are large and sit directly below the content they confirm.'],
    regions: { legend: 'Seat legend', seatmap: 'Seat map', price: 'Seat fee', continue: 'Continue button' },
    defects: {
      colorOnly: { region: 'seatmap', cat: 'color', label: 'Seat states differ only by red, green and orange', why: 'Red and green look alike to many users. Use redundant codes, such as a tick, a star or a cross, as in the “good” example slide.' },
      tinySeats: { region: 'seatmap', cat: 'target', label: 'Seats are 10 px squares', why: 'Tiny targets are slow and error-prone (Fitts’ law).' },
      noLegend: { region: 'legend', cat: 'recognition', label: 'No legend: users must guess what the symbols mean', why: 'Recognition beats recall. Show a legend next to the map.' },
      lowPrice: { region: 'price', cat: 'contrast', label: 'Price in pale khaki on white (under 2 : 1)', why: 'Important information must meet 4.5 : 1.' },
      farContinue: { region: 'continue', cat: 'target', label: 'Tiny Continue button far from the seat map', why: 'Distance and size drive pointing time. The main action should be big and close.' }
    },
    build: h => {
      const kind = (r, c) => (r === 2 && c === 1) ? 'me' : ((r * 7 + c * 3) % 5 === 0 ? 'x' : ((r + c) % 4 === 1 ? 'p' : 'f'));
      const glyph = { x: '✕', p: '★', me: '✓', f: '' };
      const g = k => (h('colorOnly') ? '' : glyph[k]);
      let cells = '';
      for (let r = 1; r <= 6; r++) {
        for (let c = 0; c < 3; c++) cells += `<span class="seat s-${kind(r, c)}">${g(kind(r, c))}</span>`;
        cells += `<span class="aisle">${r}</span>`;
        for (let c = 3; c < 6; c++) cells += `<span class="seat s-${kind(r, c)}">${g(kind(r, c))}</span>`;
      }
      const L = (k, t) => `<span><i class="seat s-${k}">${g(k)}</i>${t}</span>`;
      const legend = h('noLegend')
        ? '<p data-region="legend" style="font-size:14px">Tap a seat to choose it.</p>'
        : `<div class="m-legend" data-region="legend">${L('f', 'Free')}${L('p', 'Premium legroom')}${L('x', 'Taken')}${L('me', 'Your seat')}</div>`;
      const cont = h('farContinue')
        ? `<div style="text-align:right;margin-top:90px"><span data-region="continue"><button class="m-btn" style="min-height:0;height:18px;padding:0 6px;font-size:11px">Continue</button></span></div>`
        : `<span data-region="continue"><button class="m-btn wide">Continue to payment</button></span>`;
      return `
      <h2>Choose your seat · Flight SH 204</h2>
      <div class="${h('colorOnly') ? 'sm-col' : 'sm-sym'}">
        ${legend}
        <div class="m-seatmap" data-region="seatmap" style="--seat:${h('tinySeats') ? 10 : 34}px">${cells}</div>
      </div>
      <p data-region="price" style="color:${h('lowPrice') ? '#c9c9a0' : '#1d2530'}">Seat fee: €12 · Trip total: €142</p>
      ${cont}`;
    }
  },

  checkout: {
    id: 'checkout', name: 'ShopSphere checkout', url: 'shopsphere.example/checkout',
    style: ['Never ask for something the user already told us: pre-fill it or offer a list.', 'Quiet secondary actions are kept away from the primary one.'],
    regions: { banner: 'Promotion banner', card: 'Card number field', country: 'Country field', shipping: 'Shipping options', total: 'Order total', submit: '“Place order” button', clear: '“Clear form” control' },
    defects: {
      bigBright: { region: 'banner', cat: 'color', label: 'Neon magenta and yellow over a large area', why: 'Avoid bright colours on big areas of the screen, and avoid hard-to-pair colours.' },
      retypeCard: { region: 'card', cat: 'recognition', label: 'Asks users to retype a card number from a previous page', why: 'Do not force users to remember data from another screen or retype it.' },
      freeCountry: { region: 'country', cat: 'recognition', label: 'Country must be typed as a 3-letter ISO code', why: 'Use lists and menus instead of forcing users to recall and type information.' },
      manyShipping: { region: 'shipping', cat: 'minimal', label: 'Fourteen shipping options with equal weight', why: 'Hick’s law: T = 0.15 · log₂(n + 1). Fourteen choices cost far more than three.' },
      lowTotal: { region: 'total', cat: 'contrast', label: 'Order total in light grey on white', why: 'Even large text needs 3 : 1; this barely reaches 1.8 : 1.' },
      farSubmit: { region: 'submit', cat: 'target', label: 'Tiny “Place order” button pushed far away', why: 'By Fitts’ law, time grows with distance and shrinks with size.' },
      adjacentClear: { region: 'clear', cat: 'prevention', label: '“Clear form” sits right next to the primary button with the same style', why: 'A destructive action beside the frequent one invites accidental data loss.' }
    },
    build: h => {
      const names = ['Standard', 'Express', 'Next-day', 'Pickup point', 'Locker', 'Economy', 'Priority', 'Weekend', 'Evening', 'Eco', 'Insured', 'Signature', 'Same-day', 'Freight'];
      const ships = h('manyShipping')
        ? `<div class="m-grid2">${names.map((n, i) => `<label><input type="radio" name="s"> ${n} · €${3 + i}</label>`).join('')}</div>`
        : ['Standard · 3–5 days · free', 'Express · 1–2 days · €6', 'Pickup point · free']
          .map((n, i) => `<label><input type="radio" name="s"${i === 0 ? ' checked' : ''}> ${n}</label>`).join('');
      const bannerStyle = h('bigBright') ? ' style="background:#ff00ff;color:#ffff00;font-size:28px;font-weight:700;padding:34px 14px"' : '';
      const card = h('retypeCard')
        ? '<label for="cc">Card number</label><input id="cc" placeholder="Type the number from the previous page"><small>It is not shown here. Please remember it from step 2.</small>'
        : '<label for="cc">Card number</label><input id="cc" value="•••• •••• •••• 4242" readonly><small>Saved in step 2 · <a href="#">change</a></small>';
      const country = h('freeCountry')
        ? '<label for="co">Country</label><input id="co" placeholder="3-letter code, e.g. ESP">'
        : '<label for="co">Country</label><select id="co"><option>Spain</option><option>France</option><option>Portugal</option></select>';
      const submit = h('farSubmit')
        ? `<span data-region="submit"><button class="m-btn" style="min-height:0;height:18px;padding:0 6px;font-size:11px">Place order</button></span>`
        : `<span data-region="submit"><button class="m-btn" style="min-width:180px">Place order</button></span>`;
      const clear = h('adjacentClear')
        ? `<span data-region="clear"><button class="m-btn">Clear form</button></span>`
        : `<span data-region="clear"><a href="#" class="m-link">Clear form</a></span>`;
      return `
      <div class="m-card" style="max-width:540px">
        <div data-region="banner" class="m-banner"${bannerStyle}>Free delivery on orders over €50</div>
        <h2>Checkout</h2>
        <div data-region="card">${card}</div>
        <div data-region="country">${country}</div>
        <p style="margin:14px 0 4px"><b>Shipping</b></p>
        <div data-region="shipping">${ships}</div>
        <p data-region="total" class="m-total" style="color:${h('lowTotal') ? '#c6c6c6' : '#1d2530'}">Total: €84.50</p>
        <div class="m-actions" style="${h('farSubmit') ? 'margin-top:90px;justify-content:flex-end' : ''}${h('adjacentClear') ? ';gap:4px;justify-content:flex-start' : ''}">${submit}${clear}</div>
      </div>`;
    }
  },

  portal: {
    id: 'portal', name: 'Nimbus intranet portal', url: 'intranet.nimbus.example/reports',
    style: ['The current page is always marked; menus open next to their parent.', 'Saving work is always called “Save”.'],
    regions: { navbar: 'Main navigation', submenu: 'Reports submenu', breadcrumb: 'Breadcrumb', iconbar: 'Icon toolbar', sidebar: 'Side menu', actions: 'Form buttons' },
    defects: {
      tooManyNav: { region: 'navbar', cat: 'minimal', label: 'Fifteen top-level menu items', why: 'Hick’s law: more options, slower decisions. Group them.' },
      noCurrent: { region: 'navbar', cat: 'status', label: 'Nothing shows which page is current', why: 'Visibility of system status: users should always see where they are.' },
      farSubmenu: { region: 'submenu', cat: 'target', label: 'Submenu opens far from its parent item', why: 'Submenu options must appear as close as possible to the pointer’s start position (Fitts’ law).' },
      iconOnly: { region: 'iconbar', cat: 'recognition', label: 'Cryptic icons without labels or tooltips', why: 'Users should recognise, not recall. Add labels.' },
      jargon: { region: 'sidebar', cat: 'realworld', label: 'Internal jargon in menu labels', why: 'Speak the user’s language: “Customers”, not “Tenant provisioning”.' },
      storeLabel: { region: 'actions', cat: 'consistency', label: 'Button says “Store” where the style guide says “Save”', why: 'Same action, same name, everywhere.' }
    },
    build: h => {
      const items = h('tooManyNav')
        ? ['Home', 'News', 'Reports', 'Teams', 'Tools', 'Docs', 'Wiki', 'Jobs', 'Forms', 'HR', 'IT', 'Legal', 'Maps', 'Perks', 'Events']
        : ['Home', 'Reports', 'Teams', 'Tools', 'Help'];
      const nav = items.map(n => {
        const cur = n === 'Reports' && !h('noCurrent') ? ' class="cur" aria-current="page"' : '';
        const sub = n === 'Reports'
          ? `<ul class="m-sub" data-region="submenu"${h('farSubmenu') ? ' style="top:calc(100% + 150px);left:120px"' : ''}><li><a href="#">Quarterly summary</a></li><li><a href="#">Sales by region</a></li><li><a href="#">Exports</a></li><li><a href="#">Archive</a></li></ul>` : '';
        return `<li><a href="#"${cur}>${n}</a>${sub}</li>`;
      }).join('');
      const icons = h('iconOnly')
        ? '<button>⌘</button><button>⎘</button><button>⇪</button><button>⛭</button>'
        : '<button title="Copy">⎘ Copy</button><button title="Export">⇪ Export</button><button title="Print">⎙ Print</button><button title="Settings">⛭ Settings</button>';
      const side = h('jargon')
        ? ['Tenant provisioning', 'CRUD entities', 'Ledger reconciliation (ERP)'] : ['Customers', 'Invoices', 'Settings'];
      return `
      <nav data-region="navbar" aria-label="Main"><ul class="m-nav">${nav}</ul></nav>
      <p class="m-crumb" data-region="breadcrumb">Home › Reports › Quarterly summary</p>
      <div class="m-icons" data-region="iconbar">${icons}</div>
      <ul class="m-side" data-region="sidebar">${side.map(s => `<li>${s}</li>`).join('')}</ul>
      <div data-region="actions" style="display:flex;gap:10px"><button class="m-btn">${h('storeLabel') ? 'Store' : 'Save'}</button><button class="m-btn secondary">Cancel</button></div>`;
    }
  },

  installer: {
    id: 'installer', name: 'UpdateKit setup wizard', url: 'setup.updatekit.example/install',
    style: ['Long operations show progress and can be cancelled.', 'Messages explain the problem and how to fix it.'],
    regions: { progress: 'Progress area', message: 'Message box', settings: 'Options panel', terms: 'Licence text', actions: 'Wizard buttons' },
    defects: {
      noProgress: { region: 'progress', cat: 'status', label: 'Endless spinner with only “Working…”', why: 'Show percentage, step and time left. If a response is slow, notify the user that the request is being processed.' },
      noCancel: { region: 'actions', cat: 'control', label: 'All wizard buttons disabled: no cancel', why: 'Users must be able to leave a long operation.' },
      blame: { region: 'message', cat: 'errors', label: 'Message blames the user and gives no fix', why: 'Say what is wrong and how to fix it, without blame.' },
      denseText: { region: 'terms', cat: 'text', label: '9 px justified text with line spacing under 1', why: 'Use at least 11 px with proportional line spacing.' },
      noDefaults: { region: 'settings', cat: 'flexibility', label: 'Options panel has no “Restore defaults”', why: 'Customisation needs a way back to the default state.' }
    },
    build: h => {
      const terms = 'By installing this software you accept the licence terms. The vendor may update components automatically. You can change the update behaviour in Options at any time. ';
      return `
      <h2>Installing UpdateKit 4.2</h2>
      <div data-region="progress" style="margin-bottom:12px">${h('noProgress')
        ? '<span class="m-spin" aria-hidden="true">⟳</span> <span>Working…</span>'
        : '<progress value="45" max="100" style="height:18px;width:100%"></progress><p style="margin-top:6px">Copying files (3 of 7) · 45% · about 2 minutes left</p>'}</div>
      <div class="m-alert" data-region="message">${h('blame') ? 'Invalid input. You typed the wrong path.' : 'The folder D:\\Apps is read-only. Pick another folder or change its permissions.'}</div>
      <fieldset data-region="settings"><legend>Options</legend>
        <label><input type="checkbox" checked> Create a desktop shortcut</label>
        <label><input type="checkbox"> Check for updates daily</label>
        ${h('noDefaults') ? '' : '<button class="m-btn s secondary">Restore defaults</button>'}
      </fieldset>
      <p data-region="terms" style="${h('denseText') ? 'font-size:9px;line-height:.95;text-align:justify' : 'font-size:13px;line-height:1.5'}">${h('denseText') ? terms.repeat(3) : terms}</p>
      <div data-region="actions" style="display:flex;gap:10px">${h('noCancel')
        ? '<button class="m-btn" disabled>Back</button><button class="m-btn" disabled>Next</button>'
        : '<button class="m-btn secondary">Cancel</button>'}</div>`;
    }
  }
};

// Campaign structure, Papers-Please style: every morning a new order adds rules (and sometimes instruments).
// Only faults that break a rule already in force are ever put on a ship, so nothing unannounced is "wrong".
const TOOL_DAY = { flag: 1, contrast: 2, ruler: 4, cvd: 4, tab: 5, hand: 3 };
const DAYS = [
  { title: 'First morning', rules: ['text', 'errors', 'realworld'], maxDefects: 1, clean: 0.3,
    directive: 'Three orders to start. Read each screen the way an ordinary user would.',
    bulletin: 'Welcome to the booth. For now you enforce three orders and nothing else. If something else looks off to you, it is not your business yet. There are no warnings today: the Harbor Master is letting this first day slide. Ten years ago a wrong tide table sent the fleet to the Reach. Everything in your rulebook exists because of that day.' },
  { title: 'Order No. 2', rules: ['contrast', 'consistency'], maxDefects: 2, clean: 0.25,
    directive: 'Two new orders. Check every ship against the house style guide in its dossier.',
    bulletin: 'The Authority adds two orders and issues you a contrast lens. Eyes lie about contrast, so use the lens. Warnings are now enforced.' },
  { title: 'Safety nets', rules: ['control', 'prevention'], maxDefects: 2, clean: 0.25,
    directive: 'Can users always get out of trouble? Can they see what a risky button will do?',
    bulletin: 'Two orders on recoverability. A frightened user is an expensive user. Any screen that arrives with no registry mark is to be referred to the Registry. You will not be told what happens next.' },
  { title: 'Colour and reach', rules: ['color', 'target'], maxDefects: 3, clean: 0.2,
    directive: 'Colour alone is not a message, and a button must be easy to hit.',
    bulletin: 'Two accessibility orders, plus two instruments: calipers for sizes and distances, and a prism glass that shows how colour-blind users see the screen.' },
  { title: 'Memory and the keyboard', rules: ['recognition', 'keyboard'], maxDefects: 3, clean: 0.2,
    directive: 'Nobody should have to remember or retype. Keyboard users must be able to move in a logical order.',
    bulletin: 'Two orders on memory and keyboard use. You are issued a route chart that numbers the order the Tab key follows.' },
  { title: 'Status and choice', rules: ['status', 'minimal'], maxDefects: 3, clean: 0.2,
    directive: 'Does the screen say what it is doing? Are there too many choices?',
    bulletin: 'Two orders on feedback and choice overload. Waiting without news and facing fourteen buttons both count. Quotas are now compared between booths.' },
  { title: 'Inspector General audit', rules: ['flexibility'], maxDefects: 4, clean: 0.2,
    directive: 'Everything, fast, and the last new order. Some ships are perfectly fine: do not invent problems.',
    bulletin: 'The last new order covers customisation and a way back to defaults. The Inspector General sits in on today’s shift. Every order you have learned is now in force. What you do with them is another matter.' },
  /* ACT II · THE LONG WINTER (days 8–11): no new orders. The rulebook is complete; the harbor is not. */
  { title: 'The Long Winter', act: 2, rules: ['prediction'], maxDefects: 4, clean: 0.2,
    directive: 'One last order, from the Authority’s own course notes: Prediction. Apply all fifteen.',
    bulletin: 'The audit is behind you and the rulebook has one page left. Winter comes early to Port Halcyon: the quay is slick, the ships are heavier, and the Registry now keeps an office in the same building as yours. Nobody has asked you to move.' },
  { title: 'Memory week', act: 2, rules: [], focus: ['recognition', 'minimal', 'flexibility'], maxDefects: 4, clean: 0.2,
    directive: 'The tower is auditing memory, clutter and shortcuts this week. Expect more of them.',
    bulletin: 'By order of the Authority, this is Memory Week. Studios are told to stop making users remember things. Studios respond by making users remember that they were told.' },
  { title: 'Lantern Night', act: 2, rules: [], maxDefects: 3, clean: 0.38,
    directive: 'A festival day: many ships are sound. Turning back a good ship is a mistake too.',
    bulletin: 'The harbor lights its lanterns tonight and the studios send their best work to be seen by the crowds. Many ships are in order. A few are dressed to look it.' },
  { title: 'The Recount', act: 2, rules: [], focus: ['contrast', 'color', 'target', 'status'], maxDefects: 4, clean: 0.2,
    directive: 'Access recount: look hard at what users can see, hit and be told.',
    bulletin: 'After the clinic and pension failures the council orders a recount of every ship cleared this season. Your booth is the sample. Anything users cannot see, reach or follow goes in the minutes.' },
  /* ACT III · THE LAST TIDE (days 12–14) */
  { title: 'The Hearing', act: 3, rules: [], focus: ['control', 'prevention', 'errors'], maxDefects: 5, clean: 0.22,
    directive: 'Public inquiry day. Ships that trap or mislead users are the whole story today.',
    bulletin: 'The inquiry into the twenty-three opens at noon. The Berth Office must say how a ship without a registry mark reached the water. Everything you cleared this winter is evidence.' },
  { title: 'Eve of the Tide', act: 3, rules: [], maxDefects: 5, clean: 0.3,
    directive: 'Everything again. The Charter is being written tonight; do not add or invent.',
    bulletin: 'The committee sits tonight to write the new Charter of Screens. Every inspector in the harbor has been asked to hand in one line. Yours is due by morning.' },
  { title: 'The Last Tide', act: 3, rules: [], maxDefects: 5, clean: 0.25,
    directive: 'The last shift of the season. Every order, every tool, no excuses.',
    bulletin: 'The tide table says the water will be highest at dusk. Every berth is booked. After tonight the Charter is read aloud from the lighthouse and the booth is yours or somebody else’s. Judge each ship as you would want yours judged.' }
];
const activeCats = day => new Set(DAYS.slice(0, day).flatMap(d => d.rules));
const poolFor = day => { const a = activeCats(day); return Object.values(TEMPLATES).filter(t => Object.values(t.defects).some(d => a.has(d.cat))); };
const introDay = cat => DAYS.findIndex(d => d.rules.includes(cat)) + 1;

/* ───────────────────────── 4. Scoring ───────────────────────── */
class Scoring {
  /** @param flags Map<region, categoryId> */
  static evaluate(sub, flags, decision, timeLeft, timedOut, training) {
    const hits = [], partial = [], falseFlags = [], missed = [];
    for (const [region, cat] of flags) {
      const d = sub.defects.get(region);
      if (!d) falseFlags.push({ region, cat });
      else if (d.cat === cat) hits.push({ region, cat, d });
      else partial.push({ region, cat, d });
    }
    for (const [region, d] of sub.defects) if (!flags.has(region)) missed.push({ region, d });

    const flawed = sub.defects.size > 0;
    const correct = !timedOut && (flawed ? decision === 'reject' : decision === 'approve');
    let quality = 0;
    if (correct) {
      quality = flawed
        ? (hits.length + 0.5 * partial.length) / (sub.defects.size + falseFlags.length)
        : Math.max(0, 1 - 0.5 * falseFlags.length);
    }
    let credits;
    if (correct) {
      const bonus = training ? 0 : Math.min(4, Math.floor(Math.max(0, timeLeft) / 12));
      credits = Math.max(1, 8 + 4 * hits.length + 2 * partial.length - 3 * falseFlags.length - 2 * missed.length + bonus);
    } else {
      credits = timedOut ? -10 : -15;
    }
    return { decision, timedOut, flawed, correct, quality, credits, citation: !correct, hits, partial, falseFlags, missed };
  }
}

/* ─────────────────── 5. SubmissionFactory / queue ─────────────────── */
class SubmissionFactory {
  constructor(day) {
    this.day = day; this.cfg = DAYS[day - 1];
    this.active = activeCats(day);
    this.pool = poolFor(day);
    this.last = null;
  }

  create(no, o = {}) {
    const options = this.pool.filter(t => t !== this.last);
    const tpl = pick(options.length ? options : this.pool);
    this.last = tpl;

    const chosen = new Map();                       // region -> defect (one flaw per region)
    if (RNG() >= (o.clean ?? this.cfg.clean)) {
      const entries = Object.entries(tpl.defects).filter(([, d]) => this.active.has(d.cat));
      const target = Math.min(entries.length, randInt(1, o.maxD ?? this.cfg.maxDefects) + (o.extra || 0));
      const ord = shuffle(entries);
      if (this.cfg.focus && RNG() < .7) ord.sort((a, b) => this.cfg.focus.includes(b[1].cat) - this.cfg.focus.includes(a[1].cat));
      for (const [key, def] of ord) {
        if (chosen.size >= target) break;
        if (!chosen.has(def.region)) chosen.set(def.region, { key, ...def });
      }
    }
    const active = new Set([...chosen.values()].map(d => d.key));
    return {
      no, tpl, defects: chosen,
      html: tpl.build(k => active.has(k)),
      persona: pick(PERSONAS),
      designer: o.designer || pick(DESIGNERS), studioNote: o.note || null
    };
  }
}

/* ──────────────── 6. Auditor: tools, flags, popover ──────────────── */
class Auditor {
  constructor(game) {
    this.game = game;
    this.mock = $('#mock');
    this.readout = $('#readout');
    this.pop = $('#flag-pop');
    this.flags = new Map();          // region -> category id
    this.tool = 'flag';              // flag | contrast | ruler
    this.tabOn = false;
    this.cvd = 0;                    // 0 off, 1 protan, 2 deutan, 3 tritan
    this.prevPoint = null;
    this.popRegion = null;
    this.popOpener = null;
    this.overlay = null;
    this.buildPopover();
    this.bind();
  }

  /* ----- setup ----- */
  buildPopover() {
    const wrap = $('#pop-cats');
    for (const [group, label] of [['Accessibility', 'Accessibility rules'], ['Usability', 'Usability heuristics']]) {
      const fs = document.createElement('fieldset');
      fs.innerHTML = `<legend>${label}</legend>`;
      CATEGORIES.filter(c => c.group === group).forEach(c => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'cat'; b.dataset.cat = c.id;
        b.setAttribute('aria-pressed', 'false'); b.textContent = c.name;
        fs.appendChild(b);
      });
      wrap.appendChild(fs);
    }
  }

  bind() {
    // Keep the design inert: no focusing by mouse, no navigation, no form submit.
    this.mock.addEventListener('mousedown', e => { if (this.tool === 'hand' && e.target.closest('input,textarea')) return; e.preventDefault(); });
    this.mock.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      this.onMockClick(e);
    }, true);

    $('#tool-flag').addEventListener('click', () => this.setTool('flag'));
    $('#tool-contrast').addEventListener('click', () => this.setTool('contrast'));
    $('#tool-ruler').addEventListener('click', () => this.setTool('ruler'));
    $('#tool-tab').addEventListener('click', () => this.toggleTab());
    $('#tool-cvd').addEventListener('click', () => this.cycleCvd());

    $('#pop-cats').addEventListener('click', e => {
      const b = e.target.closest('.cat');
      if (b) this.setFlag(this.popRegion, b.dataset.cat);
    });
    $('#pop-remove').addEventListener('click', () => { this.removeFlag(this.popRegion); this.closePop(); });
    $('#pop-close').addEventListener('click', () => this.closePop());

    $('#region-cite').addEventListener('click', e => {
      if (!this.game.canInspect()) return;
      const region = $('#region-select').value;
      const el = this.mock.querySelector(`[data-region="${region}"]`);
      if (!el) return;
      const r = e.currentTarget.getBoundingClientRect();
      this.openPop(el, { clientX: r.left, clientY: r.bottom + 4 }, e.currentTarget);
    });

    $('#flag-log').addEventListener('click', e => {
      const b = e.target.closest('[data-remove]');
      if (b) this.removeFlag(b.dataset.remove);
    });

    document.addEventListener('click', e => {
      if (this.pop.hidden) return;
      if (e.target.closest('#flag-pop') || e.target.closest('#region-cite')) return;
      this.closePop();
    });
  }

  /* ----- lifecycle ----- */
  load(sub) {
    this.flags.clear();
    this.tabOn = false; this.cvd = 0; this.prevPoint = null;
    this.closePop();
    this.mock.innerHTML = sub.html;
    this.mock.scrollTop = 0;
    this.overlay = document.createElement('div');
    this.overlay.id = 'overlay';
    this.mock.appendChild(this.overlay);
    this.applyCvd();
    $('#tool-tab').setAttribute('aria-pressed', 'false');
    $('#tool-cvd').setAttribute('aria-pressed', 'false');
    this.setTool('flag', true);

    const regions = [...new Set($$('[data-region]', this.mock).map(el => el.dataset.region))];
    $('#region-select').innerHTML = regions.map(r => `<option value="${esc(r)}">${esc(sub.tpl.regions[r] || r)}</option>`).join('');
    this.renderFlags();
  }

  clear() {
    this.mock.innerHTML = '';
    this.flags.clear();
    this.renderFlags();
    $('#region-select').innerHTML = '';
  }

  say(html) { this.readout.innerHTML = html; }

  /* ----- tools ----- */
  setTool(name, silent = false) {
    this.tool = name;
    this.prevPoint = null;
    document.body.classList.remove('tool-flag', 'tool-contrast', 'tool-ruler');
    document.body.classList.add(`tool-${name}`);
    for (const t of ['flag', 'contrast', 'ruler']) $(`#tool-${t}`).setAttribute('aria-pressed', String(t === name));
    if (silent) return;
    const msg = {
      flag: 'Flag tool: click an element of the design, then choose which rule it breaks.',
      contrast: 'Contrast probe: click directly on text to measure it.',
      ruler: 'Ruler: click an element for its text and box size. Click a second one to get the distance and the Fitts time between them.'
    }[name];
    this.say(msg);
  }

  toggleTab() {
    if (!this.game.canInspect()) return;
    this.tabOn = !this.tabOn;
    $('#tool-tab').setAttribute('aria-pressed', String(this.tabOn));
    this.renderTab();
    if (this.tabOn) this.game.spend(3);
  }

  renderTab() {
    this.overlay.innerHTML = '';
    if (!this.tabOn) { this.say('Tab-order overlay off.'); return; }
    const sel = 'a[href],button,input,select,textarea,[tabindex]';
    const els = $$(sel, this.mock).filter(el => !el.closest('#overlay') && el.tabIndex >= 0 && !el.disabled);
    const seq = [...els.filter(e => e.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex), ...els.filter(e => e.tabIndex === 0)];
    const base = this.mock.getBoundingClientRect();
    seq.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const b = document.createElement('span');
      b.className = 'tab-badge';
      b.textContent = i + 1;
      b.style.left = `${r.left - base.left + this.mock.scrollLeft - 10}px`;
      b.style.top = `${r.top - base.top + this.mock.scrollTop - 10}px`;
      this.overlay.appendChild(b);
    });
    this.say(`Numbers show the order the Tab key will visit (${seq.length} stops). Does it follow the visual reading order? If not, click a number with the Flag tool to cite the form.`);
  }

  cycleCvd() {
    if (!this.game.canInspect()) return;
    this.cvd = (this.cvd + 1) % 4;
    this.applyCvd();
    $('#tool-cvd').setAttribute('aria-pressed', String(this.cvd > 0));
    const names = ['Vision filter off.', 'Simulating protanopia (red-blind).', 'Simulating deuteranopia (green-blind).', 'Simulating tritanopia (blue-blind).'];
    this.say(names[this.cvd] + (this.cvd ? ' Can you still tell everything apart without relying on colour?' : ''));
    if (this.cvd) this.game.spend(3);
  }

  applyCvd() {
    const id = ['', 'protan', 'deutan', 'tritan'][this.cvd];
    this.mock.style.filter = id ? `url(#cvd-${id})` : '';
  }

  onMockClick(e) {
    if (!this.game.canInspect()) return;
    if (this.tool === 'flag') {
      const badge = e.target.closest('.tab-badge');
      const el = badge ? this.mock.querySelector('[data-region="form"]') : e.target.closest('[data-region]');
      if (el) this.openPop(el, e);
      else this.say('Nothing to cite there. Click a highlighted element, or use “Cite by name”.');
    } else if (this.tool === 'contrast') {
      this.probeContrast(e.target);
    } else {
      this.probeRuler(e.target);
    }
  }

  probeContrast(el) {
    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color) || { r: 0, g: 0, b: 0 };
    const bg = effectiveBg(el);
    const ratio = contrastRatio(fg, bg);
    const px = parseFloat(cs.fontSize);
    const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    const need = large ? 3 : 4.5;
    const ok = ratio >= need;
    const textless = el.textContent.trim() === '' && !['INPUT', 'SELECT'].includes(el.tagName);
    this.say(
      `<span class="${ok ? 'verdict-pass' : 'verdict-fail'}">${ratio.toFixed(2)} : 1 ${ok ? 'passes' : 'fails'}</span> ` +
      `(needs ${need} : 1 for ${large ? 'large' : 'normal'} text, ${px.toFixed(0)} px).<br>` +
      `<span class="sw" style="background:${toHex(fg)}"></span>text ${toHex(fg)} on <span class="sw" style="background:${toHex(bg)}"></span>${toHex(bg)}` +
      (textless ? '<br>Tip: this element holds no text. Click on the text itself.' : '')
    );
    this.game.spend(2);
  }

  probeRuler(el) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === 'normal' ? 1.2 : parseFloat(cs.lineHeight) / fs;
    const interactive = el.closest('a,button,input,select,label,.seat');
    const box = interactive ? interactive.getBoundingClientRect() : r;
    const notes = [];
    if (fs < 11) notes.push('text under 11 px');
    if (lh < 1.1) notes.push('line spacing under 1.1');
    if (cs.textTransform === 'uppercase') notes.push('set in capitals');
    if (interactive && Math.min(box.width, box.height) < 24) notes.push('target under 24 px');
    let msg = `&lt;${esc(el.tagName.toLowerCase())}&gt; text ${fs.toFixed(0)} px · spacing ×${lh.toFixed(2)} · font “${esc(cs.fontFamily.split(',')[0].replace(/["']/g, ''))}”<br>` +
      `box ${Math.round(box.width)} × ${Math.round(box.height)} px` +
      (notes.length ? `<br><span class="verdict-fail">${notes.join(', ')}</span>` : '');
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    if (this.prevPoint) {
      const D = Math.hypot(cx - this.prevPoint.x, cy - this.prevPoint.y);
      const S = Math.max(1, Math.min(box.width, box.height));
      msg += `<br>From previous click: D = ${Math.round(D)} px, A = ${Math.round(S)} px → Fitts T ≈ ${(0.1 * Math.log2(D / S + 1)).toFixed(2)} s`;
    }
    this.prevPoint = { x: cx, y: cy };
    this.say(msg);
    this.game.spend(2);
  }

  /* ----- popover & flags ----- */
  openPop(regionEl, evt, opener = null) {
    const region = regionEl.dataset.region;
    this.popRegion = region;
    this.popOpener = opener;
    const tpl = this.game.current.tpl;
    $('#pop-title').textContent = tpl.regions[region] || region;
    const cur = this.flags.get(region);
    $$('#pop-cats .cat').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === cur)));
    $('#pop-remove').hidden = !cur;
    this.pop.hidden = false;
    const w = this.pop.offsetWidth, h = this.pop.offsetHeight;
    this.pop.style.left = `${Math.max(8, Math.min(evt.clientX + 12, innerWidth - w - 8))}px`;
    this.pop.style.top = `${Math.max(8, Math.min(evt.clientY + 12, innerHeight - h - 8))}px`;
    this.pop.querySelector('.cat').focus({ preventScroll: true });
  }

  closePop() {
    if (this.pop.hidden) return;
    this.pop.hidden = true;
    if (this.popOpener) this.popOpener.focus({ preventScroll: true });
    this.popOpener = null;
  }

  setFlag(region, cat) {
    if (!region) return;
    this.flags.set(region, cat);
    this.closePop();
    this.renderFlags();
    const tpl = this.game.current.tpl;
    this.game.toast(`Cited: ${tpl.regions[region] || region} → ${CAT[cat].name}`);
  }

  removeFlag(region) {
    this.flags.delete(region);
    this.renderFlags();
  }

  renderFlags() {
    $$('[data-flagged]', this.mock).forEach(el => el.removeAttribute('data-flagged'));
    const regions = this.game.current ? this.game.current.tpl.regions : {};
    const log = $('#flag-log');
    log.innerHTML = '';
    let i = 0;
    for (const [region, cat] of this.flags) {
      i++;
      const el = this.mock.querySelector(`[data-region="${region}"]`);
      if (el) el.dataset.flagged = i;
      const li = document.createElement('li');
      li.innerHTML = `<span class="no">#${i}</span><span class="txt">${esc(regions[region] || region)}<small>${esc(CAT[cat].name)}</small></span>` +
        `<button type="button" class="mini" data-remove="${esc(region)}" aria-label="Remove citation ${i}">Remove</button>`;
      log.appendChild(li);
    }
    $('#flag-count').textContent = this.flags.size;
  }
}

/* ───────────────────── 8. Art: everything is drawn in code ───────────────────── */
const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rng = seed => {
  let s = 7;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};
const mixHex = (a, b, t) => {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

const WEATHER = { 3: 'fog', 5: 'rain', 7: 'storm' };
const SHIP_KIND = { login: 'ferry', delete: 'tug', seats: 'sail', checkout: 'freighter', portal: 'steamer', installer: 'barge' };

const LOOKS = {
  'Dr. Quill':     { skin: '#e8c4a0', hair: '#d9d9d4', style: 'short', shirt: '#6b5b3a', bg: '#2f5d6b', glasses: true, collar: true },
  'M. Okafor':     { skin: '#6f4529', hair: '#1b1613', style: 'short', shirt: '#b5532b', bg: '#e0b95a' },
  'R. Tanaka':     { skin: '#e8c4a0', hair: '#1b1613', style: 'long', shirt: '#2b3b5c', bg: '#a8c9b8', glasses: true },
  'S. Lindqvist':  { skin: '#f7d9bf', hair: '#d9c39a', style: 'long', shirt: '#3d6b52', bg: '#c5d8e0' },
  'P. Alvarez':    { skin: '#c68a5b', hair: '#1b1613', style: 'curly', shirt: '#7a2d3a', bg: '#d9b48f', beard: true },
  'J. Whitcombe':  { skin: '#e0a97d', hair: '#8a8f95', style: 'bald', shirt: '#4d555c', bg: '#8aa0a6', hat: '#2a3b4a' },
  Antonio: { skin: '#e0a97d', hair: '#e4e4de', style: 'short', shirt: '#6a7f6a', bg: '#d8cfa8', glasses: true, collar: true },
  'Lucía': { skin: '#c68a5b', hair: '#3a2a1e', style: 'bun', shirt: '#2f9b9b', bg: '#e8eef0' },
  Marcos:  { skin: '#f1c9a5', hair: '#3a2a1e', style: 'short', shirt: '#33415a', bg: '#b9c6d6', glasses: true, beard: true, collar: true },
  Noa:     { skin: '#9c6540', hair: '#1b1613', style: 'curly', shirt: '#d9534f', bg: '#cfd8dc' },
  Jaime:   { skin: '#f1c9a5', hair: '#6a4326', style: 'short', shirt: '#4a6a8a', bg: '#e6d6b0', hat: '#c0392b' }
};

const Art = {
  _pid: 0,
  crest() {
    return `<svg viewBox="0 0 48 48" role="img" aria-label="Port Halcyon crest"><circle cx="24" cy="24" r="22" fill="#10293a" stroke="#c99a4b" stroke-width="2.5"/>
      <path d="M24 11 4 5M24 11l20-6" stroke="#ffc45c" stroke-width="1.4" opacity=".7"/>
      <path d="M20 38 22 16h4l2 22z" fill="#dcefe9"/><path d="M21 27h6l-.4 4h-5.2z" fill="#e5583e"/><rect x="20.5" y="11" width="7" height="5" fill="#ffc45c"/><path d="M19 11l5-4 5 4z" fill="#c99a4b"/>
      <path d="M3 37q5-4 10 0t10 0 10 0 10 0 2 1v6H3z" fill="#1c4a5e"/><circle cx="24" cy="24" r="22" fill="none" stroke="#000" stroke-opacity=".4"/></svg>`;
  },

  portrait(name, opts = {}) {
    const key = LOOKS[name] ? name : String(name).split(',')[0];
    const o = LOOKS[key] || LOOKS.Noa;
    const id = 'pg' + (++Art._pid);
    const sk = o.skin, skD = mixHex(sk, '#3a1a10', .28), skL = mixHex(sk, '#ffffff', .22), skS = mixHex(sk, '#5a2a1a', .14);
    const hr = o.hair, hrD = mixHex(hr, '#000000', .35), hrL = mixHex(hr, '#ffffff', .28);
    const light = ['#d9d9d4', '#e4e4de', '#d9c39a', '#8a8f95'].includes(hr);
    const eye = o.eye || (light && sk.toLowerCase() > '#e0' ? '#4f7a9a' : '#33200f');
    const lip = mixHex(sk, '#b0404a', .5), lipD = mixHex(sk, '#7a2a30', .6);
    const brow = light ? '#7c7c78' : hrD;
    const shD = mixHex(o.shirt, '#000000', .35), shL = mixHex(o.shirt, '#ffffff', .15);
    const bgL = mixHex(o.bg, '#ffffff', .3), bgD = mixHex(o.bg, '#000000', .32);
    const head = 'M31 38C31 23 39 16 50 16S69 23 69 38C69 44 68 49 65 55C62 62 57 67 50 67S38 62 35 55C32 49 31 44 31 38Z';
    let back = '', front = '';
    const side = `<path d="M30 40C27 22 38 12 50 12S73 22 70 40C68 33 66 29 62 26C55 30 44 30 38 25C34 28 31 33 30 40Z" fill="${hr}"/><path d="M38 25C44 30 55 30 62 26" fill="none" stroke="${hrD}" stroke-width="1" opacity=".5"/><path d="M40 17Q50 12 60 17" fill="none" stroke="${hrL}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
    switch (o.style) {
      case 'bald':
        front = `<path d="M31 40C29 33 31 28 33 27C32 33 32 38 33 44Z M69 40C71 33 69 28 67 27C68 33 68 38 67 44Z" fill="${hr}"/><path d="M40 20Q50 14 60 20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".28"/>`; break;
      case 'bun':
        back = `<circle cx="50" cy="9" r="8" fill="${hr}"/><circle cx="48" cy="7" r="3" fill="${hrL}" opacity=".5"/>`;
        front = side; break;
      case 'long':
        back = `<path d="M29 38C22 58 24 78 33 88L67 88C76 78 78 58 71 38Z" fill="${hrD}"/>`;
        front = side + `<path d="M31 40C27 56 29 66 34 72L38 50Z M69 40C73 56 71 66 66 72L62 50Z" fill="${hr}"/><path d="M33 52Q31 62 35 69M67 52Q69 62 65 69" stroke="${hrL}" stroke-width="1.2" fill="none" opacity=".55"/>`; break;
      case 'curly':
        back = `<g fill="${hrD}">${[[30, 34], [27, 44], [73, 34], [73, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/>`).join('')}</g>`;
        front = `<g fill="${hr}">${[[33, 26], [41, 19], [50, 16], [59, 19], [67, 26], [30, 36], [70, 36], [37, 24], [63, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8"/>`).join('')}</g><g fill="${hrL}" opacity=".35">${[[42, 17], [55, 16], [34, 25], [66, 25]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>`; break;
      default: front = side;
    }
    const collar = o.collar ? `<path d="M38 70L50 84 62 70 58 66 50 76 42 66Z" fill="#f4f1e8" stroke="#00000033" stroke-width=".6"/><path d="M50 76 46 96 50 100 54 96Z" fill="${shD}"/>` : `<path d="M38 70Q50 82 62 70L58 67Q50 76 42 67Z" fill="${shD}" opacity=".7"/>`;
    const beard = o.beard ? `<path d="M31 46C31 68 40 76 50 76S69 68 69 46C66 55 61 58 50 58S34 55 31 46Z" fill="${hr}"/><path d="M40 70Q50 77 60 70" fill="none" stroke="${hrL}" stroke-width="1.2" opacity=".4"/><path d="M42 55Q50 51 58 55Q50 59 42 55Z" fill="${hrD}"/>` : '';
    const grin = opts.mood === 'grin';
    const mouth = o.smirk && grin
      ? `<path d="M42 57Q51 69 61 55Q51 60 42 57Z" fill="#fff" stroke="${lipD}" stroke-width="1.3" stroke-linejoin="round"/><path d="M61 55l2.2-1.6" stroke="${lipD}" stroke-width="1.3" stroke-linecap="round"/>`
      : o.smirk
      ? `<path d="M43 59Q50 62 58 57" fill="none" stroke="${lipD}" stroke-width="1.8" stroke-linecap="round"/><path d="M44 60Q51 65 58 57Q52 62 44 60Z" fill="${lip}"/><path d="M58 57l2-1.4" stroke="${lipD}" stroke-width="1.2" stroke-linecap="round"/>`
      : `<path d="M43.5 59Q50 63.5 56.5 59Q50 61 43.5 59Z" fill="#fff" opacity=".0"/><path d="M43.5 59Q47 57.6 50 58.6Q53 57.6 56.5 59Q50 62.2 43.5 59Z" fill="${lip}"/><path d="M43.5 59Q50 63.5 56.5 59" fill="none" stroke="${lipD}" stroke-width="1.3" stroke-linecap="round"/>`;
    const eyeAt = (x, flip) => `<g transform="translate(${x} 43)"><path d="M-5 0Q0 -4.2 5 0Q0 3.6 -5 0Z" fill="#fbf7f0"/><circle cx="${flip * .3}" cy=".2" r="2.5" fill="${eye}"/><circle cx="${flip * .3}" cy=".2" r="1.2" fill="#0b0805"/><circle cx="${flip * .3 + .9}" cy="-.7" r=".75" fill="#fff"/><path d="M-5.4 .3Q0 -4.8 5.4 .3" fill="none" stroke="#1b110c" stroke-width="1.5" stroke-linecap="round"/><path d="M-4 1.6Q0 3.6 4 1.6" fill="none" stroke="${skD}" stroke-width=".7" opacity=".6"/></g>`;
    const brows = o.smirk
      ? `<path d="M36 37Q42 34.5 47 37" fill="none" stroke="${brow}" stroke-width="2.3" stroke-linecap="round"/><path d="M53 35.5Q59 32 65 35" fill="none" stroke="${brow}" stroke-width="2.5" stroke-linecap="round"/>`
      : `<path d="M36 37Q42 34 47 36.5" fill="none" stroke="${brow}" stroke-width="2.3" stroke-linecap="round"/><path d="M53 36.5Q58 34 64 37" fill="none" stroke="${brow}" stroke-width="2.3" stroke-linecap="round"/>`;
    const glasses = o.glasses ? `<g fill="#bfe3f0" fill-opacity=".18" stroke="#23262b" stroke-width="1.6"><rect x="35.5" y="38.5" width="15" height="10.5" rx="4.5"/><rect x="49.5" y="38.5" width="15" height="10.5" rx="4.5"/></g><path d="M50.5 42.5h-1M35.5 42l-4.5-1M64.5 42l4.5-1" stroke="#23262b" stroke-width="1.4" fill="none"/><path d="M38 40.5l4 0" stroke="#fff" stroke-width="1" opacity=".5"/>` : '';
    const mask = o.mask ? `<path d="M31 39Q40 34 50 39Q60 34 69 39Q70 49 60 50Q54 50 50 46Q46 50 40 50Q30 49 31 39Z" fill="#17102a" stroke="${o.hair}" stroke-width="1"/><ellipse cx="42.5" cy="43.5" rx="3.8" ry="2.8" fill="#fff"/><ellipse cx="57.5" cy="43.5" rx="3.8" ry="2.8" fill="#fff"/><circle cx="43" cy="43.8" r="1.7" fill="#17102a"/><circle cx="57" cy="43.8" r="1.7" fill="#17102a"/><path d="M50 36l1.2 2.4 2.6.3-2 1.7.6 2.6L50 41.800l-2.4 1.200.6-2.600-2-1.700 2.600-.3Z" fill="#fde68a" transform="translate(0 -1.5) scale(1)"/>` : '';
    const hat = o.hat ? `<path d="M29 29C29 10 71 10 71 29Z" fill="${o.hat}"/><path d="M29 29C29 10 71 10 71 29" fill="none" stroke="${mixHex(o.hat, '#000000', .3)}" stroke-width="1"/><path d="M27 29Q50 38 73 29Q73 26 50 28Q27 26 27 29Z" fill="${mixHex(o.hat, '#000000', .28)}"/><path d="M29 24Q50 30 71 24L71 27Q50 33 29 27Z" fill="${mixHex(o.hat, '#000000', .15)}"/><circle cx="50" cy="19" r="3.2" fill="#e4b34c" stroke="#7a5a1a" stroke-width=".8"/>` : '';
    return `<svg viewBox="0 0 100 100" role="img" aria-label="Portrait of ${esc(key)}"><defs>
      <radialGradient id="${id}b" cx=".35" cy=".25" r=".95"><stop offset="0" stop-color="${bgL}"/><stop offset="1" stop-color="${bgD}"/></radialGradient>
      <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="${shL}"/><stop offset="1" stop-color="${shD}"/></linearGradient>
      <linearGradient id="${id}f" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="${skL}"/><stop offset=".55" stop-color="${sk}"/><stop offset="1" stop-color="${skS}"/></linearGradient>
      <clipPath id="${id}c"><rect width="100" height="100"/></clipPath></defs>
      <g clip-path="url(#${id}c)"><rect width="100" height="100" fill="url(#${id}b)"/>
      <circle cx="82" cy="18" r="22" fill="#fff" opacity=".07"/>${back}
      <path d="M2 100C4 82 22 72 38 69H62C78 72 96 82 98 100Z" fill="url(#${id}s)"/>
      <path d="M14 100C16 88 26 80 36 76" fill="none" stroke="#fff" stroke-width="1" opacity=".12"/>
      <path d="M41 52H59V70C59 74 41 74 41 70Z" fill="${skS}"/><path d="M41 62Q50 70 59 62V70Q50 76 41 70Z" fill="${skD}" opacity=".55"/>${collar}
      <ellipse cx="31" cy="45" rx="3.6" ry="5.2" fill="${sk}"/><ellipse cx="69" cy="45" rx="3.6" ry="5.2" fill="${sk}"/><path d="M30.5 43Q32.5 45 30.5 48M69.5 43Q67.5 45 69.5 48" stroke="${skD}" stroke-width=".9" fill="none" opacity=".7"/>
      <path d="${head}" fill="url(#${id}f)"/>
      <path d="M33 52C36 62 42 66 50 66S64 62 67 52C64 60 58 63 50 63S36 60 33 52Z" fill="${skD}" opacity=".16"/>
      ${beard}
      <path d="M50 44Q48 51 47.500 53.500Q50 55.200 52.500 53.500" fill="none" stroke="${skD}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/><path d="M50.800 44.500Q51.500 49 51.200 51" stroke="${skL}" stroke-width="1" fill="none" opacity=".6" stroke-linecap="round"/>
      <ellipse cx="38.500" cy="53" rx="4.500" ry="3" fill="#e0675a" opacity=".13"/><ellipse cx="61.500" cy="53" rx="4.500" ry="3" fill="#e0675a" opacity=".13"/>
      ${mouth}<g class="eyes" style="animation-delay:-${(Math.random() * 5).toFixed(1)}s">${eyeAt(43, -1)}${eyeAt(57, -1)}</g>${brows}${front}${glasses}${mask}${hat}</g></svg>`;
  },

  /* ships are drawn bow-left with the waterline at y = 0 */
  ship(kind, seed) {
    const r = rng(seed);
    const hulls = ['#7b2d26', '#1f4a5c', '#2f5d3a', '#3b3f6b', '#8a5a1f', '#2a2f38'];
    const hull = hulls[Math.floor(r() * hulls.length)];
    const acc = ['#f4c363', '#e8e1c8', '#e4573d', '#5fc4b0'][Math.floor(r() * 4)];
    const wins = (x, y, n, gap, w, h, f = '#27485a') => Array.from({ length: n }, (_, i) => `<rect x="${x + i * gap}" y="${y}" width="${w}" height="${h}" fill="${f}"/><rect x="${x + i * gap}" y="${y}" width="${w}" height="${h}" fill="#ffd98a" style="opacity:var(--lit,0)"/>`).join('');
    const body = (w, h, inset = 10) => `<path d="M0 ${-h}H${w}L${w - inset} 0H${inset}Z" fill="${hull}"/><rect x="3" y="${-h * .45}" width="${w - 6}" height="2.4" fill="${acc}"/>`;
    let g = '';
    switch (kind) {
      case 'tug':
        g = body(82, 10, 9) + `<rect x="28" y="-25" width="28" height="15" rx="2" fill="#f0e6d0"/>${wins(32, -21, 3, 8, 5, 6)}<rect x="57" y="-41" width="10" height="18" fill="${acc}"/><rect x="57" y="-41" width="10" height="4" fill="#1b1b1b"/><circle cx="4" cy="-6" r="4" fill="#111"/><circle cx="12" cy="-4" r="3" fill="#111"/>`;
        break;
      case 'sail':
        g = body(88, 8, 14) + `<line x1="44" y1="-8" x2="44" y2="-64" stroke="#d8d2c0" stroke-width="2"/><path d="M42 -62 42 -12 10 -12Z" fill="#f1ecdc"/><path d="M47 -56 47 -12 80 -12Z" fill="${acc}"/>`;
        break;
      case 'freighter': {
        const cols = ['#c0392b', '#2e86ab', '#e0a526', '#4a7c59', '#8e5ea2'];
        let boxes = '';
        for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) boxes += `<rect x="${10 + i * 11}" y="${-14 - (row + 1) * 8}" width="10" height="7.4" fill="${cols[Math.floor(r() * cols.length)]}"/>`;
        g = body(100, 14, 9) + boxes + `<rect x="72" y="-36" width="19" height="22" rx="1.5" fill="#e8efe8"/>${wins(75, -32, 3, 5.5, 3.5, 4)}${wins(75, -25, 3, 5.5, 3.5, 4)}<rect x="80" y="-42" width="6" height="6" fill="${acc}"/>`;
        break;
      }
      case 'steamer':
        g = body(100, 12, 10) + `<rect x="12" y="-27" width="70" height="15" rx="3" fill="#efe9d8"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${20 + i * 7}" cy="-20" r="2.3" fill="#27485a"/>`).join('')}<rect x="24" y="-41" width="11" height="15" fill="${acc}"/><rect x="24" y="-41" width="11" height="3.5" fill="#1b1b1b"/><rect x="50" y="-41" width="11" height="15" fill="${acc}"/><rect x="50" y="-41" width="11" height="3.5" fill="#1b1b1b"/>`;
        break;
      case 'barge':
        g = body(100, 7, 5) + `<rect x="14" y="-18" width="16" height="11" fill="#b98a4b"/><rect x="31" y="-15" width="14" height="8" fill="#a37638"/><rect x="48" y="-20" width="18" height="13" fill="#c99a4b"/><rect x="74" y="-22" width="14" height="15" fill="#e8efe8"/>${wins(77, -18, 2, 6, 3.5, 4)}<line x1="94" y1="-7" x2="94" y2="-26" stroke="#d8d2c0" stroke-width="1.6"/><circle cx="94" cy="-28" r="2.6" fill="#ffc45c"/>`;
        break;
      case 'junk':
        g = `<path d="M0 -9H72L64 0H8Z" fill="${hull}"/><rect x="2" y="-5" width="68" height="2.4" fill="${acc}"/><line x1="30" y1="-9" x2="30" y2="-52" stroke="#d8d2c0" stroke-width="2"/><path d="M28 -50 28 -14 4 -14Z" fill="#f1ecdc"/><path d="M12 -30h8v8h-8z" fill="${acc}"/><path d="M33 -46 33 -14 58 -14Z" fill="#cfc7a8"/><path d="M40 -38h7v7h-7z" fill="#7b2d26"/><path d="M30 -54q6 -9 14 -2q-4 1 -6 4q4 1 4 4q-8 2 -12 -6Z" fill="#fff" stroke="#999" stroke-width=".6"/>`;
        break;
      case 'gala':
        g = body(100, 11, 10) + `<rect x="14" y="-25" width="64" height="14" rx="2" fill="#fde68a"/>${[0,1,2,3,4,5].map(i => `<path d="M${10+i*14} -26l6 0-3 8z" fill="${i%2?'#e11d48':'#7e22ce'}"/>`).join('')}<path d="M44 -26l5-12 5 12-13-8h16Z" fill="#c026d3"/>`;
        break;
      default: // ferry
        g = body(100, 11, 10) + `<rect x="14" y="-25" width="64" height="14" rx="2" fill="#e8efe8"/>${wins(19, -21, 8, 7.5, 4.6, 5.5)}<rect x="26" y="-33" width="36" height="8" rx="2" fill="#dbe4dc"/>${wins(30, -31, 5, 6.5, 3.6, 4)}<rect x="68" y="-39" width="10" height="14" fill="${acc}"/><rect x="68" y="-39" width="10" height="3.5" fill="#1b1b1b"/>`;
    }
    return g + `<line x1="6" y1="-12" x2="6" y2="-33" stroke="#ccc" stroke-width="1.4"/><path class="pennant" d="M6 -33 21 -29.5 6 -26Z" fill="#e8efe8"/>`;
  },

  shipSvg(kind, seed) {
    return `<svg viewBox="-4 -66 108 74" aria-hidden="true"><path d="M-4 3q14 4 28 0t28 0 28 0 28 0v5H-4z" fill="#2f7390" opacity=".55"/>${Art.ship(kind, seed)}</svg>`;
  },

  stamp(word, sub, color) {
    return `<svg viewBox="0 0 320 150" role="img" aria-label="${esc(word)} stamp"><g filter="url(#ink)" fill="none" stroke="${color}"><rect x="8" y="8" width="304" height="134" rx="14" stroke-width="7"/><rect x="21" y="21" width="278" height="108" rx="8" stroke-width="2.5"/></g>
      <g filter="url(#ink)" fill="${color}" text-anchor="middle"><text x="160" y="86" font-family="Big Shoulders Display, Impact, sans-serif" font-weight="800" font-size="62" textLength="${word.length > 8 ? 250 : 200}" lengthAdjust="spacingAndGlyphs">${esc(word)}</text><text x="160" y="116" font-family="JetBrains Mono, monospace" font-size="13.5" font-weight="700" letter-spacing="2">${esc(sub)}</text></g></svg>`;
  },

  gauge() {
    return `<svg class="gauge" viewBox="0 0 120 72" aria-hidden="true">
      <path d="M10 60A50 50 0 0 1 110 60" pathLength="100" fill="none" stroke="#c0432f" stroke-width="9" stroke-dasharray="30 70"/>
      <path d="M10 60A50 50 0 0 1 110 60" pathLength="100" fill="none" stroke="#d9a23a" stroke-width="9" stroke-dasharray="30 70" stroke-dashoffset="-30"/>
      <path d="M10 60A50 50 0 0 1 110 60" pathLength="100" fill="none" stroke="#43b087" stroke-width="9" stroke-dasharray="40 60" stroke-dashoffset="-60"/>
      <path d="M10 60A50 50 0 0 1 110 60" pathLength="100" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="2" stroke-dasharray=".6 9.4" transform="translate(0 0)"/>
      <g class="needle" style="transform:rotate(-90deg)"><path d="M60 60 60 16" stroke="#ffe2a6" stroke-width="3" stroke-linecap="round"/></g>
      <circle cx="60" cy="60" r="6" fill="#c99a4b" stroke="#000"/></svg>`;
  },

  icon(kind) {
    const s = 'stroke="#102f3a" stroke-width="3" stroke-linejoin="round"';
    const body = {
      envelope: `<rect x="8" y="16" width="48" height="34" rx="3" fill="#f4ead0" ${s}/><path d="M8 18 32 38 56 18" fill="none" ${s}/><circle cx="32" cy="40" r="5" fill="#e5583e"/>`,
      phone: `<path d="M12 24Q32 6 52 24L47 33Q32 25 17 33Z" fill="#102f3a"/><rect x="25" y="36" width="14" height="18" rx="4" fill="#c99a4b" ${s}/>`,
      press: `<rect x="14" y="10" width="36" height="46" rx="3" fill="#fff" ${s}/><path d="M20 24h24M20 32h24M20 40h14" fill="none" ${s}/><rect x="22" y="5" width="20" height="9" rx="2" fill="#c99a4b" ${s}/>`,
      papers: `<rect x="12" y="14" width="34" height="42" rx="2" fill="#e8ecdf" ${s} transform="rotate(-8 29 35)"/><rect x="20" y="10" width="34" height="42" rx="2" fill="#fff" ${s}/><path d="M26 22h22M26 30h22M26 38h12" fill="none" ${s}/>`,
      lamp: `<path d="M23 38Q32 28 41 38L39 49H25Z" fill="#ffc45c" ${s}/><rect x="21" y="49" width="22" height="7" fill="#8f6a2c" ${s}/><path d="M32 6v10M13 15l7 7M51 15l-7 7" stroke="#d68b00" stroke-width="3.5" stroke-linecap="round"/>`,
      complaint: `<path d="M8 10h48v30H31L19 52V40H8z" fill="#fff" ${s}/><path d="M32 17v12" fill="none" ${s}/><circle cx="32" cy="34" r="2.2" fill="#102f3a"/>`
    }[kind] || '';
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
  }
};

/* ───────────────────── 9. Sound: all synthesised ───────────────────── */
const Sfx = {
  ctx: null, on: true,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      this.ctx = new C();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.on ? .55 : 0;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + (Math.random() * 2 - 1) * .08) * .98; d[i] = last * 6; }
      this.ambient(); this.startTimers(); this.setWeather(this.wk || '');
    } catch { this.ctx = null; }
  },
  setOn(v) { this.on = v; if (this.master) this.master.gain.setTargetAtTime(v ? .55 : 0, this.ctx.currentTime, .05); },
  ok() { return this.ctx && this.on; },
  ambient() {
    const c = this.ctx, src = c.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const g = c.createGain(); g.gain.value = .05; this.windG = g;
    const hs = c.createBufferSource(); hs.buffer = this.noiseBuf; hs.loop = true;
    const hb = c.createBiquadFilter(); hb.type = 'bandpass'; hb.frequency.value = 3200; hb.Q.value = .6;
    this.hissG = c.createGain(); this.hissG.gain.value = 0; hs.connect(hb); hb.connect(this.hissG); this.hissG.connect(this.master); hs.start();
    const lfo = c.createOscillator(); lfo.frequency.value = .11;
    const lg = c.createGain(); lg.gain.value = .03;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    src.connect(lp); lp.connect(g); g.connect(this.master); src.start();
  },
  env(node, t, a, peak, d) { node.gain.setValueAtTime(0.0001, t); node.gain.exponentialRampToValueAtTime(peak, t + a); node.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  tone(freq, dur, type = 'sine', vol = .3, slideTo = null, when = 0) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    this.env(g, t, .01, vol, dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .05);
  },
  noise(dur, freq, type = 'lowpass', vol = .4, when = 0) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime + when, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.frequency.value = freq;
    this.env(g, t, .005, vol, dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + .05);
  },
  setWeather(kind) {
    this.wk = kind;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.hissG.gain.setTargetAtTime(kind === 'rain' ? .05 : kind === 'storm' ? .1 : 0, t, .8);
    this.windG.gain.setTargetAtTime(kind === 'storm' ? .1 : .05, t, .8);
  },
  startTimers() {
    setInterval(() => { if (!this.ok()) return; if (this.wk !== 'storm' && Math.random() < .6) this.gull(); }, 9000);
    setInterval(() => { if (!this.ok()) return; if (this.wk === 'storm' && Math.random() < .6) { this.noise(2.2, 150, 'lowpass', .9); this.noise(.12, 4000, 'highpass', .3); } if (this.wk === 'fog' && Math.random() < .7) { this.tone(87, 1.7, 'sawtooth', .07); this.tone(92, 1.7, 'sawtooth', .05); } }, 13000);
  },
  gull() { this.tone(1900, .16, 'sine', .04, 1350); this.tone(1750, .2, 'sine', .035, 1100, .2); this.tone(1850, .14, 'sine', .03, 1300, .45); },
  brig() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, .09, 'square', .06, null, i * .08)); },
  stamp() { this.noise(.26, 520, 'lowpass', 1); this.tone(92, .5, 'sine', .9, 30); this.tone(58, .55, 'sine', .55, 28, .02); this.noise(.1, 3200, 'highpass', .22, .02); },
  paper() { this.noise(.22, 2600, 'bandpass', .25); this.noise(.12, 1800, 'bandpass', .18, .12); },
  bell() { this.tone(880, 1.3, 'sine', .22); this.tone(1320, .9, 'sine', .1); this.tone(1760, .5, 'sine', .05); },
  tick() { this.tone(1500, .04, 'square', .07); },
  coin() { this.tone(1318, .08, 'square', .08); this.tone(1760, .25, 'square', .08, null, .07); },
  buzz() { this.tone(120, .28, 'sawtooth', .22, 80); },
  horn() { this.tone(98, 1.1, 'sawtooth', .22); this.tone(104, 1.1, 'sawtooth', .18); },
  good() { this.tone(523, .15, 'triangle', .2); this.tone(659, .15, 'triangle', .2, null, .12); this.tone(784, .3, 'triangle', .2, null, .24); },
  bad() { this.tone(300, .22, 'triangle', .22, 200); this.tone(220, .35, 'triangle', .22, 140, .18); }
};

/* ───────────────────── 10. Harbor window ───────────────────── */
const SKY = [
  { t: 0,   top: '#4a7fa6', bot: '#f2b57c', sea: '#3a6f86', sea2: '#17384a', city: '#27485a', city2: '#2f5568', lit: 0,  stars: 0,   beam: .15 },
  { t: .4,  top: '#3d92c9', bot: '#c3e5ea', sea: '#2e7f9a', sea2: '#164459', city: '#35596b', city2: '#3f6a7e', lit: 0,  stars: 0,   beam: .1 },
  { t: .75, top: '#5b6fa6', bot: '#f2a35a', sea: '#3b5f7d', sea2: '#142c40', city: '#243d50', city2: '#2b4960', lit: .5, stars: 0,   beam: .45 },
  { t: 1,   top: '#1d2749', bot: '#c25f4a', sea: '#2a3f66', sea2: '#0e1d30', city: '#182a3b', city2: '#1e3447', lit: 1,  stars: .3,  beam: .7 },
  { t: 1.2, top: '#07101e', bot: '#1a3652', sea: '#10263c', sea2: '#06101c', city: '#0e1b28', city2: '#122332', lit: 1,  stars: 1,   beam: .9 }
];

class Harbor {
  constructor(host) {
    this.host = host; this.ships = new Map(); this.waiting = []; this.cur = null; this.f = 0; this.raf = 0;
    host.innerHTML = this.svg();
    this.gShips = host.querySelector('#ships');
    this.sun = host.querySelector('#sun');
    this.weather = document.getElementById('weather');
    this.setSky(.05);
  }

  svg() {
    const r = rng('halcyon');
    let stars = '';
    for (let i = 0; i < 55; i++) stars += `<circle cx="${Math.round(r() * 1200)}" cy="${Math.round(r() * 120)}" r="${(r() * 1.2 + .4).toFixed(1)}" fill="#fff"/>`;
    let city = '', x = 0;
    while (x < 610) {
      const w = 20 + Math.floor(r() * 26), h = 22 + Math.floor(r() * 52), y = 152 - h;
      city += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${r() > .5 ? 'var(--city)' : 'var(--city2)'}"/>`;
      if (r() > .6) city += `<path d="M${x} ${y}l${w / 2} -10 ${w / 2} 10z" fill="var(--city)"/>`;
      for (let wy = y + 6; wy < 146; wy += 10) for (let wx = x + 4; wx < x + w - 4; wx += 8) if (r() > .55) city += `<rect x="${wx}" y="${wy}" width="3.5" height="4.5" fill="#ffd98a" style="opacity:var(--lit)"/>`;
      x += w + Math.floor(r() * 4);
    }
    const waves = [0, 1, 2, 3, 4, 5].map(i => `<path d="M${-40 + i * 40} ${206 + (i % 3) * 9}q15 -7 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="2"/>`).join('');
    return `<svg viewBox="0 0 1200 240" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Harbor of Port Halcyon with ships waiting offshore">
      <defs>
        <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky1)"/><stop offset="1" style="stop-color:var(--sky2)"/></linearGradient>
        <linearGradient id="seag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sea1)"/><stop offset="1" style="stop-color:var(--sea2)"/></linearGradient>
        <linearGradient id="beamg" gradientUnits="userSpaceOnUse" x1="1100" y1="0" x2="380" y2="0"><stop offset="0" stop-color="#fff0b8" stop-opacity=".95"/><stop offset="1" stop-color="#fff0b8" stop-opacity="0"/></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="7"/></filter>
      </defs>
      <rect width="1200" height="240" fill="url(#skyg)"/>
      <g id="stars" style="opacity:var(--stars)">${stars}</g>
      <g style="opacity:var(--stars)"><circle cx="880" cy="52" r="24" fill="#f2f2dc" opacity=".35" filter="url(#soft)"/><circle cx="880" cy="52" r="13" fill="#f4f3de"/></g>
      <g id="sun" style="transform:translate(140px,160px)"><circle r="34" fill="#ffe3a0" opacity=".55" filter="url(#soft)"/><circle r="16" fill="#fff2cc"/></g>
      <g class="cloud"><ellipse cx="120" cy="50" rx="60" ry="12" fill="#fff" opacity=".5"/><ellipse cx="160" cy="42" rx="38" ry="12" fill="#fff" opacity=".5"/></g>
      <g class="cloud b"><ellipse cx="300" cy="84" rx="70" ry="10" fill="#fff" opacity=".4"/><ellipse cx="340" cy="77" rx="40" ry="10" fill="#fff" opacity=".4"/></g>
      <g class="gulls" style="opacity:calc(1 - var(--stars))">${[0, 1, 2].map(i => `<g class="gull g${i}"><g transform="translate(0 ${30 + i * 24})"><path class="flap" d="M0 0q5 -6 10 0q5 -6 10 0" fill="none" stroke="#f4f1e8" stroke-width="2" stroke-linecap="round"/></g></g>`).join('')}</g>
      <path d="M560 152Q640 118 720 140T900 134 1010 152Z" fill="var(--city)"/>
      ${city}
      <g fill="var(--city2)"><rect x="300" y="122" width="120" height="30"/><path d="M296 122h128l-64 -14z"/></g>
      <path d="M50 152V84" stroke="var(--city)" stroke-width="4" fill="none"/><g class="jib"><path d="M50 84h92M50 96l38 -12M142 84v14" stroke="var(--city)" stroke-width="4" fill="none"/><circle cx="142" cy="100" r="3" fill="#e5583e"/></g>
      <rect y="150" width="1200" height="90" fill="url(#seag)"/>
      <path d="M0 150h1200" stroke="#fff" stroke-opacity=".25"/>
      <g class="waves">${waves}</g>
      <g class="beam" style="opacity:var(--beam)"><path d="M1100 66 L-120 14 L-120 124Z" fill="url(#beamg)"/></g>
      <path d="M1030 240Q1058 190 1088 186H1128Q1158 194 1178 240Z" fill="#26353e"/><path d="M1086 186 1094 80H1106L1114 186Z" fill="#e8efe8"/>
      <path d="M1090 150 1092 128H1108L1110 150Z M1094 110 1096 96H1104L1106 110Z" fill="#d6492f"/>
      <rect x="1091" y="56" width="18" height="24" fill="#2a2a2a"/><rect x="1094" y="59" width="12" height="18" fill="#ffe08a"/><path d="M1088 56 1100 44 1112 56Z" fill="#c99a4b"/>
      <path d="M0 150H470V170Q462 176 440 178H0Z" fill="#3d3a36"/><path d="M0 150H470V157H0Z" fill="#5a554d"/>
      <g fill="#1d1b18"><rect x="120" y="143" width="9" height="9" rx="2"/><rect x="260" y="143" width="9" height="9" rx="2"/><rect x="400" y="143" width="9" height="9" rx="2"/></g>
      <g id="ships"></g>
      <g class="waves" style="animation-direction:alternate-reverse"><path d="M-40 226q20 -8 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0V240H-40Z" fill="var(--sea2)" opacity=".7"/></g>
    </svg>`;
  }

  setSky(f) {
    this.f = f;
    const ff = clamp(f, 0, 1.2);
    let a = SKY[0], b = SKY[1];
    for (let i = 0; i < SKY.length - 1; i++) if (ff >= SKY[i].t && ff <= SKY[i + 1].t) { a = SKY[i]; b = SKY[i + 1]; break; }
    const k = b.t === a.t ? 0 : (ff - a.t) / (b.t - a.t);
    const hex = key => mixHex(a[key], b[key], k), num = key => a[key] + (b[key] - a[key]) * k;
    const s = this.host.style;
    s.setProperty('--sky1', hex('top')); s.setProperty('--sky2', hex('bot'));
    s.setProperty('--sea1', hex('sea')); s.setProperty('--sea2', hex('sea2'));
    s.setProperty('--city', hex('city')); s.setProperty('--city2', hex('city2'));
    s.setProperty('--lit', num('lit').toFixed(2)); s.setProperty('--stars', num('stars').toFixed(2)); s.setProperty('--beam', num('beam').toFixed(2));
    const p = clamp(ff, 0, 1);
    this.sun.style.transform = `translate(${140 + p * 820}px,${ff > 1 ? 280 : 172 - Math.sin(Math.PI * p) * 120}px)`;
  }

  skyTo(f, ms = 1500) {
    cancelAnimationFrame(this.raf);
    const from = this.f, t0 = performance.now();
    const step = now => {
      const k = clamp((now - t0) / ms, 0, 1);
      this.setSky(from + (f - from) * k);
      if (k < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  setWeather(day) { this.weather.className = 'weather ' + (WEATHER[day] || ''); }

  makeShip(s) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'ship');
    g.style.transform = 'translate(1350px,186px) scale(.85)';
    g.style.opacity = 0;
    g.innerHTML = `<g class="bob"><path class="wake" d="M-8 1q8 4 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path class="wake w2" d="M-2 4q8 3 16 0t16 0t16 0t16 0t16 0t16 0t16 0" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>${Art.ship(s.kind, s.seed)}</g>`;
    this.gShips.appendChild(g);
    this.ships.set(s.no, g);
    this.waiting.push(s.no);
  }

  setQueue(list) {
    this.gShips.innerHTML = ''; this.ships.clear(); this.waiting = []; this.cur = null;
    list.forEach(s => this.makeShip(s));
    requestAnimationFrame(() => requestAnimationFrame(() => this.layout()));
  }

  addShips(list) { list.forEach(s => this.makeShip(s)); requestAnimationFrame(() => requestAnimationFrame(() => this.layout())); }

  layout() {
    this.waiting.forEach((no, i) => {
      const g = this.ships.get(no);
      g.style.transitionDelay = `${i * 70}ms`;
      g.style.transform = `translate(${480 + i * 98}px,${186 + (i % 2) * 8}px) scale(.85)`;
      g.style.opacity = i < 7 ? 1 : 0;
    });
  }

  dock(no) {
    this.waiting = this.waiting.filter(n => n !== no);
    this.cur = no;
    const g = this.ships.get(no);
    if (g) { g.style.transitionDelay = '0ms'; g.style.transform = 'translate(205px,176px) scale(1.45)'; g.style.opacity = 1; }
    this.layout();
  }

  leave(no, verdict) {
    const g = this.ships.get(no);
    if (!g) return;
    const p = g.querySelector('.pennant');
    if (p) p.style.fill = verdict === 'ok' ? '#43b087' : verdict === 'no' ? '#e5583e' : '#888';
    g.style.transitionDelay = '600ms';
    g.style.transform = verdict === 'ok' ? 'translate(-280px,176px) scale(1.45)' : verdict === 'no' ? 'translate(1320px,168px) scale(.8)' : 'translate(760px,158px) scale(.6)';
    g.style.opacity = 0;
    this.cur = null;
  }
}

/* ───────────────────── 11a. Gazette art, rule pictograms and the serial story ───────────────────── */
const NINK = '#1b3a46', NPAP = '#e6e1cc', NRED = '#c0432f', NMID = '#8fa8ad';
const nscene = (alt, inner) => `<svg viewBox="0 0 240 130" role="img" aria-label="${alt}"><defs><pattern id="ht" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.05" fill="${NINK}" opacity=".4"/></pattern></defs><rect width="240" height="130" fill="${NPAP}"/><rect y="88" width="240" height="42" fill="url(#ht)"/><path d="M0 88h240" stroke="${NINK}" stroke-width="2"/>${inner}</svg>`;
const nboat = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -8H40L34 0H6Z" fill="${NINK}"/><rect x="10" y="-18" width="16" height="10" fill="${NPAP}" stroke="${NINK}" stroke-width="1.5"/><rect x="26" y="-22" width="5" height="14" fill="${NRED}"/></g>`;
const ns = `stroke="${NINK}" stroke-width="2.5"`;

Object.assign(Art, {
  news(kind) {
    const S = {
      berthoffice: ['The new Berth Office beside the lighthouse', `<path d="M34 88 40 30h12l6 58Z" fill="${NPAP}" ${ns}/><path d="M38 50h16l1 10H37ZM36 70h20l1 10H35Z" fill="${NRED}"/><rect x="38" y="18" width="14" height="10" fill="${NINK}"/><path d="M35 18 45 8 55 18Z" fill="${NINK}"/><rect x="110" y="52" width="100" height="36" fill="${NINK}"/><path d="M104 52 160 28 216 52Z" fill="${NINK}"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${118 + i * 18}" y="62" width="9" height="12" fill="${NPAP}"/>`).join('')}<path d="M160 28V10" ${ns}/><path d="M160 10l16 5-16 5z" fill="${NRED}"/>${nboat(70, 114)}`],
      guild: ['Studio workers carrying placards', [30, 70, 110, 150, 190].map((x, i) => `<path d="M${x} ${72 - (i % 2) * 10}V92" ${ns}/><rect x="${x - 16}" y="${34 - (i % 2) * 10}" width="32" height="24" fill="${NPAP}" ${ns}/><path d="M${x - 9} ${42 - (i % 2) * 10}h18M${x - 9} ${50 - (i % 2) * 10}h12" stroke="${i % 2 ? NRED : NINK}" stroke-width="2.5"/><circle cx="${x}" cy="102" r="6" fill="${NINK}"/><rect x="${x - 7}" y="108" width="14" height="22" rx="4" fill="${NINK}"/>`).join('')],
      clinic: ['A clinic building and a calendar of crossed-out appointments', `<rect x="24" y="38" width="86" height="50" fill="${NPAP}" ${ns}/><path d="M67 46v18M58 55h18" stroke="${NRED}" stroke-width="6"/><rect x="58" y="70" width="18" height="18" fill="${NINK}"/><rect x="130" y="22" width="84" height="66" fill="${NPAP}" ${ns}/><path d="M130 38h84M158 38v50M186 38v50M130 54h84M130 70h84" stroke="${NINK}" stroke-width="1.5"/><path d="M136 58l16 8M152 58l-16 8M164 42l16 8M180 42l-16 8M192 74l16 8M208 74l-16 8" stroke="${NRED}" stroke-width="2.5"/>`],
      tide: ['A tide post with red and grey flags and a fishing boat', `<path d="M60 88V22" stroke="${NINK}" stroke-width="3.5"/><path d="M60 22h32v16H60Z" fill="${NRED}"/><path d="M60 42h32v16H60Z" fill="${NMID}" ${ns}/>${nboat(124, 116, 1.5)}<circle cx="196" cy="36" r="15" fill="${NPAP}" ${ns}/><path d="M196 28v10" stroke="${NRED}" stroke-width="3.5"/><circle cx="196" cy="45" r="2" fill="${NRED}"/>`],
      marrow: ['A rival port with cranes and an arrow pointing away from Halcyon', `<rect x="104" y="58" width="22" height="30" fill="${NINK}"/><rect x="130" y="46" width="18" height="42" fill="${NINK}"/><path d="M160 88V28h60M160 38l26-10M220 28v14" stroke="${NINK}" stroke-width="3.5" fill="none"/><circle cx="220" cy="46" r="3" fill="${NRED}"/><path d="M14 52h74" stroke="${NRED}" stroke-width="5"/><path d="M76 40l16 12-16 12" stroke="${NRED}" stroke-width="5" fill="none"/>${nboat(30, 114)}`],
      council: ['The council chamber with a ballot box', `<path d="M42 50 112 22 182 50Z" fill="${NINK}"/><rect x="46" y="50" width="132" height="8" fill="${NINK}"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${56 + i * 26}" y="58" width="11" height="30" fill="${NPAP}" ${ns}/>`).join('')}<rect x="192" y="62" width="34" height="26" fill="${NRED}"/><path d="M200 70h18" stroke="${NPAP}" stroke-width="3"/>`],
      pension: ['A computer screen showing an error', `<rect x="62" y="22" width="116" height="64" rx="4" fill="${NINK}"/><rect x="69" y="29" width="102" height="50" fill="${NPAP}"/><path d="M120 36l17 30h-34Z" fill="none" stroke="${NRED}" stroke-width="3.5"/><path d="M120 46v10" stroke="${NRED}" stroke-width="3.5"/><circle cx="120" cy="61" r="1.8" fill="${NRED}"/><path d="M104 86h32l5 10h-42Z" fill="${NINK}"/>`],
      nox: ['A dark unmarked ship under a moon', `<circle cx="196" cy="30" r="14" fill="${NPAP}" ${ns}/><path d="M58 92H182L168 104H72Z" fill="${NINK}"/><rect x="96" y="58" width="52" height="34" fill="${NINK}"/><path d="M148 62l30 30h-30Z" fill="${NINK}"/><path d="M104 26q0-12 12-12t12 10q0 9-12 12v7" stroke="${NRED}" stroke-width="4.5" fill="none" stroke-linecap="round"/><circle cx="116" cy="54" r="2.6" fill="${NRED}"/>`],
      storm: ['Storm clouds and lightning over a tilted ship', `<ellipse cx="80" cy="30" rx="60" ry="18" fill="${NINK}"/><ellipse cx="150" cy="22" rx="54" ry="16" fill="${NINK}"/><path d="M126 36l-14 26h16l-12 28 28-34h-16l10-20Z" fill="${NRED}"/><g transform="rotate(-9 60 112)">${nboat(40, 118, 1.5)}</g>`],
      quiet: ['A sailing boat and gulls at the harbor', `<path d="M100 88h60l-8 10h-44Z" fill="${NINK}"/><path d="M128 84V26L96 82Z" fill="${NPAP}" ${ns}/><path d="M132 78V38l26 40Z" fill="${NRED}"/><path d="M28 36q8-8 16 0M52 24q8-8 16 0M184 34q8-8 16 0" stroke="${NINK}" stroke-width="2.5" fill="none"/>`],
      speech: ['A podium with a microphone', `<rect x="36" y="14" width="168" height="28" fill="${NPAP}" ${ns}/><path d="M48 24h60M48 32h40" stroke="${NINK}" stroke-width="2.5"/><path d="M100 54h40l-6 34h-28Z" fill="${NINK}"/><path d="M120 54V40" ${ns}/><circle cx="120" cy="36" r="5" fill="${NRED}"/>`]
    }[kind] || ['', ''];
    return nscene(S[0], S[1]);
  },

  ruleIcon(cat) {
    const b = {
      text: `<path d="M6 38 16 10l10 28M9.5 29h13M30 38V22M30 27q0-5 5-5t5 5v11" />`,
      errors: `<path d="M24 6 44 40H4Z"/><path d="M24 18v10"/><circle cx="24" cy="34" r="1.2" fill="#c0432f"/>`,
      realworld: `<path d="M6 8h36v24H22l-8 8v-8H6Z"/><path d="M19 19q0-5 5-5t5 4q0 3-5 5v2"/><circle cx="24" cy="29" r="1.2" fill="#102f3a"/>`,
      contrast: `<circle cx="24" cy="24" r="17"/><path d="M24 7a17 17 0 0 1 0 34Z" fill="#102f3a"/>`,
      consistency: `<rect x="5" y="12" width="15" height="24" rx="2"/><rect x="28" y="12" width="15" height="24" rx="2"/><path d="M20 24h8"/>`,
      control: `<path d="M16 12 7 21l9 9"/><path d="M7 21h20q13 0 13 14"/>`,
      prevention: `<path d="M16 5h16l11 11v16L32 43H16L5 32V16Z"/><path d="M15 24h18" stroke="#c0432f"/>`,
      color: `<circle cx="18" cy="19" r="10" fill="#c0432f" fill-opacity=".6"/><circle cx="30" cy="19" r="10" fill="#43b087" fill-opacity=".6"/><circle cx="24" cy="30" r="10" fill="#2f7390" fill-opacity=".6"/>`,
      target: `<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="5"/><path d="M24 4v8M24 36v8M4 24h8M36 24h8"/>`,
      recognition: `<path d="M3 24Q24 6 45 24 24 42 3 24Z"/><circle cx="24" cy="24" r="6" fill="#102f3a"/>`,
      keyboard: `<rect x="5" y="11" width="38" height="26" rx="4"/><path d="M13 24h18m-6-6 6 6-6 6"/><path d="M37 17v14"/>`,
      status: `<rect x="5" y="17" width="38" height="14" rx="3"/><rect x="8" y="20" width="18" height="8" fill="#102f3a" stroke="none"/><path d="M12 38h2M20 38h2M28 38h2"/>`,
      minimal: `<path d="M9 9h8v8H9zM20 9h8v8h-8zM31 9h8v8h-8zM9 20h8v8H9zM20 20h8v8h-8zM31 20h8v8h-8zM9 31h8v8H9zM20 31h8v8h-8zM31 31h8v8h-8z"/>`,
      flexibility: `<path d="M6 12h36M6 24h36M6 36h36"/><circle cx="16" cy="12" r="4" fill="#fff"/><circle cx="32" cy="24" r="4" fill="#fff"/><circle cx="22" cy="36" r="4" fill="#fff"/>`
    }[cat] || '';
    return `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="#102f3a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
  },

  toolIcon(id) {
    const m = {
      contrast: `<circle cx="19" cy="19" r="9" fill="none" stroke="#ffe2a6" stroke-width="2"/><path d="M19 10a9 9 0 0 1 0 18z" fill="#ffe2a6"/>`,
      ruler: `<g transform="rotate(-45 19 19)"><rect x="5" y="14" width="28" height="10" rx="1.5" fill="#ffe2a6"/><path d="M9 14v4M13 14v6M17 14v4M21 14v6M25 14v4M29 14v6" stroke="#2a1f0c" stroke-width="1.4"/></g>`,
      cvd: `<path d="M6 19Q19 8 32 19Q19 30 6 19Z" fill="#ffe2a6"/><circle cx="19" cy="19" r="5.5" fill="#2a1f0c"/><circle cx="19" cy="19" r="2.3" fill="#43b087"/>`,
      hand: `<path d="M13 22V11a2 2 0 0 1 4 0v8m0-9a2 2 0 0 1 4 0v9m0-7a2 2 0 0 1 4 0v10c0 5-3 8-7 8s-6-2-8-6l-2-4a2 2 0 0 1 3-2l2 3" fill="#ffe2a6" stroke="#2a1f0c" stroke-width="1.2"/>`,
      tab: `<rect x="8" y="12" width="22" height="15" rx="3" fill="#ffe2a6"/><path d="M12 19.5h10m-3.5-3.5 3.5 3.5-3.5 3.5" stroke="#2a1f0c" fill="none" stroke-width="2"/>`
    }[id];
    return `<svg viewBox="0 0 38 38" aria-hidden="true"><circle cx="19" cy="19" r="17" fill="#2a1f0c" stroke="#c99a4b" stroke-width="2"/>${m}</svg>`;
  }
});

const RULE_SHORT = {
  contrast: 'Text needs 4.5 : 1 against its background.',
  color: 'Never rely on colour alone to tell things apart.',
  text: 'At least 11 px, plain fonts, no phrases in capitals.',
  target: 'Controls must be big enough and close enough to hit.',
  keyboard: 'Tab must follow the order you read the screen.',
  status: 'Show what the system is doing and where you are.',
  realworld: 'Plain words. No jargon, no double negatives.',
  control: 'Always leave a way out: cancel, undo, back.',
  consistency: 'Same thing, same name, same place. Follow the style guide.',
  prevention: 'Risky actions say what will happen and can be undone.',
  recognition: 'Show it. Never make people remember or retype.',
  flexibility: 'Let people adapt it, with a way back to default.',
  minimal: 'Every extra option slows everyone down.',
  errors: 'Say what went wrong and how to fix it.'
};
const TOOL_NAME = { contrast: 'Contrast lens', ruler: 'Calipers', cvd: 'Prism glass', tab: 'Route chart', hand: 'The Hand' };

/* The Gazette: a world that unfolds a little each morning. */
const NEWS = {
  1: g => ({
    weather: ['Calm', 'clear skies, 14°'],
    lead: { img: 'berthoffice', h: 'Ten years after the Misclick, the Berth Office opens', p: 'On the anniversary of the day twenty-three boats followed a wrong tide table out to the Reach, every public screen will be inspected on the quay. Chancellor Vael: “Never again.”' },
    side: [{ img: 'quiet', h: 'Ferry fares unchanged', p: 'The Authority freezes fares for another season.' }],
    ad: 'WANTED: berth inspector. Steady hand, sharp eye. Apply at the quay.'
  }),
  2: g => ({
    weather: ['Calm', 'light wind, 13°'],
    lead: { img: 'guild', h: 'Studios protest inspection fees', p: 'The Lantern & Quill Guild says checks slow its work. Vael calls them “a small price for safety.”' },
    side: [{ img: 'council', h: 'Harbor Standard Kit announced', p: 'Licensed buttons, forms and error boxes, four credits a screen, handled by the Registry. Adoption is “voluntary for now”.' }],
    ad: 'NOTICE: Gull & Gull Studios opens at Quay 2. “Freelance.” No refunds.'
  }),
  3: g => ({
    weather: ['Fog', 'visibility poor, 11°'],
    lead: { img: 'clinic', h: 'Clinic portal fails: 40 appointments lost', p: 'Patients could not cancel or rebook after an error with no way back. The clinic blames “a design oversight.”' },
    side: [{ img: 'speech', h: 'Vael floats “Swift Clearance”', p: 'Trusted studios could skip inspection under a plan to be tabled soon.' }],
    ad: 'FOG HORN maintenance on Thursday. Expect noise.'
  }),
  4: g => ({
    weather: ['Fog lifting', 'drizzle later, 10°'],
    lead: { img: 'tide', h: 'Tide flags mix-up turns back fishing fleet', p: 'A colour-blind skipper could not tell the red flag from the green. Nobody was hurt, this time.' },
    side: [{ img: 'marrow', h: 'Three studios leave for Marrow', p: 'Departures have tripled since spring, says the Guild.' }],
    ad: 'BARNABY GULL IS NOT A REAL ENGINEER. — a concerned colleague'
  }),
  5: g => ({
    weather: ['Rain', 'steady rain, 9°'],
    lead: { img: 'pension', h: 'Pension portal baffles pensioners', p: 'Thousands had to retype details from earlier pages. “I gave up twice,” says Antonio, 74.' },
    side: [
      { img: 'council', h: 'Swift Clearance bill tabled', p: 'The council votes in two days. Supporters want speed; critics fear another clinic failure.' },
      { img: 'nox', h: 'A studio with no address', p: 'Nox & Co. has put six screens into the harbor with no registry. Nobody has met them. Its name is on the Standard Kit licence.' }
    ],
    ad: 'LESSONS: touch-typing for all ages, Tuesdays.'
  }),
  6: g => {
    const likely = g.trust < 55 || g.flow < 35;
    return {
      weather: ['Rain', 'heavy at times, 9°'],
      lead: { img: 'council', h: 'Council to vote on Swift Clearance', p: likely ? 'Public trust in the Berth Office is shaky and the quay is clogged. Observers expect the bill to pass.' : 'The Berth Office is trusted and the quay is moving. Observers expect the bill to fail.' },
      side: [
        { img: 'marrow', h: 'Marrow-built app locks out a thousand', p: 'Halcyon officials decline to comment.' },
        { img: 'nox', h: 'Nox & Co. “is the Authority’s own”', p: 'An anonymous leak says the unregistered studio works for the Chancellor’s office.' }
      ],
      ad: 'HELP WANTED: lamp-lighter, evenings. Own ladder preferred.'
    };
  },
  7: g => ({
    weather: ['Storm', 'gale warning, 8°'],
    lead: g.swift
      ? { img: 'council', h: 'Swift Clearance passes', p: 'Inspections will be shorter from today. The Guild cheers; the Berth Office is told to “keep up.”' }
      : { img: 'council', h: 'Council rejects Swift Clearance', p: 'Members cited the clinic and pension failures. Public trust in the Berth Office is credited.' },
    side: [
      { img: 'nox', h: 'Nox & Co. confirmed as Authority team', p: 'Records show it was built to dodge the berth. Vael calls it “an experiment.”' },
      { img: 'berthoffice', h: 'Inspector General at the quay', p: g.bribes > 0 ? 'The audit will read every ledger. Rumours of envelopes persist.' : 'Today the audit reads every ledger. Expect questions.' }
    ],
    ad: 'STORM SHUTTERS: order now, delivered before the gale.'
  })
};

const END_NEWS = {
  keeper: ['berthoffice', 'Halcyon sails on: users praise the Berth Office'],
  warden: ['guild', 'Safe but slow: studios grumble at the quay'],
  stamp: ['storm', 'Fast harbor, angry users: complaints at a record'],
  steady: ['quiet', 'A quiet year at the Berth Office'],
  caught: ['council', 'Inspector under audit: seal revoked'],
  fired: ['quiet', 'Seal returned: new inspector sought'],
  closed: ['storm', 'Harbor closed pending inquiry'],
  gridlock: ['guild', 'Gridlock at the quay: cargo spoils'],
  bankrupt: ['quiet', 'Inspector evicted from chandlery room']
};

/* ───────────────────── 11b. Barnaby Gull: the troll studio ─────────────────────
   Every ship he brings is faulty. On day 2 the screens are plainly silly; later they look
   more and more like real products, but never stop being wrong. Faults still obey the
   orders in force: nothing unannounced is ever "wrong".                                  */
const BARNY = 'Barnaby Gull';
LOOKS[BARNY] = { skin: '#d9a57c', hair: '#8a8f95', style: 'short', shirt: '#2d5d7a', bg: '#c9d6d0', hat: '#e8efe8', smirk: true };
SHIP_KIND.jlogin = SHIP_KIND.jcart = SHIP_KIND.jsettings = 'junk';
const TROLL_PLAN = { 2: [1], 3: [1], 4: [2, 2], 5: [2, 3], 6: [3, 3, 3], 7: [3, 3, 3] };

const L3 = (h, a, b, c) => [a, b, c][(h.lvl || 1) - 1];
const btn = (txt, st = '', cls = '') => `<button class="m-btn ${cls}" style="${st}">${txt}</button>`;

const JOKES = {
  jlogin: {
    id: 'jlogin', names: ['TotallyLegit Bank', 'Meridian Online Banking', 'Northgate Trust'], urls: ['totally-legit.bank.example/enter', 'meridian.bank.example/auth', 'northgate.trust.example/login'],
    style: ['Sentence case, plain fonts.', 'One large primary button ends the form and is called “Sign in”.'],
    regions: { title: 'Heading', subtitle: 'Intro line', error: 'Error message', user: 'Name field', pass: 'Password field', question: 'Security question', forgot: 'Help link', submit: 'Main button', back: 'Way back', extra: 'Extra buttons', shortcuts: 'Shortcut row', status: 'Status line' },
    defects: {
      shout: { region: 'title', cat: 'text', label: 'Heading in capitals with a fancy font', why: 'Capitals and decorative typefaces slow reading.' },
      mixed: { region: 'subtitle', cat: 'consistency', label: 'One action called log on, sign in and enter', why: 'The same action needs the same name everywhere. The style guide says “Sign in”.' },
      success: { region: 'error', cat: 'errors', label: 'Error message that explains nothing', why: 'Say what went wrong and how to fix it.' },
      riddle: { region: 'user', cat: 'realworld', label: 'Field label in jargon or riddles', why: 'Use words the user already knows.' },
      colorOnly: { region: 'pass', cat: 'color', label: 'Invalid password shown only by a red border', why: 'Add a redundant code: an icon or a message.' },
      recall: { region: 'question', cat: 'recognition', label: 'Security question needs perfect recall', why: 'Do not make users remember trivia.' },
      faint: { region: 'forgot', cat: 'contrast', label: 'Help link too pale to read', why: 'Normal text needs 4.5 : 1. Use the contrast lens.' },
      runaway: { region: 'submit', cat: 'target', label: 'Sign-in button is tiny', why: 'Small targets are slow to hit (Fitts’ law).' },
      noexit: { region: 'back', cat: 'control', label: 'The way back is disabled', why: 'Users must always be able to leave.' },
      danger: { region: 'extra', cat: 'prevention', label: '“Delete my account” sits next to the sign-in alternative', why: 'Keep destructive actions away from frequent ones.' },
      clutter: { region: 'shortcuts', cat: 'minimal', label: 'A dozen equal shortcuts', why: 'Hick’s law: every option costs time.' },
      spin: { region: 'status', cat: 'status', label: 'Endless spinner with no progress', why: 'Show what the system is doing and how long it will take.' }
    },
    build: h => {
      const t = (...a) => L3(h, ...a);
      return `<div class="j-wrap l${h.lvl}"><form onsubmit="return false">
        <h2 data-region="title" ${h('shout') ? `style="text-transform:uppercase;letter-spacing:${t('.2em', '.12em', '.05em')};font-family:${t("'Old English Text MT',UnifrakturCook,fantasy", 'Georgia,serif', 'inherit')}"` : ''}>${h('shout') ? t('Welcome 2 the bank!!!', 'Enter your account', 'Sign in to your account') : t('Welcome to the bank', 'Enter your account', 'Sign in to your account')}</h2>
        <p data-region="subtitle">${h('mixed') ? t('Log on, sign in, enter, login: whichever you like.', 'Log on to continue, then proceed to sign-in.', 'Log on to continue to Sign-in.') : 'Sign in to continue.'}</p>
        <div class="m-alert" data-region="error">${h('success') ? t('Error: success. Please try again to succeed.', 'Operation failed (code 0x0).', 'Something went wrong. Error A-4021.') : 'We couldn’t sign you in: that password doesn’t match. Check it, or reset it below.'}</div>
        <div data-region="user"><label for="ju">${h('riddle') ? t('By what name do ye summon thyself?', 'Principal identifier (UID)', 'Account principal') : 'Username'}</label><input id="ju"></div>
        <div data-region="pass"><label for="jp">Password</label><input id="jp" type="password" value="abc" class="invalid">${h('colorOnly') ? '' : '<small class="m-err">✕ Use at least 8 characters</small>'}</div>
        <div data-region="question">${h('recall') ? `<label for="jq">${t('Type the third word of the last email you read', 'Enter the 4th character of your first pet’s name', 'Name of your first teacher’s second pet')}</label><input id="jq">` : '<label for="jq">Security code from your app</label><input id="jq" placeholder="6 digits">'}</div>
        <p><a href="#" data-region="forgot" ${h('faint') ? `style="color:${t('#e8e8a0', '#bdbdbd', '#949494')}"` : ''}>Forgot your password?</a></p>
        <span data-region="submit">${h('runaway') ? btn('Sign in', t('height:14px;width:44px;margin-left:200px;padding:0;font-size:10px', 'height:20px;width:60px;padding:0;font-size:12px', 'height:22px;width:84px;padding:0;font-size:13px')) : btn('Sign in', '', 'wide')}</span>
        <div data-region="back" style="margin-top:8px">${h('noexit') ? '<button class="m-btn secondary" disabled>Back</button> <small>(unavailable)</small>' : '<button class="m-btn secondary s">Cancel</button>'}</div>
        <div data-region="extra" style="display:flex;gap:${h('danger') ? 2 : 10}px;margin-top:8px">${h('danger') ? '<button class="m-btn s">Use passkey</button><button class="m-btn s">Delete my account</button>' : '<button class="m-btn s secondary">Use passkey</button>'}</div>
        <div data-region="shortcuts" class="m-icons" style="flex-wrap:wrap">${h('clutter') ? ['Pay', 'Loans', 'Cards', 'FX', 'Stocks', 'ATM', 'Help', 'Rates', 'Docs', 'Tax', 'Gifts', 'Chat'].map(x => `<button>${x}</button>`).join('') : '<button>Help</button><button>Branches</button>'}</div>
        <p data-region="status">${h('spin') ? '<span class="m-spin" aria-hidden="true">⟳</span> Working…' : '<small>Ready.</small>'}</p></form></div>`;
    }
  },

  jcart: {
    id: 'jcart', names: ['Gullmart cart', 'Parcelo shopping basket', 'Kestrel Home checkout'], urls: ['gullmart.example/cart', 'parcelo.example/basket', 'kestrelhome.example/checkout'],
    style: ['The page calls it “Cart” everywhere.', 'Quiet destructive actions stay away from the primary one.'],
    regions: { banner: 'Promo banner', title: 'Page title', item: 'Item row', qty: 'Quantity buttons', coupon: 'Coupon field', msg: 'Coupon message', ship: 'Shipping options', total: 'Order total', terms: 'Small print', danger: 'Cart buttons', pay: 'Payment step', progress: 'Progress area' },
    defects: {
      bigBright: { region: 'banner', cat: 'color', label: 'Bright clashing colours over a large area', why: 'Avoid bright colours on big areas and hard-to-pair colours.' },
      trolley: { region: 'title', cat: 'consistency', label: 'Cart, basket and trolley in the same page', why: 'One thing, one name.' },
      defenestrate: { region: 'item', cat: 'realworld', label: 'Button says “Defenestrate item”', why: 'Plain words: “Remove”.' },
      tinyQty: { region: 'qty', cat: 'target', label: 'Quantity buttons are tiny', why: 'Small targets are slow and error-prone.' },
      flyer: { region: 'coupon', cat: 'recognition', label: 'Coupon must be retyped from a flyer', why: 'Do not make users remember or retype.' },
      blame: { region: 'msg', cat: 'errors', label: 'Coupon message blames the user', why: 'Say what is wrong and how to fix it, without blame.' },
      many: { region: 'ship', cat: 'minimal', label: 'Twelve shipping options of equal weight', why: 'Hick’s law: fewer choices, faster decisions.' },
      pale: { region: 'total', cat: 'contrast', label: 'Total in pale grey', why: 'Even large text needs 3 : 1.' },
      micro: { region: 'terms', cat: 'text', label: 'Small print at 6–9 px', why: 'At least 11 px.' },
      emptyNear: { region: 'danger', cat: 'prevention', label: '“Empty cart” right beside “Checkout” in the same style', why: 'Keep destructive actions away from the primary one.' },
      trap: { region: 'pay', cat: 'control', label: 'The payment step has no way back', why: 'Users must be able to cancel or go back.' },
      silent: { region: 'progress', cat: 'status', label: '“Processing…” with no progress', why: 'Show progress and what will happen next.' }
    },
    build: h => {
      const t = (...a) => L3(h, ...a);
      const px = t(6, 8, 9);
      return `<div class="j-wrap l${h.lvl}"><div class="m-card" style="max-width:560px">
        <div data-region="banner" class="m-banner" ${h('bigBright') ? `style="background:${t('#ff00ff', '#ff3d00', '#ffb300')};color:${t('#ffff00', '#00ff6a', '#00e5ff')};font-size:${t(28, 24, 20)}px;font-weight:700;padding:${t(34, 26, 20)}px 14px"` : ''}>Free delivery over €50</div>
        <h2 data-region="title">${h('trolley') ? t('Your cart / basket / trolley!!', 'Your basket (cart)', 'Your trolley') : 'Your cart'}</h2>
        <div data-region="item" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>Harbor lamp × <span data-region="qty" style="display:inline-flex;gap:${h('tinyQty') ? 1 : 6}px">${h('tinyQty') ? `<button style="width:${t(10, 14, 20)}px;height:${t(10, 14, 20)}px;padding:0;font-size:8px">−</button><button style="width:${t(10, 14, 20)}px;height:${t(10, 14, 20)}px;padding:0;font-size:8px">+</button>` : '<button class="m-btn s secondary" style="min-width:44px">−</button><button class="m-btn s secondary" style="min-width:44px">+</button>'}</span></span><a href="#" class="m-link">${h('defenestrate') ? t('Defenestrate item', 'Excise line item', 'Dequeue item') : 'Remove'}</a></div>
        <div data-region="coupon">${h('flyer') ? `<label for="jc">Coupon</label><input id="jc" placeholder="${t('Type the code from the flyer you threw away', 'Enter the code from your welcome email', 'Enter the code from step 1')}">` : '<label for="jc">Coupon</label><select id="jc"><option>SPRING10 · saved in your account</option></select>'}</div>
        <div class="m-alert" data-region="msg">${h('blame') ? t('Coupon invalid. Reason: you.', 'You entered an invalid coupon.', 'Invalid input. You typed the wrong code.') : 'That coupon expired on 1 May. Your saved coupon SPRING10 still works.'}</div>
        <div data-region="ship"><b>Shipping</b>${h('many') ? `<div class="m-grid2">${['Standard', 'Express', 'Next-day', 'Locker', 'Economy', 'Priority', 'Weekend', 'Evening', 'Eco', 'Insured', 'Signature', 'Same-day'].map((n, i) => `<label><input type="radio" name="js"> ${n} · €${3 + i}</label>`).join('')}</div>` : '<label><input type="radio" name="js" checked> Standard · free</label><label><input type="radio" name="js"> Express · €6</label>'}</div>
        <p data-region="total" class="m-total" style="color:${h('pale') ? t('#d6d6d6', '#c2c2c2', '#a6a6a6') : '#1d2530'}">Total: €58.90</p>
        <p data-region="terms" style="font-size:${h('micro') ? px : 13}px;line-height:${h('micro') ? 1 : 1.5}">Prices include VAT. Items ship within 3 working days. Returns accepted within 14 days of delivery for unused goods in original packaging, subject to the returns policy.</p>
        <div data-region="danger" style="display:flex;gap:${h('emptyNear') ? 3 : 24}px;margin-top:8px">${btn('Checkout', '', '')}${h('emptyNear') ? btn('Empty cart', '', '') : '<a href="#" class="m-link" style="align-self:center">Empty cart</a>'}</div>
        <div data-region="pay" style="margin-top:12px">${h('trap') ? '<button class="m-btn wide" disabled style="opacity:1">Pay now (no way back)</button>' : '<button class="m-btn wide">Pay now</button> <a href="#" class="m-link">Back to cart</a>'}</div>
        <p data-region="progress" style="margin-top:8px">${h('silent') ? '<span class="m-spin" aria-hidden="true">⟳</span> Processing…' : '<small>Nothing is processing.</small>'}</p></div></div>`;
    }
  },

  jsettings: {
    id: 'jsettings', names: ['HarborPhone settings', 'Orbit device settings', 'Lumen Home settings'], urls: ['settings.harborphone.example', 'orbit.example/settings', 'lumen.example/home/settings'],
    style: ['Saving is always called “Save”.', 'Every option panel offers “Restore defaults”.'],
    regions: { toggle: 'Privacy switch', theme: 'Theme choice', font: 'Text size', notif: 'Notification list', save: 'Save button', reset: 'Defaults', danger: 'Backup and wipe', switch: 'Wi-Fi switch', hint: 'Hint text', status: 'Save status', msg: 'Message', help: 'Help icons' },
    defects: {
      doubleNeg: { region: 'toggle', cat: 'realworld', label: 'Double-negative privacy switch', why: 'No logic puzzles: say what the switch does.' },
      colorTheme: { region: 'theme', cat: 'color', label: 'Theme choice shown only by colour', why: 'Add a label or a tick: a redundant code.' },
      tinyFont: { region: 'font', cat: 'text', label: 'Default text size 8–10 px', why: 'At least 11 px.' },
      fifteen: { region: 'notif', cat: 'minimal', label: 'Fifteen equal notification toggles', why: 'Hick’s law: group or remove options.' },
      apply: { region: 'save', cat: 'consistency', label: 'Button says “Apply” where the style guide says “Save”', why: 'Same action, same name.' },
      noReset: { region: 'reset', cat: 'flexibility', label: 'No “Restore defaults”', why: 'Always offer a way back to the default state.' },
      wipe: { region: 'danger', cat: 'prevention', label: '“Wipe device” next to “Back up”, no confirmation', why: 'Say what will happen and make it hard to do by accident.' },
      tinySwitch: { region: 'switch', cat: 'target', label: 'Switch is a tiny target', why: 'Small targets are slow (Fitts’ law).' },
      faintHint: { region: 'hint', cat: 'contrast', label: 'Hint text too pale', why: 'Needs 4.5 : 1.' },
      maybe: { region: 'status', cat: 'status', label: '“Saved?” with no clear feedback', why: 'Tell the user clearly that the change happened.' },
      invalid: { region: 'msg', cat: 'errors', label: 'Message: “Invalid. No.”', why: 'Say what is wrong and how to fix it.' },
      iconsOnly: { region: 'help', cat: 'recognition', label: 'Icon-only help buttons with no labels', why: 'Recognition beats recall: add labels.' }
    },
    build: h => {
      const t = (...a) => L3(h, ...a);
      const sw = (on, st = '') => `<span style="display:inline-block;width:40px;height:22px;border-radius:11px;background:${on ? '#1a7f64' : '#9aa5af'};position:relative;${st}"><i style="position:absolute;top:2px;${on ? 'right' : 'left'}:2px;width:18px;height:18px;border-radius:50%;background:#fff"></i></span>`;
      return `<div class="j-wrap l${h.lvl}"><div class="m-card" style="max-width:560px">
        <h2>Settings</h2>
        <div data-region="toggle" style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin:8px 0"><span>${h('doubleNeg') ? t('Do not not share my data with partners who do not disallow it', 'Do not disable sharing of anonymous usage data', 'Don’t stop sharing usage data') : 'Share anonymous usage data'}</span>${sw(true)}</div>
        <div data-region="theme" style="display:flex;gap:10px;align-items:center;margin:8px 0">Theme ${h('colorTheme') ? '<span style="width:28px;height:28px;border-radius:50%;background:#2ecc71;display:inline-block"></span><span style="width:28px;height:28px;border-radius:50%;background:#e74c3c;display:inline-block"></span>' : '<span class="m-btn s secondary" style="display:inline-block;min-height:0">✓ Light</span><span class="m-btn s secondary" style="display:inline-block;min-height:0">Dark</span>'}</div>
        <div data-region="font" style="margin:8px 0;font-size:${h('tinyFont') ? t(8, 9, 10) : 15}px">Text size preview: the quick brown fox jumps over the lazy dog.</div>
        <div data-region="notif" style="margin:8px 0"><b>Notifications</b><div class="m-grid2">${(h('fifteen') ? ['Mail', 'Chat', 'News', 'Deals', 'Tips', 'Likes', 'Reminders', 'Updates', 'Nearby', 'Games', 'Weather', 'Sports', 'Music', 'Photos', 'Offers'] : ['Messages', 'Reminders', 'Updates']).map(n => `<label><input type="checkbox" checked> ${n}</label>`).join('')}</div></div>
        <div style="display:flex;align-items:center;gap:10px;margin:8px 0"><span>Wi-Fi</span><span data-region="switch">${h('tinySwitch') ? sw(true, `transform:scale(${t(.35, .5, .62)});transform-origin:left center;margin-right:-${t(24, 20, 14)}px`) : sw(true)}</span><small data-region="hint" style="color:${h('faintHint') ? t('#d0d0a0', '#bcbcbc', '#9a9a9a') : '#4a5560'}">Connects automatically to known networks.</small></div>
        <div data-region="help" class="m-icons">${h('iconsOnly') ? '<button>?</button><button>⌘</button><button>⎘</button>' : '<button>? Help</button><button>⌘ Shortcuts</button>'}</div>
        <div data-region="danger" style="display:flex;gap:${h('wipe') ? 3 : 24}px;margin:8px 0">${btn('Back up', '', 's')}${h('wipe') ? btn('Wipe device', 'background:#b3261e;border-color:#8c1d18', 's') : '<a href="#" class="m-link" style="align-self:center">Erase device…</a>'}</div>
        <div style="display:flex;gap:10px;align-items:center;margin-top:10px"><span data-region="save">${btn(h('apply') ? 'Apply' : 'Save', '', '')}</span><span data-region="reset" style="display:inline-block;min-height:30px;min-width:${h('noReset') ? 90 : 0}px">${h('noReset') ? '' : '<button class="m-btn secondary s">Restore defaults</button>'}</span><small data-region="status">${h('maybe') ? 'Saved?' : 'Saved at 14:05'}</small></div>
        <div class="m-alert" data-region="msg" style="margin-top:10px">${h('invalid') ? t('Invalid. No.', 'Invalid value.', 'Invalid input. Please try again.') : 'The password must be at least 8 characters long. Add 2 more characters.'}</div></div></div>`;
    }
  }
};

SubmissionFactory.prototype.createTroll = function (no, level) {
  const base = pick(Object.values(JOKES));
  const tpl = { ...base, name: base.names[level - 1], url: base.urls[level - 1] };
  const entries = Object.entries(base.defects).filter(([, d]) => this.active.has(d.cat));
  const want = [randInt(3, 4), randInt(2, 3), randInt(1, 2)][level - 1];
  const chosen = new Map();
  for (const [key, def] of shuffle(entries)) {
    if (chosen.size >= Math.min(want, entries.length)) break;
    if (!chosen.has(def.region)) chosen.set(def.region, { key, ...def });
  }
  const on = new Set([...chosen.values()].map(d => d.key));
  const h = k => on.has(k);
  h.lvl = level;
  const cats = [...chosen.values()].map(d => d.cat);
  return { no, tpl, defects: chosen, html: tpl.build(h), persona: pick(PERSONAS), designer: BARNY, troll: { level, claimCat: pick(cats) }, forged: level >= 3 && this.day >= 5 && Math.random() < .5 };
};

/* what he says */
const FALSE_CLAIM = {
  text: 'Capital letters are perfectly legible, and fancy fonts show class.',
  errors: 'Error codes are explanations, for people who can read them.',
  realworld: 'Users love a riddle. It keeps their minds sharp.',
  contrast: 'Pale text is called “subtle”. Your lens must be broken.',
  consistency: 'Calling one thing by four names keeps users alert.',
  control: 'Nobody has ever wanted to cancel anything.',
  prevention: 'Putting “delete” next to “save” saves everyone a click.',
  color: 'Colour is the most universal language there is.',
  target: 'Small buttons are elegant. Big buttons are for beginners.',
  recognition: 'Making people remember things builds character.',
  keyboard: 'Nobody uses Tab. It is a historical curiosity.',
  status: 'Progress bars are for people who do not trust the system.',
  minimal: 'More options means more freedom. Fourteen is a good number.',
  flexibility: 'Defaults are a threat to personal growth.'
};
const BARNY_INTRO = [
  ['Barnaby Gull. Gull & Gull Studios. I made this in my sleep, so it is perfect.', 'Do not look at it too hard. It gets nervous.', 'I charge extra for being right, Inspector.'],
  ['Same Barnaby, new screen, same excellent standards.', 'Your colleague approved my last one in four seconds. Four. Try to keep up.', 'I have read your rulebook twice. Backwards.'],
  ['Look at this one. Nothing wrong with it. Take your time. Actually, do not.', 'My lawyers say you will approve this by lunch.', 'Built by forty engineers. Forty-one, counting me.']
];
const BARNY_REJECTED = ['That screen worked fine on my machine.', 'Funny. It was perfect when I left. Did you click it wrong?', 'You are imagining things, Inspector. It happens to the best of us.', 'I will be back, with a better version of exactly the same thing.'];
const BARNY_APPROVED = ['Told you. Flawless.', 'Pleasure doing business. Tell the users it is a feature.', 'Frame that stamp, Inspector. Barnaby Gull approved.'];
const BARNY_APPEAL = ['I would like to speak to your supervisor. I will wait. Loudly.', 'I am filing an appeal. In person. At volume.', 'Surely a man of your calibre can see the screen was fine?'];

/* ───────────────────── 11c. The Blink Brigade ─────────────────────
   Satirical "interface insurgents": they miss the old web (marquees, midi, guestbooks, under-construction signs)
   and think rules killed the joy. They never hurt anyone. The Authority calls them terrorists anyway.
   Their ships are charming, always faulty, and always signed with a blinking star.                          */
LOOKS.Anonymous = { skin: '#c68a5b', hair: '#c026d3', style: 'long', shirt: '#f59e0b', bg: '#312e81', mask: true };
LOOKS['Madame Marquee'] = { skin: '#e0a97d', hair: '#a21caf', style: 'bun', shirt: '#7e22ce', bg: '#fde68a', mask: true, glasses: true };
SHIP_KIND.bhome = SHIP_KIND.bguest = 'gala';
const BRIG_PLAN = { 3: 1, 4: 1, 5: 2, 6: 2, 7: 1 };
const BRIG_CLEAN = { 6: 1, 7: 1 };

const BRIGADE = {
  bhome: {
    id: 'bhome', name: 'Pixel Pete’s Homepage', url: 'pixelpete.geo.example/~cats',
    style: ['Sentence case, plain fonts, 16 px text.', 'Every link has a visible name.'],
    regions: { banner: 'Banner', colors: 'Intro text', names: 'Page links', nav: 'Icon menu', enter: 'Enter button', heart: 'Favourite star', links: 'Link list', legend: 'Link colours', construction: 'Construction sign', form: 'Message box', popups: 'Pop-up', wipe: 'Guestbook buttons' },
    defects: {
      marquee: { region: 'banner', cat: 'text', label: 'Scrolling, blinking banner in capitals', why: 'Moving, capitalised text is hard to read. Keep it still, in sentence case.' },
      neon: { region: 'colors', cat: 'contrast', label: 'Neon yellow text on a pale page', why: 'Normal text needs 4.5 : 1. Use the contrast lens.' },
      names: { region: 'names', cat: 'consistency', label: 'Home, Index and Start all lead to the same page', why: 'One page, one name.' },
      mystery: { region: 'nav', cat: 'recognition', label: 'Menu made of unlabelled symbols', why: 'Recognition beats recall: add labels.' },
      portal: { region: 'enter', cat: 'realworld', label: 'Button says “Enter the Portal of Wonders”', why: 'Say what it does: “Enter the site”.' },
      tinyHeart: { region: 'heart', cat: 'target', label: 'Favourite star is an 8 px target', why: 'Small targets are slow to hit (Fitts’ law).' },
      thirty: { region: 'links', cat: 'minimal', label: 'Thirty links of equal weight', why: 'Hick’s law: more choices, slower decisions.' },
      rainbow: { region: 'legend', cat: 'color', label: 'Link types told apart by colour alone', why: 'Add a symbol or word as a redundant code.' },
      uc: { region: 'construction', cat: 'status', label: '“Under construction” with no date or detail', why: 'Tell users what is happening and when it will be done.' },
      lol: { region: 'form', cat: 'errors', label: 'Error says “LOL u broke it”', why: 'Say what went wrong and how to fix it.' },
      trap: { region: 'popups', cat: 'control', label: 'Pop-up with no way to close it', why: 'Users must always be able to get out.' },
      wipe: { region: 'wipe', cat: 'prevention', label: '“Reset everything” right beside “Sign guestbook”', why: 'Keep destructive actions away from frequent ones.' }
    },
    build: h => `<div class="b-wrap b-home">
      <div data-region="banner">${h.retro ? '<h2 style="font-family:Georgia,serif;color:#6b21a8">★ Welcome to Pixel Pete’s Homepage ★</h2><p style="font-size:15px;color:#5b21b6">=^.^= Made with ♥ in 1999 · best viewed in any browser</p>' : h('marquee') ? '<div class="marq"><span class="blink" style="text-transform:uppercase;font-size:20px;letter-spacing:.18em;font-weight:700">Welcome to my homepage!!! Sign my guestbook!!! Best viewed in Netscape!!!</span></div>' : '<h2>Welcome to my homepage</h2>'}</div>
      <p data-region="colors" style="color:${h('neon') ? '#e6e65c' : '#1d2530'}">Hi! I am Pixel Pete. I like cats, midi files and the colour green.</p>
      <p data-region="names">${h('names') ? '<a href="#">Home</a> · <a href="#">Index</a> · <a href="#">Start</a> · <a href="#">Cats</a>' : '<a href="#">Home</a> · <a href="#">Cats</a> · <a href="#">Guestbook</a>'}</p>
      <div data-region="nav" class="m-icons">${h('mystery') ? '<button>☼</button><button>☾</button><button>♨</button><button>✎</button>' : '<button>☼ Home</button><button>☾ News</button><button>✎ Guestbook</button>'}</div>
      <p><span data-region="enter">${btn(h('portal') ? 'Enter the Portal of Wonders' : 'Enter the site', '', '')}</span> <span data-region="heart"><button class="${h('tinyHeart') ? '' : 'm-btn s secondary'}" style="${h('tinyHeart') ? 'width:8px;height:8px;padding:0;font-size:6px;border:1px solid #444' : ''}">${h('tinyHeart') ? '' : '★ Favourite'}</button></span></p>
      <p data-region="links" style="font-size:14px;line-height:1.8">${(h('thirty') ? Array.from({ length: 30 }, (_, i) => `<a href="#">Link ${i + 1}</a>`) : ['Cats', 'Midi files', 'Webring', 'About me']).join(' · ')}</p>
      <p data-region="legend" style="font-size:14px">${h('rainbow') ? 'Links: <b style="color:#d00">visited</b> <b style="color:#0a0">new</b> <b style="color:#00d">external</b>' : 'Links: visited ✓ · new ★ · external ↗'}</p>
      <p data-region="construction">${h('uc') ? '<span style="display:inline-block;animation:spin 3s linear infinite">⚙</span> <b>UNDER CONSTRUCTION</b>' : '<small>Last updated 5 May.</small>'}</p>
      <div data-region="form"><label for="bm">Message</label><input id="bm"><div class="m-alert" style="margin-top:6px">${h('lol') ? 'LOL u broke it!!! (err 7)' : 'Your message needs at least 10 characters. Add a few more words.'}</div></div>
      <div data-region="popups">${h('trap') ? '<div class="b-popup"><b>YOU WON!!!</b><br>This window cannot be closed.</div>' : '<small>No pop-ups here.</small>'}</div>
      <div data-region="wipe" style="display:flex;gap:${h('wipe') ? 2 : 24}px;margin-top:8px">${btn('Sign guestbook', '', 's')}${h('wipe') ? btn('RESET EVERYTHING', '', 's') : '<a href="#" class="m-link" style="align-self:center">Reset…</a>'}</div></div>`
  },

  bguest: {
    id: 'bguest', name: 'Mr. Blinky’s Guestbook', url: 'blinky.geo.example/guestbook',
    style: ['Sentence case, plain fonts, 16 px text.', 'One action, one name, everywhere.'],
    regions: { title: 'Heading', who: 'Name field', msg: 'Message box', send: 'Send button', nav: 'Icon menu', bg: 'Intro text', counter: 'Visitor counter', many: 'Mood picker', back: 'Way back', reset: 'Clear button', links: 'Action names' },
    defects: {
      shout: { region: 'title', cat: 'text', label: 'Heading in capitals with a fancy font', why: 'Capitals and decorative fonts slow reading.' },
      handle: { region: 'who', cat: 'realworld', label: 'Name field asks for “thy handle, o traveller”', why: 'Use words the user knows: “Name”.' },
      boom: { region: 'msg', cat: 'errors', label: 'Error is just “BOOM!”', why: 'Say what went wrong and how to fix it.' },
      dot: { region: 'send', cat: 'target', label: 'Send button is a 10 px dot', why: 'Small targets are slow to hit.' },
      mystery: { region: 'nav', cat: 'recognition', label: 'Unlabelled symbol menu', why: 'Recognition beats recall.' },
      grey: { region: 'bg', cat: 'contrast', label: 'Dark grey text on a dark background', why: 'Normal text needs 4.5 : 1.' },
      counter: { region: 'counter', cat: 'status', label: 'Visitor counter that never finishes loading', why: 'Show what the system is doing.' },
      moods: { region: 'many', cat: 'minimal', label: 'Twenty-five moods to pick from', why: 'Hick’s law: fewer choices, faster.' },
      noback: { region: 'back', cat: 'control', label: 'Leaving the page loses your message, no warning', why: 'Give users a way out and a way back.' },
      clear: { region: 'reset', cat: 'prevention', label: '“Clear all” next to “Send” in the same style', why: 'Keep destructive actions away from frequent ones.' },
      names: { region: 'links', cat: 'consistency', label: 'Send, post and sign used for the same action', why: 'One action, one name.' }
    },
    build: h => `<div class="b-wrap b-guest">
      <h2 data-region="title" ${h.retro ? 'style="color:#fde68a;font-family:Georgia,serif"' : ''} ${h('shout') ? 'style="text-transform:uppercase;letter-spacing:.14em;font-family:\'Old English Text MT\',UnifrakturCook,fantasy"' : ''}>${h('shout') ? 'Mr. Blinky’s guestbook!!' : h.retro ? '✦ Mr. Blinky’s guestbook ✦' : 'Mr. Blinky’s guestbook'}</h2>
      <p data-region="bg" style="color:${h('grey') ? '#6a6a72' : '#f5f5f5'}">Leave a message for the cats. They will read it eventually.</p>
      <div data-region="who"><label for="bg1">${h('handle') ? 'Thy handle, o traveller' : 'Name'}</label><input id="bg1"></div>
      <div data-region="msg"><label for="bg2">Message</label><textarea id="bg2" style="width:100%;min-height:60px"></textarea><div class="m-alert" style="margin-top:6px">${h('boom') ? 'BOOM!' : 'Messages need at least 10 characters. Add a few more words.'}</div></div>
      <div data-region="many"><b>Mood</b><div class="m-grid2" style="margin-top:4px">${(h('moods') ? Array.from({ length: 25 }, (_, i) => `Mood ${i + 1}`) : ['Happy', 'Curious', 'Sleepy']).map(m => `<label><input type="radio" name="bmood"> ${m}</label>`).join('')}</div></div>
      <p data-region="links" style="font-size:14px">${h('names') ? 'Send · Post · Sign · Submit: all the same button.' : 'Use “Send” to leave your message.'}</p>
      <div style="display:flex;gap:${h('clear') ? 2 : 24}px;align-items:center;margin:8px 0"><span data-region="send">${h('dot') ? '<button style="width:10px;height:10px;padding:0;font-size:6px;border:1px solid #fff" aria-label="Send"></button>' : btn('Send', '', '')}</span><span data-region="reset">${h('clear') ? btn('Clear all', '', '') : '<a href="#" class="m-link">Clear…</a>'}</span></div>
      <div data-region="nav" class="m-icons">${h('mystery') ? '<button>☼</button><button>✎</button><button>♨</button>' : '<button>☼ Home</button><button>✎ Guestbook</button>'}</div>
      <p data-region="back" style="font-size:14px">${h('noback') ? 'Leaving this page deletes your message.' : 'Your message is saved while you browse.'}</p>
      <p data-region="counter">${h('counter') ? '<span style="display:inline-block;animation:spin 2s linear infinite">⟳</span> Visitors: loading…' : '<small>Visitors: 1,204</small>'}</p></div>`
  }
};

SubmissionFactory.prototype.createBrigade = function (no, clean = false) {
  const base = pick(Object.values(BRIGADE));
  const entries = Object.entries(base.defects).filter(([, d]) => this.active.has(d.cat));
  const want = randInt(2, 4), chosen = new Map();
  for (const [key, def] of clean ? [] : shuffle(entries)) {
    if (chosen.size >= Math.min(want, entries.length)) break;
    if (!chosen.has(def.region)) chosen.set(def.region, { key, ...def });
  }
  const on = new Set([...chosen.values()].map(d => d.key));
  const h = k => on.has(k);
  if (clean) h.retro = true;
  return { no, tpl: base, defects: chosen, html: base.build(h), persona: pick(PERSONAS), designer: 'Anonymous', brig: true, retro: clean };
};

Object.assign(Art, {
  sigil(c = '#7e22ce') {
    return `<svg viewBox="0 0 48 48" role="img" aria-label="Hand-drawn star"><circle cx="24" cy="24" r="21" fill="#fde68a" stroke="${c}" stroke-width="3"/><path d="M24 7l4.6 10 10.8 1.1-8.1 7.3 2.3 10.6L24 30l-9.6 6 2.3-10.6-8.1-7.3L19.4 17Z" fill="${c}"/><path d="M30 28l10 14-5 .5-3 4Z" fill="#111" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
  }
});
// extra newspaper pictures
(() => {
  const old = Art.news;
  const extra = {
    sigil: ['A harbor wall painted with a blinking star', `<rect x="20" y="20" width="200" height="68" fill="${NMID}" ${ns}/><path d="M120 26l9 20 21 2-16 14 5 21-19-12-19 12 5-21-16-14 21-2Z" fill="${NRED}" ${ns}/><path d="M180 72l16 24" stroke="${NINK}" stroke-width="3"/>`],
    carnival: ['A ship with bunting and a crowd', `<path d="M20 30Q70 56 120 30T220 30" fill="none" stroke="${NINK}" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${28 + i * 26} ${36 + (i % 2) * 6}l10 0-5 12z" fill="${i % 2 ? NRED : NPAP}" ${ns}/>`).join('')}${nboat(80, 112, 2)}<circle cx="38" cy="106" r="5" fill="${NINK}"/><circle cx="52" cy="108" r="5" fill="${NINK}"/><circle cx="200" cy="106" r="5" fill="${NINK}"/><circle cx="214" cy="108" r="5" fill="${NINK}"/>`],
    raid: ['A pier at night with lanterns and a crossed-out star', `<rect x="0" y="70" width="240" height="18" fill="${NINK}"/>${[30, 80, 130, 180].map(x => `<path d="M${x} 70V36" stroke="${NINK}" stroke-width="3"/><circle cx="${x}" cy="32" r="6" fill="${NPAP}" ${ns}/>`).join('')}<path d="M170 24l9 20 21 2-16 14 5 21-19-12-19 12 5-21-16-14 21-2Z" fill="none" stroke="${NRED}" stroke-width="3"/><path d="M146 20l48 56" stroke="${NRED}" stroke-width="5"/>`]
  };
  Art.news = kind => extra[kind] ? nscene(extra[kind][0], extra[kind][1]) : old.call(Art, kind);
})();

/* quotes */
const BRIG_CLEAN_OK = ['You looked past the glitter and read the screen. Thank you.', 'A sound design in a costume. You saw both.', 'That is what we meant all along.'];
const BRIG_CLEAN_NO = ['It had labels, contrast and a way out. It was also fun. You said no.', 'You turned back a sound design because it was colourful.', 'The rules were met. The costume offended you.'];
const BRIG_REJECT = ['The beige wins today.', 'You measured it. Did you feel it?', 'Rules are a map. We prefer weather.', 'Somewhere a marquee stops scrolling.'];
const BRIG_APPROVE = ['Thank you. Somewhere a gif is smiling.', 'You saw what it could be.', 'Let it play.', 'The web remembers its friends.'];
const brigWord = b => b <= -3 ? 'hostile' : b <= -1 ? 'cold' : b === 0 ? 'unaware' : b === 1 ? 'curious' : b < 4 ? 'warm' : 'allied';

/* their moves */
const BRIG_EVENTS = [
  { id: 'sigil', brig: true, minDay: 3, icon: 'envelope', title: 'A note inside a dossier',
    when: g => g.brigSeen > 0,
    text: 'Tucked between two pages: a card with a blinking star. “The beige will fall. Meet us at Pier 9. Come alone. Bring a gif.”',
    choices: [
      { label: 'Keep it and go to Pier 9', hint: 'You hear them out. Brigade regard +1.', run: g => { g.knowsBrig = true; g.shiftBrig(1); return 'You pocket the card. Pier 9 smells of paint and solder.'; } },
      { label: 'Report it to the Authority', hint: '+25 cr. The Brigade will remember (−2).', run: g => { g.meter({ funds: 25 }); g.reported = true; g.shiftBrig(-2); return 'Vael’s clerk thanks you. Somewhere a star stops blinking.'; } },
      { label: 'Burn it', hint: 'Nothing happens.', run: () => 'The card curls and smells of glitter.' }
    ] },
  { id: 'marquee', brig: true, minDay: 4, icon: 'papers', title: 'A woman in a purple coat',
    when: g => g.brigSeen > 0,
    text: 'She orders tea, no beige, and leans on the sill. “I am Madame Marquee. I do not ask you to break the rules. I ask you to remember why we made screens: to delight people.” She slides a purse towards you. “One of our pieces a day, and your purse stays warm.”',
    choices: [
      { label: 'Make the pact', hint: '+40 cr now, +25 cr for every Brigade ship you clear. It counts as bribery. Brigade +2.', run: g => { g.pact = true; g.bribes++; g.meter({ funds: 40 }); g.shiftBrig(2); Sfx.coin(); return 'You shake a hand in a purple glove.'; } },
      { label: 'Refuse politely', hint: 'Brigade −1.', run: g => { g.shiftBrig(-1); return '“Pity,” she says. “The beige is so lonely.”'; } },
      { label: 'Call the guards', hint: '+40 cr, +4 trust. Brigade −4. They will hit back.', run: g => { g.meter({ funds: 40, trust: 4 }); g.reported = true; g.shiftBrig(-4); return 'She is gone before the guards arrive. A sigil blinks on the glass.'; } }
    ] },
  { id: 'pier9', brig: true, minDay: 6, icon: 'phone', title: 'Pier 9, tonight',
    when: g => g.knowsBrig || g.brig >= 2,
    text: 'Two messages arrive. One is a hand-drawn invitation to the Brigade’s Grand Exhibition. The other, on Authority letterhead: “We know about Pier 9. Tell us when.”',
    choices: [
      { label: 'Attend the exhibition', hint: 'Trust −3. Brigade +2. You see what screens could be.', run: g => { g.meter({ trust: -3 }); g.shiftBrig(2); return 'Forty years of the web on one wall. You laugh out loud.'; } },
      { label: 'Tip off the Authority', hint: '+50 cr, +4 trust. Brigade −4. Pier 9 is raided.', run: g => { g.meter({ funds: 50, trust: 4 }); g.shiftBrig(-4); g.reported = true; return 'You give them the time. You do not feel proud.'; } },
      { label: 'Stay at home', hint: 'Nothing happens.', run: () => 'You do your laundry. It is very beige.' }
    ] }
];

BRIG_EVENTS.push({ id: 'gala', brig: true, minDay: 7, icon: 'papers', title: 'Madame Marquee, in person',
  when: g => (g.pact || g.brig >= 2) && !g.reported,
  text: 'She stands at your window without her mask, holding a roll of bunting. “One banner on the quay. Just for the last day. Nobody will be harmed, and everyone will look up.”',
  choices: [
    { label: 'Let her hang it', hint: '+5 flow, −2 trust, Brigade +1. The Authority will not like it.', run: g => { g.meter({ flow: 5, trust: -2 }); g.shiftBrig(1); return 'Purple bunting crosses the quay. People stop and stare, then smile.'; } },
    { label: 'Ask her to take it down', hint: 'Brigade −1.', run: g => { g.shiftBrig(-1); return '“Of course,” she says, and rolls it up, very slowly.'; } },
    { label: 'Hang it yourself, with a ruler', hint: '+3 trust, +3 flow. Everyone is pleased.', run: g => { g.meter({ trust: 3, flow: 3 }); return 'You hang it at a legible height, with readable text. Even she laughs.'; } }
  ] });
const BRIG_ENDINGS = {
  artist: { title: 'The pixel rebellion', tone: 'good', text: 'Madame Marquee wipes your ledger and hangs your stamp in the Pier 9 gallery. The harbor fills with colour, noise and a lot of lovely, hard-to-use screens. Many users are delighted. A few still cannot find the Back button. You helped build a place where both are true.' },
  informer: { title: 'Friend of the Authority', tone: 'meh', text: 'Pier 9 is raided, the stars are scrubbed off the walls and Vael promotes you. Every screen in Port Halcyon is now clear, correct and a bit beige. Nobody complains. Some people say they miss being surprised.' }
};
Object.assign(END_NEWS, { artist: ['carnival', 'Pier 9 gallery opens: the Inspector’s stamp on display'], informer: ['raid', 'Pier 9 raided: stars scrubbed from the harbor walls'] });

const BRIG_NEWS = {
  3: g => g.brigSeen > 0 && { img: 'sigil', h: 'Blinking stars appear on harbor walls', p: 'Nobody knows who paints them. The Authority calls it “interface vandalism.”' },
  4: g => g.brigSeen > 0 && { img: 'sigil', h: 'Authority brands “Blink Brigade” terrorists', p: 'Vael says the group wants “a harbor full of noise.” The Brigade answers with a blinking banner. No one has been hurt.' },
  5: g => g.brigSeen > 0 && { img: 'carnival', h: 'Marrow ferry screen turned into a carnival', p: 'Someone swapped its ticket page for a rainbow. Passengers were delighted, and lost.' },
  6: g => g.brigSeen > 0 && (g.reported && g.brig <= -3
    ? { img: 'raid', h: 'Authority prepares raid on Pier 9', p: 'A tip-off gave away the Brigade’s meeting place. “Order will be restored,” says Vael.' }
    : g.brig >= 2 ? { img: 'carnival', h: 'Brigade plans Pier 9 exhibition', p: 'Rumour says forty years of the web will be shown on one wall.' }
      : { img: 'sigil', h: 'Brigade promises “a surprise”', p: 'The group says it is “not done with the beige.”' }),
  7: g => g.brigSeen > 0 && (g.brig >= 4
    ? { img: 'carnival', h: 'Pier 9 exhibition draws thousands', p: 'Queues form to click a giant blinking star. The Chancellor stays home.' }
    : g.reported && g.brig <= -3 ? { img: 'raid', h: 'Raid on Pier 9: sixty arrested for “unlawful animation”', p: 'The walls are clean again. “Order,” says Vael, to no one.' }
      : { img: 'sigil', h: 'Brigade quiet. For now.', p: 'The walls are clean. Some say they miss the stars.' })
};

/* ───────────────────── 11d. More mock interfaces: wizard, dashboard, onboarding ───────────────────── */
SHIP_KIND.wizard = 'sail'; SHIP_KIND.dash = 'freighter'; SHIP_KIND.onboard = 'tug';
const tiny = (txt, ti = '') => `<button class="m-btn" style="min-height:0;height:18px;width:56px;padding:0;font-size:11px"${ti}>${txt}</button>`;

TEMPLATES.wizard = {
  id: 'wizard', name: 'FerryNow booking wizard', url: 'book.ferrynow.example/step-2',
  style: ['The primary button reads “Next” on every step.', 'Body text is never below 12 px.'],
  regions: { steps: 'Step indicator', title: 'Page title', date: 'Date field', pax: 'Passenger count', email: 'Email field', help: 'Help text', next: 'Next button', back: 'Back button', cancel: 'Cancel booking', form: 'Whole form (tab sequence)', save: 'Save progress', terms: 'Fine print' },
  defects: {
    noSteps: { region: 'steps', cat: 'status', label: 'No indication of which step you are on', why: 'Show “Step 2 of 4” so users know where they are and how much is left.' },
    typed: { region: 'date', cat: 'recognition', label: 'Date must be typed in a format shown nowhere', why: 'Offer a date picker or show the format. Do not make users remember it.' },
    pax: { region: 'pax', cat: 'realworld', label: 'Field labelled “Pax (int, 1..9)”', why: 'Use the user’s words: “Passengers”.' },
    invalid: { region: 'email', cat: 'errors', label: 'Error just says “Invalid input”', why: 'Say what is wrong and how to fix it.' },
    grey: { region: 'help', cat: 'contrast', label: 'Help text in pale grey on white', why: 'Normal text needs 4.5 : 1. Use the contrast lens.' },
    proceed: { region: 'next', cat: 'consistency', label: 'Button says “Proceed ▶” instead of “Next”', why: 'The house style says the primary button reads “Next” everywhere.' },
    noBack: { region: 'back', cat: 'control', label: 'No Back button: one mistake means starting over', why: 'Users must be able to step back without losing their work.' },
    cancel: { region: 'cancel', cat: 'prevention', label: '“Cancel booking” sits tight against “Next”, no confirm', why: 'Keep destructive actions away from frequent ones and ask for confirmation.' },
    tinyNext: { region: 'next', cat: 'target', label: 'Next button is a 56 × 18 px sliver', why: 'Small targets are slow to hit (Fitts’ law).' },
    noSave: { region: 'save', cat: 'flexibility', label: 'No way to save and finish later', why: 'Let users save progress and return, especially on long forms.' },
    tinyTerms: { region: 'terms', cat: 'text', label: 'Fine print in 8 px text', why: 'Font size should be at least 11, and the house guide asks for 12.' },
    tabOrder: { region: 'form', cat: 'keyboard', label: 'Tab order jumps around the form', why: 'Tab goes email → Next → date → … Keyboard users expect the visual order.' }
  },
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    const clash = h('cancel') && !h('noBack');
    const nextLabel = h('proceed') ? 'Proceed ▶' : 'Next';
    return `<form class="m-card" data-region="form" onsubmit="return false">
      <p data-region="steps" style="font-size:13px;color:#4a5560">${h('noSteps') ? '' : '● ○ ○ ○ &nbsp;Step 2 of 4: Your trip'}</p>
      <h2 data-region="title">Book your crossing</h2>
      <div data-region="date"><label for="wd">Date</label><input id="wd" ${h('typed') ? '' : 'type="date" '}placeholder="${h('typed') ? '' : 'Pick a date'}"${ti(3)}></div>
      <div data-region="pax"><label for="wp">${h('pax') ? 'Pax (int, 1..9)' : 'Passengers'}</label><input id="wp" value="2"${ti(4)}></div>
      <div data-region="email"><label for="we">Email</label><input id="we" class="invalid" value="jo@"${ti(1)}><div class="m-alert" style="margin-top:6px">${h('invalid') ? 'Invalid input' : 'That email looks incomplete. It needs a domain, like jo@example.com.'}</div></div>
      <p data-region="help" style="font-size:14px;color:${h('grey') ? '#b8b8b8' : '#4a5560'}">We send your ticket here.</p>
      <div style="display:flex;gap:${clash ? 2 : 14}px;align-items:center;margin:8px 0">
        <span data-region="back">${h('noBack') ? '' : btn('Back', '', 'secondary')}</span>
        <span data-region="next">${h('tinyNext') ? tiny(nextLabel, ti(2)) : `<button class="m-btn"${ti(2)}>${nextLabel}</button>`}</span>
        <span data-region="cancel">${h('cancel') ? btn('Cancel booking', 'background:#c0392b;border-color:#c0392b', '') : '<a href="#" class="m-link">Cancel…</a>'}</span>
      </div>
      <p data-region="save">${h('noSave') ? '' : '<a href="#" class="m-link">Save and finish later</a>'}</p>
      <p data-region="terms" style="font-size:${h('tinyTerms') ? 8 : 13}px;color:#4a5560">Tickets are non-transferable. Changes are free up to 24 hours before departure.</p></form>`;
  }
};

TEMPLATES.dash = {
  id: 'dash', name: 'TideWatch ops dashboard', url: 'ops.tidewatch.example/overview',
  style: ['Colour is never the only way to tell things apart.', 'One date format everywhere.'],
  regions: { form: 'Whole dashboard (tab sequence)', title: 'Page title', kpis: 'KPI tiles', chart: 'Chart legend', delta: 'Change figures', status: 'Data status', filters: 'Filter chips', reset: 'Reset filters', table: 'Table dates', alert: 'Message box', toolbar: 'Toolbar', danger: 'Export and delete', group: 'Grouping control' },
  defects: {
    sixteen: { region: 'kpis', cat: 'minimal', label: 'Sixteen KPI tiles of equal weight', why: 'Hick’s law: more things to scan, slower decisions. Show the few that matter.' },
    legend: { region: 'chart', cat: 'color', label: 'Chart series told apart by colour only', why: 'Add a redundant code: patterns, labels or markers.' },
    grey: { region: 'delta', cat: 'contrast', label: 'Change figures in pale grey on white', why: 'Normal text needs 4.5 : 1. Use the contrast lens.' },
    spinner: { region: 'status', cat: 'status', label: '“Updating…” spinner, no last-updated time', why: 'Show what the system is doing and when the data was last refreshed.' },
    chips: { region: 'filters', cat: 'target', label: 'Filter chips are 14 px high', why: 'Small targets are slow to hit (Fitts’ law).' },
    noReset: { region: 'reset', cat: 'flexibility', label: 'No way to reset the filters', why: 'Customisation needs a way back to the default state.' },
    dates: { region: 'table', cat: 'consistency', label: 'Dates shown as 05/06, 6 May and 2026-05-06', why: 'The house style asks for one date format everywhere.' },
    failed: { region: 'alert', cat: 'errors', label: 'Message says “Query failed (E-500)”', why: 'Say what happened and how to fix it.' },
    icons: { region: 'toolbar', cat: 'recognition', label: 'Toolbar of unlabelled icons', why: 'Recognition beats recall: add labels.' },
    both: { region: 'danger', cat: 'prevention', label: '“Delete dataset” right beside “Export”, no confirm', why: 'Keep destructive actions away from frequent ones.' },
    jargon: { region: 'group', cat: 'realworld', label: 'Grouping offered as “Aggregate by τ-bucket”', why: 'Use words the user knows: “Group by hour”.' },
    allCaps: { region: 'title', cat: 'text', label: 'Title in capitals with a fancy font', why: 'Capitals and decorative fonts slow reading.' },
    tabOrder: { region: 'form', cat: 'keyboard', label: 'Tab order jumps around the page', why: 'Tab goes Export → filters → toolbar → … Keyboard users expect the visual order.' }
  },
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    const tiles = Array.from({ length: h('sixteen') ? 16 : 4 }, (_, i) => `<div style="border:1px solid #ccd3d8;padding:4px 8px;border-radius:6px;font-size:13px"><b>${[412, 38, 7.4, 91][i % 4]}</b><br>KPI ${i + 1}</div>`).join('');
    return `<div class="m-card" data-region="form">
      <h2 data-region="title"${h('allCaps') ? ` style="text-transform:uppercase;font-family:'Old English Text MT',UnifrakturCook,fantasy;letter-spacing:.12em"` : ''}>Harbor overview</h2>
      <div data-region="toolbar" class="m-icons">${h('icons') ? `<button${ti(4)}>⟳</button><button>⚙</button><button>⇪</button>` : `<button${ti(4)}>⟳ Refresh</button><button>⚙ Settings</button>`}</div>
      <div data-region="kpis" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0">${tiles}</div>
      <p data-region="delta" style="font-size:14px;color:${h('grey') ? '#bdbdbd' : '#2c3b46'}">Arrivals +12% · Delays −3%</p>
      <div data-region="chart" style="font-size:13px">${h('legend') ? '<span style="color:#d33">■</span> <span style="color:#2a9d3c">■</span> <span style="color:#2a62d9">■</span>' : '<span style="color:#d33">■ Arrivals</span> · <span style="color:#2a9d3c">▲ Departures</span> · <span style="color:#2a62d9">● Delays</span>'}</div>
      <p data-region="status" style="font-size:13px">${h('spinner') ? '<span class="m-spin" aria-hidden="true">⟳</span> Updating…' : 'Updated 2 minutes ago · next refresh in 3 min'}</p>
      <div data-region="group"><label for="dg">${h('jargon') ? 'Aggregate by τ-bucket' : 'Group by'}</label><select id="dg"><option>${h('jargon') ? 'τ = 3600 s' : 'Hour'}</option></select></div>
      <div data-region="filters" style="display:flex;gap:8px;margin:8px 0">${['Today', 'Week', 'Month'].map(t => h('chips') ? `<button style="height:14px;padding:0 4px;font-size:9px;min-height:0"${ti(3)}>${t}</button>` : `<button class="m-btn s secondary"${ti(3)}>${t}</button>`).join('')}<span data-region="reset">${h('noReset') ? '' : '<a href="#" class="m-link">Reset filters</a>'}</span></div>
      <div class="m-alert" data-region="alert">${h('failed') ? 'Query failed (E-500)' : 'Tide data for Pier 4 is missing. Pick another pier or try again in a minute.'}</div>
      <p data-region="table" style="font-size:13px">${h('dates') ? 'Rows: 05/06 · 6 May · 2026-05-06' : 'Rows: 6 May · 7 May · 8 May'}</p>
      <div data-region="danger" style="display:flex;gap:${h('both') ? 2 : 22}px;margin-top:8px"><button class="m-btn"${ti(1)}>Export</button>${h('both') ? '<button class="m-btn" style="background:#c0392b;border-color:#c0392b">Delete dataset</button>' : '<a href="#" class="m-link" style="align-self:center">Delete dataset…</a>'}</div></div>`;
  }
};

TEMPLATES.onboard = {
  id: 'onboard', name: 'NoteNest welcome flow', url: 'app.notenest.example/welcome',
  style: ['Every step can be skipped.', 'Plain words, never jargon.'],
  regions: { form: 'Whole screen (tab sequence)', hero: 'Welcome text', dots: 'Progress dots', perms: 'Permission switches', skip: 'Skip link', go: 'Continue button', name: 'Name field', alert: 'Message box', close: 'Close button', overwrite: 'Import option', later: 'Settings note', gesture: 'Gesture tip' },
  defects: {
    noSkip: { region: 'skip', cat: 'control', label: 'No Skip: the whole flow is forced', why: 'Users must always be able to get out or skip.' },
    dots: { region: 'dots', cat: 'status', label: 'No progress dots or step count', why: 'Show where the user is and how much is left.' },
    twelve: { region: 'perms', cat: 'minimal', label: 'Twelve permission switches on one screen', why: 'Hick’s law: more choices, slower decisions. Ask when needed.' },
    jargon: { region: 'perms', cat: 'realworld', label: 'Switch says “Grant ambient telemetry ingress”', why: 'Use words the user knows: “Share usage data”.' },
    light: { region: 'go', cat: 'contrast', label: 'White text on a pale yellow button', why: 'Normal text needs 4.5 : 1. Use the contrast lens.' },
    redStar: { region: 'name', cat: 'color', label: 'Required field shown only by a red edge', why: 'Add a redundant code: an asterisk and the word “required”.' },
    wrong: { region: 'alert', cat: 'errors', label: '“Something went wrong” with no next step', why: 'Say what went wrong and how to fix it.' },
    tinyX: { region: 'close', cat: 'target', label: 'Close button is a 12 px square', why: 'Small targets are slow to hit (Fitts’ law).' },
    overwrite: { region: 'overwrite', cat: 'prevention', label: '“Replace my existing notes” is ticked by default', why: 'Destructive options must not be the default and need confirmation.' },
    gesture: { region: 'gesture', cat: 'recognition', label: 'Tip says “Use the gesture from the first slide”', why: 'Do not make users remember something from earlier. Show the tip where it applies.' },
    forever: { region: 'later', cat: 'flexibility', label: '“These choices can’t be changed later”', why: 'Let users change defaults and return to them later.' },
    tinyText: { region: 'hero', cat: 'text', label: 'Welcome text in 9 px type', why: 'Font size should be at least 11, and plain text should be easy to read.' },
    tabOrder: { region: 'form', cat: 'keyboard', label: 'Tab order jumps around the screen', why: 'Tab goes Continue → name → switches → … Keyboard users expect the visual order.' }
  },
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    const sw = (h('twelve') ? ['Photos', 'Contacts', 'Location', 'Camera', 'Mic', 'Calendar', 'Files', 'Reminders', 'Bluetooth', 'Motion', 'Health', 'Notifications'] : ['Notifications', 'Sync notes']);
    return `<div class="m-card" data-region="form">
      <div style="display:flex;justify-content:space-between;align-items:center"><p data-region="dots" style="font-size:13px">${h('dots') ? '' : '● ● ○ ○ &nbsp;Step 2 of 4'}</p><span data-region="close">${h('tinyX') ? '<button style="width:12px;height:12px;padding:0;font-size:8px;min-height:0" aria-label="Close">x</button>' : '<button class="m-btn s secondary" aria-label="Close">✕</button>'}</span></div>
      <h2>Welcome to NoteNest</h2>
      <p data-region="hero" style="font-size:${h('tinyText') ? 9 : 15}px">Your notes, everywhere. Let’s set up a few things.</p>
      <div data-region="name"><label for="on">Your name ${h('redStar') ? '' : '<b>*</b> <small>(required)</small>'}</label><input id="on" class="${h('redStar') ? 'invalid' : ''}" placeholder="e.g. Alex"${ti(2)}></div>
      <div data-region="perms" style="display:grid;grid-template-columns:${h('twelve') ? '1fr 1fr' : '1fr'};gap:2px;font-size:13px;margin:8px 0">${sw.map((s, i) => `<label><input type="checkbox"${ti(3)}> ${h('jargon') && i === 0 ? 'Grant ambient telemetry ingress' : s}</label>`).join('')}</div>
      <label data-region="overwrite" style="font-size:13px;display:block"><input type="checkbox" ${h('overwrite') ? 'checked' : ''}> Replace my existing notes with the imported ones</label>
      <p data-region="gesture" style="font-size:13px">${h('gesture') ? 'Tip: use the gesture from the first slide.' : 'Tip: swipe left on a note to archive it.'}</p>
      <div class="m-alert" data-region="alert">${h('wrong') ? 'Something went wrong.' : 'We couldn’t sync yet because you are offline. Reconnect and tap Continue.'}</div>
      <p data-region="later" style="font-size:13px">${h('forever') ? 'These choices can’t be changed later.' : 'You can change all of this later in Settings.'}</p>
      <div style="display:flex;gap:14px;align-items:center"><span data-region="go"><button class="m-btn" style="${h('light') ? 'background:#fff3b0;color:#fff;border-color:#fff3b0' : ''}"${ti(1)}>Continue</button></span><span data-region="skip">${h('noSkip') ? '' : '<a href="#" class="m-link">Skip</a>'}</span></div></div>`;
  }
};

/* ───────────────────── 11e. Six more interfaces: chat, calendar, radio, survey, shop, mail ───────────────────── */
Object.assign(SHIP_KIND, { chat: 'ferry', cal: 'steamer', radio: 'barge', survey: 'sail', shop: 'freighter', mail: 'tug' });
const CAPS = `text-transform:uppercase;font-family:'Old English Text MT',UnifrakturCook,fantasy;letter-spacing:.12em`;
const GREY = '#b8b8b8';
const tinyB = (t, ti = '', w = 40) => `<button class="m-btn" style="min-height:0;height:16px;width:${w}px;padding:0;font-size:10px"${ti}>${t}</button>`;
const danger = t => btn(t, 'background:#c0392b;border-color:#c0392b', '');
const MK = (pairs) => Object.fromEntries(pairs.map(([k, region, cat, label, why]) => [k, { region, cat, label, why }]));
const W = {
  text: 'Font size should be at least 11, and the house guide asks for 12.',
  contrast: 'Normal text needs 4.5 : 1. Use the contrast lens.',
  target: 'Small targets are slow to hit (Fitts’ law).',
  recog: 'Recognition beats recall: add labels.',
  err: 'Say what went wrong and how to fix it.',
  stat: 'Show what the system is doing and how long it will take.',
  prev: 'Keep destructive actions away from frequent ones and ask for confirmation.',
  min: 'Hick’s law: more choices, slower decisions.',
  flex: 'Customisation needs a way back to the default state.',
  color: 'Add a redundant code: an icon, a pattern or a word.',
  real: 'Use words the user knows.',
  tab: 'Keyboard users expect the visual order.'
};

TEMPLATES.chat = {
  id: 'chat', name: 'HarborChat messenger', url: 'chat.harborchat.example/crew',
  style: ['The send button reads “Send” everywhere.', 'Body text is never below 12 px.'],
  regions: { form: 'Whole screen (tab sequence)', title: 'Conversation title', stamp: 'Time stamps', bubble: 'Incoming message', status: 'Delivery status', online: 'Online dots', tools: 'Attach and send icons', send: 'Send button', clear: 'Clear conversation', react: 'Reaction bar', mute: 'Mute option', alert: 'Message box', input: 'Message field', undo: 'Unsend option' },
  defects: MK([
    ['tinyTime', 'stamp', 'text', 'Time stamps in 8 px text', W.text],
    ['greyBubble', 'bubble', 'contrast', 'Pale grey text in the incoming bubble', W.contrast],
    ['icons', 'tools', 'recognition', 'Attach and send are unlabelled icons', W.recog],
    ['code', 'alert', 'errors', 'Error reads “Message not sent (code 4012)”', W.err],
    ['noStatus', 'status', 'status', 'No sent, delivered or typing indicator', W.stat],
    ['noUnsend', 'undo', 'control', 'No way to unsend or delete a message', 'Users need a way out of a mistake.'],
    ['clearBtn', 'clear', 'prevention', '“Clear conversation” right beside Send, no confirm', W.prev],
    ['tinySend', 'send', 'target', 'Send button is 16 px high', W.target],
    ['dots', 'online', 'color', 'Online status shown only by a green or grey dot', W.color],
    ['twenty', 'react', 'minimal', 'Twenty reaction buttons under every message', W.min],
    ['noMute', 'mute', 'flexibility', 'No way to mute a noisy group', 'Let users tailor the experience, and restore it.'],
    ['post', 'send', 'consistency', 'Button says “Post” instead of “Send”', 'The house style says the button reads “Send” everywhere.'],
    ['payload', 'input', 'realworld', 'Field placeholder says “Compose payload”', W.real],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the screen', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    return `<div class="m-card" data-region="form">
      <h2 data-region="title">Crew room <span data-region="online" style="font-size:13px">${h('dots') ? '<span style="color:#2a9d3c">●</span> <span style="color:#999">●</span>' : '<span style="color:#2a9d3c">● Mara online</span> · <span style="color:#666">○ Tom away</span>'}</span></h2>
      <div data-region="bubble" style="background:#eef1f3;border-radius:10px;padding:8px 10px;max-width:80%;color:${h('greyBubble') ? '#c4c4c4' : '#1d2530'}">Berth 4 is free. Come in whenever you like.</div>
      <p data-region="stamp" style="font-size:${h('tinyTime') ? 8 : 12}px;color:#4a5560">10:42</p>
      <div data-region="react" style="font-size:13px">${Array.from({ length: h('twenty') ? 20 : 3 }, (_, i) => '<span style="display:inline-block;border:1px solid #ccd3d8;border-radius:10px;padding:0 5px;margin:1px">' + ['👍', '❤', '😂', '😮', '😢'][i % 5] + '</span>').join('')}</div>
      <p data-region="status" style="font-size:13px;color:#4a5560">${h('noStatus') ? '' : '✓✓ Delivered · Mara is typing…'}</p>
      <div class="m-alert" data-region="alert">${h('code') ? 'Message not sent (code 4012)' : 'Your last message was not sent because you are offline. It will send when you reconnect.'}</div>
      <div data-region="input"><input placeholder="${h('payload') ? 'Compose payload' : 'Write a message'}" aria-label="Message"${ti(1)}></div>
      <div style="display:flex;gap:${h('clearBtn') ? 2 : 16}px;align-items:center;margin-top:8px">
        <span data-region="tools" class="m-icons">${h('icons') ? `<button${ti(2)}>📎</button>` : `<button${ti(2)}>📎 Attach</button>`}</span>
        <span data-region="send">${h('tinySend') ? tinyB(h('post') ? 'Post' : 'Send', ti(3)) : `<button class="m-btn"${ti(3)}>${h('post') ? 'Post' : 'Send'}</button>`}</span>
        <span data-region="clear">${h('clearBtn') ? danger('Clear conversation') : '<a href="#" class="m-link">Clear…</a>'}</span></div>
      <p data-region="undo" style="font-size:13px">${h('noUnsend') ? '' : '<a href="#" class="m-link">Unsend last message</a>'}</p>
      <p data-region="mute" style="font-size:13px">${h('noMute') ? '' : '<a href="#" class="m-link">Mute this group</a>'}</p></div>`;
  }
};

TEMPLATES.cal = {
  id: 'cal', name: 'TideCal calendar', url: 'cal.tidecal.example/may',
  style: ['One time format everywhere: 14:00.', 'Colour is never the only way to tell things apart.'],
  regions: { form: 'Whole screen (tab sequence)', title: 'Month title', days: 'Weekend dates', types: 'Event colours', arrows: 'Month arrows', views: 'View buttons', sync: 'Sync status', alert: 'Message box', times: 'Event times', danger: 'Add and delete', undo: 'Undo link', tools: 'Toolbar', slot: 'Slot field', pref: 'Default view' },
  defects: MK([
    ['caps', 'title', 'text', 'Month title in capitals with a fancy font', 'Capitals and decorative fonts slow reading.'],
    ['greyDays', 'days', 'contrast', 'Weekend dates in pale grey', W.contrast],
    ['colourOnly', 'types', 'color', 'Work and personal events told apart by colour only', W.color],
    ['tinyArrows', 'arrows', 'target', 'Month arrows are 12 px', W.target],
    ['twelve', 'views', 'minimal', 'Twelve view toggles in the header', W.min],
    ['syncing', 'sync', 'status', '“Syncing…” spinner that never ends', W.stat],
    ['conflict', 'alert', 'errors', 'Message reads “Conflict: E-409”', W.err],
    ['formats', 'times', 'consistency', 'Times shown as 14:00, 2pm and 14h', 'The house style asks for one time format: 14:00.'],
    ['wipe', 'danger', 'prevention', '“Delete all events” beside “Add event”', W.prev],
    ['noUndo', 'undo', 'control', 'No undo after deleting an event', 'Users need a way back from a mistake.'],
    ['icons', 'tools', 'recognition', 'Toolbar of unlabelled icons', W.recog],
    ['alloc', 'slot', 'realworld', 'Field labelled “Temporal slot allocation”', W.real],
    ['noDefault', 'pref', 'flexibility', 'No way to choose or restore the default view', W.flex],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the screen', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    const cells = Array.from({ length: 14 }, (_, i) => `<span style="display:inline-block;width:13%;text-align:center;font-size:13px;color:${h('greyDays') && i % 7 > 4 ? '#c4c4c4' : '#1d2530'}">${i + 1}</span>`).join('');
    return `<div class="m-card" data-region="form">
      <div style="display:flex;justify-content:space-between;align-items:center"><span data-region="arrows">${h('tinyArrows') ? `<button style="width:12px;height:12px;padding:0;font-size:8px;min-height:0"${ti(1)}>&lt;</button> <button style="width:12px;height:12px;padding:0;font-size:8px;min-height:0">&gt;</button>` : `<button class="m-btn s secondary"${ti(1)}>◀ Prev</button> <button class="m-btn s secondary">Next ▶</button>`}</span>
      <h2 data-region="title" ${h('caps') ? `style="${CAPS}"` : ''}>May 2026</h2></div>
      <div data-region="days" style="margin:6px 0">${cells}</div>
      <div data-region="types" style="font-size:13px">${h('colourOnly') ? '<span style="color:#d33">■</span> <span style="color:#2a62d9">■</span>' : '<span style="color:#d33">■ Work</span> · <span style="color:#2a62d9">▲ Personal</span>'}</div>
      <p data-region="times" style="font-size:13px">${h('formats') ? 'Standup 14:00 · Lunch 2pm · Sync 14h' : 'Standup 14:00 · Lunch 13:00 · Sync 16:00'}</p>
      <div data-region="views" style="display:flex;flex-wrap:wrap;gap:4px;font-size:12px">${(h('twelve') ? ['Day', 'Week', 'Month', 'Year', 'Agenda', 'List', 'Gantt', 'Board', '3-day', '5-day', 'Split', 'Focus'] : ['Day', 'Week', 'Month']).map(v => `<button class="m-btn s secondary">${v}</button>`).join('')}</div>
      <p data-region="sync" style="font-size:13px">${h('syncing') ? '<span class="m-spin" aria-hidden="true">⟳</span> Syncing…' : 'Synced a minute ago'}</p>
      <div class="m-alert" data-region="alert">${h('conflict') ? 'Conflict: E-409' : 'That time overlaps another event. Choose a different slot.'}</div>
      <div data-region="slot"><label for="cs">${h('alloc') ? 'Temporal slot allocation' : 'Start time'}</label><input id="cs" value="14:00"${ti(2)}></div>
      <span data-region="tools" class="m-icons">${h('icons') ? '<button>＋</button><button>⚙</button><button>⎙</button>' : '<button>＋ Add</button><button>⚙ Settings</button>'}</span>
      <div data-region="danger" style="display:flex;gap:${h('wipe') ? 2 : 22}px;margin-top:8px"><button class="m-btn"${ti(3)}>Add event</button>${h('wipe') ? danger('Delete all events') : '<a href="#" class="m-link" style="align-self:center">Delete all…</a>'}</div>
      <p data-region="undo" style="font-size:13px">${h('noUndo') ? '' : 'Event deleted. <a href="#" class="m-link">Undo</a>'}</p>
      <p data-region="pref" style="font-size:13px">${h('noDefault') ? '' : '<a href="#" class="m-link">Set default view</a>'}</p></div>`;
  }
};

TEMPLATES.radio = {
  id: 'radio', name: 'Lighthouse Radio player', url: 'radio.lighthouse.example/live',
  style: ['The play button is at least 44 px.', 'Every control has a text label.'],
  regions: { form: 'Whole player (tab sequence)', title: 'Station name', time: 'Time readout', transport: 'Transport buttons', play: 'Play button', buffer: 'Buffer status', alert: 'Message box', stop: 'Stop control', clear: 'Playlist controls', like: 'Like button', genres: 'Genre tiles', eq: 'Equaliser', action: 'Start button', jargon: 'Stream label' },
  defects: MK([
    ['tinyTime', 'time', 'text', 'Time readout in 8 px text', W.text],
    ['greyTime', 'time', 'contrast', 'Pale grey time readout on white', W.contrast],
    ['icons', 'transport', 'recognition', 'Transport buttons are unlabelled icons', W.recog],
    ['tinyPlay', 'play', 'target', 'Play button is 16 px high', W.target],
    ['buffering', 'buffer', 'status', '“Buffering…” with no percentage or time', W.stat],
    ['broken', 'alert', 'errors', 'Message says “Playback error”', W.err],
    ['noStop', 'stop', 'control', 'No way to pause or stop the stream', 'Users must be able to get out.'],
    ['clearBtn', 'clear', 'prevention', '“Clear playlist” beside “Next track”, no confirm', W.prev],
    ['heart', 'like', 'color', 'Liked songs shown only by a red or grey heart', W.color],
    ['thirty', 'genres', 'minimal', 'Thirty genre tiles of equal weight', W.min],
    ['noEq', 'eq', 'flexibility', 'No way to reset the equaliser', W.flex],
    ['go', 'action', 'consistency', 'Button says “Go” instead of “Play”', 'The house style says “Play” everywhere.'],
    ['initiate', 'jargon', 'realworld', 'Label reads “Initiate audio stream”', W.real],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the player', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    return `<div class="m-card" data-region="form">
      <h2 data-region="title">Lighthouse Radio</h2>
      <p data-region="jargon" style="font-size:14px">${h('initiate') ? 'Initiate audio stream' : 'Listen live'}</p>
      <p data-region="time" style="font-size:${h('tinyTime') ? 8 : 14}px;color:${h('greyTime') ? '#c4c4c4' : '#2c3b46'}">01:42 / 03:50</p>
      <div data-region="transport" class="m-icons">${h('icons') ? `<button${ti(2)}>⏮</button><button>⏭</button>` : `<button${ti(2)}>⏮ Previous</button><button>⏭ Next</button>`}</div>
      <div style="margin:8px 0"><span data-region="play">${h('tinyPlay') ? tinyB('▶', ti(1), 18) : `<button class="m-btn" style="min-height:44px"${ti(1)}>▶ Play</button>`}</span> <span data-region="action">${btn(h('go') ? 'Go' : 'Play', '', 's')}</span> <span data-region="like">${h('heart') ? '<span style="color:#d33;font-size:20px">♥</span><span style="color:#999;font-size:20px">♥</span>' : '<span style="font-size:14px">♥ Liked · ♡ Like</span>'}</span></div>
      <p data-region="buffer" style="font-size:13px">${h('buffering') ? '<span class="m-spin" aria-hidden="true">⟳</span> Buffering…' : 'Buffering: 64% · about 3 s left'}</p>
      <div class="m-alert" data-region="alert">${h('broken') ? 'Playback error' : 'We can’t reach the stream. Check your connection, or pick another station.'}</div>
      <p data-region="stop" style="font-size:13px">${h('noStop') ? '' : '<a href="#" class="m-link">Pause</a> · <a href="#" class="m-link">Stop</a>'}</p>
      <div data-region="clear" style="display:flex;gap:${h('clearBtn') ? 2 : 22}px"><button class="m-btn s secondary"${ti(3)}>Next track</button>${h('clearBtn') ? danger('Clear playlist') : '<a href="#" class="m-link" style="align-self:center">Clear playlist…</a>'}</div>
      <div data-region="genres" style="font-size:12px;margin-top:6px">${Array.from({ length: h('thirty') ? 30 : 5 }, (_, i) => `<span style="display:inline-block;border:1px solid #ccd3d8;padding:1px 5px;margin:1px">${['Jazz', 'Folk', 'Soul', 'Pop', 'Rock', 'Dub'][i % 6]}${i > 5 ? i : ''}</span>`).join('')}</div>
      <p data-region="eq" style="font-size:13px">${h('noEq') ? '' : 'Equaliser: <a href="#" class="m-link">Reset to flat</a>'}</p></div>`;
  }
};

TEMPLATES.survey = {
  id: 'survey', name: 'Harbor feedback survey', url: 'survey.halcyon.example/page-3',
  style: ['“Next” on every page.', 'Required fields carry an asterisk and the word “required”.'],
  regions: { form: 'Whole survey (tab sequence)', title: 'Title', scale: 'Rating scale', req: 'Required field', alert: 'Message box', progress: 'Progress', back: 'Back link', danger: 'Submit and discard', many: 'Question list', hint: 'Hint text', next: 'Next button', earlier: 'Earlier-answer note', draft: 'Save draft', size: 'Intro text' },
  defects: MK([
    ['tinyIntro', 'size', 'text', 'Intro text in 9 px type', W.text],
    ['greyHint', 'hint', 'contrast', 'Hint text in pale grey', W.contrast],
    ['ordinal', 'scale', 'realworld', 'Scale labelled “Rate on a 5-point ordinal Likert scale”', W.real],
    ['redOnly', 'req', 'color', 'Required field shown only by a red edge', W.color],
    ['invalid', 'alert', 'errors', 'Message just says “Invalid response”', W.err],
    ['noProgress', 'progress', 'status', 'No page count or progress bar', W.stat],
    ['noBack', 'back', 'control', 'No way to go back to an earlier page', 'Users must be able to step back.'],
    ['both', 'danger', 'prevention', '“Discard survey” beside “Submit”, no confirm', W.prev],
    ['fifteen', 'many', 'minimal', 'Fifteen questions on a single page', W.min],
    ['tinyNext', 'next', 'target', 'Next button is 16 px high', W.target],
    ['continue', 'next', 'consistency', 'Button says “Continue” instead of “Next”', 'The house style says “Next” on every page.'],
    ['remember', 'earlier', 'recognition', 'Question says “Compared to your answer on page 2…”', 'Do not make users remember earlier answers; show them.'],
    ['noDraft', 'draft', 'flexibility', 'No way to save a draft and return', 'Let users finish later.'],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the form', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    const qs = Array.from({ length: h('fifteen') ? 15 : 3 }, (_, i) => `<div style="font-size:13px;margin:2px 0">Q${i + 1}. How was the quay? <label><input type="radio" name="q${i}"> Good</label> <label><input type="radio" name="q${i}"> Poor</label></div>`).join('');
    const nl = h('continue') ? 'Continue' : 'Next';
    return `<div class="m-card" data-region="form">
      <h2 data-region="title">Tell us about your crossing</h2>
      <p data-region="progress" style="font-size:13px">${h('noProgress') ? '' : 'Page 3 of 5 <progress value="60" max="100" style="width:100px"></progress>'}</p>
      <p data-region="size" style="font-size:${h('tinyIntro') ? 9 : 14}px">Your answers help us improve the harbor.</p>
      <div data-region="scale"><b>${h('ordinal') ? 'Rate on a 5-point ordinal Likert scale' : 'How easy was it? (1 = hard, 5 = easy)'}</b> <input style="width:50px" value="4"${ti(1)}></div>
      <div data-region="req"><label for="sr">Your name ${h('redOnly') ? '' : '* <small>(required)</small>'}</label><input id="sr" class="${h('redOnly') ? 'invalid' : ''}"${ti(2)}></div>
      <p data-region="hint" style="font-size:13px;color:${h('greyHint') ? '#c4c4c4' : '#4a5560'}">We never share your name.</p>
      <p data-region="earlier" style="font-size:13px">${h('remember') ? 'Compared to your answer on page 2, was this better?' : 'You said the ferry was late (page 2). Was this one better?'}</p>
      <div data-region="many">${qs}</div>
      <div class="m-alert" data-region="alert">${h('invalid') ? 'Invalid response' : 'Please answer question 2. It is required.'}</div>
      <div style="display:flex;gap:14px;align-items:center;margin-top:8px"><span data-region="back">${h('noBack') ? '' : '<a href="#" class="m-link">◀ Back</a>'}</span><span data-region="next">${h('tinyNext') ? tinyB(nl, ti(3), 48) : `<button class="m-btn"${ti(3)}>${nl}</button>`}</span></div>
      <div data-region="danger" style="display:flex;gap:${h('both') ? 2 : 22}px;margin-top:8px"><button class="m-btn s"${ti(4)}>Submit</button>${h('both') ? danger('Discard survey') : '<a href="#" class="m-link" style="align-self:center">Discard…</a>'}</div>
      <p data-region="draft" style="font-size:13px">${h('noDraft') ? '' : '<a href="#" class="m-link">Save draft and finish later</a>'}</p></div>`;
  }
};

TEMPLATES.shop = {
  id: 'shop', name: 'ShipShop search results', url: 'shop.shipshop.example/search?q=rope',
  style: ['Prices always read “12.50 cr”.', 'Stock is shown with a word or icon, not only colour.'],
  regions: { form: 'Whole page (tab sequence)', title: 'Page title', filters: 'Filter list', stock: 'Stock labels', price: 'Price', add: 'Add to cart', status: 'Result count', alert: 'Message box', sort: 'Sort control', row: 'Add and remove', reset: 'Clear filters', undo: 'Filter undo', sku: 'Product class', price2: 'Price formats' },
  defects: MK([
    ['tinyText', 'title', 'text', 'Heading and notes in 9 px type', W.text],
    ['greyPrice', 'price', 'contrast', 'Prices in pale grey', W.contrast],
    ['twelve', 'filters', 'minimal', 'Twelve filter groups, all open', W.min],
    ['stockColour', 'stock', 'color', 'Stock shown only by a green or red dot', W.color],
    ['tinyAdd', 'add', 'target', 'Add-to-cart button is 16 px high', W.target],
    ['noCount', 'status', 'status', '“Loading…” with no result count', W.stat],
    ['none', 'alert', 'errors', 'Message says “No results” with no help', W.err],
    ['sortIcon', 'sort', 'recognition', 'Sort control is an unlabelled icon', W.recog],
    ['both', 'row', 'prevention', '“Remove from cart” beside “Add to cart”, no confirm', W.prev],
    ['noClear', 'reset', 'flexibility', 'No way to clear all filters', W.flex],
    ['instant', 'undo', 'control', 'Filters apply instantly with no undo', 'Users need a way back.'],
    ['sku', 'sku', 'realworld', 'Product class shown as “SKU-class: R-09”', W.real],
    ['prices', 'price2', 'consistency', 'Prices shown as 12.50 cr, 12,5 and 12½', 'The house style says one price format.'],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the page', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    const fs = Array.from({ length: h('twelve') ? 12 : 3 }, (_, i) => `<label style="display:inline-block;margin-right:8px;font-size:13px"><input type="checkbox"> ${['Length', 'Brand', 'Colour', 'Weight', 'Material', 'Age', 'Rating', 'Seller', 'Stock', 'Port', 'Season', 'Use'][i]}</label>`).join('');
    return `<div class="m-card" data-region="form">
      <h2 data-region="title" style="font-size:${h('tinyText') ? 9 : 22}px">Results for “rope”</h2>
      <p data-region="status" style="font-size:13px">${h('noCount') ? '<span class="m-spin" aria-hidden="true">⟳</span> Loading…' : '24 results'}</p>
      <div data-region="filters">${fs}</div>
      <p data-region="reset" style="font-size:13px">${h('noClear') ? '' : '<a href="#" class="m-link">Clear all filters</a>'}</p>
      <p data-region="undo" style="font-size:13px">${h('instant') ? '' : 'Filters applied. <a href="#" class="m-link">Undo</a>'}</p>
      <span data-region="sort" class="m-icons">${h('sortIcon') ? '<button>⇅</button>' : '<button>⇅ Sort: price</button>'}</span>
      <p data-region="stock" style="font-size:13px">${h('stockColour') ? '<span style="color:#2a9d3c">●</span> <span style="color:#d33">●</span>' : '<span style="color:#2a9d3c">● In stock</span> · <span style="color:#d33">✕ Sold out</span>'}</p>
      <p data-region="price" style="font-size:15px;color:${h('greyPrice') ? '#c4c4c4' : '#1d2530'}"><b>Hemp rope, 20 m</b> <span data-region="price2">${h('prices') ? '12.50 cr · 12,5 · 12½' : '12.50 cr'}</span></p>
      <p data-region="sku" style="font-size:13px">${h('sku') ? 'SKU-class: R-09' : 'Category: ropes'}</p>
      <div class="m-alert" data-region="alert">${h('none') ? 'No results' : 'No ropes match “rop”. Check the spelling or try “cable”.'}</div>
      <div data-region="row" style="display:flex;gap:${h('both') ? 2 : 22}px;margin-top:8px"><span data-region="add">${h('tinyAdd') ? tinyB('Add', ti(1), 36) : `<button class="m-btn"${ti(1)}>Add to cart</button>`}</span>${h('both') ? danger('Remove from cart') : '<a href="#" class="m-link" style="align-self:center">Remove…</a>'}</div></div>`;
  }
};

TEMPLATES.mail = {
  id: 'mail', name: 'Harbor Mail inbox', url: 'mail.halcyon.example/inbox',
  style: ['The primary button reads “Send”.', 'Delete is called “Delete” everywhere.'],
  regions: { form: 'Whole inbox (tab sequence)', title: 'Inbox title', unread: 'Unread mail', list: 'Message list', tools: 'Toolbar', send: 'Send button', status: 'Sending status', alert: 'Message box', danger: 'Archive and delete', undo: 'Undo send', density: 'Layout options', words: 'Action names', jargon: 'Compose label', small: 'Dates' },
  defects: MK([
    ['tinyDates', 'small', 'text', 'Dates in 8 px text', W.text],
    ['greyList', 'list', 'contrast', 'Pale grey sender names on white', W.contrast],
    ['boldOnly', 'unread', 'color', 'Unread mail shown only by a blue tint', W.color],
    ['tinyBtn', 'send', 'target', 'Send button is 16 px high', W.target],
    ['sending', 'status', 'status', '“Sending…” with no progress or result', W.stat],
    ['bounce', 'alert', 'errors', 'Message reads “550 5.1.1 rejected”', W.err],
    ['icons', 'tools', 'recognition', 'Toolbar of unlabelled icons', W.recog],
    ['both', 'danger', 'prevention', '“Delete all” beside “Archive”, no confirm', W.prev],
    ['noUndo', 'undo', 'control', 'No way to undo a sent message', 'Users need a way out of a mistake.'],
    ['twelve', 'tools', 'minimal', 'Twelve toolbar buttons of equal weight', W.min],
    ['noDensity', 'density', 'flexibility', 'No way to change or reset the layout', W.flex],
    ['trash', 'words', 'consistency', 'Delete, Trash and Remove used for one action', 'The house style says “Delete” everywhere.'],
    ['transmit', 'jargon', 'realworld', 'Compose button says “Transmit new datagram”', W.real],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the inbox', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    const bar = h('twelve') ? ['Reply', 'Reply all', 'Forward', 'Move', 'Label', 'Flag', 'Snooze', 'Print', 'Mute', 'Spam', 'Pin', 'More'] : ['Reply', 'Forward'];
    return `<div class="m-card" data-region="form">
      <h2 data-region="title">Inbox</h2>
      <p data-region="jargon"><button class="m-btn s"${ti(1)}>${h('transmit') ? 'Transmit new datagram' : 'New message'}</button></p>
      <div data-region="tools" class="m-icons" style="font-size:12px;flex-wrap:wrap">${bar.map(b => `<button>${h('icons') ? b[0] : b}</button>`).join('')}</div>
      <div data-region="list" style="font-size:14px;color:${h('greyList') ? '#c4c4c4' : '#1d2530'}">Captain Reyes: berth schedule</div>
      <div data-region="unread" style="font-size:14px;${h('boldOnly') ? 'background:#eaf2ff' : 'font-weight:700'}">● Mara: new rules (unread)</div>
      <p data-region="small" style="font-size:${h('tinyDates') ? 8 : 12}px;color:#4a5560">Today 09:12 · Yesterday 17:40</p>
      <p data-region="words" style="font-size:13px">${h('trash') ? 'Delete · Trash · Remove' : 'Delete · Archive · Report spam'}</p>
      <p data-region="status" style="font-size:13px">${h('sending') ? '<span class="m-spin" aria-hidden="true">⟳</span> Sending…' : 'Sent to Captain Reyes.'}</p>
      <div class="m-alert" data-region="alert">${h('bounce') ? '550 5.1.1 rejected' : 'We couldn’t deliver this: the address doesn’t exist. Check it for typing mistakes.'}</div>
      <p data-region="undo" style="font-size:13px">${h('noUndo') ? '' : 'Message sent. <a href="#" class="m-link">Undo</a>'}</p>
      <p data-region="density" style="font-size:13px">${h('noDensity') ? '' : '<a href="#" class="m-link">Compact view</a> · <a href="#" class="m-link">Restore default layout</a>'}</p>
      <div style="display:flex;gap:${h('both') ? 2 : 22}px;margin-top:8px;align-items:center"><span data-region="send">${h('tinyBtn') ? tinyB('Send', ti(2), 40) : `<button class="m-btn"${ti(2)}>Send</button>`}</span><span data-region="danger" style="display:inline-flex;gap:${h('both') ? 2 : 22}px"><button class="m-btn s secondary"${ti(3)}>Archive</button>${h('both') ? danger('Delete all') : '<a href="#" class="m-link">Delete all…</a>'}</span></div></div>`;
  }
};

/* ───────────────────── 11g. Six more interfaces: bank, map, smart home, tasks, video, tax form ───────────────────── */
Object.assign(SHIP_KIND, { bank: 'steamer', map: 'sail', home: 'tug', todo: 'ferry', video: 'barge', tax: 'freighter' });
const fld = (id, label, ti = '', val = '') => `<div><label for="${id}">${label}</label><input id="${id}" value="${val}"${ti}></div>`;

TEMPLATES.bank = {
  id: 'bank', name: 'HalcyonBank transfer', url: 'bank.halcyon.example/transfer',
  style: ['The action is called “Send” everywhere.', 'Money moves only after a review step.'],
  regions: { form: 'Whole page (tab sequence)', title: 'Page title', fee: 'Fee note', bal: 'Balance', payee: 'Payee field', alert: 'Message box', status: 'Transfer status', undo: 'Recall option', review: 'Review step', send: 'Send button', neg: 'Overdraft marker', many: 'Optional fields', recall: 'Saved payees', limit: 'Daily limit', words: 'Action names' },
  defects: MK([
    ['tinyFee', 'fee', 'text', 'Fee note in 8 px type', W.text],
    ['greyBal', 'bal', 'contrast', 'Balance in pale grey on white', W.contrast],
    ['jargon', 'payee', 'realworld', 'Field labelled “Counterparty remittance locus”', W.real],
    ['declined', 'alert', 'errors', 'Message reads “Transaction declined (0x51)”', W.err],
    ['processing', 'status', 'status', '“Processing…” with no result or time', W.stat],
    ['noRecall', 'undo', 'control', 'No way to cancel or recall a pending transfer', 'Users need a way back from a mistake.'],
    ['noReview', 'review', 'prevention', 'Money leaves the moment you press Send: no review step', 'Add a review step for irreversible actions.'],
    ['tinySend', 'send', 'target', 'Send button is 16 px high', W.target],
    ['redOnly', 'neg', 'color', 'Overdrawn shown only by red text', W.color],
    ['eighteen', 'many', 'minimal', 'Eighteen optional fields on the main form', W.min],
    ['noPayees', 'recall', 'recognition', 'No saved payees: retype the account number each time', 'Recognition beats recall: show saved payees.'],
    ['limit', 'limit', 'flexibility', 'Daily limit cannot be changed or reset', W.flex],
    ['names', 'words', 'consistency', 'Send, Transfer and Pay used for one action', 'The house style says “Send” everywhere.'],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the form', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    return `<div class="m-card" data-region="form">
      <h2 data-region="title">Send money</h2>
      <p data-region="bal" style="font-size:15px;color:${h('greyBal') ? '#c4c4c4' : '#1d2530'}">Balance: 1,240.00 cr</p>
      <p data-region="neg" style="font-size:14px">${h('redOnly') ? '<span style="color:#c0392b">−35.00</span>' : '<span style="color:#c0392b">−35.00 (overdrawn)</span>'}</p>
      <div data-region="payee"><label for="bp">${h('jargon') ? 'Counterparty remittance locus' : 'Pay to (account number)'}</label><input id="bp"${ti(1)}></div>
      <div data-region="recall" style="font-size:13px">${h('noPayees') ? '' : 'Saved payees: <a href="#" class="m-link">Rent</a> · <a href="#" class="m-link">Mara</a>'}</div>
      <div data-region="many" style="font-size:13px">${Array.from({ length: h('eighteen') ? 18 : 2 }, (_, i) => `<label style="display:inline-block;margin-right:6px">Opt ${i + 1} <input style="width:34px"></label>`).join('')}</div>
      <p data-region="fee" style="font-size:${h('tinyFee') ? 8 : 13}px;color:#4a5560">A fee of 0.50 cr applies to transfers over 100 cr.</p>
      <p data-region="limit" style="font-size:13px">${h('limit') ? 'Daily limit: 500 cr.' : 'Daily limit: 500 cr. <a href="#" class="m-link">Change</a> · <a href="#" class="m-link">Reset</a>'}</p>
      <p data-region="words" style="font-size:13px">${h('names') ? 'Send · Transfer · Pay: all the same.' : 'Use “Send” to move money.'}</p>
      <p data-region="review" style="font-size:13px">${h('noReview') ? '' : 'You will see a summary to confirm before anything is sent.'}</p>
      <div class="m-alert" data-region="alert">${h('declined') ? 'Transaction declined (0x51)' : 'That account number has 9 digits; it needs 10. Check it and try again.'}</div>
      <div style="margin:8px 0"><span data-region="send">${h('tinySend') ? tinyB('Send', ti(2), 40) : `<button class="m-btn"${ti(2)}>Send</button>`}</span></div>
      <p data-region="status" style="font-size:13px">${h('processing') ? '<span class="m-spin" aria-hidden="true">⟳</span> Processing…' : 'Last transfer: delivered 09:12.'}</p>
      <p data-region="undo" style="font-size:13px">${h('noRecall') ? '' : 'Pending transfer: <a href="#" class="m-link">Cancel</a>'}</p></div>`;
  }
};

TEMPLATES.map = {
  id: 'map', name: 'Quayside route planner', url: 'maps.halcyon.example/route',
  style: ['Distances in km, always.', 'Every control has a text label.'],
  regions: { form: 'Whole page (tab sequence)', title: 'Page title', from: 'Start field', streets: 'Street names', routes: 'Route list', legend: 'Route legend', eta: 'Arrival time', zoom: 'Zoom buttons', tools: 'Toolbar', alert: 'Message box', stop: 'Stop navigation', danger: 'Start and reset', units: 'Distance units', dist: 'Distance figures', jargon: 'Mode label' },
  defects: MK([
    ['tinyLabels', 'streets', 'text', 'Street names in 8 px type', W.text],
    ['greyStreets', 'streets', 'contrast', 'Pale grey street names on a light map', W.contrast],
    ['geodesic', 'jargon', 'realworld', 'Mode labelled “Geodesic traversal”', W.real],
    ['noPath', 'alert', 'errors', 'Message reads “ERR_NO_PATH”', W.err],
    ['noEta', 'eta', 'status', 'No arrival time or progress shown', W.stat],
    ['noStop', 'stop', 'control', 'No way to stop or change the route once started', 'Users must be able to get out.'],
    ['wipe', 'danger', 'prevention', '“Reset map” right beside “Start”, no confirm', W.prev],
    ['tinyZoom', 'zoom', 'target', 'Zoom buttons are 14 px', W.target],
    ['colourRoutes', 'legend', 'color', 'Fast and scenic routes told apart by colour only', W.color],
    ['twelve', 'routes', 'minimal', 'Twelve route options of equal weight', W.min],
    ['icons', 'tools', 'recognition', 'Toolbar of unlabelled icons', W.recog],
    ['noUnits', 'units', 'flexibility', 'No way to switch or reset units', W.flex],
    ['mixed', 'dist', 'consistency', 'Distances in km, miles and cables', 'The house style says km everywhere.'],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the page', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    const rs = Array.from({ length: h('twelve') ? 12 : 3 }, (_, i) => `<label style="display:block;font-size:13px"><input type="radio" name="rt"> Route ${i + 1}</label>`).join('');
    return `<div class="m-card" data-region="form">
      <h2 data-region="title">Plan your route</h2>
      <div data-region="from"><label for="mf">From</label><input id="mf" value="Pier 4"${ti(1)}></div>
      <p data-region="jargon" style="font-size:13px">Mode: ${h('geodesic') ? 'Geodesic traversal' : 'Walking'}</p>
      <div style="background:#e8eef0;padding:6px;border-radius:6px"><p data-region="streets" style="margin:0;font-size:${h('tinyLabels') ? 8 : 13}px;color:${h('greyStreets') ? '#c9cfd2' : '#1d2530'}">Quay Road · Lantern Lane · Net Street</p></div>
      <div data-region="routes" style="margin:6px 0">${rs}</div>
      <div data-region="legend" style="font-size:13px">${h('colourRoutes') ? '<span style="color:#d33">━</span> <span style="color:#2a9d3c">━</span>' : '<span style="color:#d33">━ Fast</span> · <span style="color:#2a9d3c">┅ Scenic</span>'}</div>
      <p data-region="dist" style="font-size:13px">${h('mixed') ? '2.4 km · 1.5 mi · 13 cables' : '2.4 km · 3.1 km · 5.0 km'}</p>
      <p data-region="eta" style="font-size:13px">${h('noEta') ? '' : 'Arrive 14:35 · 32 min'}</p>
      <div data-region="zoom">${h('tinyZoom') ? '<button style="width:14px;height:14px;padding:0;font-size:9px;min-height:0">+</button> <button style="width:14px;height:14px;padding:0;font-size:9px;min-height:0">−</button>' : '<button class="m-btn s secondary">＋ Zoom in</button> <button class="m-btn s secondary">－ Zoom out</button>'}</div>
      <span data-region="tools" class="m-icons">${h('icons') ? '<button>⌖</button><button>☆</button><button>⎙</button>' : '<button>⌖ Locate me</button><button>☆ Save</button>'}</span>
      <div class="m-alert" data-region="alert">${h('noPath') ? 'ERR_NO_PATH' : 'We can’t find a walking route to Pier 9 from here. Try a different start point.'}</div>
      <p data-region="units" style="font-size:13px">${h('noUnits') ? '' : 'Units: km · <a href="#" class="m-link">Switch to miles</a> · <a href="#" class="m-link">Reset</a>'}</p>
      <p data-region="stop" style="font-size:13px">${h('noStop') ? '' : '<a href="#" class="m-link">Stop navigation</a>'}</p>
      <div data-region="danger" style="display:flex;gap:${h('wipe') ? 2 : 22}px;margin-top:8px"><button class="m-btn"${ti(2)}>Start</button>${h('wipe') ? danger('Reset map') : '<a href="#" class="m-link" style="align-self:center">Reset map…</a>'}</div></div>`;
  }
};

TEMPLATES.home = {
  id: 'home', name: 'Lamp & Latch smart home', url: 'home.lampandlatch.example/panel',
  style: ['One word per action: “On”.', 'State is never shown by colour alone.'],
  regions: { form: 'Whole panel (tab sequence)', title: 'Panel title', labels: 'Device labels', door: 'Door status', jargon: 'Relay label', alert: 'Message box', status: 'Update status', override: 'Schedule override', danger: 'Lights and locks', toggles: 'Light toggles', many: 'Device tiles', rooms: 'Room tabs', scenes: 'Scenes', words: 'Switch names', dim: 'Dim note' },
  defects: MK([
    ['tinyLabels', 'labels', 'text', 'Device labels in 8 px type', W.text],
    ['greyDim', 'dim', 'contrast', 'Pale grey “last used” note on white', W.contrast],
    ['relay', 'jargon', 'realworld', 'Switch labelled “Actuate relay K2”', W.real],
    ['offline', 'alert', 'errors', 'Message reads “Device offline (E12)”', W.err],
    ['updating', 'status', 'status', '“Updating…” spinner with no confirmation', W.stat],
    ['noOverride', 'override', 'control', 'No way to cancel or override a schedule', 'Users must be able to get out.'],
    ['unlock', 'danger', 'prevention', '“Unlock all doors” beside “Lights on”, no confirm', W.prev],
    ['tinyToggle', 'toggles', 'target', 'Toggles are 14 px', W.target],
    ['doorColour', 'door', 'color', 'Door locked or open shown only by a red or green dot', W.color],
    ['tiles', 'many', 'minimal', 'Twenty-four device tiles on the home screen', W.min],
    ['roomIcons', 'rooms', 'recognition', 'Rooms shown as unlabelled icons', W.recog],
    ['noScenes', 'scenes', 'flexibility', 'No way to edit or reset scenes', W.flex],
    ['switchNames', 'words', 'consistency', 'On, Enable and Activate used for one action', 'The house style says “On”.'],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the panel', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    const tiles = Array.from({ length: h('tiles') ? 24 : 4 }, (_, i) => `<span style="display:inline-block;border:1px solid #ccd3d8;border-radius:6px;padding:2px 6px;margin:1px;font-size:12px">Dev ${i + 1}</span>`).join('');
    return `<div class="m-card" data-region="form">
      <h2 data-region="title">Home panel</h2>
      <span data-region="rooms" class="m-icons">${h('roomIcons') ? '<button>⌂</button><button>☾</button><button>♨</button>' : '<button>⌂ Hall</button><button>☾ Bedroom</button>'}</span>
      <p data-region="labels" style="font-size:${h('tinyLabels') ? 8 : 14}px">Hall lamp · Porch light · Front door</p>
      <p data-region="dim" style="font-size:13px;color:${h('greyDim') ? '#c4c4c4' : '#4a5560'}">Last used 3 minutes ago</p>
      <p data-region="door" style="font-size:14px">${h('doorColour') ? '<span style="color:#2a9d3c">●</span> <span style="color:#d33">●</span>' : '<span style="color:#2a9d3c">● Locked</span> · <span style="color:#d33">○ Open</span>'}</p>
      <div data-region="toggles">${['Hall', 'Porch'].map(n => h('tinyToggle') ? `<button style="width:14px;height:14px;padding:0;font-size:8px;min-height:0"${ti(1)}></button> ` : `<label><input type="checkbox"${ti(1)}> ${n} ${h('switchNames') ? 'Enable' : 'On'}</label> `).join('')}</div>
      <p data-region="words" style="font-size:13px">${h('switchNames') ? 'On · Enable · Activate: all the same.' : 'Use “On” to switch a light on.'}</p>
      <p data-region="jargon" style="font-size:13px">${h('relay') ? 'Actuate relay K2' : 'Porch light'}</p>
      <p data-region="status" style="font-size:13px">${h('updating') ? '<span class="m-spin" aria-hidden="true">⟳</span> Updating…' : 'Porch light is on. Changed just now.'}</p>
      <div class="m-alert" data-region="alert">${h('offline') ? 'Device offline (E12)' : 'The porch light is not answering. Check that it is plugged in, then try again.'}</div>
      <div data-region="many">${tiles}</div>
      <p data-region="scenes" style="font-size:13px">${h('noScenes') ? '' : 'Scenes: <a href="#" class="m-link">Edit</a> · <a href="#" class="m-link">Reset to default</a>'}</p>
      <p data-region="override" style="font-size:13px">${h('noOverride') ? '' : '<a href="#" class="m-link">Skip tonight’s schedule</a>'}</p>
      <div data-region="danger" style="display:flex;gap:${h('unlock') ? 2 : 22}px;margin-top:8px"><button class="m-btn"${ti(2)}>Lights on</button>${h('unlock') ? danger('Unlock all doors') : '<a href="#" class="m-link" style="align-self:center">Unlock doors…</a>'}</div></div>`;
  }
};

TEMPLATES.todo = {
  id: 'todo', name: 'TaskTide to-do list', url: 'tasks.tasktide.example/today',
  style: ['One word for the date: “Due”.', 'Body text is never below 12 px.'],
  regions: { form: 'Whole list (tab sequence)', title: 'Page title', done: 'Completed tasks', prio: 'Priority marks', check: 'Task checkboxes', many: 'Sections', status: 'Saving status', alert: 'Message box', undo: 'Undo delete', danger: 'Add and delete', icons: 'Priority icons', reorder: 'Reorder and filters', dates: 'Date labels', jargon: 'Add field', hint: 'Hint text' },
  defects: MK([
    ['tinyHint', 'hint', 'text', 'Hint text in 8 px type', W.text],
    ['greyDue', 'done', 'contrast', 'Due dates in pale grey on white', W.contrast],
    ['instantiate', 'jargon', 'realworld', 'Field labelled “Instantiate task entity”', W.real],
    ['failed', 'alert', 'errors', 'Message reads “Failed (null)”', W.err],
    ['noSave', 'status', 'status', 'No sign that changes were saved', W.stat],
    ['noUndo', 'undo', 'control', 'No undo after deleting a task', 'Users need a way back from a mistake.'],
    ['wipe', 'danger', 'prevention', '“Delete list” beside “Add task”, no confirm', W.prev],
    ['tinyCheck', 'check', 'target', 'Checkboxes are 12 px', W.target],
    ['prioColour', 'prio', 'color', 'Priority shown only by colour', W.color],
    ['sections', 'many', 'minimal', 'Fifteen sections open at once', W.min],
    ['prioIcons', 'icons', 'recognition', 'Priority set by unlabelled icons', W.recog],
    ['noReorder', 'reorder', 'flexibility', 'No way to reorder or reset filters', W.flex],
    ['dateWords', 'dates', 'consistency', 'Due, By and Deadline used for one thing', 'The house style says “Due”.'],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the list', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    return `<div class="m-card" data-region="form">
      <h2 data-region="title">Today</h2>
      <div data-region="jargon"><label for="tt">${h('instantiate') ? 'Instantiate task entity' : 'New task'}</label><input id="tt"${ti(1)}></div>
      <p data-region="hint" style="font-size:${h('tinyHint') ? 8 : 13}px;color:#4a5560">Press Enter to add.</p>
      <div data-region="check" style="font-size:14px">${['Buy rope', 'Call Mara'].map(t => h('tinyCheck') ? `<div><button style="width:12px;height:12px;padding:0;min-height:0"${ti(2)}></button> ${t}</div>` : `<div><label><input type="checkbox"${ti(2)}> ${t}</label></div>`).join('')}</div>
      <p data-region="done" style="font-size:13px;color:${h('greyDue') ? '#c4c4c4' : '#4a5560'}">Done: Pay rent · due 5 May</p>
      <p data-region="dates" style="font-size:13px">${h('dateWords') ? 'Due 5 May · By 6 May · Deadline 7 May' : 'Due 5 May · Due 6 May · Due 7 May'}</p>
      <p data-region="prio" style="font-size:13px">${h('prioColour') ? '<span style="color:#d33">●</span> <span style="color:#e0a030">●</span> <span style="color:#2a9d3c">●</span>' : '<span style="color:#d33">● High</span> · <span style="color:#8a5a00">▲ Medium</span> · <span style="color:#2a9d3c">○ Low</span>'}</p>
      <span data-region="icons" class="m-icons">${h('prioIcons') ? '<button>⚑</button><button>⏰</button>' : '<button>⚑ Flag</button><button>⏰ Remind</button>'}</span>
      <div data-region="many" style="font-size:12px">${Array.from({ length: h('sections') ? 15 : 3 }, (_, i) => `<span style="display:inline-block;border:1px solid #ccd3d8;padding:1px 5px;margin:1px">List ${i + 1}</span>`).join('')}</div>
      <p data-region="reorder" style="font-size:13px">${h('noReorder') ? '' : '<a href="#" class="m-link">Reorder</a> · <a href="#" class="m-link">Reset filters</a>'}</p>
      <p data-region="status" style="font-size:13px">${h('noSave') ? '' : 'All changes saved.'}</p>
      <div class="m-alert" data-region="alert">${h('failed') ? 'Failed (null)' : 'We couldn’t save “Buy rope” because the title is empty. Type a title and try again.'}</div>
      <p data-region="undo" style="font-size:13px">${h('noUndo') ? '' : 'Task deleted. <a href="#" class="m-link">Undo</a>'}</p>
      <div data-region="danger" style="display:flex;gap:${h('wipe') ? 2 : 22}px;margin-top:8px"><button class="m-btn"${ti(3)}>Add task</button>${h('wipe') ? danger('Delete list') : '<a href="#" class="m-link" style="align-self:center">Delete list…</a>'}</div></div>`;
  }
};

TEMPLATES.video = {
  id: 'video', name: 'Beacon video browser', url: 'watch.beacon.example/home',
  style: ['The button reads “Play” everywhere.', 'Autoplay can always be cancelled.'],
  regions: { form: 'Whole page (tab sequence)', title: 'Page title', desc: 'Descriptions', caption: 'Thumbnail captions', seen: 'Watched marks', next: 'Next episode button', many: 'Show tiles', alert: 'Message box', buffer: 'Buffer status', auto: 'Autoplay', danger: 'Resume and clear history', icons: 'Player controls', subs: 'Subtitle settings', words: 'Play buttons', jargon: 'Session label' },
  defects: MK([
    ['tinyDesc', 'desc', 'text', 'Descriptions in 8 px type', W.text],
    ['whiteCap', 'caption', 'contrast', 'White captions over a pale thumbnail', W.contrast],
    ['commence', 'jargon', 'realworld', 'Button says “Commence viewing session”', W.real],
    ['denied', 'alert', 'errors', 'Message reads “Playback failed (403)”', W.err],
    ['buffering', 'buffer', 'status', '“Buffering…” with no progress', W.stat],
    ['noCancel', 'auto', 'control', 'Next video autoplays with no way to cancel', 'Users must always be able to stop.'],
    ['clearHist', 'danger', 'prevention', '“Clear history” beside “Resume”, no confirm', W.prev],
    ['tinyNext', 'next', 'target', '“Next episode” is a 14 px button', W.target],
    ['seenColour', 'seen', 'color', 'Watched shows marked only by a grey tint', W.color],
    ['thirty', 'many', 'minimal', 'Thirty show tiles of equal weight', W.min],
    ['icons', 'icons', 'recognition', 'Player controls are unlabelled icons', W.recog],
    ['noSubs', 'subs', 'flexibility', 'No way to change or reset subtitle size', W.flex],
    ['watchWords', 'words', 'consistency', 'Watch, Play and Start used for one action', 'The house style says “Play”.'],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the page', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    return `<div class="m-card" data-region="form">
      <h2 data-region="title">Beacon</h2>
      <p data-region="jargon"><button class="m-btn"${ti(1)}>${h('commence') ? 'Commence viewing session' : 'Play'}</button></p>
      <div data-region="caption" style="background:#f2efe3;padding:8px;border-radius:6px;font-size:14px;color:${h('whiteCap') ? '#ffffff' : '#1d2530'}">The Reach · Episode 3</div>
      <p data-region="desc" style="font-size:${h('tinyDesc') ? 8 : 13}px">A fisherman returns to a harbor that has forgotten him.</p>
      <p data-region="seen" style="font-size:13px">${h('seenColour') ? '<span style="opacity:.45">The Reach</span> · Tidewater' : '✓ The Reach (watched) · Tidewater'}</p>
      <p data-region="words" style="font-size:13px">${h('watchWords') ? 'Watch · Play · Start: all the same.' : 'Use “Play” to start a show.'}</p>
      <span data-region="icons" class="m-icons">${h('icons') ? `<button${ti(2)}>⏪</button><button>⏩</button>` : `<button${ti(2)}>⏪ Back 10 s</button><button>⏩ Forward 10 s</button>`}</span>
      <p data-region="buffer" style="font-size:13px">${h('buffering') ? '<span class="m-spin" aria-hidden="true">⟳</span> Buffering…' : 'Buffering: 72%'}</p>
      <div class="m-alert" data-region="alert">${h('denied') ? 'Playback failed (403)' : 'This show isn’t available in your region. Pick another show.'}</div>
      <p data-region="auto" style="font-size:13px">${h('noCancel') ? '' : 'Next episode starts in 10 s. <a href="#" class="m-link">Cancel</a>'}</p>
      <div data-region="many" style="font-size:12px">${Array.from({ length: h('thirty') ? 30 : 5 }, (_, i) => `<span style="display:inline-block;border:1px solid #ccd3d8;padding:1px 5px;margin:1px">Show ${i + 1}</span>`).join('')}</div>
      <p data-region="subs" style="font-size:13px">${h('noSubs') ? '' : 'Subtitles: <a href="#" class="m-link">Size</a> · <a href="#" class="m-link">Reset</a>'}</p>
      <div style="margin:6px 0"><span data-region="next">${h('tinyNext') ? tinyB('Next episode', ti(3), 62) : `<button class="m-btn s"${ti(3)}>Next episode</button>`}</span></div>
      <div data-region="danger" style="display:flex;gap:${h('clearHist') ? 2 : 22}px"><button class="m-btn s secondary"${ti(4)}>Resume</button>${h('clearHist') ? danger('Clear history') : '<a href="#" class="m-link" style="align-self:center">Clear history…</a>'}</div></div>`;
  }
};

TEMPLATES.tax = {
  id: 'tax', name: 'Harbor tax return form', url: 'tax.halcyon.example/return/step-3',
  style: ['“Next” on every step.', 'Required fields carry an asterisk and the word “required”.'],
  regions: { form: 'Whole form (tab sequence)', title: 'Page title', help: 'Help text', jargon: 'Income field', alert: 'Message box', progress: 'Progress', back: 'Back link', danger: 'Save and submit', req: 'Required field', many: 'Form fields', next: 'Next button', earlier: 'Earlier-figure note', skip: 'Optional sections', words: 'Step buttons', hint: 'Hint text' },
  defects: MK([
    ['tinyHelp', 'help', 'text', 'Help text in 8 px type', W.text],
    ['greyHint', 'hint', 'contrast', 'Hint text in pale grey', W.contrast],
    ['emolument', 'jargon', 'realworld', 'Field labelled “Taxable emolument per fiscal epoch”', W.real],
    ['field14', 'alert', 'errors', 'Message reads “Field 14b invalid”', W.err],
    ['noProgress', 'progress', 'status', 'No step count, progress bar or saved indicator', W.stat],
    ['noBack', 'back', 'control', 'No way back, and the session expires without warning', 'Users must be able to step back and keep their work.'],
    ['submit', 'danger', 'prevention', '“Submit final return” beside “Save draft”, no confirm', W.prev],
    ['redOnly', 'req', 'color', 'Required fields shown only by a red edge', W.color],
    ['sixty', 'many', 'minimal', 'Sixty fields on a single page', W.min],
    ['tinyNext', 'next', 'target', 'Next button is 16 px high', W.target],
    ['recall', 'earlier', 'recognition', 'Asks you to “re-enter the figure from page 2”', 'Show earlier answers; do not make users recall them.'],
    ['noSkip', 'skip', 'flexibility', 'No way to skip optional sections or restore defaults', W.flex],
    ['stepWords', 'words', 'consistency', 'Next, Continue and Proceed used for one action', 'The house style says “Next”.'],
    ['tabOrder', 'form', 'keyboard', 'Tab order jumps around the form', W.tab]
  ]),
  build: h => {
    const ti = n => (h('tabOrder') ? ` tabindex="${n}"` : '');
    const rows = Array.from({ length: h('sixty') ? 24 : 3 }, (_, i) => `<span style="display:inline-block;margin:1px 4px 1px 0;font-size:12px">F${i + 1} <input style="width:34px"></span>`).join('');
    return `<div class="m-card" data-region="form">
      <h2 data-region="title">Your tax return</h2>
      <p data-region="progress" style="font-size:13px">${h('noProgress') ? '' : 'Step 3 of 6 <progress value="50" max="100" style="width:100px"></progress> · Saved 14:02'}</p>
      <div data-region="jargon"><label for="tx">${h('emolument') ? 'Taxable emolument per fiscal epoch' : 'Yearly income'}</label><input id="tx"${ti(1)}></div>
      <div data-region="req"><label for="tr">Tax number ${h('redOnly') ? '' : '* <small>(required)</small>'}</label><input id="tr" class="${h('redOnly') ? 'invalid' : ''}"${ti(2)}></div>
      <p data-region="help" style="font-size:${h('tinyHelp') ? 8 : 13}px">Enter the amount before deductions.</p>
      <p data-region="hint" style="font-size:13px;color:${h('greyHint') ? '#c4c4c4' : '#4a5560'}">Your tax number is on your last letter.</p>
      <p data-region="earlier" style="font-size:13px">${h('recall') ? 'Re-enter the figure from page 2.' : 'The figure from page 2 is 12,400 cr. Change it if it is wrong.'}</p>
      <div data-region="many">${rows}</div>
      <p data-region="words" style="font-size:13px">${h('stepWords') ? 'Next · Continue · Proceed: all the same.' : 'Use “Next” to move on.'}</p>
      <p data-region="skip" style="font-size:13px">${h('noSkip') ? '' : '<a href="#" class="m-link">Skip optional sections</a> · <a href="#" class="m-link">Restore defaults</a>'}</p>
      <div class="m-alert" data-region="alert">${h('field14') ? 'Field 14b invalid' : 'The deduction on line 14 must be less than your income. Check the figure.'}</div>
      <div style="display:flex;gap:14px;align-items:center;margin-top:8px"><span data-region="back">${h('noBack') ? '' : '<a href="#" class="m-link">◀ Back</a>'}</span><span data-region="next">${h('tinyNext') ? tinyB('Next', ti(3), 40) : `<button class="m-btn"${ti(3)}>Next</button>`}</span></div>
      <div data-region="danger" style="display:flex;gap:${h('submit') ? 2 : 22}px;margin-top:8px"><button class="m-btn s secondary"${ti(4)}>Save draft</button>${h('submit') ? danger('Submit final return') : '<a href="#" class="m-link" style="align-self:center">Submit return…</a>'}</div></div>`;
  }
};

/* ───────────────────── 11h. A wider harbor: declarative interfaces (pharmacy, flights, recipes, thermostat, parking, library, grades, hotel) ─────────────────────
   defTpl builds a template from parts: P(region, label, okHtml, [faults]). A fault replaces the part’s html with its “bad” version. */
const BADS = { tiny: ok => `<span class="bad-tiny">${ok}</span>`, grey: ok => `<span class="bad-grey">${ok}</span>` };
const TB = (t, w = 40) => `<button class="m-btn" style="min-height:0;height:16px;width:${w}px;padding:0;font-size:10px">${t}</button>`;
const B = (t, cls = '') => `<button class="m-btn ${cls}">${t}</button>`;
const I = (id, label, val = '') => `<label for="${id}" style="font-size:14px">${label}</label><input id="${id}" value="${val}">`;
const AL = t => `<div class="m-alert">${t}</div>`;
const NOTE = (t, st = '') => `<p style="margin:4px 0;font-size:14px;${st}">${t}</p>`;
const LK = t => `<a href="#" class="m-link">${t}</a>`;
const P = (r, label, ok, faults = [], st = '') => ({ r, label, ok, faults, st });
const F = (key, cat, label, why, bad) => ({ key, cat, label, why, bad });
const fTiny = (k, what) => F(k, 'text', `${what} in 8 px type`, W.text, BADS.tiny);
const fGrey = (k, what) => F(k, 'contrast', `${what} in pale grey`, W.contrast, BADS.grey);
const fErr = (k, msg) => F(k, 'errors', `Message reads “${msg}”`, W.err, AL(msg));
const fJar = (k, bad) => F(k, 'realworld', `Jargon: “${bad.replace(/<[^>]+>/g, '')}”`, W.real, bad);
const fNone = (k, cat, label, why) => F(k, cat, label, why, '');
const fTgt = (k, what, t, w) => F(k, 'target', `${what} is only 16 px high`, W.target, TB(t, w));
const fCons = (k, what, bad) => F(k, 'consistency', `${what}`, 'One action, one name, everywhere.', bad);
const fPrev = (k, what, bad) => F(k, 'prevention', what, W.prev, bad);
const fRec = (k, what, bad) => F(k, 'recognition', what, 'Recognition beats recall: show words and options.', bad);
const fMin = (k, what, bad) => F(k, 'minimal', what, W.min, bad);
const scramble = html => { let n = 30; return html.replace(/<(input|button|select|textarea)\b/g, (m, t) => `<${t} tabindex="${n--}"`); };
const many = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
function defTpl(id, name, url, style, kind, parts, o = {}) {
  SHIP_KIND[id] = kind;
  const regions = { form: 'Whole page (tab sequence)' }, defects = {
    tabOrder: { region: 'form', cat: 'keyboard', label: 'Tab order jumps around the page', why: W.tab }
  };
  parts.forEach(p => { regions[p.r] = p.label; p.faults.forEach(f => { defects[f.key] = { region: p.r, cat: f.cat, label: f.label, why: f.why }; }); });
  TEMPLATES[id] = {
    id, name, url, style, regions, defects,
    build: h => {
      const body = parts.map(p => {
        const f = p.faults.find(x => h(x.key));
        const inner = f ? (typeof f.bad === 'function' ? f.bad(p.ok) : f.bad) : p.ok;
        return `<div data-region="${p.r}" style="${p.st}">${inner}</div>`;
      }).join('');
      let hue = 0; for (const ch of id) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
      const col = `hsl(${hue},55%,36%)`;
      const head = `<div style="display:flex;align-items:center;gap:8px;margin:-8px -8px 12px;padding:8px;border-bottom:3px solid ${col}"><span style="width:26px;height:26px;border-radius:50%;background:${col};color:#fff;display:grid;place-items:center;font-weight:700;font-size:14px">${name[0]}</span><b style="font-size:14px;color:${col}">${name}</b></div>`;
      return `<div class="m-card" data-region="form" style="max-width:${o.w || 460}px">${head}${h('tabOrder') ? scramble(body) : body}</div>`;
    }
  };
}
const H2 = t => `<h2 style="margin:0 0 8px;font-size:21px">${t}</h2>`;
const WHY_UNDO = 'Users need a way back from a mistake.';

/* 1. pharmacy */
defTpl('pharmacy', 'MedRelay refills', 'refill.medrelay.example/order', ['The action is called “Refill” everywhere.', 'Plain words for medicines and doses.'], 'freighter', [
  P('title', 'Page title', H2('Refill a prescription')),
  P('drug', 'Medicine field', I('rx', 'Medicine'), [fJar('rxJar', I('rx', 'Active pharmaceutical ingredient designation'))]),
  P('dose', 'Dose instructions', NOTE('Take one tablet twice a day with food.'), [fTiny('doseTiny', 'Dose instructions'), fGrey('doseGrey', 'Dose instructions')]),
  P('stock', 'Stock status', NOTE('<span style="color:#1e8e3e">●</span> In stock at Quay Street pharmacy.'), [F('stockColor', 'color', 'Stock shown by coloured dots only', W.color, NOTE('<span style="color:#1e8e3e">●</span> <span style="color:#c0392b">●</span> <span style="color:#e6a700">●</span>'))]),
  P('slot', 'Pickup time', `<label style="font-size:14px">Pickup</label><select><option>Today after 14:00</option><option>Tomorrow morning</option></select>`, [fMin('slots', 'Forty-eight pickup slots in one list', `<label style="font-size:14px">Pickup</label><select>${many(48, i => `<option>Day ${1 + (i >> 3)} · ${8 + (i % 8)}:00</option>`)}</select>`)]),
  P('allergy', 'Allergy message', `<div class="m-banner">Tell us about any allergy before you pay.</div>`, [fErr('allergyErr', 'Contraindication flag 0x3F')]),
  P('refill', 'Refill button', B('Refill now'), [fTgt('refillTiny', 'Refill button', 'Refill', 48)]),
  P('cancel', 'Cancel order', NOTE(`${LK('Cancel this refill')} until it is packed.`), [fNone('noCancel', 'control', 'No way to cancel a refill once ordered', WHY_UNDO)]),
  P('wipe', 'Delete history', NOTE(`${LK('Delete medication history')} (you will be asked to confirm)`), [fPrev('wipeNow', '“Delete medication history” is a red button with no confirmation', danger('Delete medication history'))]),
  P('orders', 'Past orders', NOTE('Past: Amoxicillin 500 mg · Ibuprofen 400 mg · Vitamin D'), [fRec('orderIds', 'Past orders are only numbers: #4471, #4388, #4102', NOTE('Past: #4471 · #4388 · #4102'))]),
  P('names', 'Action names', NOTE('Press “Refill” to order again.'), [fCons('namesMix', 'Refill, Reorder and Renew used for one action', NOTE('Refill · Reorder · Renew: all the same.'))]),
  P('remind', 'Reminders', NOTE(`Remind me <select><option>3 days before</option><option>1 week before</option></select> ${LK('Reset')}`), [F('remindFixed', 'flexibility', 'Reminders are fixed and cannot be changed', W.flex, NOTE('Reminders: fixed at 3 days.'))])
]);

/* 2. flight check-in */
const seatRow = lab => many(6, i => `<span style="display:inline-block;width:34px;height:34px;margin:2px;border-radius:5px;background:${i === 2 ? '#8b95a1' : '#bfe0ff'};text-align:center;line-height:34px;font-size:13px">${lab ? (i === 2 ? '✕' : 'ABCDEF'[i]) : ''}</span>`);
defTpl('flight', 'SkyHarbor check-in', 'checkin.skyharbor.example/seat', ['Seats show a letter or a cross, never colour alone.', 'The action is called “Check in” everywhere.'], 'steamer', [
  P('title', 'Page title', H2('Check in · HX 482 to Lisbon')),
  P('pnr', 'Booking code field', I('pnr', 'Booking code (6 characters)'), [fJar('pnrJar', I('pnr', 'Passenger name record locator'))]),
  P('seat', 'Seat map', `<div>${seatRow(true)}</div>`, [F('seatColor', 'color', 'Free and taken seats differ by colour only', W.color, `<div>${seatRow(false)}</div>`)]),
  P('bag', 'Baggage fee', NOTE('Checked bag: 35 cr. Carry-on is free.'), [fTiny('bagTiny', 'Baggage fee'), fGrey('bagGrey', 'Baggage fee')]),
  P('upsell', 'Upgrade offers', NOTE(`${B('Keep my seat', 's secondary')}`), [fMin('upMany', 'Nine upgrade offers of equal weight', many(9, i => NOTE(`Offer ${i + 1}: Lounge, legroom or priority ${TB('Buy', 30)}`)))]),
  P('progress', 'Check-in progress', `<progress value="3" max="4" style="width:60%"></progress> <span style="font-size:13px">Step 3 of 4</span>`, [fNone('noProg', 'status', 'No sign of which step you are on', W.stat)]),
  P('err', 'Message', AL('That code has 6 characters. Yours has 5. Check the email we sent.'), [fErr('pnrErr', 'Error 4011: PNR_INVALID')]),
  P('pay', 'Pay button', B('Pay 35 cr'), [fTgt('payTiny', 'Pay button', 'Pay', 40)]),
  P('trip', 'Cancel trip', NOTE(`${LK('Cancel my trip')} (we will ask you to confirm)`), [fPrev('tripNow', '“Cancel trip” is a red button next to Pay with no confirmation', danger('Cancel entire trip'))]),
  P('pass', 'Boarding pass options', NOTE('Show on phone · Print · Send by email'), [fRec('passIcons', 'Boarding pass options are symbols only', NOTE('⎙ ✉ ☎'))]),
  P('change', 'Seat change', NOTE(`Seat locked. ${LK('Change seat')} until 1 hour before.`), [fNone('noChange', 'control', 'Seat is locked with no way to change it', WHY_UNDO)]),
  P('names', 'Action names', NOTE('Press “Check in” to continue.'), [fCons('namesCI', 'Check in, Check-in and Register used for one action', NOTE('Check in · Check-in · Register'))])
]);

/* 3. recipe */
defTpl('recipe', 'Slow Kettle recipes', 'recipes.slowkettle.example/shakshuka', ['Quantities use grams and millilitres.', 'Steps are numbered and short.'], 'tug', [
  P('title', 'Recipe title', H2('Shakshuka for four')),
  P('serves', 'Servings control', NOTE(`Servings: <button class="m-btn s secondary">−</button> 4 <button class="m-btn s secondary">+</button>`), [fTgt('servTiny', 'Servings buttons', '+ −', 36)]),
  P('ing', 'Ingredients', NOTE('400 g tomatoes · 4 eggs · 1 onion · 2 tsp paprika'), [fTiny('ingTiny', 'Ingredients'), fGrey('ingGrey', 'Ingredients'), fJar('ingJar', NOTE('Solanum lycopersicum 400 g · ovum 4 · allium cepa 1'))]),
  P('step', 'Method', NOTE('1. Soften the onion. 2. Add tomatoes and spice. 3. Crack in the eggs. 4. Cover for 6 minutes.'), [fMin('stepWall', 'The method is one unbroken paragraph of 600 words', `<p style="font-size:14px;margin:4px 0">${many(18, () => 'Soften the onion in a wide pan and then add the tomatoes and the spice and leave it all to simmer. ')}</p>`)]),
  P('timer', 'Timer', NOTE(`Timer: ${B('Start 6:00', 's secondary')}`), [fNone('noTimer', 'status', 'The timer shows no countdown once started', W.stat)]),
  P('heat', 'Heat marker', NOTE('<span style="color:#c0392b">■ high</span> · <span style="color:#1e8e3e">■ low</span> (hover the marker for words)'), [F('heatColor', 'color', 'Heat levels shown by colour only', W.color, NOTE('<span style="color:#c0392b">■</span> <span style="color:#1e8e3e">■</span> <span style="color:#e6a700">■</span>'))]),
  P('print', 'Print and save', NOTE(`${B('Print', 's secondary')} ${B('Save', 's secondary')}`), [fRec('printIcons', 'Print and Save are symbols only', NOTE('⎙ ♡'))]),
  P('clear', 'Clear notes', NOTE(`${LK('Clear my notes')} (asks first)`), [fPrev('clearNow', 'Notes are wiped by a red button with no confirmation', danger('Clear my notes'))]),
  P('conv', 'Unit switch', NOTE(`Units: <select><option>grams</option><option>cups</option></select> ${LK('Back to grams')}`), [F('unitsFlex', 'flexibility', 'Units can be changed but never changed back', W.flex, NOTE('Units: cups (cannot be changed back).'))]),
  P('err', 'Message', AL('No eggs found in the pantry list. Add some, or skip them.'), [fErr('pantryErr', 'Exception: NullReferenceException')]),
  P('unitsW', 'Unit wording', NOTE('All amounts in grams.'), [fCons('unitsMix', 'Grams, oz, cups and “a knob” in the same list', NOTE('400 g · 14 oz · 2 cups · a knob'))])
]);

/* 4. thermostat */
defTpl('thermo', 'WarmQuay thermostat', 'home.warmquay.example/heating', ['Temperatures in °C, one decimal.', 'Every control has a word label.'], 'barge', [
  P('title', 'Page title', H2('Living room')),
  P('now', 'Current temperature', `<p style="font-size:34px;margin:2px 0">19.5 °C</p>`, [fGrey('nowGrey', 'Temperature'), fTiny('nowTiny', 'Temperature')]),
  P('dial', 'Target controls', NOTE(`Target: ${B('−', 's secondary')} 21.0 ${B('+', 's secondary')}`), [fTgt('dialTiny', 'Plus and minus buttons', '− +', 36)]),
  P('mode', 'Mode', NOTE(`Mode: <select><option>Comfort</option><option>Away</option></select>`), [fJar('modeJar', NOTE('Mode: <select><option>Setpoint hysteresis A</option></select>'))]),
  P('sched', 'Schedule', NOTE('Weekdays 06:30 – 08:00 · 17:00 – 22:30'), [fMin('schedMany', 'Forty schedule slots of equal weight', many(14, i => NOTE(`Slot ${i + 1}: 0${i % 10}:00 – 0${(i % 10) + 1}:30`)))]),
  P('state', 'Heating state', NOTE('<span style="color:#c0392b">▲</span> Heating now'), [F('stateColor', 'color', 'Heating and cooling shown by red and blue only', W.color, NOTE('<span style="color:#c0392b">●</span> <span style="color:#2b6cb0">●</span>'))]),
  P('save', 'Applying', NOTE('Changes apply within a minute.'), [fNone('noApply', 'status', 'Changes apply with no sign that anything happened', W.stat)]),
  P('vac', 'Vacation reset', NOTE(`${LK('Switch on holiday mode')} (we will check first)`), [fPrev('vacNow', '“Factory reset” sits beside the target buttons, no confirmation', danger('Factory reset'))]),
  P('hold', 'Hold', NOTE(`Holding until 18:00. ${LK('Stop holding')}`), [fNone('noHold', 'control', 'A hold cannot be cancelled until it expires', WHY_UNDO)]),
  P('icons', 'Room tabs', NOTE('Living room · Kitchen · Bedroom'), [fRec('roomIcons', 'Rooms are shown as symbols only', NOTE('⌂ ♨ ☾'))]),
  P('err', 'Message', AL('The boiler did not answer. Check it is switched on.'), [fErr('boilErr', 'Fault E-47 (BLR_NACK)')]),
  P('flex', 'Defaults', NOTE(`Min 16 °C · Max 24 °C ${LK('Reset limits')}`), [F('limitFix', 'flexibility', 'Limits are locked and cannot be reset', W.flex, NOTE('Min 16 °C · Max 24 °C (locked).'))])
]);

/* 5. parking kiosk */
defTpl('parking', 'QuayPark pay station', 'pay.quaypark.example/bay', ['Prices in credits per hour.', 'Press “Pay” to finish.'], 'tug', [
  P('title', 'Page title', H2('Pay for parking')),
  P('plate', 'Plate field', I('pl', 'Number plate'), [fJar('plJar', I('pl', 'Vehicle registration alphanumeric identifier'))]),
  P('time', 'Time chooser', NOTE(`Time: ${B('−', 's secondary')} 2 hours ${B('+', 's secondary')}`), [fTgt('timeTiny', 'Time buttons', '− +', 36)]),
  P('price', 'Price', `<p style="font-size:22px;margin:4px 0">Total: 3.60 cr</p>`, [fTiny('priceTiny', 'Price'), fGrey('priceGrey', 'Price')]),
  P('zone', 'Zone', NOTE('Zone B · Bay 14'), [fMin('zoneMany', 'Thirty-two zones in one list', `<select>${many(32, i => `<option>Zone ${String.fromCharCode(65 + (i % 26))}${i > 25 ? 2 : ''}</option>`)}</select>`)]),
  P('err', 'Message', AL('That plate is not valid. Check the letters and try again.'), [fErr('plErr', 'Error 0xA3: PLATE_FMT')]),
  P('card', 'Card reader', NOTE('Insert or tap your card below.'), [fNone('noCard', 'status', 'No sign that the card was read or is being checked', W.stat)]),
  P('pay', 'Pay button', B('Pay 3.60 cr'), [fTgt('payTiny', 'Pay button', 'Pay', 40)]),
  P('abort', 'Cancel', NOTE(`${LK('Cancel and return card')}`), [fNone('noAbort', 'control', 'No Cancel once the card is inserted', WHY_UNDO)]),
  P('reset', 'Start over', NOTE(`${LK('Start over')} (asks first)`), [fPrev('resetNow', '“Start over” is a red button beside Pay with no confirmation', danger('Start over'))]),
  P('receipt', 'Receipt options', NOTE('Print a receipt · Email a receipt'), [fRec('rcptIcons', 'Receipt options are symbols only', NOTE('⎙ ✉'))]),
  P('lang', 'Language', NOTE(`Language: <select><option>English</option><option>Español</option></select>`), [F('langFix', 'flexibility', 'Language can be changed once and never back', W.flex, NOTE('Language: Español (cannot be changed back).'))]),
  P('wording', 'Wording', NOTE('Every step says “Pay”.'), [fCons('wordsMix', 'Pay, Purchase, Settle and Confirm used for one action', NOTE('Pay · Purchase · Settle · Confirm'))])
]);

/* 6. library */
defTpl('library', 'Lanternlight library', 'catalogue.lanternlight.example/search', ['Item types have words, not only icons.', 'The action is called “Borrow” everywhere.'], 'sail', [
  P('title', 'Page title', H2('Find a book')),
  P('search', 'Search field', I('q', 'Title, author or subject'), [fJar('qJar', I('q', 'Bibliographic descriptor or ISBN-13 token'))]),
  P('result', 'Result', NOTE('<b>The Lamp-Lighter’s Almanac</b> · A. Ferro · 2019 · Available'), [fTiny('resTiny', 'Result details'), fGrey('resGrey', 'Result details')]),
  P('avail', 'Availability', NOTE('<span style="color:#1e8e3e">●</span> Available at Quay Branch'), [F('availColor', 'color', 'Available and on loan differ by dot colour only', W.color, NOTE('<span style="color:#1e8e3e">●</span> <span style="color:#c0392b">●</span>'))]),
  P('format', 'Format list', NOTE('Format: Book · Large print · Audio'), [fMin('fmtMany', 'Twenty-four format filters of equal weight', many(24, i => `<label style="display:inline-block;margin-right:6px;font-size:13px"><input type="checkbox"> F${i + 1}</label>`))]),
  P('hold', 'Hold button', B('Borrow'), [fTgt('holdTiny', 'Borrow button', 'Borrow', 48)]),
  P('renew', 'Renewal', NOTE(`${LK('Renew')} for 14 days`), [fNone('noRenew', 'control', 'No way to renew or return early once borrowed', WHY_UNDO)]),
  P('card', 'Library card', NOTE(`${LK('Remove my card')} (asks first)`), [fPrev('cardNow', '“Remove my card” is a red button with no confirmation', danger('Remove my card'))]),
  P('err', 'Message', AL('We could not find that title. Try fewer words or check the spelling.'), [fErr('qErr', 'Query failed: zero hits (E_EMPTY)')]),
  P('load', 'Loading', NOTE('Showing 1 – 20 of 142 results.'), [fNone('noLoad', 'status', 'No count or sign that more results are loading', W.stat)]),
  P('icons', 'Item types', NOTE('Book · DVD · Magazine · Game'), [fRec('typeIcons', 'Item types are shown as symbols only', NOTE('▤ ◉ ❏ ▣'))]),
  P('names', 'Action names', NOTE('Press “Borrow” to take it home.'), [fCons('namesLib', 'Borrow, Check out, Loan and Reserve for one action', NOTE('Borrow · Check out · Loan · Reserve'))])
]);

/* 7. gradebook */
defTpl('grades', 'Tideschool gradebook', 'grades.tideschool.example/term-2', ['Grades are shown with a number and a word.', 'Plain language for every status.'], 'steamer', [
  P('title', 'Page title', H2('Term 2 · Marta Ruiz')),
  P('table', 'Grades', `<table style="font-size:14px;width:100%"><tr><td>Maths</td><td>7.4</td><td>Good</td></tr><tr><td>History</td><td>5.1</td><td>Pass</td></tr></table>`, [fTiny('tabTiny', 'The grades table'), fGrey('tabGrey', 'The grades table')]),
  P('flag', 'Status flags', NOTE('<span style="color:#1e8e3e">●</span> Maths · <span style="color:#c0392b">●</span> History'), [F('flagColor', 'color', 'Pass and at-risk shown by dot colour only', W.color, NOTE('<span style="color:#1e8e3e">●</span> Maths · <span style="color:#c0392b">●</span> History · <span style="color:#e6a700">●</span> Art'))]),
  P('gpa', 'Average', NOTE('Term average: 6.3'), [fJar('gpaJar', NOTE('Cumulative weighted ordinal aggregate: 6.3'))]),
  P('term', 'Term chooser', NOTE(`<select><option>Term 2</option><option>Term 1</option></select>`), [fMin('termMany', 'Sixty term and year options in one list', `<select>${many(60, i => `<option>Term ${(i % 3) + 1} · ${2036 - (i >> 2)}</option>`)}</select>`)]),
  P('appeal', 'Appeal a grade', NOTE(`${LK('Ask for a review')} within 7 days`), [fNone('noAppeal', 'control', 'No way to question a grade', WHY_UNDO)]),
  P('send', 'Send button', B('Send to parents'), [fTgt('sendTiny', 'Send button', 'Send', 40)]),
  P('wipe', 'Delete term', NOTE(`${LK('Delete this term')} (asks first)`), [fPrev('delNow', '“Delete this term” is red, next to Send, no confirmation', danger('Delete this term'))]),
  P('err', 'Message', AL('Marks must be between 0 and 10. Please check the entry.'), [fErr('markErr', 'Validation failed: ERR_RANGE_3')]),
  P('saved', 'Saved state', NOTE('Saved 2 minutes ago.'), [fNone('noSaved', 'status', 'No sign that marks were saved', W.stat)]),
  P('icons', 'Subjects', NOTE('Maths · History · Art · Music'), [fRec('subjIcons', 'Subjects are shown as symbols only', NOTE('∑ ⌛ ✎ ♪'))]),
  P('scale', 'Marking scale', NOTE(`Scale: <select><option>0–10</option><option>A–F</option></select> ${LK('Back to 0–10')}`), [F('scaleFix', 'flexibility', 'Scale can be switched but not switched back', W.flex, NOTE('Scale: A–F (cannot be changed back).'))])
]);

/* 8. hotel */
defTpl('hotel', 'Seabreeze hotels', 'stay.seabreeze.example/rooms', ['Prices include tax and are per night.', 'The action is called “Book” everywhere.'], 'gala', [
  P('title', 'Page title', H2('Choose your room')),
  P('dates', 'Date fields', `<div>${I('d1', 'Check-in')}${I('d2', 'Check-out')}</div>`, [fJar('datesJar', `<div>${I('d1', 'Temporal ingress parameter')}${I('d2', 'Temporal egress parameter')}</div>`)]),
  P('price', 'Price', `<p style="font-size:22px;margin:4px 0">96 cr per night, tax included</p>`, [fTiny('prTiny', 'Price'), fGrey('prGrey', 'Price'), F('prHidden', 'realworld', 'Price shown without tax or fees until the last step', 'Say what the user will pay, in words they know.', `<p style="font-size:22px;margin:4px 0">from 60 cr</p>`)]),
  P('rooms', 'Room list', NOTE('Sea view · Garden · Courtyard'), [fMin('roomMany', 'Thirty room types of equal weight', many(30, i => NOTE(`Room type ${i + 1} · ${60 + i} cr`)))]),
  P('left', 'Availability', NOTE('<span style="color:#c0392b">●</span> Only 2 rooms left'), [F('leftColor', 'color', 'Low availability shown by colour only', W.color, NOTE('<span style="color:#c0392b">●</span>'))]),
  P('book', 'Book button', B('Book this room'), [fTgt('bookTiny', 'Book button', 'Book', 40)]),
  P('cancel', 'Cancellation', NOTE('Free cancellation until 48 hours before.'), [fNone('noCancel', 'control', 'No way to cancel or change a booking', WHY_UNDO)]),
  P('wipe', 'Clear trip', NOTE(`${LK('Clear my trip')} (asks first)`), [fPrev('clrNow', '“Clear my trip” is a red button beside Book, no confirmation', danger('Clear my trip'))]),
  P('err', 'Message', AL('Check-out must be after check-in. Pick a later date.'), [fErr('dateErr', 'Exception: DATE_RANGE_NEGATIVE')]),
  P('wait', 'Search status', NOTE('34 rooms found.'), [fNone('noWait', 'status', 'Searching shows nothing: no spinner, no count', W.stat)]),
  P('amen', 'Amenities', NOTE('Wi-Fi · Parking · Breakfast · Pool'), [fRec('amenIcons', 'Amenities are shown as symbols only', NOTE('⌁ ▣ ☕ ≈'))]),
  P('names', 'Action names', NOTE('Press “Book” to reserve.'), [fCons('namesBook', 'Book, Reserve, Secure and Purchase for one action', NOTE('Book · Reserve · Secure · Purchase'))])
], { w: 480 });

/* ───────────────────── 11i. More harbor: delivery, rides, language app, meditation, jobs, ballot, trading, fitness ───────────────────── */

/* 1. food delivery */
defTpl('delivery', 'Gullwing food delivery', 'order.gullwing.example/cart', ['Prices include delivery.', 'The action is called “Order” everywhere.'], 'tug', [
  P('title', 'Page title', H2('Your order · Noodle Quay')),
  P('items', 'Items', NOTE('2 × Spicy noodles 9.50 cr · 1 × Green tea 2.00 cr'), [fTiny('itemTiny', 'Items'), fGrey('itemGrey', 'Items')]),
  P('spice', 'Spice level', NOTE('Spice: <span style="color:#1e8e3e">mild</span> · <span style="color:#c0392b">hot</span> · medium'), [F('spiceColor', 'color', 'Spice level shown by colour only', W.color, NOTE('<span style="color:#1e8e3e">●</span> <span style="color:#e6a700">●</span> <span style="color:#c0392b">●</span>'))]),
  P('tip', 'Tip', NOTE(`Tip the courier: ${B('1 cr', 's secondary')} ${B('2 cr', 's secondary')} ${B('Other', 's secondary')}`), [F('tipPre', 'prevention', 'A 25% tip is pre-selected and easy to miss', 'Do not pre-select costly options without a clear sign.', NOTE('Tip the courier: <b>25% (4.88 cr) selected</b>'))]),
  P('eta', 'Delivery time', NOTE('Arrives in about 25 minutes.'), [fNone('noEta', 'status', 'No arrival time and no tracking after ordering', W.stat)]),
  P('address', 'Address field', I('ad', 'Delivery address'), [fJar('adJar', I('ad', 'Geolocated drop-off coordinate string'))]),
  P('menu', 'Menu', NOTE('Noodles · Rice · Soup · Drinks'), [fMin('menuMany', 'One hundred and twenty dishes on one page', many(24, i => `<span style="display:inline-block;width:70px;font-size:12px">Dish ${i + 1}</span>`))]),
  P('order', 'Order button', B('Order · 21.00 cr'), [fTgt('ordTiny', 'Order button', 'Order', 48)]),
  P('cancel', 'Cancel order', NOTE(`${LK('Cancel order')} within 2 minutes`), [fNone('noCancel', 'control', 'No way to cancel once the order is placed', WHY_UNDO)]),
  P('wipe', 'Empty basket', NOTE(`${LK('Empty basket')} (asks first)`), [fPrev('emptyNow', '“Empty basket” is red, beside Order, no confirmation', danger('Empty basket'))]),
  P('err', 'Message', AL('That address is outside the delivery zone. Try a closer one.'), [fErr('adErr', 'Error 422: GEO_OUT_OF_BOUNDS')]),
  P('icons', 'Diet filters', NOTE('Vegan · Gluten-free · Nut-free'), [fRec('dietIcons', 'Diet filters are symbols only', NOTE('✿ ⌀ ◌'))]),
  P('names', 'Action names', NOTE('Press “Order” to finish.'), [fCons('namesOrd', 'Order, Purchase, Place and Submit for one action', NOTE('Order · Purchase · Place · Submit'))])
]);

/* 2. ride hailing */
defTpl('ride', 'Tidecab rides', 'ride.tidecab.example/request', ['Fares include tax.', 'The action is called “Request” everywhere.'], 'sail', [
  P('title', 'Page title', H2('Where to?')),
  P('pickup', 'Pickup field', I('pk', 'Pick-up point', 'Quay Street 12'), [fJar('pkJar', I('pk', 'Origin waypoint (geohash)'))]),
  P('fare', 'Fare', `<p style="font-size:24px;margin:4px 0">Fare: 8.40 cr</p>`, [fTiny('fareTiny', 'Fare'), fGrey('fareGrey', 'Fare'), F('fareVague', 'realworld', 'Fare shown as “1.4×” with no amount', 'Say what the user will pay, in plain terms.', `<p style="font-size:24px;margin:4px 0">1.4×</p>`)]),
  P('car', 'Car types', NOTE('Standard · Large · Accessible'), [fMin('carMany', 'Fourteen car types of equal weight', many(14, i => NOTE(`Type ${i + 1} · ${5 + i} cr`)))]),
  P('driver', 'Driver status', NOTE('<span style="color:#1e8e3e">●</span> Driver 3 minutes away'), [F('drvColor', 'color', 'Driver status by dot colour only', W.color, NOTE('<span style="color:#1e8e3e">●</span> <span style="color:#c0392b">●</span>'))]),
  P('wait', 'Waiting', NOTE('Looking for a driver…'), [fNone('noWait', 'status', 'Nothing shows while it looks for a driver', W.stat)]),
  P('req', 'Request button', B('Request ride'), [fTgt('reqTiny', 'Request button', 'Request', 52)]),
  P('cancel', 'Cancel ride', NOTE(`${LK('Cancel ride')} (free for 2 minutes)`), [fNone('noCancel', 'control', 'No way to cancel a ride once requested', WHY_UNDO)]),
  P('sos', 'Report a problem', NOTE(`${LK('Report a problem')}`), [fPrev('sosNow', '“Delete trip history” sits beside Request, no confirmation', danger('Delete trip history'))]),
  P('err', 'Message', AL('We could not find that address. Check the street name or pick it on the map.'), [fErr('pkErr', 'Error: GEOCODE_NULL')]),
  P('share', 'Share options', NOTE('Share trip · Call driver · Message'), [fRec('shareIcons', 'Share, call and message are symbols only', NOTE('↗ ☎ ✉'))]),
  P('names', 'Action names', NOTE('Press “Request” to book.'), [fCons('namesReq', 'Request, Book, Hail and Order for one action', NOTE('Request · Book · Hail · Order'))])
]);

/* 3. language app */
defTpl('lang', 'Parrot language lessons', 'learn.parrot.example/lesson-12', ['Feedback always says what to do next.', 'Hearts and streaks have words beside them.'], 'sail', [
  P('title', 'Lesson title', H2('Lesson 12 · At the market')),
  P('prompt', 'Prompt', `<p style="font-size:20px;margin:4px 0">Translate: “two kilos of apples”</p>`, [fTiny('promptTiny', 'Prompt'), fGrey('promptGrey', 'Prompt')]),
  P('answer', 'Answer field', I('an', 'Your answer'), [fJar('anJar', I('an', 'Target-language morphosyntactic rendition'))]),
  P('hearts', 'Hearts', NOTE('<span style="color:#c0392b">♥ ♥ ♥</span> 3 lives left'), [F('heartColor', 'color', 'Lives left shown by red and grey hearts only', W.color, NOTE('<span style="color:#c0392b">♥ ♥</span> <span style="color:#bbb">♥</span>'))]),
  P('right', 'Feedback', AL('Almost! It is “dos kilos de manzanas”. You wrote “kilo” without the s.'), [fErr('fbErr', 'Incorrect. (Code: MISMATCH)')]),
  P('streak', 'Streak', NOTE('Streak: 12 days'), [fNone('noStreak', 'status', 'No sign of lesson progress or the streak', W.stat)]),
  P('check', 'Check button', B('Check'), [fTgt('chkTiny', 'Check button', 'Check', 40)]),
  P('quit', 'Quit lesson', NOTE(`${LK('Quit lesson')} (progress is saved)`), [fNone('noQuit', 'control', 'No way to leave a lesson without losing everything', WHY_UNDO)]),
  P('reset', 'Reset course', NOTE(`${LK('Reset course')} (asks first)`), [fPrev('resetNow', '“Reset my course” is red, beside Check, no confirmation', danger('Reset my course'))]),
  P('skills', 'Skill list', NOTE('Food · Travel · Family · Work'), [fMin('skillMany', 'Ninety skills shown at once', many(20, i => `<span style="display:inline-block;width:60px;font-size:12px">Skill ${i + 1}</span>`))]),
  P('icons', 'Skill icons', NOTE('Food · Travel · Family · Work'), [fRec('skIcons', 'Skills are symbols only', NOTE('☕ ✈ ♥ ⚒'))]),
  P('speed', 'Speed', NOTE(`Speech speed: <select><option>Normal</option><option>Slow</option></select> ${LK('Back to normal')}`), [F('speedFix', 'flexibility', 'Speed can be slowed but not set back', W.flex, NOTE('Speech speed: slow (cannot be changed back).'))]),
  P('names', 'Action names', NOTE('Press “Check” to see if you are right.'), [fCons('namesChk', 'Check, Submit, Verify and Grade for one action', NOTE('Check · Submit · Verify · Grade'))])
]);

/* 4. meditation */
defTpl('calm', 'Stillwater meditation', 'calm.stillwater.example/session', ['Timers show minutes and seconds.', 'Calm colours, readable text.'], 'barge', [
  P('title', 'Page title', H2('Ten quiet minutes')),
  P('timer', 'Timer', `<p style="font-size:38px;margin:2px 0">10:00</p>`, [fGrey('timerGrey', 'Timer'), fTiny('timerTiny', 'Timer')]),
  P('breath', 'Breathing guide', NOTE('<span style="color:#2b6cb0">◯ breathe in</span> · <span style="color:#1e8e3e">◯ breathe out</span>'), [F('breathColor', 'color', 'In and out shown by blue and green circles only', W.color, NOTE('<span style="color:#2b6cb0">◯</span> <span style="color:#1e8e3e">◯</span>'))]),
  P('bell', 'Bell setting', NOTE(`Bell: <select><option>Soft</option><option>Loud</option></select>`), [fJar('bellJar', NOTE('Bell: <select><option>Tibetan resonant idiophone</option></select>'))]),
  P('start', 'Start button', B('Begin'), [fTgt('startTiny', 'Begin button', 'Begin', 40)]),
  P('pause', 'Pause', NOTE(`${LK('Pause')} · ${LK('End session')}`), [fNone('noPause', 'control', 'No way to pause or stop a session once begun', WHY_UNDO)]),
  P('prog', 'Session progress', NOTE('Session 3 of 7 this week'), [fNone('noProg', 'status', 'No sign of time left once it starts', W.stat)]),
  P('lib', 'Session library', NOTE('Sleep · Focus · Calm · Walk'), [fMin('libMany', 'Two hundred sessions listed at once', many(24, i => `<span style="display:inline-block;width:70px;font-size:12px">Session ${i + 1}</span>`))]),
  P('wipe', 'Delete journal', NOTE(`${LK('Delete my journal')} (asks first)`), [fPrev('wipeNow', '“Delete journal” is red, beside Begin, no confirmation', danger('Delete my journal'))]),
  P('err', 'Message', AL('Your session could not be saved. Check your connection and try again.'), [fErr('saveErr', 'Error 0x1F: SYNC_ABORT')]),
  P('icons', 'Mood buttons', NOTE('Calm · Tired · Anxious · Happy'), [fRec('moodIcons', 'Mood buttons are symbols only', NOTE('☺ ☹ ☁ ☀'))]),
  P('names', 'Action names', NOTE('Press “Begin” to start.'), [fCons('namesBeg', 'Begin, Start, Commence and Go for one action', NOTE('Begin · Start · Commence · Go'))])
]);

/* 5. job application */
defTpl('job', 'Lighthouse careers', 'jobs.lighthouse.example/apply', ['Required fields are marked with words, not only colour.', 'The action is called “Apply” everywhere.'], 'freighter', [
  P('title', 'Page title', H2('Apply · Harbour clerk')),
  P('name', 'Name field', I('nm', 'Full name (required)'), [fJar('nmJar', I('nm', 'Legal nomenclature of applicant'))]),
  P('req', 'Required marker', NOTE('Fields marked “required” must be filled in.'), [F('reqColor', 'color', 'Required fields marked by red label colour only', W.color, NOTE('Red labels are required.'))]),
  P('salary', 'Salary question', I('sl', 'Salary expectation (optional)'), [F('salBad', 'realworld', 'Salary asked as “Remuneration delta vs. incumbent band”', W.real, I('sl', 'Remuneration delta vs. incumbent band'))]),
  P('cv', 'CV upload', NOTE(`${B('Upload CV', 's secondary')} (PDF or Word, up to 5 MB)`), [fNone('noCvStatus', 'status', 'Uploading a CV shows nothing: no bar, no tick', W.stat)]),
  P('long', 'Questions', NOTE('Three short questions.'), [fMin('longForm', 'Thirty-one questions on one page', many(14, i => `<div style="font-size:12px">Q${i + 1} <input style="width:60%"></div>`))]),
  P('apply', 'Apply button', B('Apply'), [fTgt('applyTiny', 'Apply button', 'Apply', 40)]),
  P('save', 'Save draft', NOTE(`${LK('Save as draft')} · ${LK('Withdraw application')}`), [fNone('noDraft', 'control', 'No way to save, go back or withdraw', WHY_UNDO)]),
  P('wipe', 'Delete profile', NOTE(`${LK('Delete my profile')} (asks first)`), [fPrev('wipeNow', '“Delete profile” is red, beside Apply, no confirmation', danger('Delete my profile'))]),
  P('err', 'Message', AL('Your CV is larger than 5 MB. Please compress it or choose another file.'), [fErr('cvErr', 'Upload failed: 413 (ENTITY_TOO_LARGE)')]),
  P('tiny', 'Privacy note', NOTE('We keep your data for 6 months.'), [fTiny('privTiny', 'Privacy note'), fGrey('privGrey', 'Privacy note')]),
  P('icons', 'Job filters', NOTE('Full time · Part time · Remote'), [fRec('jobIcons', 'Job filters are symbols only', NOTE('◐ ◑ ⌂'))]),
  P('names', 'Action names', NOTE('Press “Apply” to send.'), [fCons('namesApp', 'Apply, Submit, Send and Enrol for one action', NOTE('Apply · Submit · Send · Enrol'))])
]);

/* 6. ballot */
defTpl('ballot', 'Harbor referendum ballot', 'vote.halcyon.example/ballot', ['Review before you cast.', 'Neutral wording, large type.'], 'gala', [
  P('title', 'Ballot title', H2('Referendum: a new footbridge')),
  P('question', 'Question', NOTE('Should the council build a footbridge across the harbor?'), [fTiny('qTiny', 'The question'), fGrey('qGrey', 'The question'), F('qLoaded', 'realworld', 'Question uses loaded wording and a double negative', 'Use neutral words the voter knows.', NOTE('Should the council not refuse to cancel the failed footbridge scheme?'))]),
  P('choice', 'Choices', NOTE('<label><input type="radio" name="b"> Yes</label> <label><input type="radio" name="b"> No</label> <label><input type="radio" name="b"> Blank</label>'), [F('choiceColor', 'color', 'Yes and No differ by green and red only', W.color, NOTE('<span style="color:#1e8e3e">◯</span> <span style="color:#c0392b">◯</span> <span style="color:#888">◯</span>'))]),
  P('review', 'Review step', NOTE('You will see a summary before your vote is cast.'), [fNone('noReview', 'prevention', 'The vote is cast the moment you choose: no review step', 'Add a review step before an irreversible action.')]),
  P('cast', 'Cast button', B('Cast my vote'), [fTgt('castTiny', 'Cast button', 'Cast', 40)]),
  P('change', 'Change vote', NOTE(`${LK('Change my answer')} until you press Cast`), [fNone('noChange', 'control', 'No way to change an answer before casting', WHY_UNDO)]),
  P('status', 'Progress', NOTE('Step 2 of 3'), [fNone('noStep', 'status', 'No sign of step or whether the vote was received', W.stat)]),
  P('err', 'Message', AL('You can pick only one answer. Please change your choice.'), [fErr('voteErr', 'Invalid ballot: 0xBAD')]),
  P('help', 'Help text', NOTE('Need help? Ask a volunteer or press Help.'), [fJar('helpJar', NOTE('Initiate an adjudication-assist protocol.'))]),
  P('ref', 'Other ballots', NOTE('Footbridge · Lamp oil tax · Market hours'), [fMin('refMany', 'Forty referendums on one page', many(24, i => `<span style="display:inline-block;width:70px;font-size:12px">Item ${i + 1}</span>`))]),
  P('icons', 'Accessibility', NOTE('Larger text · High contrast · Read aloud'), [fRec('accIcons', 'Accessibility options are symbols only', NOTE('A+ ◐ ♪'))]),
  P('names', 'Action names', NOTE('Press “Cast” to vote.'), [fCons('namesCast', 'Cast, Submit, Confirm and Finish for one action', NOTE('Cast · Submit · Confirm · Finish'))])
]);

/* 7. trading */
defTpl('trade', 'Anchor trading desk', 'trade.anchor.example/ticket', ['Prices in credits.', 'The action is called “Buy” everywhere.'], 'steamer', [
  P('title', 'Page title', H2('Order ticket · LAMP')),
  P('price', 'Price', `<p style="font-size:28px;margin:2px 0">42.80 cr</p>`, [fGrey('priceGrey', 'Price'), fTiny('priceTiny', 'Price')]),
  P('change', 'Day change', NOTE('<span style="color:#1e8e3e">▲ +1.2%</span> today'), [F('changeColor', 'color', 'Up and down shown by green and red only', W.color, NOTE('<span style="color:#1e8e3e">1.2%</span> <span style="color:#c0392b">0.4%</span>'))]),
  P('qty', 'Quantity field', I('qy', 'Number of shares'), [fJar('qyJar', I('qy', 'Notional exposure quantum'))]),
  P('type', 'Order type', NOTE(`Order type: <select><option>Market</option><option>Limit</option></select>`), [fMin('typeMany', 'Twenty-six order types in one list', `<select>${many(26, i => `<option>Order type ${i + 1}</option>`)}</select>`)]),
  P('review', 'Review', NOTE('You will see the cost before you confirm.'), [fNone('noReview', 'prevention', 'Money moves the moment you press Buy: no review step', 'Add a review step for irreversible actions.')]),
  P('buy', 'Buy button', B('Buy'), [fTgt('buyTiny', 'Buy button', 'Buy', 40)]),
  P('cancel', 'Cancel order', NOTE(`${LK('Cancel open order')}`), [fNone('noCancel', 'control', 'No way to cancel an open order', WHY_UNDO)]),
  P('sell', 'Sell all', NOTE(`${LK('Sell everything')} (asks first)`), [fPrev('sellNow', '“Sell everything” is red, beside Buy, no confirmation', danger('Sell everything'))]),
  P('status', 'Order status', NOTE('Order filled at 09:41.'), [fNone('noStatus', 'status', 'No sign whether the order was filled', W.stat)]),
  P('err', 'Message', AL('You do not have enough cash for that. Try fewer shares.'), [fErr('cashErr', 'Error 51: INSUFFICIENT_BP')]),
  P('icons', 'Chart tools', NOTE('Zoom · Draw · Compare'), [fRec('chartIcons', 'Chart tools are symbols only', NOTE('⊕ ✎ ⇄'))]),
  P('names', 'Action names', NOTE('Press “Buy” to place the order.'), [fCons('namesBuy', 'Buy, Purchase, Go long and Acquire for one action', NOTE('Buy · Purchase · Go long · Acquire'))])
]);

/* 8. fitness */
defTpl('fit', 'Strider fitness log', 'log.strider.example/today', ['Distances in km.', 'The action is called “Save” everywhere.'], 'ferry', [
  P('title', 'Page title', H2('Today’s run')),
  P('dist', 'Distance', `<p style="font-size:30px;margin:2px 0">6.4 km</p>`, [fGrey('distGrey', 'Distance'), fTiny('distTiny', 'Distance')]),
  P('zones', 'Heart zones', NOTE('<span style="color:#1e8e3e">Easy</span> · <span style="color:#8a5a00">Steady</span> · <span style="color:#c0392b">Hard</span>'), [F('zoneColor', 'color', 'Heart zones shown by colour only', W.color, NOTE('<span style="color:#1e8e3e">▮</span><span style="color:#e6a700">▮</span><span style="color:#c0392b">▮</span>'))]),
  P('goal', 'Goal field', I('gl', 'Weekly goal (km)'), [fJar('glJar', I('gl', 'Kilometric periodisation target'))]),
  P('goals', 'Goals', NOTE('Distance · Pace · Streak'), [fMin('goalMany', 'Sixty badges and goals on one page', many(24, i => `<span style="display:inline-block;width:62px;font-size:12px">Badge ${i + 1}</span>`))]),
  P('sync', 'Sync status', NOTE('Synced with your watch 2 minutes ago.'), [fNone('noSync', 'status', 'No sign whether the watch synced', W.stat)]),
  P('save', 'Save button', B('Save run'), [fTgt('saveTiny', 'Save button', 'Save', 40)]),
  P('edit', 'Edit run', NOTE(`${LK('Edit run')} · ${LK('Undo last edit')}`), [fNone('noEdit', 'control', 'No way to undo an edit to a run', WHY_UNDO)]),
  P('wipe', 'Delete history', NOTE(`${LK('Delete all runs')} (asks first)`), [fPrev('wipeNow', '“Delete all runs” is red, beside Save, no confirmation', danger('Delete all runs'))]),
  P('err', 'Message', AL('The distance looks too long for that time. Check the time or distance.'), [fErr('distErr', 'Validation error 12: OUT_OF_RANGE')]),
  P('icons', 'Run types', NOTE('Run · Walk · Ride · Swim'), [fRec('runIcons', 'Run types are symbols only', NOTE('➤ ☰ ⚙ ≈'))]),
  P('units', 'Units', NOTE(`Units: <select><option>km</option><option>miles</option></select> ${LK('Back to km')}`), [F('unitFix', 'flexibility', 'Units can be changed but not changed back', W.flex, NOTE('Units: miles (cannot be changed back).'))]),
  P('names', 'Action names', NOTE('Press “Save” to keep it.'), [fCons('namesSave', 'Save, Store, Log and Commit for one action', NOTE('Save · Store · Log · Commit'))])
]);

/* ───────────────────── 11j. More harbor: podcast, civic office, weather alerts, triage, photo editor, concert tickets, cookie consent, two-step sign-in ───────────────────── */

/* 1. podcast */
defTpl('podcast', 'Foghorn podcasts', 'listen.foghorn.example/ep-212', ['Controls have words as well as icons.', 'Time is shown as minutes and seconds.'], 'barge', [
  P('title', 'Episode title', H2('Ep. 212 · The tide that waited')),
  P('seek', 'Progress bar', `<div style="height:10px;background:#d8dee6;border-radius:5px"><div style="width:38%;height:10px;background:#1a4d8f;border-radius:5px"></div></div><p style="font-size:13px;margin:4px 0">18:42 of 49:10</p>`, [F('noTime', 'status', 'The progress bar shows no time played or left', W.stat, `<div style="height:10px;background:#d8dee6;border-radius:5px"><div style="width:38%;height:10px;background:#1a4d8f;border-radius:5px"></div></div>`)]),
  P('skip', 'Skip buttons', NOTE(`${B('− 15 s', 's secondary')} ${B('Play', 's')} ${B('+ 30 s', 's secondary')}`), [fTgt('skipTiny', 'Skip and play buttons', '◂ ▸', 40), fRec('skipIcons', 'Skip and play are symbols only', NOTE('⏪ ▶ ⏩'))]),
  P('speed', 'Speed button', NOTE(`Speed: ${B('1.0×', 's secondary')} ${LK('Back to 1.0×')}`), [F('speedFix', 'flexibility', 'Speed can be changed but never set back to normal', W.flex, NOTE('Speed: 1.8× (cannot be reset).'))]),
  P('sleep', 'Sleep timer', NOTE('Sleep timer: <select><option>Off</option><option>15 min</option><option>30 min</option></select>'), [fNone('noSleepStatus', 'status', 'No sign that the sleep timer is on or how long is left', W.stat), fJar('sleepJar', NOTE('Sleep timer: <select><option>Cease playback after temporal threshold</option></select>'))]),
  P('notes', 'Show notes', NOTE('In this episode: the old tide tables, a lamp keeper, and a very slow ferry.'), [fTiny('notesTiny', 'Show notes'), fGrey('notesGrey', 'Show notes')]),
  P('list', 'Episode list', NOTE('Ep. 212 · Ep. 211 · Ep. 210'), [fMin('listMany', 'Four hundred episodes with no grouping', many(24, i => `<span style="display:inline-block;width:70px;font-size:12px">Ep. ${212 - i}</span>`))]),
  P('dl', 'Download', NOTE(`${B('Download', 's secondary')} 38 MB`), [fNone('noDl', 'status', 'Downloading shows no bar, size or finish', W.stat)]),
  P('unsub', 'Unsubscribe', NOTE(`${LK('Unsubscribe')} (asks first)`), [fPrev('unsubNow', '“Unsubscribe and delete downloads” is red, beside Play, no confirmation', danger('Unsubscribe and delete downloads'))]),
  P('ads', 'Ad break', NOTE('Ad break · 30 s · you can skip in 5 s'), [fNone('noSkipAd', 'control', 'The ad cannot be skipped or paused', 'Users must always be able to get out.')]),
  P('err', 'Message', AL('This episode could not be played. Check your connection and press Play.'), [fErr('playErr', 'Playback error: MEDIA_ERR_SRC_NOT_SUPPORTED (4)')]),
  P('names', 'Action names', NOTE('Press “Play” to listen.'), [fCons('namesPlay', 'Play, Start, Listen and Resume for one action', NOTE('Play · Start · Listen · Resume'))])
]);

/* 2. vehicle office */
defTpl('office', 'Quay licence office', 'book.licence.halcyon.example/appointment', ['Dates are written 7 May 2036.', 'Say which documents to bring, in plain words.'], 'freighter', [
  P('title', 'Page title', H2('Book a licence appointment')),
  P('service', 'Service', NOTE(`Service: <select><option>Renew my licence</option><option>Replace a lost licence</option></select>`), [fJar('svcJar', NOTE('Service: <select><option>Credential reissuance (Class B, Annex II)</option></select>'))]),
  P('cal', 'Calendar', NOTE('Free days are ringed. Taken days are crossed out.'), [F('calColor', 'color', 'Free and taken days differ by colour only', W.color, NOTE('<span style="color:#1e8e3e">■■■</span> <span style="color:#c0392b">■■</span> <span style="color:#1e8e3e">■</span>'))]),
  P('queue', 'Queue number', NOTE('Your number: <b>B-214</b>. About 12 minutes’ wait.'), [fNone('noQueue', 'status', 'No queue number or wait time after booking', W.stat)]),
  P('docs', 'Documents list', NOTE('Bring: photo ID · proof of address · old licence'), [fTiny('docsTiny', 'The documents list'), fGrey('docsGrey', 'The documents list')]),
  P('time', 'Time slots', NOTE('09:00 · 09:15 · 09:30 · 09:45'), [fMin('slotMany', 'Ninety time slots in one list', many(30, i => `<span style="display:inline-block;width:46px;font-size:12px">${8 + (i >> 2)}:${['00', '15', '30', '45'][i % 4]}</span>`))]),
  P('book', 'Book button', B('Book appointment'), [fTgt('bookTiny', 'Book button', 'Book', 40)]),
  P('change', 'Change booking', NOTE(`${LK('Change or cancel my appointment')}`), [fNone('noChange', 'control', 'No way to change or cancel an appointment', WHY_UNDO)]),
  P('wipe', 'Delete application', NOTE(`${LK('Delete my application')} (asks first)`), [fPrev('wipeNow', '“Delete my application” is red, beside Book, no confirmation', danger('Delete my application'))]),
  P('err', 'Message', AL('We need a photo ID number with 8 digits. Yours has 7.'), [fErr('idErr', 'Error 7: FIELD_VALIDATION_FAIL')]),
  P('icons', 'Contact options', NOTE('Phone · Email · Visit'), [fRec('contactIcons', 'Contact options are symbols only', NOTE('☎ ✉ ⌂'))]),
  P('names', 'Action names', NOTE('Press “Book” to reserve a slot.'), [fCons('namesBookO', 'Book, Schedule, Reserve and Arrange for one action', NOTE('Book · Schedule · Reserve · Arrange'))]),
  P('lang', 'Language', NOTE(`<select><option>English</option><option>Español</option></select> ${LK('Back to English')}`), [F('langFixO', 'flexibility', 'Language can be changed once and never back', W.flex, NOTE('Language: Español (cannot be changed back).'))])
]);

/* 3. weather warning */
defTpl('alert', 'Beacon weather warnings', 'warn.beacon.example/storm', ['Severity has a word and a symbol, never colour alone.', 'Say what to do, in plain words.'], 'sail', [
  P('title', 'Warning title', H2('Storm warning · Harbor coast')),
  P('level', 'Severity', NOTE('<span style="background:#c0392b;color:#fff;padding:2px 8px;border-radius:3px">▲ SEVERE</span> until 18:00'), [F('levelColor', 'color', 'Severity shown by a coloured box with no word', W.color, NOTE('<span style="background:#c0392b;color:#fff;padding:2px 14px;border-radius:3px">&nbsp;&nbsp;</span> until 18:00'))]),
  P('what', 'What to do', NOTE('Stay indoors. Move boats to the inner harbor. Avoid the sea wall.'), [fTiny('whatTiny', 'The advice'), fGrey('whatGrey', 'The advice'), fJar('whatJar', NOTE('Implement shelter-in-place posture; mitigate maritime asset exposure.'))]),
  P('map', 'Area map', NOTE('Affected area: the harbor and the north shore.'), [fNone('noMapKey', 'recognition', 'The map has no key or place names', 'Recognition beats recall: label the places.')]),
  P('time', 'Updated', NOTE('Updated 14:20 · next update 15:00'), [fNone('noUpdated', 'status', 'No sign of when this was last updated', W.stat)]),
  P('ack', 'Acknowledge', B('I have read this'), [fTgt('ackTiny', 'Acknowledge button', 'Read', 40)]),
  P('mute', 'Mute alerts', NOTE(`${LK('Pause alerts for 1 hour')} · ${LK('Resume alerts')}`), [fNone('noMute', 'control', 'Alerts cannot be paused or turned back on', WHY_UNDO)]),
  P('off', 'Turn off alerts', NOTE(`${LK('Turn off all alerts')} (asks first)`), [fPrev('offNow', '“Turn off all alerts” is red, beside “I have read this”, no confirmation', danger('Turn off all alerts'))]),
  P('areas', 'Area list', NOTE('Harbor · North shore · Old town'), [fMin('areaMany', 'Two hundred areas in one list', many(24, i => `<span style="display:inline-block;width:70px;font-size:12px">Area ${i + 1}</span>`))]),
  P('err', 'Message', AL('We could not load the warning area. Try again in a minute.'), [fErr('mapErr', 'Error 503: UPSTREAM_TIMEOUT')]),
  P('icons', 'Alert types', NOTE('Wind · Rain · Flood · Heat'), [fRec('typeIcons2', 'Alert types are symbols only', NOTE('≋ ☂ ≈ ☀'))]),
  P('names', 'Action names', NOTE('Press “I have read this” to confirm.'), [fCons('namesAck', 'Acknowledge, Confirm, Dismiss and Accept for one action', NOTE('Acknowledge · Confirm · Dismiss · Accept'))])
]);

/* 4. triage form */
defTpl('triage', 'Mercy Quay triage form', 'triage.mercyquay.example/start', ['One question per screen where possible.', 'Emergency help is always visible and large.'], 'steamer', [
  P('title', 'Page title', H2('Tell us what is wrong')),
  P('emerg', 'Emergency button', `<div style="background:#c0392b;color:#fff;padding:12px;border-radius:6px;font-size:18px;text-align:center">Emergency? Call 112 now</div>`, [F('emergTiny', 'target', 'The emergency call link is small and tucked in a corner', W.target, NOTE(`<a href="#" style="font-size:9px;color:#aaa">emergency</a>`))]),
  P('pain', 'Pain scale', NOTE('Pain: 0 none · 5 moderate · 10 worst. <b>You chose 6.</b>'), [F('painColor', 'color', 'Pain scale shown by a green-to-red bar only', W.color, `<div style="height:14px;background:linear-gradient(90deg,#1e8e3e,#e6a700,#c0392b);border-radius:6px"></div>`)]),
  P('sym', 'Symptoms field', I('sy', 'What are you feeling?'), [fJar('syJar', I('sy', 'Presenting symptomatology (chief complaint)'))]),
  P('allergy', 'Allergies', NOTE('Allergies: penicillin'), [fTiny('allTiny', 'The allergies line'), fGrey('allGrey', 'The allergies line')]),
  P('qs', 'Questions', NOTE('Five short questions.'), [fMin('qMany', 'Sixty questions on one screen', many(18, i => `<div style="font-size:12px">${i + 1}. Symptom ${i + 1} <input type="checkbox"></div>`))]),
  P('next', 'Next button', B('Next'), [fTgt('nextTiny', 'Next button', 'Next', 36)]),
  P('back', 'Go back', NOTE(`${LK('Back')} · ${LK('Change an answer')}`), [fNone('noBack', 'control', 'No way to go back and change an answer', WHY_UNDO)]),
  P('wipe', 'Start again', NOTE(`${LK('Start again')} (asks first)`), [fPrev('wipeNow', '“Start again” is red, beside Next, no confirmation', danger('Start again'))]),
  P('wait', 'Wait time', NOTE('Expected wait: about 40 minutes. You are 6th in line.'), [fNone('noWait', 'status', 'No wait time or place in the queue after sending', W.stat)]),
  P('err', 'Message', AL('Please add how long you have felt this. For example “two days”.'), [fErr('durErr', 'Error: DURATION_REQUIRED (422)')]),
  P('icons', 'Body areas', NOTE('Head · Chest · Stomach · Legs'), [fRec('bodyIcons', 'Body areas are symbols only', NOTE('☺ ♥ ◎ ⫿'))]),
  P('names', 'Action names', NOTE('Press “Next” to continue.'), [fCons('namesNext', 'Next, Continue, Proceed and Advance for one action', NOTE('Next · Continue · Proceed · Advance'))])
]);

/* 5. photo editor */
defTpl('photo', 'Lantern photo editor', 'edit.lantern.example/photo-8', ['Sliders show their value as a number.', 'Edits can always be undone.'], 'tug', [
  P('title', 'Editor title', H2('Edit · harbor-sunrise.jpg')),
  P('canvas', 'Photo', `<div style="height:70px;background:linear-gradient(90deg,#f6c177,#f08a5d,#6a4c93);border-radius:6px"></div>`, [fNone('noAlt', 'recognition', 'The photo has no name, size or description shown', 'Show what the user is working on.')]),
  P('slider', 'Brightness slider', NOTE('Brightness: <input type="range"> <b>+12</b>'), [fNone('noVal', 'status', 'The slider shows no value, only the handle', W.stat)]),
  P('filters', 'Filters', NOTE('Warm · Cool · Mono · Fade'), [fMin('filtMany', 'One hundred and fifty filters in a grid', many(30, i => `<span style="display:inline-block;width:40px;height:24px;margin:1px;background:hsl(${i * 12},50%,60%)"></span>`))]),
  P('names', 'Filter names', NOTE('Filters are named: Warm, Cool, Mono, Fade.'), [fRec('filtNoNames', 'Filters are unnamed colour chips', NOTE('<span style="display:inline-block;width:30px;height:20px;background:#f6c177"></span> <span style="display:inline-block;width:30px;height:20px;background:#6ab0de"></span> <span style="display:inline-block;width:30px;height:20px;background:#999"></span>'))]),
  P('undo', 'Undo', NOTE(`${LK('Undo')} · ${LK('Redo')} · ${LK('Revert to original')}`), [fNone('noUndo', 'control', 'No undo or revert after an edit', WHY_UNDO)]),
  P('save', 'Export button', B('Export'), [fTgt('expTiny', 'Export button', 'Export', 40)]),
  P('over', 'Overwrite', NOTE('Saving makes a copy. The original stays safe.'), [fPrev('overNow', 'Export silently overwrites the original with no warning', NOTE(`Export replaces the original file. ${danger('Export')}`))]),
  P('fmt', 'File format', NOTE('Format: <select><option>JPEG (small)</option><option>PNG (sharp)</option></select>'), [fJar('fmtJar', NOTE('Format: <select><option>Lossy DCT-quantised raster</option></select>'))]),
  P('prog', 'Export progress', NOTE('Exporting… 70%'), [fNone('noExpProg', 'status', 'Exporting shows no progress and no done message', W.stat)]),
  P('err', 'Message', AL('This photo is too large to export. Try making it smaller.'), [fErr('expErr', 'Error 0xC0000005: ACCESS_VIOLATION')]),
  P('caption', 'Caption', NOTE('Sunrise over the harbor, Day 3.'), [fTiny('capTiny', 'Caption'), fGrey('capGrey', 'Caption')]),
  P('tools', 'Tool names', NOTE('Crop · Rotate · Text · Draw'), [fCons('toolMix', 'Crop, Trim and Cut for one tool', NOTE('Crop · Trim · Cut'))])
]);

/* 6. concert tickets */
defTpl('tickets', 'Bellbuoy tickets', 'tickets.bellbuoy.example/seats', ['The full price is shown from the first screen.', 'No countdown tricks.'], 'gala', [
  P('title', 'Show title', H2('The Lamp-lighters · Harbor Hall')),
  P('price', 'Price', `<p style="font-size:24px;margin:2px 0">40 cr, fees included</p>`, [F('priceFees', 'realworld', 'The price shown is 28 cr, and 12 cr of fees appear at the last step', 'Say what the user will pay, up front.', `<p style="font-size:24px;margin:2px 0">from 28 cr</p>`), fGrey('priceGrey', 'Price')]),
  P('timer', 'Countdown', NOTE('Seats held for 10:00 minutes.'), [F('timerPressure', 'prevention', 'A fast, flashing countdown rushes people into buying', 'Do not pressure users into irreversible actions.', NOTE('<b style="color:#c0392b">HURRY! 00:47 left! 14 people are looking!</b>'))]),
  P('tier', 'Ticket types', NOTE('Standing 40 cr · Seated 55 cr · Balcony 70 cr'), [fMin('tierMany', 'Twenty ticket types at one level', many(20, i => NOTE(`Type ${i + 1} · ${30 + i * 3} cr`)))]),
  P('map', 'Seat map', NOTE('Seats are labelled by row and number.'), [F('mapColor', 'color', 'Free and sold seats differ by colour only', W.color, NOTE('<span style="color:#1e8e3e">■■■</span> <span style="color:#c0392b">■■</span> <span style="color:#1e8e3e">■■</span>'))]),
  P('buy', 'Buy button', B('Buy 2 tickets'), [fTgt('buyTiny', 'Buy button', 'Buy', 40)]),
  P('hold', 'Release seats', NOTE(`${LK('Release my seats')}`), [fNone('noRelease', 'control', 'No way to release seats or step back', WHY_UNDO)]),
  P('insure', 'Insurance box', NOTE('<label><input type="checkbox"> Add ticket insurance (6 cr)</label>'), [fPrev('insPre', 'Insurance is pre-ticked and easy to miss', NOTE('<label><input type="checkbox" checked> Add ticket insurance (6 cr)</label>'))]),
  P('wait', 'Queue', NOTE('You are in the queue: place 214, about 6 minutes.'), [fNone('noQueue', 'status', 'A waiting room that shows no place or time', W.stat)]),
  P('err', 'Message', AL('Those seats have just been taken. Please pick other seats.'), [fErr('seatErr', 'Error 409: SEAT_STATE_CONFLICT')]),
  P('icons', 'Filters', NOTE('Date · Price · Distance'), [fRec('filtIcons', 'Filters are symbols only', NOTE('▦ $ ⌖'))]),
  P('names', 'Action names', NOTE('Press “Buy” to get your tickets.'), [fCons('namesTix', 'Buy, Purchase, Get and Secure for one action', NOTE('Buy · Purchase · Get · Secure'))])
]);

/* 7. cookie consent */
defTpl('consent', 'Cookie jar consent', 'jar.example/privacy', ['Accept and Decline look equally important.', 'Plain words about what is collected.'], 'junk', [
  P('title', 'Banner title', H2('We use cookies')),
  P('text', 'Banner text', NOTE('Cookies remember your settings and show you ads. You can say no.'), [fTiny('cText', 'Banner text'), fGrey('cText2', 'Banner text'), fJar('cJar', NOTE('We process pseudonymous identifiers for legitimate-interest profiling.'))]),
  P('accept', 'Accept button', B('Accept all'), [fTgt('accTiny', 'Accept button', 'Accept', 48)]),
  P('decline', 'Decline option', B('Decline all', 'secondary'), [F('declHidden', 'control', 'Declining is hidden in tiny grey text under “Manage”', 'Make the no-choice as easy as the yes-choice.', NOTE(`<a href="#" style="font-size:9px;color:#bbb">manage</a>`))]),
  P('boxes', 'Preference boxes', NOTE('<label><input type="checkbox"> Ads</label> <label><input type="checkbox"> Stats</label>'), [fPrev('boxPre', 'Every box is pre-ticked and Accept is the only big button', NOTE('<label><input type="checkbox" checked> Ads</label> <label><input type="checkbox" checked> Stats</label> <label><input type="checkbox" checked> Sharing</label>'))]),
  P('partners', 'Partners', NOTE('Partners: Harbor Ads · Gull Stats'), [fMin('partMany', 'Four hundred partners with a toggle each', many(30, i => `<label style="display:inline-block;width:70px;font-size:11px"><input type="checkbox"> P${i + 1}</label>`))]),
  P('later', 'Decide later', NOTE(`${LK('Decide later')}`), [fNone('noLater', 'control', 'No way to close the banner without choosing', WHY_UNDO)]),
  P('state', 'Saved choice', NOTE('Your choice is saved. You can change it at any time.'), [fNone('noSaved', 'status', 'No sign that the choice was saved', W.stat)]),
  P('change', 'Change choice', NOTE(`${LK('Change my choice')}`), [F('noChange', 'flexibility', 'The choice cannot be changed later', W.flex, NOTE('Your choice is final.'))]),
  P('err', 'Message', AL('We could not save your choice. Check that cookies are allowed for this page.'), [fErr('cErr', 'Error 0x80: CONSENT_PERSIST_FAIL')]),
  P('icons', 'Categories', NOTE('Needed · Stats · Ads'), [fRec('catIcons', 'Cookie categories are symbols only', NOTE('✓ ▥ ✦'))]),
  P('names', 'Action names', NOTE('Press “Accept all” or “Decline all”.'), [fCons('namesConsent', 'Accept, Agree, Allow and OK for one action', NOTE('Accept · Agree · Allow · OK'))])
]);

/* 8. two-step sign-in */
defTpl('twofa', 'Keyring two-step sign-in', 'keyring.example/verify', ['Codes are six digits.', 'The action is called “Verify” everywhere.'], 'ferry', [
  P('title', 'Page title', H2('Enter your code')),
  P('code', 'Code field', I('cd', 'Six-digit code'), [fJar('cdJar', I('cd', 'Time-based one-time password (TOTP) token'))]),
  P('timer', 'Code timer', NOTE('The code expires in 28 seconds.'), [fNone('noTimer', 'status', 'No sign of when the code expires', W.stat)]),
  P('hint', 'Hint', NOTE('Open your authenticator app and read the 6-digit code.'), [fTiny('hintTiny', 'Hint'), fGrey('hintGrey', 'Hint')]),
  P('verify', 'Verify button', B('Verify'), [fTgt('verTiny', 'Verify button', 'Verify', 40)]),
  P('resend', 'Resend code', NOTE(`${LK('Send a new code')} · ${LK('Use a backup code')}`), [fNone('noResend', 'control', 'No way to get a new code or use a backup code', WHY_UNDO)]),
  P('trust', 'Remember device', NOTE('<label><input type="checkbox"> Trust this device for 30 days</label>'), [fPrev('trustPre', '“Trust this device” is pre-ticked on a shared computer', NOTE('<label><input type="checkbox" checked> Trust this device forever</label>'))]),
  P('reset', 'Reset sign-in', NOTE(`${LK('Remove two-step sign-in')} (asks first)`), [fPrev('resetNow', '“Remove two-step sign-in” is red, beside Verify, no confirmation', danger('Remove two-step sign-in'))]),
  P('err', 'Message', AL('That code is not right. Codes change every 30 seconds, so try the newest one.'), [fErr('codeErr', 'Auth error 0x2B: TOTP_MISMATCH')]),
  P('methods', 'Methods', NOTE('App · Text message · Security key'), [fMin('methMany', 'Twenty ways to sign in on one screen', many(20, i => NOTE(`Method ${i + 1}`)))]),
  P('icons', 'Method icons', NOTE('App · Text message · Security key'), [fRec('methIcons', 'Methods are symbols only', NOTE('▣ ✉ ⚷'))]),
  P('names', 'Action names', NOTE('Press “Verify” to sign in.'), [fCons('namesVer', 'Verify, Confirm, Authenticate and Submit for one action', NOTE('Verify · Confirm · Authenticate · Submit'))])
]);
/* ───────────────────── 11k. Even more harbor: 24 generated everyday interfaces ───────────────────── */
const SPWHY = { contrast: 'Normal text needs 4.5 : 1.', text: 'At least 11 px.', realworld: 'Use words the reader knows.', recognition: 'Show what it is; do not make people remember.', consistency: 'Same thing, same name, same place.', minimal: 'Show only what is needed now.', errors: 'Say what went wrong and how to fix it.', control: 'Give users a way back.', prevention: W.prev, status: W.stat, color: W.color, target: W.target, flexibility: W.flex };
const kit = (c) => defTpl(c.id, c.name, c.url, ['The main action has one name everywhere.', 'Use words people already know.'], c.kind, [
  P('title', 'Page title', H2(c.title)),
  P('field', c.field + ' field', I('f1', c.field), [fJar('fJar', I('f1', c.jar))]),
  P('text', 'Details', NOTE(c.text), [fTiny('textTiny', 'The details'), fGrey('textGrey', 'The details')]),
  P('color', 'Status marks', NOTE('<span style="color:#1e8e3e">●</span> <b>' + c.cl.split(' shown')[0] + '</b> ok.'), [F('colorOnly', 'color', c.cl, W.color, NOTE('<span style="color:#1e8e3e">●</span> <span style="color:#c0392b">●</span> <span style="color:#e6a700">●</span>'))]),
  P('status', 'Confirmation', NOTE(c.status), [fNone('noStatus', 'status', 'No confirmation or sign of progress after the action', W.stat)]),
  P('btn', 'Main button', B(c.btn), [fTgt('btnTiny', 'Main button', c.btnShort, 40)]),
  P('cancel', 'Way back', NOTE(LK(c.cancel)), [fNone('noCancel', 'control', 'No way to undo or cancel once done', WHY_UNDO)]),
  P('wipe', 'Delete', NOTE(LK(c.wipe) + ' (asks first)'), [fPrev('wipeNow', '“' + c.wipe + '” is red beside the main button, no confirmation', danger(c.wipe))]),
  P('list', 'List of ' + c.noun + 's', NOTE('Showing your ' + c.noun + 's, newest first.'), [fMin('listMany', 'Two hundred ' + c.noun + 's in one list', many(24, i => `<span style="display:inline-block;width:70px;font-size:12px">${c.noun} ${i + 1}</span>`))]),
  P('icons', 'Categories', NOTE(c.icons), [fRec('catIcons', 'Categories are symbols only', NOTE(c.iconsBad))]),
  P('err', 'Message', AL(c.err), [fErr('errCode', c.errCode)]),
  P('names', 'Action names', NOTE('Press “' + c.names[0] + '” to continue.'), [fCons('namesMix', c.names.join(', ') + ' for one action', NOTE(c.names.join(' · ')))]),
  P('flex', c.flexWhat, NOTE(c.flexWhat + ': <select><option>Standard</option><option>Custom</option></select> ' + LK('Back to standard')), [F('flexFixed', 'flexibility', c.flexWhat + ' can be changed once and never back', W.flex, NOTE(c.flexWhat + ': custom (cannot be changed back).'))]),
  ...(c.sp ? [P('special', c.sp[0], NOTE(c.sp[1]), [F('spFault', c.sp[3], c.sp[2], SPWHY[c.sp[3]], (c.sp[3]==='text'?NOTE(`<span class="bad-tiny">${c.sp[1]}</span>`):c.sp[3]==='contrast'?NOTE(`<span class="bad-grey">${c.sp[1]}</span>`):NOTE(c.sp[4])))])] : []),
  P('predict', 'Next step', NOTE('Step 1 of 2: ' + c.field + '. Next: ' + c.btn + '. ' + B('Next', 's secondary').replace('<button','<button disabled') + ' stays grey until you finish, and says why.'), [F('noPredict', 'prediction', 'Unavailable actions vanish and the next step is never named', 'Show what is available now and what comes next.', NOTE('Fill in the form.'))]),
  P('shortcut', 'Repeat visits', NOTE('Press ' + B('Same as last time').replace('<button','<button style="font-size:12px"') + ' to reuse your last choice, or <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to send.'), [F('noShortcut', 'flexibility', 'Regular users must redo every step each time: no saved choices, no shortcuts', W.flex, NOTE('Every visit starts from scratch. No saved choices, no shortcuts, no quick way to repeat.'))])
]);
kit({"id": "bakery", "name": "Crumb & Quay bakery", "url": "order.crumbquay.example/loaf", "kind": "barge", "title": "Order bread for tomorrow", "field": "Loaf", "jar": "Artisanal fermented cereal unit", "text": "Collect from 07:00 at the Quay Street counter.", "btn": "Order loaf", "btnShort": "Order", "cancel": "Cancel this order", "wipe": "Delete my order history", "status": "Order placed. Ready tomorrow at 07:00.", "noun": "loaf", "icons": "Rye · Seeded · White", "iconsBad": "🌾 ✿ ○", "names": ["Order", "Buy", "Reserve", "Get"], "flexWhat": "Pickup time", "cl": "Stock shown by coloured dots only", "err": "We have no seeded loaves left. Pick another loaf.", "errCode": "Error 9: STOCK_NULL"});
kit({"id": "museum", "name": "Tidewater Museum tickets", "url": "tickets.tidewater.example/visit", "kind": "gala", "title": "Plan your visit", "field": "Visit date", "jar": "Temporal admission window", "text": "Open 10:00 to 17:00, last entry 16:00.", "btn": "Buy tickets", "btnShort": "Buy", "cancel": "Change my visit", "wipe": "Delete my account", "status": "Tickets sent to your email.", "noun": "exhibit", "icons": "Ship hall · Lamp room · Café", "iconsBad": "⚓ ☼ ☕", "names": ["Buy", "Book", "Get", "Reserve"], "flexWhat": "Language", "cl": "Crowd level shown by colour only", "err": "Choose a date in the future. Yours is today and we are closed.", "errCode": "Error 412: DATE_PRECOND"});
kit({"id": "gym", "name": "Anchor Gym membership", "url": "join.anchorgym.example/plan", "kind": "tug", "title": "Join the gym", "field": "Plan", "jar": "Recurring fitness subscription tier", "text": "First month 20 cr, then 30 cr a month. Cancel any time.", "btn": "Join now", "btnShort": "Join", "cancel": "Pause or cancel membership", "wipe": "Delete my membership", "status": "Welcome. Your card works from tomorrow.", "noun": "class", "icons": "Spin · Yoga · Swim", "iconsBad": "⟳ ☯ ≈", "names": ["Join", "Sign up", "Enrol", "Subscribe"], "flexWhat": "Reminder time", "cl": "Class fullness shown by colour only", "err": "Your card number has 15 digits. We need 16.", "errCode": "Error 22: PAN_LEN"});
kit({"id": "taxi", "name": "Quay Cab booking", "url": "book.quaycab.example/ride", "kind": "tug", "title": "Book a cab", "field": "Pickup", "jar": "Origin geolocation node", "text": "A cab arrives in about 6 minutes. Fare 9 cr.", "btn": "Book cab", "btnShort": "Book", "cancel": "Cancel my cab", "wipe": "Remove saved places", "status": "Cab 14 is on its way.", "noun": "saved place", "icons": "Home · Work · Harbor", "iconsBad": "⌂ ⚒ ⚓", "names": ["Book", "Hail", "Order", "Call"], "flexWhat": "Fare display", "cl": "Cab availability shown by colour only", "err": "We cannot find that address. Add a street number.", "errCode": "Error 404: GEO_NULL"});
kit({"id": "bank2", "name": "Lantern Savings transfer", "url": "online.lanternsavings.example/pay", "kind": "steamer", "title": "Send money", "field": "Recipient", "jar": "Beneficiary identifier (IBAN)", "text": "Fee: free. Arrives today before 17:00.", "btn": "Send money", "btnShort": "Send", "cancel": "Cancel this transfer", "wipe": "Delete all payees", "status": "Transfer scheduled for today.", "noun": "payee", "icons": "Ana · Landlord · Mum", "iconsBad": "♀ ⌂ ♥", "names": ["Send", "Pay", "Transfer", "Remit"], "flexWhat": "Daily limit", "cl": "Balance shown red or green only", "err": "The amount is more than your balance of 40 cr.", "errCode": "Error 51: INSUFFICIENT_FUNDS"});
kit({"id": "news", "name": "Gull Daily news app", "url": "read.gulldaily.example/today", "kind": "barge", "title": "Today’s stories", "field": "Search", "jar": "Query string parameter", "text": "Updated 14:05. Seven new stories since morning.", "btn": "Subscribe", "btnShort": "Join", "cancel": "Cancel my subscription", "wipe": "Clear reading history", "status": "Saved to your reading list.", "noun": "story", "icons": "Harbor · Weather · Sport", "iconsBad": "⚓ ☂ ⚽", "names": ["Subscribe", "Join", "Sign up", "Follow"], "flexWhat": "Text size", "cl": "Breaking news marked by colour only", "err": "We could not load the story. Try again in a minute.", "errCode": "Error 500: FETCH_FAIL"});
kit({"id": "seachat", "name": "Seabird chat", "url": "chat.seabird.example/room", "kind": "sail", "title": "Chat with the harbor team", "field": "Message", "jar": "Compose payload", "text": "Mara is online. Replies usually within 5 minutes.", "btn": "Send", "btnShort": "Send", "cancel": "Undo send", "wipe": "Delete the whole conversation", "status": "Delivered. Read at 14:21.", "noun": "chat", "icons": "Mara · Ilse · Pete", "iconsBad": "☺ ✉ ♞", "names": ["Send", "Post", "Submit", "Push"], "flexWhat": "Notification sound", "cl": "Online status shown by a dot of colour only", "err": "Your message is longer than 500 characters.", "errCode": "Error 413: PAYLOAD_LARGE"});
kit({"id": "maps", "name": "Lanternmap routes", "url": "route.lanternmap.example/walk", "kind": "sail", "title": "Plan your walk", "field": "Destination", "jar": "Terminus coordinates", "text": "Walk 14 minutes. Arrive at 14:48.", "btn": "Start route", "btnShort": "Start", "cancel": "Cancel the route", "wipe": "Delete saved routes", "status": "Route started. Follow the arrow.", "noun": "route", "icons": "Walk · Cycle · Tram", "iconsBad": "☞ ⚙ ▣", "names": ["Start", "Go", "Begin", "Navigate"], "flexWhat": "Units", "cl": "Traffic shown by colour only", "err": "We cannot find a walking route between those places.", "errCode": "Error 404: ROUTE_NULL"});
kit({"id": "bills", "name": "Hearth utilities bill", "url": "my.hearthutil.example/pay", "kind": "freighter", "title": "Pay your bill", "field": "Account number", "jar": "Remittance reference token", "text": "Due on the 28th. Late fee after 7 days.", "btn": "Pay bill", "btnShort": "Pay", "cancel": "Cancel this payment", "wipe": "Delete my account", "status": "Payment received. Thank you.", "noun": "bill", "icons": "Gas · Water · Power", "iconsBad": "♨ ≈ ⚡", "names": ["Pay", "Settle", "Remit", "Clear"], "flexWhat": "Paperless option", "cl": "Overdue shown by colour only", "err": "The account number has 8 digits. Yours has 7.", "errCode": "Error 3: ACCT_FMT"});
kit({"id": "petshop", "name": "Whisker & Tide pet shop", "url": "shop.whiskertide.example/cart", "kind": "junk", "title": "Food for your cat", "field": "Pet name", "jar": "Companion animal nomenclature", "text": "Free delivery over 20 cr, on Thursdays.", "btn": "Add to basket", "btnShort": "Add", "cancel": "Remove from basket", "wipe": "Empty my basket and wishlist", "status": "Added. Basket has 3 items.", "noun": "item", "icons": "Dry · Wet · Treats", "iconsBad": "☻ ☹ ♥", "names": ["Add", "Put", "Insert", "Place"], "flexWhat": "Delivery day", "cl": "Low stock shown by colour only", "err": "That promo code is not valid for this item.", "errCode": "Error 7: PROMO_REJ"});
kit({"id": "weddings", "name": "Garland wedding RSVP", "url": "rsvp.garland.example/yes", "kind": "gala", "title": "Will you come?", "field": "Your name", "jar": "Invitee denomination", "text": "Ceremony at 15:00. Dinner at 18:30.", "btn": "Send RSVP", "btnShort": "RSVP", "cancel": "Change my answer", "wipe": "Delete my RSVP", "status": "Thank you. We have your answer.", "noun": "guest", "icons": "Ceremony · Dinner · Dance", "iconsBad": "✝ ♨ ♫", "names": ["RSVP", "Reply", "Confirm", "Respond"], "flexWhat": "Dietary notes", "cl": "Attending status shown by colour only", "err": "Your party size must be between 1 and 4.", "errCode": "Error 6: PARTY_RANGE"});
kit({"id": "classroom", "name": "Reef Academy homework", "url": "learn.reefacademy.example/task", "kind": "barge", "title": "Hand in your homework", "field": "File", "jar": "Artefact upload slot", "text": "Due Friday 17:00. Late work loses 10%.", "btn": "Hand in", "btnShort": "Submit", "cancel": "Withdraw my submission", "wipe": "Delete all my work", "status": "Handed in at 14:02. Well done.", "noun": "assignment", "icons": "Maths · Art · History", "iconsBad": "∑ ✎ ⌛", "names": ["Submit", "Hand in", "Turn in", "Upload"], "flexWhat": "Text size", "cl": "Grade shown by colour only", "err": "That file is too big. The limit is 10 MB.", "errCode": "Error 413: FILE_LARGE"});
kit({"id": "car", "name": "Keel Motors service", "url": "book.keelmotors.example/service", "kind": "freighter", "title": "Book a car service", "field": "Registration", "jar": "Vehicle identification mark", "text": "Takes about 2 hours. We can lend you a car.", "btn": "Book service", "btnShort": "Book", "cancel": "Cancel the booking", "wipe": "Delete my vehicle", "status": "Booked for Tuesday at 09:00.", "noun": "job", "icons": "Oil · Brakes · Tyres", "iconsBad": "◉ ⊘ ○", "names": ["Book", "Schedule", "Reserve", "Arrange"], "flexWhat": "Reminder time", "cl": "Urgency shown by colour only", "err": "We cannot read that registration. Check the letters.", "errCode": "Error 18: VRN_PARSE"});
kit({"id": "bike", "name": "Spoke bike share", "url": "ride.spoke.example/unlock", "kind": "tug", "title": "Unlock a bike", "field": "Bike code", "jar": "Rolling asset identifier", "text": "Bike 214 is at Quay Street, 2 minutes away.", "btn": "Unlock", "btnShort": "Unlock", "cancel": "End my ride", "wipe": "Delete my account", "status": "Unlocked. Ride safely.", "noun": "station", "icons": "Quay · Market · Pier", "iconsBad": "⚓ ✿ ≈", "names": ["Unlock", "Start", "Open", "Release"], "flexWhat": "Units", "cl": "Bike battery shown by colour only", "err": "That bike is already in use. Pick another one.", "errCode": "Error 409: ASSET_BUSY"});
kit({"id": "tideradio", "name": "Tideline radio", "url": "play.tideline.example/live", "kind": "sail", "title": "Listen live", "field": "Station", "jar": "Broadcast stream endpoint", "text": "Now playing: The Slow Ferry. Next: News at 15:00.", "btn": "Play", "btnShort": "Play", "cancel": "Stop the stream", "wipe": "Delete my favourites", "status": "Playing. Tune in any time.", "noun": "station", "icons": "Jazz · News · Folk", "iconsBad": "♪ ✉ ☘", "names": ["Play", "Listen", "Start", "Tune"], "flexWhat": "Sleep timer", "cl": "Signal strength shown by colour only", "err": "The station is off air. Try another one.", "errCode": "Error 503: STREAM_DOWN"});
kit({"id": "garden", "name": "Furrow plant care", "url": "grow.furrow.example/water", "kind": "barge", "title": "Water your plants", "field": "Plant", "jar": "Botanical specimen", "text": "Water the fern every 3 days. Tomatoes every day.", "btn": "Log watering", "btnShort": "Log", "cancel": "Undo last watering", "wipe": "Delete all my plants", "status": "Logged. Next watering Thursday.", "noun": "plant", "icons": "Fern · Basil · Tomato", "iconsBad": "♣ ☘ ●", "names": ["Log", "Record", "Note", "Add"], "flexWhat": "Reminder time", "cl": "Thirst shown by colour only", "err": "That plant is already logged today.", "errCode": "Error 409: DUP_ENTRY"});
kit({"id": "quiz", "name": "Kelp Pub quiz", "url": "play.kelpquiz.example/round", "kind": "sail", "title": "Round 3 of 5", "field": "Answer", "jar": "Response string", "text": "You have 20 seconds. Wrong answers lose no points.", "btn": "Lock in", "btnShort": "Submit", "cancel": "Change my answer", "wipe": "Delete my score", "status": "Locked in. Next question in 3 seconds.", "noun": "round", "icons": "Sport · Harbor · Film", "iconsBad": "⚽ ⚓ ▣", "names": ["Submit", "Lock in", "Answer", "Send"], "flexWhat": "Timer length", "cl": "Correct shown by green and wrong by red only", "err": "That is not a valid answer. Choose A, B, C or D.", "errCode": "Error 400: ANS_FMT"});
kit({"id": "rent", "name": "Lintel flat rental", "url": "find.lintel.example/viewing", "kind": "freighter", "title": "Book a viewing", "field": "Name", "jar": "Prospective tenant identifier", "text": "Viewing takes 20 minutes. Bring photo ID.", "btn": "Book viewing", "btnShort": "Book", "cancel": "Cancel my viewing", "wipe": "Delete my search", "status": "Viewing booked for Saturday at 11:00.", "noun": "flat", "icons": "Studio · 1 bed · 2 bed", "iconsBad": "▣ ☗ ⌂", "names": ["Book", "Request", "Reserve", "Arrange"], "flexWhat": "Currency", "cl": "Price shown red or green only", "err": "Choose a time between 09:00 and 18:00.", "errCode": "Error 422: TIME_RANGE"});
kit({"id": "repair", "name": "Fixit parcel repair", "url": "fix.fixit.example/ticket", "kind": "junk", "title": "Report a fault", "field": "Item", "jar": "Defective unit descriptor", "text": "We reply within 24 hours. Repairs take about a week.", "btn": "Send ticket", "btnShort": "Send", "cancel": "Withdraw my ticket", "wipe": "Delete my tickets", "status": "Ticket 4417 received.", "noun": "ticket", "icons": "Phone · Radio · Lamp", "iconsBad": "☎ ♪ ☼", "names": ["Send", "Submit", "Raise", "File"], "flexWhat": "Contact method", "cl": "Ticket status shown by colour only", "err": "Please describe the fault in at least 10 characters.", "errCode": "Error 400: DESC_SHORT"});
kit({"id": "travelins", "name": "Haven travel insurance", "url": "quote.haven.example/trip", "kind": "steamer", "title": "Get a quote", "field": "Destination", "jar": "Territorial coverage jurisdiction", "text": "Cover starts the day you leave. Pay by card.", "btn": "Get quote", "btnShort": "Quote", "cancel": "Cancel my policy", "wipe": "Delete my quotes", "status": "Quote saved. Valid for 7 days.", "noun": "plan", "icons": "Basic · Plus · Max", "iconsBad": "▢ ▣ ■", "names": ["Quote", "Price", "Estimate", "Calculate"], "flexWhat": "Currency", "cl": "Risk level shown by colour only", "err": "Your trip end date is before the start date.", "errCode": "Error 422: DATE_ORDER"});
kit({"id": "stamps", "name": "Postmark stamp club", "url": "join.postmark.example/new", "kind": "barge", "title": "Join the stamp club", "field": "Your name", "jar": "Philatelic subscriber designation", "text": "Four issues a year. Cancel any time.", "btn": "Join", "btnShort": "Join", "cancel": "Leave the club", "wipe": "Delete my collection", "status": "Welcome to the club.", "noun": "issue", "icons": "1990 · 2000 · 2010", "iconsBad": "☗ ✿ ☼", "names": ["Join", "Enrol", "Sign up", "Register"], "flexWhat": "Language", "cl": "Rarity shown by colour only", "err": "That email is already in our list.", "errCode": "Error 409: EMAIL_DUP"});
kit({"id": "karaoke", "name": "Echo karaoke room", "url": "book.echoroom.example/slot", "kind": "gala", "title": "Book a room", "field": "Room", "jar": "Acoustic chamber designation", "text": "Rooms for 4 to 12. Songs not included.", "btn": "Book room", "btnShort": "Book", "cancel": "Cancel my room", "wipe": "Delete my playlists", "status": "Booked for tonight at 20:00.", "noun": "song", "icons": "Pop · Rock · Folk", "iconsBad": "♪ ♫ ☘", "names": ["Book", "Reserve", "Hire", "Arrange"], "flexWhat": "Volume", "cl": "Room availability shown by colour only", "err": "That room is booked. Pick another time.", "errCode": "Error 409: SLOT_TAKEN"});
kit({"id": "orders", "name": "Dockside parcel tracking", "url": "track.dockside.example/where", "kind": "freighter", "title": "Where is my parcel?", "field": "Tracking number", "jar": "Consignment waybill identifier", "text": "Expected Thursday between 12:00 and 15:00.", "btn": "Track", "btnShort": "Track", "cancel": "Reroute my parcel", "wipe": "Delete my tracking list", "status": "Parcel is out for delivery.", "noun": "parcel", "icons": "Packed · Sent · Delivered", "iconsBad": "▣ ➤ ✔", "names": ["Track", "Find", "Locate", "Follow"], "flexWhat": "Delivery day", "cl": "Delay shown by colour only", "err": "We cannot find that number. It should have 12 digits.", "errCode": "Error 404: WB_NULL"});
kit({"id": "tutor", "name": "Lighthouse tutor", "url": "learn.lighthousetutor.example/lesson", "kind": "sail", "title": "Book a lesson", "field": "Subject", "jar": "Disciplinary domain", "text": "Lessons last 45 minutes. First lesson is free.", "btn": "Book lesson", "btnShort": "Book", "cancel": "Cancel the lesson", "wipe": "Delete my profile", "status": "Lesson booked for Thursday at 16:00.", "noun": "tutor", "icons": "Maths · Art · English", "iconsBad": "∑ ✎ ¶", "names": ["Book", "Reserve", "Schedule", "Arrange"], "flexWhat": "Text size", "cl": "Tutor availability shown by colour only", "err": "Please choose a time when the tutor is free.", "errCode": "Error 409: TUTOR_BUSY"});
/* ───────────────────── 11l. Fill the thin ship kinds: ferry (accounts), junk (shady), gala (events) ───────────────────── */
kit({"id": "libcard", "name": "Harbor Library sign-in", "url": "account.harborlib.example/login", "kind": "ferry", "title": "Sign in to your library card", "field": "Card number", "jar": "Patron identifier credential", "text": "Renew books online. Fines are paid at the desk.", "btn": "Sign in", "btnShort": "Sign in", "cancel": "Sign out of all devices", "wipe": "Delete my reading history", "status": "Signed in. You have 3 books out.", "noun": "loan", "icons": "Novels · Maps · Music", "iconsBad": "▣ ☗ ♪", "names": ["Sign in", "Log in", "Enter", "Proceed"], "flexWhat": "Text size", "cl": "Overdue shown by colour only", "err": "Card number not recognised. Check the 10 digits.", "errCode": "Error 401: PATRON_AUTH"});
kit({"id": "patient", "name": "Clinic patient portal", "url": "portal.quayclinic.example/login", "kind": "ferry", "title": "Patient portal", "field": "Date of birth", "jar": "Demographic verification token", "text": "Results usually appear within 3 working days.", "btn": "Log in", "btnShort": "Log in", "cancel": "Cancel my appointment", "wipe": "Delete my records request", "status": "Welcome back. You have 1 new result.", "noun": "result", "icons": "Blood · X-ray · Letters", "iconsBad": "♥ ☢ ✉", "names": ["Log in", "Sign in", "Access", "Authenticate"], "flexWhat": "Language", "cl": "Result flagged by colour only", "err": "Date of birth does not match our records.", "errCode": "Error 403: DEMOGRAPHIC_MISMATCH"});
kit({"id": "tramacct", "name": "Quay Tram account", "url": "my.quaytram.example/sign-in", "kind": "ferry", "title": "Your tram account", "field": "Email", "jar": "Electronic mail credential", "text": "Top up any time. Balance never expires.", "btn": "Sign in", "btnShort": "Sign in", "cancel": "Sign out", "wipe": "Delete my card", "status": "Signed in. Balance 12 cr.", "noun": "trip", "icons": "Zone 1 · Zone 2 · Night", "iconsBad": "① ② ☾", "names": ["Sign in", "Log in", "Continue", "Enter"], "flexWhat": "Receipt emails", "cl": "Low balance shown red only", "err": "That email and password do not match.", "errCode": "Error 401: CRED_INVALID"});
kit({"id": "parents", "name": "Reef School parent login", "url": "parents.reefschool.example/enter", "kind": "ferry", "title": "Parents’ page", "field": "Child’s name", "jar": "Pupil nomenclature", "text": "Reports are posted twice a term.", "btn": "Enter", "btnShort": "Enter", "cancel": "Log out", "wipe": "Delete my child’s profile", "status": "Welcome. Term dates are on the calendar.", "noun": "report", "icons": "Maths · Art · Sport", "iconsBad": "∑ ✎ ⚽", "names": ["Enter", "Log in", "Go", "Access"], "flexWhat": "Text size", "cl": "Attendance shown by colour only", "err": "We could not find that pupil. Check the spelling.", "errCode": "Error 404: PUPIL_NULL"});
kit({"id": "taxoffice", "name": "Berth Tax Office sign-in", "url": "online.berthtax.example/file", "kind": "ferry", "title": "File your harbor tax", "field": "Tax reference", "jar": "Fiscal identification number", "text": "Deadline 31 January. Late filing costs 20 cr.", "btn": "Sign in", "btnShort": "Sign in", "cancel": "Cancel this return", "wipe": "Delete my return", "status": "Signed in. Your return is open.", "noun": "return", "icons": "Income · Boat · Gifts", "iconsBad": "$ ⚓ ♥", "names": ["Sign in", "Log in", "Authenticate", "Enter"], "flexWhat": "Currency", "cl": "Amount owed shown red only", "err": "Reference must be 10 characters. You typed 9.", "errCode": "Error 400: REF_LEN"});
kit({"id": "gymapp", "name": "Anchor Gym app sign-in", "url": "app.anchorgym.example/in", "kind": "ferry", "title": "Welcome back", "field": "Member number", "jar": "Membership credential string", "text": "Classes open for booking seven days ahead.", "btn": "Sign in", "btnShort": "Sign in", "cancel": "Sign out", "wipe": "Delete my bookings", "status": "Signed in. Spin at 18:00 is free.", "noun": "class", "icons": "Spin · Yoga · Swim", "iconsBad": "⟳ ☯ ≈", "names": ["Sign in", "Log in", "Enter", "Start"], "flexWhat": "Reminder time", "cl": "Class fullness shown by colour only", "err": "Member number not recognised.", "errCode": "Error 401: MEMBER_AUTH"});
kit({"id": "power", "name": "Hearth Power login", "url": "account.hearthpower.example/login", "kind": "ferry", "title": "Your energy account", "field": "Customer number", "jar": "Energy account identifier", "text": "Meter readings are due on the 1st.", "btn": "Log in", "btnShort": "Log in", "cancel": "Cancel my reading", "wipe": "Delete my account", "status": "Reading received. Thank you.", "noun": "reading", "icons": "Gas · Power · Water", "iconsBad": "♨ ⚡ ≈", "names": ["Log in", "Sign in", "Access", "Enter"], "flexWhat": "Paperless option", "cl": "Usage shown red or green only", "err": "Customer number must be 9 digits.", "errCode": "Error 400: CUST_FMT"});
kit({"id": "photocloud", "name": "Shoal photo cloud sign-in", "url": "cloud.shoal.example/sign-in", "kind": "ferry", "title": "Your photos", "field": "Username", "jar": "Subscriber alias", "text": "5 GB free. 50 GB for 1 cr a month.", "btn": "Sign in", "btnShort": "Sign in", "cancel": "Undo last upload", "wipe": "Delete all my photos", "status": "Signed in. 214 photos synced.", "noun": "album", "icons": "Holiday · Pets · Family", "iconsBad": "☀ ☻ ♥", "names": ["Sign in", "Log in", "Open", "Enter"], "flexWhat": "Photo quality", "cl": "Storage used shown by colour only", "err": "Username not found. Did you register?", "errCode": "Error 404: USER_NULL"});
kit({"id": "cinemaclub", "name": "Reel Cinema club sign-in", "url": "club.reelcinema.example/in", "kind": "ferry", "title": "Cinema club", "field": "Member email", "jar": "Subscriber electronic address", "text": "Members see new films one day early.", "btn": "Sign in", "btnShort": "Sign in", "cancel": "Cancel my membership", "wipe": "Delete my watchlist", "status": "Signed in. Two new films today.", "noun": "film", "icons": "Drama · Comedy · Doc", "iconsBad": "☹ ☺ ▣", "names": ["Sign in", "Log in", "Enter", "Join in"], "flexWhat": "Subtitles", "cl": "Seats left shown by colour only", "err": "That email is not a member. Join first.", "errCode": "Error 403: NOT_MEMBER"});
kit({"id": "luckywheel", "name": "Lucky Wheel coupon", "url": "prizes.luckywheel.example/spin", "kind": "junk", "title": "Spin to win a coupon", "field": "Email", "jar": "Contact vector", "text": "You have 1 spin. Coupons last 24 hours.", "btn": "Spin now", "btnShort": "Spin", "cancel": "Close this offer", "wipe": "Delete my spins", "status": "Spun! You won 5% off.", "noun": "coupon", "icons": "5% · 10% · Free ship", "iconsBad": "★ ★ ★", "names": ["Spin", "Win", "Claim", "Go"], "flexWhat": "Notification sound", "cl": "Win chance shown by colour only", "err": "Sorry, that spin has expired. Spin again tomorrow.", "errCode": "Error 11: SPIN_EXP"});
kit({"id": "teadeal", "name": "Miracle Tea shop", "url": "shop.miracletea.example/offer", "kind": "junk", "title": "Tea that changes everything", "field": "Quantity", "jar": "Unit multiplier", "text": "Free delivery. Ships in 5 days.", "btn": "Buy now", "btnShort": "Buy", "cancel": "Cancel my order", "wipe": "Delete my details", "status": "Order placed. Tea is on its way.", "noun": "tea", "icons": "Green · Black · Herbal", "iconsBad": "☘ ☕ ♨", "names": ["Buy", "Order", "Grab", "Get"], "flexWhat": "Delivery day", "cl": "Stock shown by colour only", "err": "That quantity is not available. Choose 1 to 5.", "errCode": "Error 5: QTY_RANGE"});
kit({"id": "dlmanager", "name": "FastLoad download manager", "url": "get.fastload.example/install", "kind": "junk", "title": "Download faster", "field": "Install folder", "jar": "Destination path", "text": "Installs in about a minute.", "btn": "Download", "btnShort": "Get", "cancel": "Cancel the download", "wipe": "Remove all my files", "status": "Download started.", "noun": "file", "icons": "App · Driver · Pack", "iconsBad": "↓ ⚙ ▣", "names": ["Download", "Get", "Install", "Grab"], "flexWhat": "Language", "cl": "Progress shown by colour only", "err": "The installer cannot write to that folder.", "errCode": "Error 13: EACCES"});
kit({"id": "phonesurvey", "name": "Win a Phone survey", "url": "win.phonesurvey.example/start", "kind": "junk", "title": "Answer 3 questions, win a phone", "field": "Name", "jar": "Respondent identifier", "text": "Takes 1 minute. One entry per person.", "btn": "Continue", "btnShort": "Next", "cancel": "Back out", "wipe": "Delete my answers", "status": "Entry received. Winners emailed on Friday.", "noun": "question", "icons": "Phone · Age · Town", "iconsBad": "☎ ♨ ⌂", "names": ["Continue", "Next", "Go", "Proceed"], "flexWhat": "Text size", "cl": "Required fields shown by colour only", "err": "Please answer all three questions.", "errCode": "Error 8: REQ_MISSING"});
kit({"id": "horoscope", "name": "Stars Daily horoscope", "url": "read.starsdaily.example/sign", "kind": "junk", "title": "Your sign today", "field": "Birth date", "jar": "Natal temporal coordinate", "text": "Daily readings free. Weekly readings 1 cr.", "btn": "Reveal", "btnShort": "Reveal", "cancel": "Cancel my plan", "wipe": "Delete my chart", "status": "Your reading is ready.", "noun": "sign", "icons": "Fire · Earth · Water", "iconsBad": "♈ ♉ ♊", "names": ["Reveal", "Show", "Read", "Open"], "flexWhat": "Language", "cl": "Luck shown by colour only", "err": "That date is not valid. Try again.", "errCode": "Error 2: DATE_INV"});
kit({"id": "watches", "name": "Cheap Watches outlet", "url": "outlet.cheapwatches.example/deal", "kind": "junk", "title": "Watches from 3 cr", "field": "Size", "jar": "Case diameter parameter", "text": "Delivered in 2 weeks. Returns accepted.", "btn": "Add to basket", "btnShort": "Add", "cancel": "Remove from basket", "wipe": "Empty basket and wishlist", "status": "Added. Basket has 2 items.", "noun": "watch", "icons": "Sport · Dress · Kids", "iconsBad": "⌚ ⚓ ☺", "names": ["Add", "Put", "Place", "Insert"], "flexWhat": "Currency", "cl": "Discount shown red only", "err": "That watch is sold out.", "errCode": "Error 9: OUT_OF_STOCK"});
kit({"id": "quaydating", "name": "Quay Singles", "url": "meet.quaysingles.example/join", "kind": "junk", "title": "Meet someone on the quay", "field": "Display name", "jar": "Profile alias", "text": "Free to browse. Messages cost 1 cr.", "btn": "Join free", "btnShort": "Join", "cancel": "Hide my profile", "wipe": "Delete my profile", "status": "Welcome. Your profile is live.", "noun": "match", "icons": "Near · New · Online", "iconsBad": "♥ ☺ ★", "names": ["Join", "Sign up", "Start", "Meet"], "flexWhat": "Notification sound", "cl": "Online status shown by colour only", "err": "That name is taken. Try another.", "errCode": "Error 409: ALIAS_TAKEN"});
kit({"id": "coinshop", "name": "Shell Coin exchange", "url": "trade.shellcoin.example/buy", "kind": "junk", "title": "Buy shell coins", "field": "Amount", "jar": "Quantity of tokens", "text": "Price updates every 10 seconds. No refunds.", "btn": "Buy coins", "btnShort": "Buy", "cancel": "Cancel the trade", "wipe": "Delete my wallet", "status": "Order filled at 1.2 cr.", "noun": "coin", "icons": "Shell · Pearl · Reef", "iconsBad": "● ◆ ■", "names": ["Buy", "Trade", "Swap", "Get"], "flexWhat": "Currency", "cl": "Price change shown red or green only", "err": "Order rejected: price moved. Try again.", "errCode": "Error 409: PRICE_MOVED"});
kit({"id": "regatta", "name": "Quay Regatta entry", "url": "enter.quayregatta.example/boat", "kind": "gala", "title": "Enter your boat", "field": "Boat name", "jar": "Vessel appellation", "text": "Race starts Saturday at 10:00. Entry 12 cr.", "btn": "Enter race", "btnShort": "Enter", "cancel": "Withdraw my entry", "wipe": "Delete my crew", "status": "Entry received. Good luck.", "noun": "race", "icons": "Dinghy · Sloop · Open", "iconsBad": "⛵ ⚓ ☸", "names": ["Enter", "Register", "Sign up", "Submit"], "flexWhat": "Units", "cl": "Wind shown by colour only", "err": "That class holds 12 boats and is full.", "errCode": "Error 409: CLASS_FULL"});
kit({"id": "foodfest", "name": "Harbor Food Festival tickets", "url": "tickets.harborfood.example/day", "kind": "gala", "title": "Festival tickets", "field": "Date", "jar": "Admission date", "text": "Entry 5 cr. Tastings from 2 cr.", "btn": "Buy tickets", "btnShort": "Buy", "cancel": "Change my date", "wipe": "Delete my tickets", "status": "Tickets sent. Bring an appetite.", "noun": "stall", "icons": "Fish · Sweet · Spice", "iconsBad": "☘ ♨ ✿", "names": ["Buy", "Book", "Get", "Reserve"], "flexWhat": "Dietary notes", "cl": "Queue length shown by colour only", "err": "Choose Saturday or Sunday only.", "errCode": "Error 422: DATE_SET"});
kit({"id": "openair", "name": "Open-air Cinema", "url": "book.openaircinema.example/seat", "kind": "gala", "title": "Pick your film night", "field": "Seats", "jar": "Admission quantity", "text": "Bring a blanket. Starts at sundown.", "btn": "Reserve", "btnShort": "Reserve", "cancel": "Cancel my seats", "wipe": "Delete my reservations", "status": "Reserved. See you on the quay.", "noun": "film", "icons": "Drama · Comedy · Kids", "iconsBad": "☹ ☺ ☻", "names": ["Reserve", "Book", "Get", "Hold"], "flexWhat": "Subtitles", "cl": "Seats left shown by colour only", "err": "You asked for 9 seats. Maximum is 6.", "errCode": "Error 413: SEAT_MAX"});
kit({"id": "paradesign", "name": "Lantern parade signup", "url": "join.lanternparade.example/walk", "kind": "gala", "title": "Walk with a lantern", "field": "Group name", "jar": "Marching unit denomination", "text": "Meet at 18:00 at Pier 3. Lanterns provided.", "btn": "Sign up", "btnShort": "Sign up", "cancel": "Leave the parade", "wipe": "Delete my group", "status": "You are on the list. Wear warm shoes.", "noun": "group", "icons": "Family · School · Club", "iconsBad": "☻ ✎ ♞", "names": ["Sign up", "Join", "Enrol", "Add me"], "flexWhat": "Text size", "cl": "Group size shown by colour only", "err": "Group size must be between 2 and 20.", "errCode": "Error 422: GROUP_SIZE"});
kit({"id": "fairstall", "name": "Quay Fair stall booking", "url": "stalls.quayfair.example/book", "kind": "gala", "title": "Book a stall", "field": "Stall number", "jar": "Pitch designator", "text": "Pitch 3 m by 3 m. Table included.", "btn": "Book stall", "btnShort": "Book", "cancel": "Cancel my stall", "wipe": "Delete my business", "status": "Stall booked. Set up from 7:00.", "noun": "stall", "icons": "Food · Craft · Toys", "iconsBad": "♨ ✎ ☻", "names": ["Book", "Reserve", "Claim", "Hire"], "flexWhat": "Currency", "cl": "Pitch status shown by colour only", "err": "Stall 14 is taken. Pick another.", "errCode": "Error 409: PITCH_TAKEN"});
kit({"id": "choirconcert", "name": "Tidewater Choir tickets", "url": "tickets.tidewaterchoir.example/seat", "kind": "gala", "title": "Winter concert", "field": "Seat", "jar": "Auditorium position", "text": "Doors 18:30. Concert 19:30. Wheelchair spaces on request.", "btn": "Buy tickets", "btnShort": "Buy", "cancel": "Return my tickets", "wipe": "Delete my booking", "status": "Tickets reserved for 20 minutes.", "noun": "seat", "icons": "Front · Middle · Back", "iconsBad": "♪ ♫ ♬", "names": ["Buy", "Book", "Pay", "Get"], "flexWhat": "Text size", "cl": "Seat availability shown by colour only", "err": "Those seats have just been sold.", "errCode": "Error 409: SEAT_SOLD"});
kit({"id": "fireworks", "name": "Dusk Fireworks viewing spots", "url": "view.duskworks.example/spot", "kind": "gala", "title": "Choose a viewing spot", "field": "Spot", "jar": "Vantage coordinate", "text": "Show at 21:00 for 15 minutes. Free entry.", "btn": "Save a spot", "btnShort": "Save", "cancel": "Give up my spot", "wipe": "Delete my spots", "status": "Spot saved. Arrive before 20:30.", "noun": "spot", "icons": "Pier · Hill · Beach", "iconsBad": "⚓ ▲ ≈", "names": ["Save", "Book", "Hold", "Get"], "flexWhat": "Reminder time", "cl": "Crowd level shown by colour only", "err": "That spot is full. Try the hill.", "errCode": "Error 409: SPOT_FULL"});
/* ───────────────────── 11m. Forms, mobile and everyday chores: 24 more interfaces ───────────────────── */
kit({"id": "passport", "name": "Passport renewal form", "url": "gov.halcyon.example/passport", "kind": "steamer", "title": "Renew your passport", "field": "Passport number", "jar": "Travel document serial (MRZ line 2)", "text": "Takes 10 working days. Fee 60 cr.", "btn": "Submit renewal", "btnShort": "Submit", "cancel": "Withdraw my application", "wipe": "Delete my application draft", "status": "Application received. Reference PR-2291.", "noun": "document", "icons": "Passport · Visa · ID", "iconsBad": "▣ ✈ ☻", "names": ["Submit", "Apply", "Send", "File"], "flexWhat": "Text size", "cl": "Required fields shown by colour only", "err": "The photo is too dark. Upload a lighter one.", "errCode": "Error 422: PHOTO_LUMA"});
kit({"id": "visa", "name": "Visa application", "url": "visa.halcyon.example/apply", "kind": "steamer", "title": "Apply for a visa", "field": "Nationality", "jar": "Citizenship classification", "text": "Decisions in about 15 days. Fee 80 cr.", "btn": "Apply", "btnShort": "Apply", "cancel": "Cancel my application", "wipe": "Delete my details", "status": "Application submitted.", "noun": "country", "icons": "Marrow · Vael · Isle", "iconsBad": "⚑ ⚓ ☗", "names": ["Apply", "Submit", "Request", "File"], "flexWhat": "Language", "cl": "Missing documents shown red only", "err": "Your passport expires within 6 months.", "errCode": "Error 409: DOC_EXPIRY"});
kit({"id": "mortgage", "name": "Berth mortgage calculator", "url": "loans.berthbank.example/calc", "kind": "steamer", "title": "How much can you borrow?", "field": "Income", "jar": "Gross annual remuneration", "text": "Estimates only. Not an offer.", "btn": "Calculate", "btnShort": "Calc", "cancel": "Clear the calculator", "wipe": "Delete my saved scenarios", "status": "Estimate ready: 2,100 cr a month.", "noun": "scenario", "icons": "Fixed · Variable · Offset", "iconsBad": "▬ ≈ ◆", "names": ["Calculate", "Work out", "Compute", "Estimate"], "flexWhat": "Currency", "cl": "Affordability shown red or green only", "err": "Income must be a number. You typed “lots”.", "errCode": "Error 400: NaN"});
kit({"id": "deduct", "name": "Tax deduction helper", "url": "tax.berthtax.example/deduct", "kind": "steamer", "title": "Find your deductions", "field": "Expense type", "jar": "Fiscal expenditure taxonomy node", "text": "Keep receipts for 6 years.", "btn": "Add deduction", "btnShort": "Add", "cancel": "Remove deduction", "wipe": "Delete all my deductions", "status": "Deduction added. Total 140 cr.", "noun": "deduction", "icons": "Work · Gifts · Boat", "iconsBad": "$ ♥ ⚓", "names": ["Add", "Claim", "Include", "Enter"], "flexWhat": "Currency", "cl": "Eligible items shown by colour only", "err": "That expense cannot be claimed twice.", "errCode": "Error 409: DUP_CLAIM"});
kit({"id": "pensioncheck", "name": "Pension forecast", "url": "pension.halcyon.example/forecast", "kind": "steamer", "title": "Check your pension", "field": "Retirement age", "jar": "Target decumulation age", "text": "Forecast assumes steady work until retirement.", "btn": "Show forecast", "btnShort": "Show", "cancel": "Reset my forecast", "wipe": "Delete my records", "status": "Forecast ready: 640 cr a month.", "noun": "forecast", "icons": "Basic · State · Private", "iconsBad": "☗ ⚓ $", "names": ["Show", "Forecast", "Project", "Calculate"], "flexWhat": "Text size", "cl": "On-track status shown by colour only", "err": "Retirement age must be between 60 and 75.", "errCode": "Error 422: AGE_RANGE"});
kit({"id": "claim", "name": "Insurance claim form", "url": "claims.haven.example/new", "kind": "steamer", "title": "Make a claim", "field": "Policy number", "jar": "Contract reference identifier", "text": "We reply within 5 working days.", "btn": "Send claim", "btnShort": "Send", "cancel": "Withdraw my claim", "wipe": "Delete my claim", "status": "Claim 9915 received.", "noun": "claim", "icons": "Water · Theft · Fire", "iconsBad": "≈ ☹ ♨", "names": ["Send", "Submit", "File", "Lodge"], "flexWhat": "Contact method", "cl": "Claim status shown by colour only", "err": "Upload at least one photo of the damage.", "errCode": "Error 400: ATTACH_REQ"});
kit({"id": "housing", "name": "Council housing list", "url": "housing.halcyon.example/register", "kind": "steamer", "title": "Join the housing list", "field": "Household size", "jar": "Domicile occupant count", "text": "Waits are about 18 months.", "btn": "Join the list", "btnShort": "Join", "cancel": "Leave the list", "wipe": "Delete my household", "status": "You are on the list. Position 412.", "noun": "household", "icons": "Single · Couple · Family", "iconsBad": "☻ ♥ ⌂", "names": ["Join", "Register", "Apply", "Enrol"], "flexWhat": "Language", "cl": "Priority band shown by colour only", "err": "Household size must be 1 or more.", "errCode": "Error 422: SIZE_MIN"});
kit({"id": "licence", "name": "Driving licence renewal", "url": "licence.halcyon.example/renew", "kind": "steamer", "title": "Renew your licence", "field": "Licence number", "jar": "Operator permit identifier", "text": "New licence arrives in 7 days.", "btn": "Renew", "btnShort": "Renew", "cancel": "Cancel renewal", "wipe": "Delete my details", "status": "Renewal paid. Licence on its way.", "noun": "licence", "icons": "Car · Bike · Boat", "iconsBad": "◉ ⊘ ⚓", "names": ["Renew", "Pay", "Submit", "Apply"], "flexWhat": "Text size", "cl": "Expiry shown by colour only", "err": "Your eye test is older than 2 years.", "errCode": "Error 409: TEST_OLD"});
kit({"id": "topup", "name": "Mobile top-up", "url": "topup.tidephone.example/add", "kind": "freighter", "title": "Top up your phone", "field": "Number", "jar": "Subscriber MSISDN", "text": "Credit arrives in about a minute.", "btn": "Top up", "btnShort": "Top up", "cancel": "Cancel the top-up", "wipe": "Delete my cards", "status": "Topped up. New balance 12 cr.", "noun": "amount", "icons": "5 cr · 10 cr · 20 cr", "iconsBad": "⌗ ☎ $", "names": ["Top up", "Add credit", "Recharge", "Pay"], "flexWhat": "Currency", "cl": "Low credit shown red only", "err": "That number is not on our network.", "errCode": "Error 404: MSISDN_UNK"});
kit({"id": "locker", "name": "Parcel locker pickup", "url": "lockers.dockside.example/open", "kind": "freighter", "title": "Open your locker", "field": "Pickup code", "jar": "Collection token (6 digits)", "text": "Parcels wait 3 days.", "btn": "Open locker", "btnShort": "Open", "cancel": "Return my parcel", "wipe": "Delete my history", "status": "Locker 14 is open.", "noun": "locker", "icons": "Small · Medium · Large", "iconsBad": "▣ ▤ ▥", "names": ["Open", "Unlock", "Release", "Get"], "flexWhat": "Language", "cl": "Locker free or full shown by colour only", "err": "That code has expired. Request a new one.", "errCode": "Error 410: TOKEN_EXP"});
kit({"id": "grocery", "name": "Supermarket delivery slot", "url": "slots.quaymart.example/pick", "kind": "freighter", "title": "Choose a delivery slot", "field": "Postcode", "jar": "Delivery zone identifier", "text": "Free delivery over 40 cr.", "btn": "Reserve slot", "btnShort": "Reserve", "cancel": "Cancel the slot", "wipe": "Delete my basket", "status": "Slot reserved for Thursday 18:00.", "noun": "slot", "icons": "Morning · Evening · Night", "iconsBad": "☀ ☾ ★", "names": ["Reserve", "Book", "Choose", "Hold"], "flexWhat": "Delivery day", "cl": "Slot fullness shown by colour only", "err": "No slots are free in your area today.", "errCode": "Error 409: SLOT_FULL"});
kit({"id": "refill", "name": "Pharmacy refill app", "url": "refill.quaypharm.example/repeat", "kind": "freighter", "title": "Repeat prescription", "field": "Prescription number", "jar": "Rx dispensing identifier", "text": "Ready in 2 hours. Collect with ID.", "btn": "Request refill", "btnShort": "Refill", "cancel": "Cancel the request", "wipe": "Delete my prescriptions", "status": "Refill requested.", "noun": "medicine", "icons": "Pain · Allergy · Daily", "iconsBad": "✚ ☘ ☼", "names": ["Request", "Order", "Refill", "Ask"], "flexWhat": "Text size", "cl": "Stock shown by colour only", "err": "That prescription has no refills left.", "errCode": "Error 403: REFILL_ZERO"});
kit({"id": "sofa", "name": "Sofa configurator", "url": "shop.hearthfurn.example/sofa", "kind": "freighter", "title": "Design your sofa", "field": "Fabric", "jar": "Upholstery textile code", "text": "Delivery in 6 weeks. Free returns.", "btn": "Add to basket", "btnShort": "Add", "cancel": "Remove from basket", "wipe": "Empty basket and designs", "status": "Added. Basket has 1 item.", "noun": "fabric", "icons": "Wool · Linen · Velvet", "iconsBad": "☗ ≈ ♣", "names": ["Add", "Put", "Place", "Insert"], "flexWhat": "Currency", "cl": "Fabric colours differ by tint only", "err": "That fabric is out of stock.", "errCode": "Error 409: STOCK_ZERO"});
kit({"id": "merch", "name": "Concert merch store", "url": "merch.tidewaterband.example/shop", "kind": "freighter", "title": "Merch", "field": "Size", "jar": "Garment dimension code", "text": "Pick up at the venue or ship in 5 days.", "btn": "Buy", "btnShort": "Buy", "cancel": "Cancel my order", "wipe": "Delete my details", "status": "Order placed.", "noun": "item", "icons": "Shirt · Poster · Cap", "iconsBad": "▣ ♪ ☗", "names": ["Buy", "Order", "Add", "Get"], "flexWhat": "Currency", "cl": "Low stock shown red only", "err": "That size is sold out.", "errCode": "Error 409: SIZE_OUT"});
kit({"id": "sim", "name": "SIM activation", "url": "sim.tidephone.example/on", "kind": "tug", "title": "Activate your SIM", "field": "SIM number", "jar": "ICCID serial", "text": "Active within 10 minutes.", "btn": "Activate", "btnShort": "Activate", "cancel": "Cancel activation", "wipe": "Delete my account", "status": "Your SIM is active.", "noun": "plan", "icons": "Basic · Plus · Max", "iconsBad": "☎ ▣ ■", "names": ["Activate", "Turn on", "Start", "Enable"], "flexWhat": "Language", "cl": "Signal shown by colour only", "err": "That SIM number has 19 digits. We need 20.", "errCode": "Error 400: ICCID_LEN"});
kit({"id": "remind", "name": "Appointment reminders", "url": "remind.quayclinic.example/set", "kind": "tug", "title": "Appointment reminders", "field": "Reminder time", "jar": "Notification lead time", "text": "We text you the day before.", "btn": "Save reminder", "btnShort": "Save", "cancel": "Undo last change", "wipe": "Delete all reminders", "status": "Reminder saved.", "noun": "reminder", "icons": "1 day · 1 hour · 15 min", "iconsBad": "☎ ⌚ ✉", "names": ["Save", "Set", "Confirm", "Apply"], "flexWhat": "Reminder time", "cl": "Reminder status shown by colour only", "err": "Choose a time earlier than the appointment.", "errCode": "Error 422: LEAD_TIME"});
kit({"id": "hotspot", "name": "Cafe wifi login", "url": "wifi.beancafe.example/login", "kind": "tug", "title": "Join the wifi", "field": "Email", "jar": "Subscriber email credential", "text": "Free for 30 minutes.", "btn": "Connect", "btnShort": "Join", "cancel": "Disconnect", "wipe": "Forget my device", "status": "Connected. 30 minutes left.", "noun": "session", "icons": "30 min · 1 hour · Day", "iconsBad": "≈ ⌚ ☼", "names": ["Connect", "Join", "Log in", "Go online"], "flexWhat": "Language", "cl": "Signal shown by colour only", "err": "Please accept the terms to continue.", "errCode": "Error 428: TERMS_REQ"});
kit({"id": "carpark", "name": "Car park pay", "url": "pay.quaypark.example/stay", "kind": "tug", "title": "Pay for parking", "field": "Registration", "jar": "Vehicle registration mark", "text": "Pay before you leave. First 15 minutes free.", "btn": "Pay", "btnShort": "Pay", "cancel": "Cancel payment", "wipe": "Delete my vehicles", "status": "Paid until 17:30.", "noun": "stay", "icons": "1 hour · 2 hours · Day", "iconsBad": "⌚ ⌚ ☼", "names": ["Pay", "Buy time", "Add time", "Settle"], "flexWhat": "Reminder time", "cl": "Time left shown by colour only", "err": "Registration not recognised.", "errCode": "Error 404: VRM_NULL"});
kit({"id": "liftshare", "name": "Lift share", "url": "lifts.quayshare.example/offer", "kind": "tug", "title": "Share a ride", "field": "From", "jar": "Origin node", "text": "Share fuel costs. Drivers are rated.", "btn": "Offer ride", "btnShort": "Offer", "cancel": "Cancel my ride", "wipe": "Delete my profile", "status": "Ride offered. 2 seats free.", "noun": "ride", "icons": "Today · Tomorrow · Weekly", "iconsBad": "⌂ ➤ ⚓", "names": ["Offer", "Post", "Share", "List"], "flexWhat": "Fare display", "cl": "Seats left shown by colour only", "err": "Departure time must be in the future.", "errCode": "Error 422: DEPART_PAST"});
kit({"id": "laundry", "name": "Laundry machine app", "url": "wash.tidyquay.example/start", "kind": "tug", "title": "Start a wash", "field": "Machine", "jar": "Appliance unit identifier", "text": "Machine 3 is free. Cycle 40 minutes.", "btn": "Start wash", "btnShort": "Start", "cancel": "Stop the wash", "wipe": "Delete my cycles", "status": "Wash started. 40 minutes left.", "noun": "cycle", "icons": "Cotton · Wool · Quick", "iconsBad": "≈ ☼ ⌚", "names": ["Start", "Run", "Begin", "Go"], "flexWhat": "Reminder time", "cl": "Machine free or busy shown by colour only", "err": "That machine is busy. Pick another.", "errCode": "Error 409: BUSY"});
kit({"id": "readlist", "name": "Reading list", "url": "list.gulldaily.example/saved", "kind": "barge", "title": "Saved for later", "field": "Add link", "jar": "URL string", "text": "Saved stories keep for 30 days.", "btn": "Save", "btnShort": "Save", "cancel": "Undo save", "wipe": "Delete my list", "status": "Saved to your list.", "noun": "story", "icons": "Long reads · Short · Audio", "iconsBad": "▤ ▣ ♪", "names": ["Save", "Keep", "Add", "Bookmark"], "flexWhat": "Text size", "cl": "Read and unread shown by colour only", "err": "That link did not load. Check it.", "errCode": "Error 404: URL_DEAD"});
kit({"id": "flash", "name": "Flashcards", "url": "learn.cardwise.example/deck", "kind": "barge", "title": "Review your deck", "field": "Answer", "jar": "Response text", "text": "12 cards due today.", "btn": "Check answer", "btnShort": "Check", "cancel": "Skip this card", "wipe": "Delete my deck", "status": "Correct. Next card in 1 day.", "noun": "card", "icons": "New · Learning · Due", "iconsBad": "★ ⟳ ⌚", "names": ["Check", "Answer", "Submit", "Mark"], "flexWhat": "Card timer", "cl": "Correct and wrong shown by colour only", "err": "Please type an answer first.", "errCode": "Error 400: ANS_EMPTY"});
kit({"id": "habit", "name": "Habit tracker", "url": "habits.dailyloop.example/today", "kind": "barge", "title": "Today’s habits", "field": "Habit", "jar": "Behavioural routine label", "text": "3 of 5 done. Streak 7 days.", "btn": "Mark done", "btnShort": "Done", "cancel": "Undo mark", "wipe": "Delete my habits", "status": "Marked done. Streak 8 days.", "noun": "habit", "icons": "Water · Walk · Read", "iconsBad": "≈ ➤ ▤", "names": ["Mark done", "Check", "Tick", "Log"], "flexWhat": "Reminder time", "cl": "Done and missed shown by colour only", "err": "That habit is already marked today.", "errCode": "Error 409: DUP_MARK"});
kit({"id": "prints", "name": "Photo printing", "url": "prints.shoal.example/order", "kind": "barge", "title": "Print your photos", "field": "Print size", "jar": "Output dimension designation", "text": "Ready in 3 days at your local shop.", "btn": "Order prints", "btnShort": "Order", "cancel": "Cancel my order", "wipe": "Delete my photos", "status": "Order placed. Collect Thursday.", "noun": "print", "icons": "10×15 · 13×18 · 20×30", "iconsBad": "▣ ▢ ▥", "names": ["Order", "Print", "Buy", "Send"], "flexWhat": "Currency", "cl": "Low resolution shown by colour only", "err": "That photo is too small to print at that size.", "errCode": "Error 422: DPI_LOW"});
/* ───────────────────── 11o. Forty-eight more, one set for each new ship ───────────────────── */
kit({"id": "fuelcard", "name": "Fuel card portal", "url": "cards.berthfuel.example/top", "kind": "tanker", "title": "Manage your fuel card", "field": "Card number", "jar": "Fleet card PAN", "text": "Cards are charged monthly in arrears.", "btn": "Order card", "btnShort": "Order", "cancel": "Block this card", "wipe": "Delete my fleet", "status": "Card ordered. Arrives in 5 days.", "noun": "card", "icons": "Diesel · Petrol · Gas", "iconsBad": "⛽ ⚡ ♨", "names": ["Order", "Request", "Get", "Add"], "flexWhat": "Currency", "cl": "Spend limit shown by colour only", "err": "The card limit must be less than 5,000 cr.", "errCode": "Error 422: LIMIT_MAX", "sp": ["Monthly limit", "Limit: 500 cr a month.", "Limit shown as “L=0x1F4”", "realworld", "L=0x1F4"]});
kit({"id": "freightq", "name": "Freight quote", "url": "quote.dockfreight.example/get", "kind": "tanker", "title": "Get a freight quote", "field": "Weight", "jar": "Gross mass declaration", "text": "Quotes valid for 48 hours.", "btn": "Get quote", "btnShort": "Quote", "cancel": "Cancel the quote", "wipe": "Delete my quotes", "status": "Quote ready: 1,240 cr.", "noun": "quote", "icons": "Road · Sea · Rail", "iconsBad": "➤ ⚓ ═", "names": ["Quote", "Price", "Get", "Estimate"], "flexWhat": "Units", "cl": "Surcharges shown red only", "err": "Weight must be more than 0 and under 40,000 kg.", "errCode": "Error 422: WEIGHT_RANGE", "sp": ["Surcharges", "Fuel surcharge 4%.", "Surcharges hidden until the last step", "minimal", "Surcharges revealed only after you pay"]});
kit({"id": "portfees", "name": "Port fees calculator", "url": "fees.berthoffice.example/calc", "kind": "tanker", "title": "Calculate port fees", "field": "Ship length", "jar": "Overall length (LOA)", "text": "Fees are per metre per day.", "btn": "Calculate", "btnShort": "Calc", "cancel": "Reset the form", "wipe": "Delete my ships", "status": "Fees ready: 90 cr.", "noun": "fee", "icons": "Berth · Pilot · Tug", "iconsBad": "⚓ ☗ ⚙", "names": ["Calculate", "Work out", "Compute", "Total"], "flexWhat": "Units", "cl": "Overdue fees shown red only", "err": "Length must be a number in metres.", "errCode": "Error 400: NaN", "sp": ["Fee total", "Total: 90 cr.", "Total shown in 8 px grey type", "text", "Total in tiny grey type"]});
kit({"id": "warehouse", "name": "Warehouse slot booking", "url": "slots.dockstore.example/book", "kind": "tanker", "title": "Book a loading slot", "field": "Pallets", "jar": "Unit load count", "text": "Slots last 30 minutes.", "btn": "Book slot", "btnShort": "Book", "cancel": "Cancel the slot", "wipe": "Delete my bookings", "status": "Slot booked for 09:30.", "noun": "slot", "icons": "Dock 1 · Dock 2 · Dock 3", "iconsBad": "▣ ▤ ▥", "names": ["Book", "Reserve", "Hold", "Claim"], "flexWhat": "Reminder time", "cl": "Dock busy shown by colour only", "err": "Your slot clashes with another booking.", "errCode": "Error 409: SLOT_CLASH", "sp": ["Time slots", "09:30 · 10:00 · 10:30", "Slots are small buttons 12 px wide", "target", "Slots as 12 px buttons"]});
kit({"id": "customs", "name": "Customs declaration", "url": "declare.berthcustoms.example/new", "kind": "tanker", "title": "Declare your goods", "field": "Goods", "jar": "Commodity classification", "text": "Fines apply to late declarations.", "btn": "Declare", "btnShort": "Declare", "cancel": "Withdraw declaration", "wipe": "Delete my declarations", "status": "Declaration 7710 filed.", "noun": "item", "icons": "Food · Tools · Textiles", "iconsBad": "☘ ⚙ ✂", "names": ["Declare", "File", "Submit", "Lodge"], "flexWhat": "Language", "cl": "Duty due shown red only", "err": "HS code must have 6 digits.", "errCode": "Error 422: HS_LEN", "sp": ["Duty", "Duty: 12 cr.", "Duty explained as “ad valorem tariff”", "realworld", "Ad valorem tariff, schedule 4"]});
kit({"id": "pallet", "name": "Pallet tracker", "url": "track.dockstore.example/where", "kind": "tanker", "title": "Where is your pallet?", "field": "Pallet ID", "jar": "Unit load identifier", "text": "Updates every 10 minutes.", "btn": "Track", "btnShort": "Track", "cancel": "Reroute pallet", "wipe": "Delete my list", "status": "Pallet is at dock 3.", "noun": "pallet", "icons": "Packed · Loaded · Sent", "iconsBad": "▣ ▤ ➤", "names": ["Track", "Find", "Locate", "Follow"], "flexWhat": "Text size", "cl": "Delay shown by colour only", "err": "Pallet ID not found.", "errCode": "Error 404: PALLET_NULL", "sp": ["Map", "Dock 3, row B.", "The map has no legend", "recognition", "A map of dots with no legend"]});
kit({"id": "cruise", "name": "Cruise booking", "url": "book.bluehorizon.example/sail", "kind": "liner", "title": "Book a cruise", "field": "Cabin", "jar": "Berth category", "text": "Prices per person, two sharing.", "btn": "Book cruise", "btnShort": "Book", "cancel": "Cancel booking", "wipe": "Delete my trips", "status": "Booked. Sailing 4 June.", "noun": "cabin", "icons": "Inside · Ocean · Suite", "iconsBad": "▣ ≈ ★", "names": ["Book", "Reserve", "Hold", "Secure"], "flexWhat": "Currency", "cl": "Cabin availability shown by colour only", "err": "That cabin is no longer available.", "errCode": "Error 409: CABIN_GONE", "sp": ["Insurance", "Optional travel insurance: 40 cr.", "Insurance is ticked already, hidden below", "prevention", "A pre-ticked box far below the button"]});
kit({"id": "spa", "name": "Spa booking", "url": "spa.bluehorizon.example/treat", "kind": "liner", "title": "Book a treatment", "field": "Treatment", "jar": "Therapy procedure code", "text": "Arrive 10 minutes early.", "btn": "Book treatment", "btnShort": "Book", "cancel": "Cancel treatment", "wipe": "Delete my profile", "status": "Booked for Friday at 15:00.", "noun": "treatment", "icons": "Massage · Facial · Sauna", "iconsBad": "♥ ☺ ♨", "names": ["Book", "Reserve", "Treat", "Hold"], "flexWhat": "Reminder time", "cl": "Free slots shown by colour only", "err": "Choose a slot between 10:00 and 18:00.", "errCode": "Error 422: HOURS", "sp": ["Cancellation", "Free cancellation up to 24 hours.", "Cancellation terms only in a PDF link", "minimal", "Terms in a PDF link"]});
kit({"id": "table", "name": "Restaurant table", "url": "tables.lampside.example/seat", "kind": "liner", "title": "Reserve a table", "field": "Guests", "jar": "Party size", "text": "Tables held for 15 minutes.", "btn": "Reserve", "btnShort": "Reserve", "cancel": "Cancel the table", "wipe": "Delete my reservations", "status": "Table for 4 at 19:30 reserved.", "noun": "table", "icons": "Terrace · Bar · Window", "iconsBad": "☼ ♪ ▣", "names": ["Reserve", "Book", "Hold", "Save"], "flexWhat": "Dietary notes", "cl": "Table free or taken shown by colour only", "err": "We cannot seat more than 8 online.", "errCode": "Error 422: PARTY_MAX", "sp": ["Allergies", "Tell us any allergies.", "Allergy box is a 10 px grey field", "contrast", "Allergies in a faint box"]});
kit({"id": "upgrade", "name": "Hotel upgrade offer", "url": "upgrade.lampside.example/room", "kind": "liner", "title": "Upgrade your room", "field": "Room", "jar": "Accommodation tier", "text": "Offer ends tomorrow.", "btn": "Upgrade", "btnShort": "Upgrade", "cancel": "Keep my room", "wipe": "Delete my booking", "status": "Upgraded. Enjoy the view.", "noun": "room", "icons": "Standard · Deluxe · Suite", "iconsBad": "☗ ★ ♛", "names": ["Upgrade", "Pay more", "Move up", "Switch"], "flexWhat": "Currency", "cl": "Offer urgency shown by colour only", "err": "That upgrade is no longer available.", "errCode": "Error 409: TIER_GONE", "sp": ["Price difference", "Upgrade costs 30 cr more.", "Price difference shown only after clicking Upgrade", "status", "Price appears after you commit"]});
kit({"id": "theatre", "name": "Theatre box office", "url": "box.tidehall.example/seat", "kind": "liner", "title": "Choose your seats", "field": "Seats", "jar": "Seat pair", "text": "Tickets held for 10 minutes.", "btn": "Buy seats", "btnShort": "Buy", "cancel": "Release my seats", "wipe": "Delete my basket", "status": "Seats held. Pay in 10 minutes.", "noun": "seat", "icons": "Stalls · Circle · Box", "iconsBad": "♪ ♫ ★", "names": ["Buy", "Book", "Hold", "Pay"], "flexWhat": "Text size", "cl": "Seat free or taken shown by colour only", "err": "Seats must be next to each other.", "errCode": "Error 422: ADJACENT", "sp": ["Seat map", "Stalls row C.", "Seat map has no focus outline", "keyboard", "A seat map with no focus ring"]});
kit({"id": "yacht", "name": "Yacht charter", "url": "charter.bluehorizon.example/hire", "kind": "liner", "title": "Charter a yacht", "field": "Dates", "jar": "Charter window", "text": "Skipper included. Fuel extra.", "btn": "Request charter", "btnShort": "Request", "cancel": "Withdraw request", "wipe": "Delete my enquiry", "status": "Request sent. We reply tomorrow.", "noun": "yacht", "icons": "Sail · Motor · Catamaran", "iconsBad": "⛵ ⚙ ⚓", "names": ["Request", "Hire", "Book", "Enquire"], "flexWhat": "Currency", "cl": "Boat free or booked shown by colour only", "err": "Choose a start date in the future.", "errCode": "Error 422: DATE_PAST", "sp": ["Deposit", "Deposit: 20% today.", "Deposit shown as 0.2 × TOTAL", "realworld", "0.2 × TOTAL deposit"]});
kit({"id": "timetable", "name": "Ferry timetable", "url": "times.quayferry.example/next", "kind": "hydrofoil", "title": "Next departures", "field": "Stop", "jar": "Embarkation node", "text": "Times are for today only.", "btn": "Set alert", "btnShort": "Alert", "cancel": "Cancel alert", "wipe": "Delete my stops", "status": "Alert set for 17:40.", "noun": "stop", "icons": "Quay · Market · Pier", "iconsBad": "⚓ ✿ ≈", "names": ["Set alert", "Remind me", "Notify", "Alert"], "flexWhat": "Reminder time", "cl": "Delays shown by colour only", "err": "Pick a stop first.", "errCode": "Error 400: STOP_NULL", "sp": ["Departures", "17:40 · 18:10 · 18:40", "Times in 24h code like 1740Z", "realworld", "1740Z · 1810Z · 1840Z"]});
kit({"id": "railpass", "name": "Rail pass", "url": "pass.quayrail.example/buy", "kind": "hydrofoil", "title": "Buy a rail pass", "field": "Pass type", "jar": "Fare product SKU", "text": "Valid for 30 days from first use.", "btn": "Buy pass", "btnShort": "Buy", "cancel": "Refund my pass", "wipe": "Delete my passes", "status": "Pass bought. Valid from today.", "noun": "pass", "icons": "Day · Week · Month", "iconsBad": "① ⑦ ㉚", "names": ["Buy", "Pay", "Get", "Order"], "flexWhat": "Currency", "cl": "Zone coverage shown by colour only", "err": "That pass is not valid for zone 3.", "errCode": "Error 422: ZONE", "sp": ["Zones", "Zones 1 and 2.", "Zones shown as a coloured map only", "color", "Zones only by map colour"]});
kit({"id": "checkin", "name": "Flight check-in", "url": "checkin.skyquay.example/online", "kind": "hydrofoil", "title": "Check in online", "field": "Booking code", "jar": "PNR locator", "text": "Check-in opens 24 hours before.", "btn": "Check in", "btnShort": "Check in", "cancel": "Undo check-in", "wipe": "Delete my bookings", "status": "Checked in. Boarding pass sent.", "noun": "flight", "icons": "Today · Tomorrow · Later", "iconsBad": "✈ ☼ ⌚", "names": ["Check in", "Confirm", "Submit", "Done"], "flexWhat": "Seat preference", "cl": "Gate changes shown red only", "err": "Booking code must be 6 characters.", "errCode": "Error 400: PNR_LEN", "sp": ["Seat", "Seat 14A.", "Seat chosen for you with no way to change it", "control", "A seat that cannot be changed"]});
kit({"id": "airpark", "name": "Airport parking", "url": "park.skyquay.example/book", "kind": "hydrofoil", "title": "Book airport parking", "field": "Arrival", "jar": "Entry timestamp", "text": "Free shuttle every 10 minutes.", "btn": "Book parking", "btnShort": "Book", "cancel": "Cancel parking", "wipe": "Delete my bookings", "status": "Parking booked for 4 days.", "noun": "stay", "icons": "Short · Long · Valet", "iconsBad": "P ☼ ♛", "names": ["Book", "Reserve", "Hold", "Save"], "flexWhat": "Currency", "cl": "Lot fullness shown by colour only", "err": "Your return time is before your arrival.", "errCode": "Error 422: ORDER", "sp": ["Total", "4 days: 56 cr.", "Total updates silently with no announcement", "status", "Total changes with no notice"]});
kit({"id": "taxishare", "name": "Taxi share", "url": "share.quaycab.example/pool", "kind": "hydrofoil", "title": "Share a taxi", "field": "Destination", "jar": "Terminus node", "text": "Split the fare with strangers.", "btn": "Join ride", "btnShort": "Join", "cancel": "Leave ride", "wipe": "Delete my rides", "status": "Ride joined. Fare 4 cr.", "noun": "ride", "icons": "Now · Later · Daily", "iconsBad": "☻ ⌚ ⟳", "names": ["Join", "Share", "Pool", "Sign up"], "flexWhat": "Fare display", "cl": "Seats shown by colour only", "err": "That ride has already left.", "errCode": "Error 410: GONE", "sp": ["Rider list", "Ana and Pete.", "Riders’ full names and phones shown to everyone", "minimal", "All riders’ phone numbers visible"]});
kit({"id": "courier", "name": "Express courier", "url": "send.quaydash.example/new", "kind": "hydrofoil", "title": "Send a parcel", "field": "Weight", "jar": "Mass declaration", "text": "Same-day delivery before 18:00.", "btn": "Send parcel", "btnShort": "Send", "cancel": "Cancel the pickup", "wipe": "Delete my parcels", "status": "Pickup booked for 13:00.", "noun": "parcel", "icons": "Letter · Box · Pallet", "iconsBad": "✉ ▣ ▤", "names": ["Send", "Ship", "Post", "Dispatch"], "flexWhat": "Delivery day", "cl": "Pickup window shown by colour only", "err": "Parcel is too heavy for same-day delivery.", "errCode": "Error 413: MASS", "sp": ["Address", "12 Quay Street.", "Address field loses text when you tab away", "prevention", "Typed address is erased on blur"]});
kit({"id": "swap", "name": "Neighbourhood swap shelf", "url": "swap.quayfolk.example/offer", "kind": "raft", "title": "Swap something", "field": "Item", "jar": "Goods item descriptor", "text": "Swap, do not sell.", "btn": "Offer swap", "btnShort": "Offer", "cancel": "Withdraw offer", "wipe": "Delete my items", "status": "Offer posted.", "noun": "item", "icons": "Books · Tools · Plants", "iconsBad": "▤ ⚙ ♣", "names": ["Offer", "Swap", "Trade", "Post"], "flexWhat": "Text size", "cl": "New items shown by colour only", "err": "Please describe your item in at least 10 characters.", "errCode": "Error 400: DESC_SHORT", "sp": ["Photo", "Add a photo.", "Photo upload shows no preview", "status", "Upload with no preview or progress"]});
kit({"id": "skills", "name": "Skill swap", "url": "skills.quayfolk.example/trade", "kind": "raft", "title": "Share a skill", "field": "Skill", "jar": "Competency tag", "text": "Teach an hour, learn an hour.", "btn": "Offer skill", "btnShort": "Offer", "cancel": "Withdraw skill", "wipe": "Delete my profile", "status": "Skill listed.", "noun": "skill", "icons": "Cook · Sew · Code", "iconsBad": "♨ ✂ ▤", "names": ["Offer", "Share", "Teach", "List"], "flexWhat": "Language", "cl": "Match shown by colour only", "err": "That skill is already listed.", "errCode": "Error 409: DUP", "sp": ["Availability", "Weekday evenings.", "Availability calendar is only a picture", "recognition", "A calendar image, not a picker"]});
kit({"id": "repairc", "name": "Repair cafe", "url": "repair.quayfolk.example/book", "kind": "raft", "title": "Book a repair slot", "field": "Item", "jar": "Defective unit descriptor", "text": "Volunteers repair for free.", "btn": "Book slot", "btnShort": "Book", "cancel": "Cancel slot", "wipe": "Delete my items", "status": "Slot booked for Saturday.", "noun": "slot", "icons": "Electrics · Bikes · Clothes", "iconsBad": "⚡ ⚙ ✂", "names": ["Book", "Reserve", "Hold", "Join"], "flexWhat": "Reminder time", "cl": "Slots left shown by colour only", "err": "Saturday is full. Try another day.", "errCode": "Error 409: FULL", "sp": ["Items", "Bring one item.", "Limit of one item is not said until after booking", "minimal", "Rule revealed after booking"]});
kit({"id": "plots", "name": "Community garden plots", "url": "plots.quayfolk.example/claim", "kind": "raft", "title": "Claim a garden plot", "field": "Plot number", "jar": "Allotment identifier", "text": "One plot per household.", "btn": "Claim plot", "btnShort": "Claim", "cancel": "Release plot", "wipe": "Delete my claim", "status": "Plot 14 is yours until October.", "noun": "plot", "icons": "Sunny · Shade · Raised", "iconsBad": "☼ ☁ ▣", "names": ["Claim", "Reserve", "Take", "Book"], "flexWhat": "Text size", "cl": "Plot free or taken shown by colour only", "err": "That plot is already claimed.", "errCode": "Error 409: TAKEN", "sp": ["Season", "Spring to autumn.", "Season shown only as a swatch", "color", "Season by colour swatch only"]});
kit({"id": "permit", "name": "Street party permit", "url": "permit.berthcouncil.example/apply", "kind": "raft", "title": "Apply for a street party permit", "field": "Street", "jar": "Highway segment", "text": "Apply 6 weeks ahead.", "btn": "Apply", "btnShort": "Apply", "cancel": "Withdraw application", "wipe": "Delete my application", "status": "Application 612 received.", "noun": "permit", "icons": "Small · Medium · Large", "iconsBad": "☻ ♫ ✿", "names": ["Apply", "Submit", "Request", "File"], "flexWhat": "Language", "cl": "Status shown by colour only", "err": "Choose a date at least 6 weeks away.", "errCode": "Error 422: LEAD", "sp": ["Neighbours", "Tell your neighbours.", "Required field is marked with a pale asterisk only", "contrast", "A faint asterisk marks required fields"]});
kit({"id": "bookswap", "name": "Book swap", "url": "books.quayfolk.example/swap", "kind": "raft", "title": "Swap a book", "field": "Title", "jar": "Bibliographic title", "text": "Leave one, take one.", "btn": "Post book", "btnShort": "Post", "cancel": "Take it back", "wipe": "Delete my books", "status": "Book posted.", "noun": "book", "icons": "Novel · Kids · Maps", "iconsBad": "▤ ☺ ☗", "names": ["Post", "Offer", "Swap", "Add"], "flexWhat": "Text size", "cl": "Read and unread shown by colour only", "err": "That book is already on the shelf.", "errCode": "Error 409: DUP", "sp": ["Shelf", "12 books.", "Shelf shows 200 books on one page", "minimal", "200 books in one list"]});
kit({"id": "catchlog", "name": "Catch log", "url": "log.quaytrawl.example/today", "kind": "trawler", "title": "Log today’s catch", "field": "Species", "jar": "Taxonomic designation", "text": "Logs are legal records.", "btn": "Save catch", "btnShort": "Save", "cancel": "Edit last entry", "wipe": "Delete the log", "status": "Catch saved: 42 kg.", "noun": "entry", "icons": "Cod · Haddock · Crab", "iconsBad": "☻ ☺ ✂", "names": ["Save", "Log", "Record", "Enter"], "flexWhat": "Units", "cl": "Weight ok or over shown by colour only", "err": "Weight must be a number in kg.", "errCode": "Error 400: NaN", "sp": ["Weight", "42 kg.", "Units switch between kg and lb silently", "consistency", "Units change without notice"]});
kit({"id": "quotaperm", "name": "Quota permit", "url": "permit.quaytrawl.example/apply", "kind": "trawler", "title": "Apply for a quota permit", "field": "Vessel number", "jar": "Vessel registration identifier", "text": "Quotas reset each season.", "btn": "Apply", "btnShort": "Apply", "cancel": "Withdraw application", "wipe": "Delete my application", "status": "Application received.", "noun": "permit", "icons": "Cod · Haddock · Crab", "iconsBad": "☻ ☺ ✂", "names": ["Apply", "Submit", "Request", "File"], "flexWhat": "Language", "cl": "Quota left shown by colour only", "err": "Vessel number not found.", "errCode": "Error 404: VESSEL_NULL", "sp": ["Quota", "1,200 kg left.", "Quota meter has no label", "recognition", "A bar with no label"]});
kit({"id": "iceorder", "name": "Ice order", "url": "ice.quaytrawl.example/order", "kind": "trawler", "title": "Order ice for the boat", "field": "Sacks", "jar": "Cryogenic unit count", "text": "Delivered at 04:00.", "btn": "Order ice", "btnShort": "Order", "cancel": "Cancel order", "wipe": "Delete my account", "status": "Order placed for 04:00.", "noun": "order", "icons": "10 · 20 · 50", "iconsBad": "① ② ⑤", "names": ["Order", "Buy", "Get", "Request"], "flexWhat": "Reminder time", "cl": "Stock shown by colour only", "err": "Order before midnight for 04:00 delivery.", "errCode": "Error 422: CUTOFF", "sp": ["Delivery time", "04:00.", "Delivery time reads 0400 UTC+0", "realworld", "0400 UTC+0"]});
kit({"id": "tides", "name": "Tide table", "url": "tides.berthoffice.example/day", "kind": "trawler", "title": "Tide table", "field": "Port", "jar": "Hydrographic station", "text": "High 18:42 at 4.1 m.", "btn": "Set alert", "btnShort": "Alert", "cancel": "Clear alert", "wipe": "Delete my ports", "status": "Alert set for 18:00.", "noun": "port", "icons": "Halcyon · Marrow · Vael", "iconsBad": "≈ ⚓ ☗", "names": ["Set alert", "Remind me", "Notify", "Alert"], "flexWhat": "Units", "cl": "High and low shown by colour only", "err": "Choose a port first.", "errCode": "Error 400: PORT_NULL", "sp": ["Graph", "High 18:42.", "Graph has no axis labels", "text", "A graph with unlabeled axes"]});
kit({"id": "boatfix", "name": "Boat repair quote", "url": "fix.quaytrawl.example/quote", "kind": "trawler", "title": "Get a repair quote", "field": "Fault", "jar": "Defect description", "text": "Quotes within one day.", "btn": "Get quote", "btnShort": "Quote", "cancel": "Cancel quote", "wipe": "Delete my quotes", "status": "Quote requested.", "noun": "quote", "icons": "Engine · Hull · Net", "iconsBad": "⚙ ≈ ═", "names": ["Quote", "Request", "Ask", "Get"], "flexWhat": "Contact method", "cl": "Urgency shown by colour only", "err": "Please add a photo.", "errCode": "Error 400: ATTACH", "sp": ["Photos", "Add a photo.", "Photo upload fails silently for big files", "errors", "Upload fails with no message"]});
kit({"id": "shiftswap", "name": "Crew shift swap", "url": "shifts.quaytrawl.example/swap", "kind": "trawler", "title": "Swap a shift", "field": "Date", "jar": "Shift date", "text": "Swaps need the skipper’s ok.", "btn": "Ask to swap", "btnShort": "Ask", "cancel": "Cancel swap", "wipe": "Delete my shifts", "status": "Swap request sent.", "noun": "shift", "icons": "Day · Night · Split", "iconsBad": "☼ ☾ ⌚", "names": ["Ask to swap", "Request", "Offer", "Swap"], "flexWhat": "Reminder time", "cl": "Pending swaps shown by colour only", "err": "That shift is already swapped.", "errCode": "Error 409: SWAPPED", "sp": ["Crew list", "Ana, Pete, Noa.", "Swapping is irreversible once the skipper agrees", "control", "No undo after the skipper agrees"]});
kit({"id": "stormalert", "name": "Storm alert sign-up", "url": "alerts.berthoffice.example/storm", "kind": "lightship", "title": "Get storm alerts", "field": "Phone", "jar": "Notification number", "text": "Alerts by text, free.", "btn": "Sign up", "btnShort": "Sign up", "cancel": "Stop alerts", "wipe": "Delete my number", "status": "You will get storm alerts.", "noun": "alert", "icons": "Storm · Fog · Ice", "iconsBad": "☂ ☁ ☃", "names": ["Sign up", "Join", "Subscribe", "Enrol"], "flexWhat": "Language", "cl": "Severity shown by colour only", "err": "That number cannot receive texts.", "errCode": "Error 422: LANDLINE", "sp": ["Warning level", "Level 2 of 4.", "Warning level only in a colour bar", "color", "Level shown by colour alone"]});
kit({"id": "lhtour", "name": "Lighthouse tour", "url": "tour.berthoffice.example/climb", "kind": "lightship", "title": "Climb the lighthouse", "field": "Date", "jar": "Visit date", "text": "Tours take 45 minutes. 148 steps.", "btn": "Book tour", "btnShort": "Book", "cancel": "Cancel tour", "wipe": "Delete my bookings", "status": "Booked for Saturday at 11:00.", "noun": "tour", "icons": "Morning · Noon · Dusk", "iconsBad": "☼ ☀ ☾", "names": ["Book", "Reserve", "Hold", "Join"], "flexWhat": "Text size", "cl": "Tours left shown by colour only", "err": "Tours are full that day.", "errCode": "Error 409: FULL", "sp": ["Access", "Wheelchair access: ground floor only.", "Accessibility info is a tooltip only", "minimal", "Access info in a hover tooltip"]});
kit({"id": "tidewarn", "name": "Tide warnings", "url": "warn.berthoffice.example/tide", "kind": "lightship", "title": "Tide warnings", "field": "Berth", "jar": "Mooring identifier", "text": "Flood risk is shown per berth.", "btn": "Subscribe", "btnShort": "Join", "cancel": "Unsubscribe", "wipe": "Delete my berths", "status": "Subscribed to berth 12.", "noun": "warning", "icons": "Low · Medium · High", "iconsBad": "▲ ■ ▼", "names": ["Subscribe", "Follow", "Watch", "Join"], "flexWhat": "Reminder time", "cl": "Risk shown by colour only", "err": "Pick a berth from the list.", "errCode": "Error 400: BERTH", "sp": ["Water level", "2.4 m.", "Water level updates with no timestamp", "status", "No time on the water level"]});
kit({"id": "lostprop", "name": "Lost property", "url": "lost.berthoffice.example/find", "kind": "lightship", "title": "Find lost property", "field": "Item", "jar": "Object description", "text": "Items kept for 30 days.", "btn": "Search", "btnShort": "Search", "cancel": "Clear search", "wipe": "Delete my claims", "status": "3 items match your description.", "noun": "item", "icons": "Bags · Keys · Coats", "iconsBad": "▣ ⚷ ☗", "names": ["Search", "Find", "Look", "Go"], "flexWhat": "Text size", "cl": "Matches shown by colour only", "err": "No items match. Try fewer words.", "errCode": "Error 404: NONE", "sp": ["Claim code", "Show this code at the desk.", "Claim code is an image with no text", "recognition", "Claim code as an image only"]});
kit({"id": "emergency", "name": "Emergency contacts", "url": "contacts.berthoffice.example/set", "kind": "lightship", "title": "Emergency contacts", "field": "Name", "jar": "Next-of-kin designation", "text": "We call these in an emergency.", "btn": "Save contact", "btnShort": "Save", "cancel": "Undo change", "wipe": "Delete all contacts", "status": "Contact saved.", "noun": "contact", "icons": "Family · Doctor · Work", "iconsBad": "♥ ✚ ⚒", "names": ["Save", "Add", "Keep", "Store"], "flexWhat": "Language", "cl": "Primary contact shown by colour only", "err": "Add a phone number that works.", "errCode": "Error 422: PHONE", "sp": ["Order", "Primary first.", "Contacts can be reordered only with a mouse drag", "keyboard", "Drag-only reordering"]});
kit({"id": "firstaid", "name": "First aid course", "url": "course.berthoffice.example/join", "kind": "lightship", "title": "Book a first aid course", "field": "Date", "jar": "Course date", "text": "Certificate valid for 3 years.", "btn": "Book course", "btnShort": "Book", "cancel": "Cancel booking", "wipe": "Delete my bookings", "status": "Booked for 12 March.", "noun": "course", "icons": "Basic · Child · Advanced", "iconsBad": "✚ ☺ ★", "names": ["Book", "Join", "Reserve", "Enrol"], "flexWhat": "Text size", "cl": "Places left shown by colour only", "err": "That course has no places left.", "errCode": "Error 409: FULL", "sp": ["Price", "60 cr.", "Price changes when you pick a different date, silently", "consistency", "Price changes with no notice"]});
kit({"id": "bingo", "name": "Pier bingo club", "url": "bingo.quaypier.example/join", "kind": "paddle", "title": "Join Friday bingo", "field": "Name", "jar": "Player name", "text": "Doors at 19:00. Eyes down at 19:30.", "btn": "Join", "btnShort": "Join", "cancel": "Leave the game", "wipe": "Delete my cards", "status": "You are in. Card 14.", "noun": "card", "icons": "Full house · Line · Corners", "iconsBad": "▣ ★ ◆", "names": ["Join", "Sign up", "Play", "Enter"], "flexWhat": "Text size", "cl": "Called numbers shown by colour only", "err": "Please choose at least one card.", "errCode": "Error 400: CARDS", "sp": ["Numbers", "Called: 7, 22, 41.", "Called numbers vanish after 2 seconds", "minimal", "Numbers disappear quickly"]});
kit({"id": "dance", "name": "Dance class booking", "url": "dance.quaypier.example/book", "kind": "paddle", "title": "Book a dance class", "field": "Class", "jar": "Instructional session", "text": "First class is free.", "btn": "Book class", "btnShort": "Book", "cancel": "Cancel class", "wipe": "Delete my account", "status": "Booked for Thursday at 19:00.", "noun": "class", "icons": "Waltz · Swing · Salsa", "iconsBad": "♪ ♫ ♬", "names": ["Book", "Reserve", "Join", "Sign up"], "flexWhat": "Reminder time", "cl": "Places left shown by colour only", "err": "That class is full.", "errCode": "Error 409: FULL", "sp": ["Level", "Beginner.", "Level choices use symbols only", "recognition", "Symbols with no words"]});
kit({"id": "icecream", "name": "Ice cream pre-order", "url": "order.quaypier.example/cone", "kind": "paddle", "title": "Pre-order an ice cream", "field": "Flavour", "jar": "Frozen confection variant", "text": "Collect at the pier kiosk.", "btn": "Order", "btnShort": "Order", "cancel": "Cancel order", "wipe": "Delete my orders", "status": "Order ready in 5 minutes.", "noun": "flavour", "icons": "Vanilla · Mint · Berry", "iconsBad": "♥ ☘ ●", "names": ["Order", "Buy", "Get", "Reserve"], "flexWhat": "Dietary notes", "cl": "Sold out shown by colour only", "err": "That flavour is sold out.", "errCode": "Error 409: OUT", "sp": ["Toppings", "Sprinkles free.", "Toppings are pre-ticked and cost extra", "prevention", "Extra toppings added by default"]});
kit({"id": "golf", "name": "Crazy golf booking", "url": "golf.quaypier.example/hole", "kind": "paddle", "title": "Book crazy golf", "field": "Players", "jar": "Participant count", "text": "18 holes. Putters provided.", "btn": "Book round", "btnShort": "Book", "cancel": "Cancel round", "wipe": "Delete my bookings", "status": "Round booked for 15:00.", "noun": "round", "icons": "Pirate · Space · Jungle", "iconsBad": "☠ ★ ♣", "names": ["Book", "Reserve", "Hold", "Play"], "flexWhat": "Text size", "cl": "Free slots shown by colour only", "err": "That slot is taken.", "errCode": "Error 409: TAKEN", "sp": ["Scorecard", "Par 54.", "Scorecard in 8 px type", "text", "Scorecard in tiny type"]});
kit({"id": "arcade", "name": "Pier arcade tokens", "url": "arcade.quaypier.example/buy", "kind": "paddle", "title": "Buy tokens", "field": "Tokens", "jar": "Credit quantity", "text": "10 tokens = 5 cr. No refunds.", "btn": "Buy tokens", "btnShort": "Buy", "cancel": "Refund tokens", "wipe": "Delete my account", "status": "Bought 10 tokens.", "noun": "game", "icons": "Racing · Claw · Pinball", "iconsBad": "☗ ✋ ●", "names": ["Buy", "Pay", "Get", "Top up"], "flexWhat": "Currency", "cl": "Balance shown red only", "err": "That amount is not a multiple of 10.", "errCode": "Error 422: STEP", "sp": ["Balance", "Balance: 10 tokens.", "Balance shown in “credits” in one place and “tokens” in another", "consistency", "Credits here, tokens there"]});
kit({"id": "carousel", "name": "Carousel rides", "url": "carousel.quaypier.example/ride", "kind": "paddle", "title": "Ride the carousel", "field": "Riders", "jar": "Passenger count", "text": "Each ride lasts 3 minutes.", "btn": "Buy ride", "btnShort": "Buy", "cancel": "Refund ride", "wipe": "Delete my tickets", "status": "Ticket bought. Next ride at 15:20.", "noun": "ride", "icons": "Horse · Cart · Swan", "iconsBad": "☗ ▣ ☺", "names": ["Buy", "Pay", "Get", "Ride"], "flexWhat": "Text size", "cl": "Next ride shown by colour only", "err": "Rides are for ages 3 and up.", "errCode": "Error 422: AGE", "sp": ["Rules", "Hold on at all times.", "Rules appear in a pop-up that closes itself", "control", "A pop-up that auto-closes"]});
kit({"id": "vault", "name": "Password vault", "url": "vault.deepkeep.example/open", "kind": "submarine", "title": "Open your vault", "field": "Master password", "jar": "Primary secret", "text": "Your vault is encrypted on this device.", "btn": "Unlock", "btnShort": "Unlock", "cancel": "Lock now", "wipe": "Wipe my vault", "status": "Vault unlocked.", "noun": "secret", "icons": "Logins · Cards · Notes", "iconsBad": "⚷ ▣ ✎", "names": ["Unlock", "Open", "Enter", "Log in"], "flexWhat": "Auto-lock", "cl": "Strength shown by colour only", "err": "Master password is too short.", "errCode": "Error 400: ENTROPY", "sp": ["Hint", "Hint: first pet.", "Password hint is shown in plain text to everyone", "prevention", "Hint visible without unlocking"]});
kit({"id": "vpn", "name": "VPN client", "url": "vpn.deepkeep.example/connect", "kind": "submarine", "title": "Connect to the VPN", "field": "Server", "jar": "Egress node", "text": "Your traffic is encrypted.", "btn": "Connect", "btnShort": "Connect", "cancel": "Disconnect", "wipe": "Delete my profile", "status": "Connected to Marrow.", "noun": "server", "icons": "Marrow · Vael · Isle", "iconsBad": "⚑ ⚓ ☗", "names": ["Connect", "Join", "Go online", "Tunnel"], "flexWhat": "Language", "cl": "Connection state shown by colour only", "err": "Connection failed. Try another server.", "errCode": "Error 504: TIMEOUT", "sp": ["Status", "Connected.", "Status is a coloured dot with no words", "status", "Status by colour dot only"]});
kit({"id": "burner", "name": "Burner email", "url": "mail.deepkeep.example/new", "kind": "submarine", "title": "Make a burner email", "field": "Alias", "jar": "Disposable address", "text": "Addresses last 24 hours.", "btn": "Create address", "btnShort": "Create", "cancel": "Delete address now", "wipe": "Delete my aliases", "status": "Address created: otter47@…", "noun": "alias", "icons": "1 hour · 1 day · 1 week", "iconsBad": "⌚ ☼ ⌛", "names": ["Create", "Make", "Generate", "Get"], "flexWhat": "Language", "cl": "Active shown by colour only", "err": "That alias is taken.", "errCode": "Error 409: TAKEN", "sp": ["Expiry", "Expires in 24 hours.", "Expiry shown as a Unix timestamp", "realworld", "Expires 1731000000"]});
kit({"id": "stealthshop", "name": "Quiet shop", "url": "shop.deepkeep.example/cart", "kind": "submarine", "title": "Shop privately", "field": "Item", "jar": "Goods identifier", "text": "No tracking, no ads.", "btn": "Add to basket", "btnShort": "Add", "cancel": "Remove from basket", "wipe": "Empty basket", "status": "Added. Basket has 2 items.", "noun": "item", "icons": "Books · Tools · Tea", "iconsBad": "▤ ⚙ ☕", "names": ["Add", "Put", "Place", "Insert"], "flexWhat": "Currency", "cl": "Stock shown by colour only", "err": "That item is out of stock.", "errCode": "Error 409: OUT", "sp": ["Delivery", "Delivery in 5 days.", "Delivery estimate hidden until payment", "minimal", "Delivery time revealed at the end"]});
kit({"id": "securenotes", "name": "Secure notes", "url": "notes.deepkeep.example/write", "kind": "submarine", "title": "Write a secure note", "field": "Note", "jar": "Plaintext payload", "text": "Notes self-destruct after reading.", "btn": "Save note", "btnShort": "Save", "cancel": "Undo last change", "wipe": "Burn all notes", "status": "Note saved. Burns after one read.", "noun": "note", "icons": "Plans · Lists · Ideas", "iconsBad": "✎ ▤ ☼", "names": ["Save", "Store", "Keep", "Write"], "flexWhat": "Text size", "cl": "Read and unread shown by colour only", "err": "Notes are limited to 2,000 characters.", "errCode": "Error 413: LONG", "sp": ["Burn", "Burn after reading.", "“Burn all” sits next to Save, no confirmation", "prevention", "Burn all beside Save, no confirmation"]});
kit({"id": "tipline", "name": "Anonymous tipline", "url": "tips.deepkeep.example/send", "kind": "submarine", "title": "Send a tip", "field": "Tip", "jar": "Free-text report", "text": "We cannot trace you.", "btn": "Send tip", "btnShort": "Send", "cancel": "Withdraw tip", "wipe": "Delete my tips", "status": "Tip received. Thank you.", "noun": "tip", "icons": "Safety · Fraud · Other", "iconsBad": "✚ $ …", "names": ["Send", "Submit", "Report", "File"], "flexWhat": "Language", "cl": "Tip status shown by colour only", "err": "Please say a little more.", "errCode": "Error 400: SHORT", "sp": ["Follow-up", "Use code 4471 to check.", "Follow-up code shown once and cannot be found again", "recognition", "A code you cannot retrieve again"]});
/* spread a few older interfaces over the new hulls so every ship type has company */
(() => {
  const NEWK = ['tanker', 'liner', 'hydrofoil', 'raft', 'trawler', 'lightship', 'paddle', 'submarine'];
  const old = Object.keys(TEMPLATES).filter(id => SHIP_KIND[id] && !NEWK.includes(SHIP_KIND[id]) && SHIP_KIND[id] !== 'junk' && SHIP_KIND[id] !== 'gala' && !BRIGADE[id] && !TROLLTPL(id)).sort();
  function TROLLTPL(id) { return typeof TROLL !== 'undefined' && TROLL && TROLL[id]; }
  old.forEach((id, i) => { if (i % 5 === 2) SHIP_KIND[id] = NEWK[(i / 5 | 0) % NEWK.length]; });
})();
/* ───────────────────── 11p. Not forms: 24 interfaces with their own shapes (grids, boards, tables, players, dashboards, maps) ───────────────────── */
const DANGER = (t) => danger(t);
const cell = (t, bg = '#fff', fg = '#1d2530', extra = '') => `<span style="display:inline-block;box-sizing:border-box;width:13.5%;min-height:34px;margin:0 .3%;padding:2px;font-size:12px;text-align:center;vertical-align:top;background:${bg};color:${fg};border:1px solid #d6dbe0;${extra}">${t}</span>`;
const DOT = (c, t = '') => `<i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c}"></i>${t ? ' ' + t : ''}`;
const bar = (pct, c = '#2e86ab', h = 12) => `<span style="display:inline-block;width:100px;height:${h}px;background:#e3e8ec;vertical-align:middle"><i style="display:block;width:${pct}%;height:100%;background:${c}"></i></span>`;

/* 1. month calendar */
defTpl('calmonth', 'Quay diary calendar', 'diary.quaycal.example/month', ['Dates are written 7 Nov, never 11/7.', 'Every control has a word.'], 'liner', [
  P('title', 'Month heading', H2('November 2026'), [fJar('weekIso', 'Wk 45 / 2026-11 (ISO)')]),
  P('nav', 'Month arrows', `<p>${B('◀ Previous', 's secondary')} ${B('Next ▶', 's secondary')}</p>`, [fTgt('navTiny', 'Month arrows', '◀ ▶', 30)]),
  P('grid', 'Day grid', `<div>${many(14, i => cell(`<b>${i + 1}</b>${i % 5 === 2 ? '<br><small>Dentist</small>' : ''}${i === 6 ? '<br><small>Ferry</small>' : ''}`, i === 6 ? '#fff4c7' : '#fff'))}</div>`, [F('gridCol', 'color', 'Busy days differ from free days by colour only', W.color, `<div>${many(14, i => cell(`${i + 1}`, i % 5 === 2 ? '#bfe0ff' : '#fff'))}</div>`)]),
  P('today', 'Today marker', NOTE('Today is <b>Thu 5 Nov</b> (outlined).'), [fNone('noToday', 'status', 'Nothing marks today', W.stat)]),
  P('legend', 'Legend', NOTE(`${DOT('#1e8e3e')} Work · ${DOT('#c0392b')} Home · ${DOT('#2e86ab')} Ferry`), [fTiny('legTiny', 'The legend'), fGrey('legGrey', 'The legend')]),
  P('add', 'Add event', B('Add event'), [fCons('addMix', 'Add, New and Create used for one action', NOTE('Add · New · Create'))]),
  P('del', 'Delete all events', NOTE(`${LK('Delete all events this month')} (asks first)`), [fPrev('delNow', '“Delete all events” sits beside Add, no confirmation', DANGER('Delete all events'))]),
  P('undo', 'Undo', NOTE(`${LK('Undo last change')}`), [fNone('noUndo', 'control', 'Edits cannot be undone', WHY_UNDO)]),
  P('sync', 'Sync', NOTE('Synced 2 minutes ago.'), [fErr('syncErr', 'Error 0x80190: CAL_SYNC')])
], { w: 560 });

/* 2. data table */
const trows = (n, f) => many(n, i => `<tr style="background:${i % 2 ? '#f5f7f8' : '#fff'}">${f(i)}</tr>`);
defTpl('dtable', 'Berth ledger table', 'ledger.berthoffice.example/table', ['Columns have words, never codes.', 'Sorting is shown with an arrow and a word.'], 'tanker', [
  P('title', 'Table title', H2('Berth ledger')),
  P('head', 'Column headings', `<table style="color:#1d2530;width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th align=left>Ship</th><th align=left>Berth</th><th align=left>Status</th></tr></thead><tbody>${trows(4, i => `<td>MV Gull ${i + 1}</td><td>${i + 3}</td><td>${['Docked', 'Waiting', 'Docked', 'Left'][i]}</td>`)}</tbody></table>`, [fJar('headJar', '<table style="color:#1d2530;width:100%;font-size:13px"><tr><th align=left>VSL_ID</th><th align=left>BTH_NO</th><th align=left>STS_CD</th></tr><tr><td>0x4F1</td><td>3</td><td>D</td></tr></table>')]),
  P('status', 'Status column', NOTE(`${DOT('#1e8e3e')} Docked · ${DOT('#e6a700')} Waiting · ${DOT('#888')} Left`), [F('statCol', 'color', 'Status shown by coloured dots only', W.color, NOTE(`${DOT('#1e8e3e')} ${DOT('#e6a700')} ${DOT('#888')}`))]),
  P('sort', 'Sort control', NOTE(`Sorted by <b>Berth ▲</b> ${LK('Reverse')}`), [fNone('noSort', 'status', 'Nothing shows which column is sorted', W.stat)]),
  P('rows', 'Row count', NOTE('Showing 4 of 4 ships.'), [fMin('rowMany', 'Four hundred rows on one page', `<div style="max-height:90px;overflow:auto;font-size:11px">${many(60, i => `<div>MV Gull ${i + 1} · berth ${i % 9} · docked</div>`)}</div>`)]),
  P('cell', 'Cell text', NOTE('Row text is 14 px.'), [fTiny('cellTiny', 'Row text'), fGrey('cellGrey', 'Row text')]),
  P('rowbtn', 'Row buttons', NOTE(`${B('Open', 's')} ${B('Edit', 's secondary')}`), [fTgt('rowTiny', 'Row buttons', 'Open', 32)]),
  P('purge', 'Remove row', NOTE(`${LK('Remove selected rows')} (asks first)`), [fPrev('purgeNow', '“Remove” sits beside Open, no confirmation', DANGER('Remove selected rows'))]),
  P('export', 'Export', NOTE(`${B('Export', 's')} as CSV or print.`), [fErr('expErr', 'Error 500: SERIALIZE_FAIL')])
], { w: 560 });

/* 3. kanban */
const kcard = (t, c = '#fff') => `<div style="padding:5px;margin:4px 0;background:${c};border:1px solid #d6dbe0;font-size:12px">${t}</div>`;
defTpl('kanban', 'Crew task board', 'tasks.quaycrew.example/board', ['Columns are named To do, Doing, Done.', 'Every card has a visible owner.'], 'trawler', [
  P('title', 'Board title', H2('Crew task board')),
  P('cols', 'Three columns', `<div style="display:flex;gap:6px">${['To do', 'Doing', 'Done'].map((c, i) => `<div style="flex:1;background:#eef1f3;padding:5px"><b style="font-size:12px">${c}</b>${kcard(['Mend net', 'Paint hull', 'Ice order'][i] + ' · Ana')}${kcard('Check lamp · Pete')}</div>`).join('')}</div>`, [fRec('colIcons', 'Columns are icons only: ○ ◐ ●', `<div style="display:flex;gap:6px">${['○', '◐', '●'].map((c, i) => `<div style="flex:1;background:#eef1f3;padding:5px"><b>${c}</b>${kcard(['Mend net', 'Paint hull', 'Ice order'][i] + ' · Ana')}</div>`).join('')}</div>`)]),
  P('owner', 'Card owners', NOTE('Owners show initials and a name.'), [fNone('noOwner', 'recognition', 'Cards show no owner', 'Show who is responsible.')]),
  P('prio', 'Priority', NOTE(`${DOT('#c0392b', 'High')} · ${DOT('#e6a700', 'Medium')} · ${DOT('#1e8e3e', 'Low')}`), [F('prioCol', 'color', 'Priority by colour only', W.color, NOTE(`${DOT('#c0392b')} ${DOT('#e6a700')} ${DOT('#1e8e3e')}`))]),
  P('move', 'Move card', NOTE('Drag, or press <kbd>M</kbd> then arrow keys.'), [F('dragOnly', 'keyboard', 'Cards can be moved only by dragging', 'Keyboard users need an alternative.', NOTE('Drag cards between columns.'))]),
  P('add', 'Add card', B('Add card'), [fTgt('addTiny', 'Add card', '+', 22)]),
  P('arch', 'Archive done', NOTE(`${LK('Archive all done cards')} (asks first)`), [fPrev('archNow', '“Archive all” beside Add, no confirmation', DANGER('Archive all done cards'))]),
  P('limit', 'Work limit', NOTE('Doing limit: 3. You have 2.'), [fNone('noLimit', 'status', 'Going over the limit gives no warning', W.stat)]),
  P('cons', 'Card names', NOTE('Press “Add card” to create a card.'), [fCons('cardMix', 'Card, Task and Ticket used for one thing', NOTE('Card · Task · Ticket'))])
], { w: 580 });

/* 4. messenger bubbles */
const bub = (t, me) => `<div style="max-width:70%;margin:4px ${me ? '0 4px auto' : 'auto 4px 0'};padding:6px 8px;border-radius:10px;background:${me ? '#d7ecff' : '#eef1f3'};font-size:13px">${t}</div>`;
defTpl('bubbles', 'Dockside group chat', 'chat.dockside.example/crew', ['The send button reads “Send”.', 'Messages show a time.'], 'raft', [
  P('title', 'Group name', H2('Crew chat · 5 online')),
  P('log', 'Messages', `${bub('Fog at six, hold the ferry.', false)}${bub('Holding. Thanks.', true)}${bub('Who has the key?', false)}`, [fGrey('logGrey', 'Messages')]),
  P('time', 'Time stamps', NOTE('Sent 14:02 · Read 14:03'), [fTiny('timeTiny', 'Time stamps')]),
  P('who', 'Online list', NOTE(`${DOT('#1e8e3e')} Ana · ${DOT('#888')} Pete · ${DOT('#1e8e3e')} Noa`), [F('onlineCol', 'color', 'Online status by colour only', W.color, NOTE(`${DOT('#1e8e3e')} ${DOT('#888')} ${DOT('#1e8e3e')}`))]),
  P('typing', 'Typing sign', NOTE('<i>Ana is typing…</i>'), [fNone('noTyping', 'status', 'Nothing shows that someone is typing', W.stat)]),
  P('compose', 'Message box', `<input placeholder="Write a message" style="width:70%"> ${B('Send', 's')}`, [fTgt('sendTiny', 'Send', '➤', 20)]),
  P('attach', 'Attach', NOTE('📎 Attach a file · 😀 Emoji'), [fRec('attachIcon', 'Attach and emoji are unlabelled icons', NOTE('📎 😀 ⌘'))]),
  P('leave', 'Leave group', NOTE(`${LK('Leave this group')} (asks first)`), [fPrev('leaveNow', '“Leave group” beside Send, no confirmation', DANGER('Leave group'))]),
  P('edit', 'Edit message', NOTE(`${LK('Edit last message')} within 5 minutes`), [fNone('noEdit', 'control', 'Sent messages cannot be edited or recalled', WHY_UNDO)])
], { w: 460 });

/* 5. KPI dashboard */
const kpi = (l, v, c) => `<div style="display:inline-block;width:31%;margin:1%;padding:6px;background:#f5f7f8;border-left:4px solid ${c}"><div style="font-size:11px;color:#556">${l}</div><b style="font-size:19px">${v}</b></div>`;
defTpl('kpi', 'Harbor KPI board', 'stats.harbor.example/today', ['Numbers show units.', 'Charts have labels and a title.'], 'liner', [
  P('title', 'Board title', H2('Harbor today')),
  P('tiles', 'Number tiles', `${kpi('Arrivals', '42 ships', '#2e86ab')}${kpi('Delays', '3 ships', '#c0392b')}${kpi('Berths free', '7 of 20', '#1e8e3e')}`, [fJar('tileJar', `${kpi('ARR_CNT', '42', '#2e86ab')}${kpi('DLY_CNT', '3', '#c0392b')}${kpi('BTH_FRE', '7/20', '#1e8e3e')}`)]),
  P('chart', 'Bar chart', `<p style="font-size:12px;margin:2px"><b>Arrivals by hour</b></p>${[40, 70, 55, 90, 30].map((v, i) => `<div style="font-size:11px">${8 + i * 2}:00 ${bar(v)} ${v}</div>`).join('')}`, [fNone('noAxis', 'text', 'The chart has no title, labels or numbers', 'Charts need labelled axes.')]),
  P('trend', 'Trend arrow', NOTE('Delays: <b style="color:#c0392b">▲ up 2</b>'), [F('trendCol', 'color', 'Up and down shown by red or green only', W.color, NOTE('Delays: <b style="color:#c0392b">●</b>'))]),
  P('range', 'Date range', NOTE(`Range: <select><option>Today</option><option>7 days</option></select> ${LK('Reset')}`), [F('rangeFixed', 'flexibility', 'The range cannot be changed', W.flex, NOTE('Range: today (fixed).'))]),
  P('live', 'Refresh', NOTE('Updated 14:05:12 · refreshes every minute'), [fNone('noLive', 'status', 'Numbers change with no sign they refreshed', W.stat)]),
  P('widgets', 'Widgets', NOTE('Showing 6 widgets.'), [fMin('wMany', 'Forty widgets on one screen', `<div style="font-size:10px;line-height:1.5">${many(40, i => `<span style="display:inline-block;width:23%;background:#eef1f3;margin:1px">W${i}</span>`)}</div>`)]),
  P('reset', 'Reset layout', NOTE(`${LK('Reset layout')} (asks first)`), [fPrev('resetNow', '“Reset layout” beside Refresh, no confirmation', DANGER('Reset layout'))]),
  P('hit', 'Export button', B('Export'), [fTgt('expTiny', 'Export button', 'Export', 44)])
], { w: 560 });

/* 6. map with pins */
defTpl('mapp', 'Quay map', 'map.quaywalk.example/pins', ['Pins have a shape and a name.', 'Map controls have words.'], 'hydrofoil', [
  P('title', 'Map title', H2('Quay map')),
  P('pins', 'Map pins', `<div style="position:relative;height:110px;background:#cfe6ee;border:1px solid #8ab"><b style="position:absolute;left:20px;top:28px;font-size:11px">⚓ Pier 9</b><b style="position:absolute;left:120px;top:58px;font-size:11px">☕ Café</b><b style="position:absolute;left:210px;top:22px;font-size:11px">⚑ Office</b></div>`, [F('pinCol', 'color', 'Pins differ by colour only, no shape or name', W.color, `<div style="position:relative;height:110px;background:#cfe6ee;border:1px solid #8ab"><i style="position:absolute;left:20px;top:28px;width:12px;height:12px;border-radius:50%;background:#c0392b"></i><i style="position:absolute;left:120px;top:58px;width:12px;height:12px;border-radius:50%;background:#1e8e3e"></i><i style="position:absolute;left:210px;top:22px;width:12px;height:12px;border-radius:50%;background:#e6a700"></i></div>`)]),
  P('zoom', 'Zoom buttons', NOTE(`${B('+ Zoom in', 's')} ${B('− Zoom out', 's secondary')}`), [fTgt('zoomTiny', 'Zoom buttons', '+ −', 26)]),
  P('search', 'Search box', `<input placeholder="Search the quay" style="width:80%">`, [fJar('searchJar', '<input value="lat,lon" style="width:80%">')]),
  P('scale', 'Scale bar', NOTE('Scale: 100 m ▬▬▬'), [fTiny('scaleTiny', 'The scale bar'), fGrey('scaleGrey', 'The scale bar')]),
  P('locate', 'Locate me', NOTE(`${B('Find me', 's')} shows where you are.`), [fNone('noLocate', 'status', 'Pressing Find me shows nothing while it searches', W.stat)]),
  P('route', 'Route', NOTE('Walk 8 minutes. ' + LK('Change route')), [fNone('noAlt', 'control', 'The route cannot be changed or cancelled', WHY_UNDO)]),
  P('layers', 'Layers', NOTE('Layers: <select><option>Streets</option><option>Tide</option></select> ' + LK('Back to streets')), [F('layerFixed', 'flexibility', 'Layers cannot be switched back', W.flex, NOTE('Layers: Tide (fixed).'))]),
  P('clear', 'Clear pins', NOTE(`${LK('Remove all my pins')} (asks first)`), [fPrev('clearNow', '“Remove all pins” beside Zoom, no confirmation', DANGER('Remove all pins'))])
], { w: 500 });

/* 7. settings toggles */
const tog = (l, on) => `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e3e8ec;font-size:14px"><span>${l}</span><span style="padding:1px 8px;border-radius:10px;background:${on ? '#1e8e3e' : '#aab'};color:#fff;font-size:12px">${on ? 'On' : 'Off'}</span></div>`;
defTpl('toggles', 'Lamp settings', 'settings.lamplight.example/all', ['Every switch shows On or Off in words.', 'Settings have plain names.'], 'lightship', [
  P('title', 'Page title', H2('Settings')),
  P('sw', 'Switches', `${tog('Night mode', true)}${tog('Sound', false)}${tog('Alerts', true)}`, [F('swCol', 'color', 'On and Off differ by colour only', W.color, `<div style="display:flex;gap:6px">${DOT('#1e8e3e')} ${DOT('#aab')} ${DOT('#1e8e3e')}</div>`)]),
  P('names', 'Setting names', NOTE('Night mode · Sound · Alerts'), [fJar('setJar', 'ui.theme.dark · audio.mute.flag · push.notify.mask')]),
  P('slider', 'Brightness', `<label style="font-size:14px">Brightness <input type="range" min="0" max="100" value="60"> 60%</label>`, [fNone('noVal', 'status', 'The slider shows no value', W.stat)]),
  P('hint', 'Help text', NOTE('Alerts tell you about storms.'), [fTiny('hintTiny', 'Help text'), fGrey('hintGrey', 'Help text')]),
  P('save', 'Save', B('Save settings'), [fTgt('saveTiny', 'Save', 'Save', 36)]),
  P('defaults', 'Defaults', NOTE(`${LK('Restore defaults')} (asks first)`), [fNone('noDefaults', 'control', 'No way back to default settings', W.flex)]),
  P('wipe', 'Erase data', NOTE(`${LK('Erase all my data')} (asks first)`), [fPrev('eraseNow', '“Erase all my data” beside Save, no confirmation', DANGER('Erase all my data'))]),
  P('all', 'Settings list', NOTE('12 settings in four groups.'), [fMin('setMany', 'Ninety settings in one list', `<div style="font-size:11px;max-height:80px;overflow:auto">${many(60, i => tog('Setting ' + i, i % 2))}</div>`)])
], { w: 460 });

/* 8. stepper wizard */
defTpl('berthwiz', 'Berth application wizard', 'apply.berthoffice.example/step', ['Steps are numbered and named.', 'Back is always available.'], 'steamer', [
  P('title', 'Wizard title', H2('Apply for a berth')),
  P('steps', 'Step bar', `<p style="font-size:13px"><b>1 Ship</b> › <b style="background:#ffe9a8">2 Crew</b> › 3 Fees › 4 Confirm</p>`, [fNone('noSteps', 'status', 'No sign of which step you are on', W.stat)]),
  P('field', 'Crew field', I('crew', 'Crew size'), [fJar('crewJar', I('crew', 'Complement headcount (integer)'))]),
  P('help', 'Help', NOTE('Count everyone who sleeps aboard.'), [fTiny('helpTiny', 'Help text'), fGrey('helpGrey', 'Help text')]),
  P('next', 'Next', B('Next: Fees'), [fTgt('nextTiny', 'Next', 'Next', 36)]),
  P('back', 'Back', NOTE(`${LK('◀ Back to Ship')} (your answers are kept)`), [fNone('noBack', 'control', 'There is no Back; leaving loses your answers', WHY_UNDO)]),
  P('err', 'Message', AL('Crew size must be a whole number, like 6.'), [fErr('crewErr', 'Error 22: CREW_NaN')]),
  P('save', 'Save draft', NOTE(`${LK('Save and finish later')}`), [fNone('noDraft', 'prevention', 'Closing the wizard silently discards everything', W.prev)]),
  P('cancel', 'Cancel', NOTE(`${LK('Cancel application')} (asks first)`), [fPrev('cancelNow', '“Cancel application” beside Next, no confirmation', DANGER('Cancel application'))])
], { w: 520 });

/* 9. calculator keypad */
const key = (t, w = 22) => `<button style="width:${w}px;height:${w}px;margin:2px;font-size:${Math.max(9, w / 2.2)}px;background:#e8edf1;color:#1d2530;border:1px solid #8a96a0">${t}</button>`;
defTpl('keypad', 'Tide calculator', 'calc.berthoffice.example/tide', ['Keys carry plain symbols.', 'The display shows units.'], 'trawler', [
  P('title', 'Title', H2('Tide calculator')),
  P('display', 'Display', `<div style="font:700 22px monospace;text-align:right;background:#102f3a;color:#9fe8c8;padding:6px">4.2 m</div>`, [fGrey('dispGrey', 'The display'), F('dispNoUnit', 'realworld', 'Display shows 0x2A with no unit', W.real, `<div style="font:700 22px monospace;text-align:right;background:#102f3a;color:#9fe8c8;padding:6px">0x2A</div>`)]),
  P('keys', 'Number keys', `<div>${['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '='].map(k => key(k, 38)).join('')}</div>`, [F('keyTiny', 'target', 'Keys are 14 px square', W.target, `<div>${['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '='].map(k => key(k, 14)).join('')}</div>`)]),
  P('ops', 'Operators', `<div>${['+', '−', '×', '÷'].map(k => key(k, 38)).join('')}</div>`, [fRec('opsIcon', 'Operators are unlabelled glyphs: ⊕ ⊖ ⊗ ⊘', `<div>${['⊕', '⊖', '⊗', '⊘'].map(k => key(k, 38)).join('')}</div>`)]),
  P('clear', 'Clear', NOTE(`${B('C', 's secondary')} clears the last entry; <b>Undo</b> brings it back.`), [fNone('noClr', 'control', 'Clear erases everything with no undo', WHY_UNDO)]),
  P('hist', 'History', NOTE('Last: 3.1 m + 1.1 m = 4.2 m'), [fNone('noHist', 'recognition', 'Nothing shows earlier results', 'Show what was done.')]),
  P('mode', 'Mode', NOTE('Mode: <select><option>Metres</option><option>Feet</option></select> ' + LK('Back to metres')), [F('modeFixed', 'flexibility', 'Units cannot be switched back', W.flex, NOTE('Mode: feet (fixed).'))]),
  P('shortcut', 'Keyboard', NOTE('Type numbers; Enter calculates.'), [F('noKb', 'keyboard', 'Only the on-screen keys work; typing does nothing', 'Keyboard users need keyboard input.', NOTE('Use the on-screen keys.'))])
], { w: 360 });

/* 10. audio player timeline */
defTpl('player', 'Foghorn radio player', 'play.foghorn.example/now', ['Controls have words and icons.', 'Time is shown as 2:41.'], 'paddle', [
  P('title', 'Now playing', H2('Now playing: The Slow Ferry')),
  P('time', 'Time', NOTE('2:41 / 4:10'), [fJar('timeJar', '161000 / 250000 ms')]),
  P('bar', 'Progress bar', `<div style="height:8px;background:#dde3e8"><i style="display:block;width:64%;height:100%;background:#2e86ab"></i></div>`, [fGrey('barGrey', 'The progress bar')]),
  P('ctl', 'Controls', NOTE(`${B('⏮ Previous', 's')} ${B('⏸ Pause', 's')} ${B('⏭ Next', 's')}`), [fRec('ctlIcon', 'Controls are unlabelled glyphs', NOTE('⏮ ⏸ ⏭'))]),
  P('hit', 'Play button', B('▶ Play'), [fTgt('playTiny', 'Play', '▶', 20)]),
  P('queue', 'Queue', NOTE('Up next: 3 songs.'), [fMin('qMany', 'Two hundred songs in the queue list', `<div style="max-height:70px;overflow:auto;font-size:11px">${many(80, i => `<div>Song ${i}</div>`)}</div>`)]),
  P('load', 'Buffering', NOTE('Buffered. Playing.'), [fNone('noBuf', 'status', 'Buffering shows no sign at all', W.stat)]),
  P('clearq', 'Clear queue', NOTE(`${LK('Clear the queue')} (asks first)`), [fPrev('clearNow', '“Clear the queue” beside Next, no confirmation', DANGER('Clear the queue'))]),
  P('speed', 'Speed', NOTE('Speed: <select><option>1×</option><option>1.5×</option></select> ' + LK('Back to 1×')), [F('speedFixed', 'flexibility', 'Speed cannot be changed back', W.flex, NOTE('Speed: 1.5× (fixed).'))])
], { w: 480 });

/* 11. social feed */
const post = (n, t) => `<div style="padding:6px;border-bottom:1px solid #e3e8ec;font-size:13px"><b>${n}</b> · 2 h<br>${t}</div>`;
defTpl('feed', 'Quay Notes feed', 'notes.quay.example/home', ['Posts show an author and a time.', 'Buttons carry words.'], 'raft', [
  P('title', 'Feed title', H2('Quay Notes')),
  P('posts', 'Posts', `${post('Ana', 'Fog lifted at six.')}${post('Pete', 'New cat on Pier 3.')}${post('Noa', 'Lanterns tonight.')}`, [fGrey('postGrey', 'Posts'), fTiny('postTiny', 'Posts')]),
  P('like', 'Like button', NOTE(`${B('♥ Like', 's')} ${B('↩ Reply', 's secondary')}`), [fRec('likeIcon', 'Like and reply are unlabelled glyphs', NOTE('♥ ↩'))]),
  P('count', 'Counts', NOTE('12 likes · 3 replies'), [fNone('noCount', 'status', 'Liking gives no sign it worked', W.stat)]),
  P('new', 'New post', `<textarea placeholder="What happened on the quay?" style="width:90%"></textarea> ${B('Post')}`, [fTgt('postTinyBtn', 'Post', 'Post', 34)]),
  P('del', 'Delete post', NOTE(`${LK('Delete my post')} (asks first)`), [fPrev('delNow', '“Delete post” beside Reply, no confirmation', DANGER('Delete post'))]),
  P('refresh', 'Refresh', NOTE('Pull down or press <kbd>R</kbd>.'), [F('pullOnly', 'keyboard', 'Refresh works only by pulling down', 'Keyboard users need an alternative.', NOTE('Pull down to refresh.'))]),
  P('more', 'More posts', NOTE('Showing 3 posts. ' + LK('Load more')), [fMin('inf', 'Endless scroll with no end or footer', `<div style="font-size:11px">${many(25, i => `<div>Post ${i}</div>`)}</div>`)]),
  P('err', 'Message', AL('Your post is too long. Keep it under 280 characters.'), [fErr('postErr', 'Error 413: PAYLOAD_TOO_LARGE')])
], { w: 480 });

/* 12. invoice */
defTpl('invoice', 'Berth invoice', 'bills.berthoffice.example/invoice', ['Money is shown with a unit.', 'Due dates are written in words.'], 'tanker', [
  P('title', 'Invoice heading', H2('Invoice 4417')),
  P('lines', 'Line items', `<table style="color:#1d2530;width:100%;font-size:13px"><tr><td>Berth, 4 nights</td><td align=right>80 cr</td></tr><tr><td>Water</td><td align=right>6 cr</td></tr><tr><td><b>Total</b></td><td align=right><b>86 cr</b></td></tr></table>`, [fJar('lineJar', '<table style="color:#1d2530;width:100%;font-size:13px"><tr><td>SKU-BRTH-4N</td><td align=right>8000</td></tr><tr><td>SKU-WTR</td><td align=right>600</td></tr><tr><td>TOT</td><td align=right>8600</td></tr></table>')]),
  P('due', 'Due date', NOTE('Due on <b>Friday 13 November</b>.'), [fTiny('dueTiny', 'The due date'), fGrey('dueGrey', 'The due date')]),
  P('status', 'Paid status', NOTE(`${DOT('#c0392b')} <b>Unpaid</b>`), [F('paidCol', 'color', 'Paid or unpaid by colour only', W.color, NOTE(DOT('#c0392b')))]),
  P('pay', 'Pay button', B('Pay 86 cr'), [fTgt('payTiny', 'Pay', 'Pay', 32)]),
  P('disp', 'Dispute', NOTE(`${LK('Dispute a line')}`), [fNone('noDisp', 'control', 'There is no way to dispute a line', WHY_UNDO)]),
  P('late', 'Late fee', NOTE('A late fee of 5 cr applies after the due date.'), [fMin('lateHidden', 'Fees are explained in forty lines of legal text', `<div style="font-size:10px">${many(14, i => `<div>${i + 1}. The party of the first part shall…</div>`)}</div>`)]),
  P('save', 'Pay later', NOTE(`${LK('Remind me on Thursday')}`), [fNone('noRemind', 'status', 'Pressing remind gives no confirmation', W.stat)]),
  P('wipe', 'Void', NOTE(`${LK('Void this invoice')} (asks first)`), [fPrev('voidNow', '“Void this invoice” beside Pay, no confirmation', DANGER('Void invoice'))])
], { w: 480 });

/* 13. seat grid picker */
const seat = (n, free) => `<span style="display:inline-block;width:26px;height:26px;margin:2px;line-height:26px;text-align:center;font-size:11px;background:${free ? '#bfe0ff' : '#8b95a1'};color:#102f3a">${n}</span>`;
defTpl('seatgrid', 'Cinema seat picker', 'seats.reelhouse.example/pick', ['Taken seats show a cross.', 'Prices are in cr.'], 'liner', [
  P('title', 'Film title', H2('The Slow Ferry · 20:00')),
  P('grid', 'Seat grid', `<div>${many(12, i => seat(i % 4 === 1 ? '✕' : i + 1, i % 4 !== 1))}</div>`, [F('seatCol', 'color', 'Free and taken seats differ by colour only', W.color, `<div>${many(12, i => seat('', i % 4 !== 1))}</div>`)]),
  P('legend', 'Legend', NOTE('Free · ✕ taken · selected is outlined'), [fTiny('legTiny', 'The legend'), fGrey('legGrey', 'The legend')]),
  P('price', 'Price', NOTE('2 seats: 16 cr'), [fNone('noTotal', 'status', 'The total does not update when you pick a seat', W.stat)]),
  P('pick', 'Confirm', B('Choose these seats'), [fTgt('pickTiny', 'Choose seats', 'OK', 30)]),
  P('clear', 'Clear', NOTE(`${LK('Clear my choice')}`), [fNone('noClear', 'control', 'Once picked, seats cannot be changed', WHY_UNDO)]),
  P('kb', 'Keyboard', NOTE('Arrow keys move; Space picks.'), [F('mouseOnly', 'keyboard', 'Seats can be picked only with a mouse', 'Keyboard users need an alternative.', NOTE('Click a seat.'))]),
  P('err', 'Message', AL('Those seats are not together. Pick two next to each other.'), [fErr('seatErr', 'Error 409: SEAT_ADJ')]),
  P('hold', 'Hold timer', NOTE('Held for 9:40.'), [fNone('noTimer', 'prevention', 'Seats vanish after a hidden timer', W.prev)])
], { w: 500 });

/* 14. checklist */
const chk = (t, d) => `<div style="font-size:14px;padding:3px 0"><span style="display:inline-block;width:16px;height:16px;border:1px solid #556;text-align:center;line-height:16px;margin-right:6px">${d ? '✓' : ''}</span>${d ? '<s>' : ''}${t}${d ? '</s>' : ''}</div>`;
defTpl('checklist', 'Pre-sailing checklist', 'check.sailwell.example/today', ['Done is shown with a tick and strikethrough.', 'Every task has a name.'], 'raft', [
  P('title', 'List title', H2('Before we sail')),
  P('items', 'Items', `${chk('Lamps on', true)}${chk('Check the tide', true)}${chk('Radio test', false)}${chk('Count lifejackets', false)}`, [F('doneCol', 'color', 'Done items differ by colour only', W.color, `<div style="font-size:14px"><span style="color:#1e8e3e">● Lamps on</span><br><span style="color:#1e8e3e">● Check the tide</span><br><span style="color:#888">● Radio test</span></div>`)]),
  P('prog', 'Progress', NOTE('2 of 4 done'), [fNone('noProg', 'status', 'Nothing shows how many are done', W.stat)]),
  P('add', 'Add task', `<input placeholder="New task"> ${B('Add', 's')}`, [fTgt('addTiny', 'Add', '+', 20)]),
  P('undo', 'Undo', NOTE(`${LK('Undo last tick')}`), [fNone('noUndo', 'control', 'Ticks cannot be undone', WHY_UNDO)]),
  P('note', 'Notes', NOTE('Tap a task for notes.'), [fTiny('noteTiny', 'Notes'), fGrey('noteGrey', 'Notes')]),
  P('reset', 'Reset', NOTE(`${LK('Start a new list')} (asks first)`), [fPrev('resetNow', '“Start a new list” beside Add, no confirmation', DANGER('Start a new list'))]),
  P('names', 'Names', NOTE('Task · Task · Task'), [fCons('taskMix', 'Task, Item and Chore used for one thing', NOTE('Task · Item · Chore'))]),
  P('sort', 'Order', NOTE('Order: <select><option>As written</option><option>Undone first</option></select> ' + LK('Back to as written')), [F('sortFixed', 'flexibility', 'The order cannot be changed back', W.flex, NOTE('Order: undone first (fixed).'))])
], { w: 420 });

/* 15. pricing tiers */
const tier = (n, p, f, hi) => `<div style="display:inline-block;width:31%;margin:1%;padding:6px;border:2px solid ${hi ? '#2e86ab' : '#d6dbe0'};vertical-align:top;font-size:12px"><b>${n}</b><br><span style="font-size:18px">${p}</span><br>${f}</div>`;
defTpl('tiers', 'Harbor plan tiers', 'plans.harborpass.example/choose', ['Prices show a unit and a period.', 'Plans are named in words.'], 'liner', [
  P('title', 'Page title', H2('Choose a plan')),
  P('tiers', 'Three plans', `${tier('Small', '5 cr/mo', '1 ship', false)}${tier('Medium', '12 cr/mo', '5 ships', true)}${tier('Large', '30 cr/mo', 'All ships', false)}`, [fJar('tierJar', `${tier('Tier α', '0x05/30d', 'cap=1', false)}${tier('Tier β', '0x0C/30d', 'cap=5', true)}${tier('Tier γ', '0x1E/30d', 'cap=∞', false)}`)]),
  P('hi', 'Best value', NOTE('Medium is the most popular.'), [F('hiCol', 'color', 'The recommended plan is marked by colour only', W.color, NOTE(''))]),
  P('fine', 'Small print', NOTE('Cancel any time. Prices include tax.'), [fTiny('fineTiny', 'Small print'), fGrey('fineGrey', 'Small print')]),
  P('choose', 'Choose button', B('Choose Medium'), [fTgt('chooseTiny', 'Choose', 'Choose', 40)]),
  P('trial', 'Free trial', NOTE('14 days free. You will not be charged today.'), [fPrev('trialTrap', 'The free trial renews silently into a paid plan', NOTE('Free trial, then 12 cr/mo (hidden)'))]),
  P('compare', 'Compare', NOTE('Compare plans: 5 rows.'), [fMin('cmpMany', 'A compare table with sixty rows', `<div style="font-size:10px;max-height:70px;overflow:auto">${many(60, i => `<div>Feature ${i}: ✓ ✓ ✓</div>`)}</div>`)]),
  P('switch', 'Switch', NOTE(`${LK('Change or cancel my plan')}`), [fNone('noSwitch', 'control', 'No way to change plan after choosing', WHY_UNDO)])
], { w: 560 });

/* 16. search results with filters */
const res = (t, d) => `<div style="padding:4px 0;border-bottom:1px solid #e3e8ec;font-size:13px"><b style="color:#2563eb">${t}</b><br><span style="color:#556">${d}</span></div>`;
defTpl('results', 'Quay search results', 'find.quaysearch.example/q', ['Result titles are links in words.', 'Filters show what is active.'], 'hydrofoil', [
  P('title', 'Query', H2('Results for “ferry”')),
  P('list', 'Result list', `${res('Quay ferry timetable', 'Departures every 20 minutes from Pier 3.')}${res('Ferry fares', 'Single 2 cr, return 3 cr.')}${res('Lost on the ferry', 'Contact the Berth Office.')}`, [fGrey('listGrey', 'Result snippets')]),
  P('count', 'Count', NOTE('3 results in 0.12 s'), [fNone('noCount', 'status', 'There is no result count and no loading sign', W.stat)]),
  P('filters', 'Filters', NOTE('Filters: <b>This week ✕</b> · <b>Free ✕</b>'), [fNone('noActive', 'recognition', 'Active filters are not shown', 'Show what is currently applied.')]),
  P('sort', 'Sort', NOTE('Sort: <select><option>Relevance</option><option>Newest</option></select> ' + LK('Back to relevance')), [F('sortFixed', 'flexibility', 'The sort cannot be changed back', W.flex, NOTE('Sort: newest (fixed).'))]),
  P('page', 'Pages', NOTE(`${B('‹', 's secondary')} Page 1 of 3 ${B('›', 's secondary')}`), [fTgt('pageTiny', 'Page arrows', '›', 18)]),
  P('none', 'Empty state', NOTE('No results? Try fewer words.'), [fErr('noRes', 'Error 0: ZERO_ROWS')]),
  P('hist', 'History', NOTE(`${LK('Clear search history')} (asks first)`), [fPrev('histNow', '“Clear history” beside Search, no confirmation', DANGER('Clear history'))]),
  P('ads', 'Ads', NOTE('Two sponsored results are marked “Ad”.'), [fMin('adsMany', 'Eight sponsored boxes above the results', many(8, i => `<div style="background:#fff4c7;border:1px solid #e6a700;margin:2px;padding:2px;font-size:11px">Sponsored ${i + 1}</div>`))])
], { w: 500 });

/* 17. onboarding carousel */
defTpl('tourcar', 'Welcome tour', 'start.lamplight.example/tour', ['Dots show which slide you are on.', 'Skip is always visible.'], 'paddle', [
  P('slide', 'Slide', `<div style="text-align:center;padding:14px;background:#eef6fb"><div style="font-size:30px">⚓</div><b>Welcome aboard</b><p style="font-size:13px">Track every ship at the quay.</p></div>`, [fGrey('slideGrey', 'The slide text')]),
  P('dots', 'Slide dots', NOTE('<span style="color:#2e86ab">●</span> ○ ○ · slide 1 of 3'), [fNone('noDots', 'status', 'Nothing shows which slide you are on', W.stat)]),
  P('next', 'Next', B('Next'), [fTgt('nextTiny', 'Next', '›', 20)]),
  P('skip', 'Skip', NOTE(`${LK('Skip the tour')}`), [fNone('noSkip', 'control', 'The tour cannot be skipped', WHY_UNDO)]),
  P('auto', 'Auto-advance', NOTE('Slides change when you press Next.'), [fPrev('autoAdv', 'Slides advance by themselves every 3 seconds', NOTE('Auto-advancing…'))]),
  P('kb', 'Keyboard', NOTE('Press the right arrow for the next slide.'), [F('swipeOnly', 'keyboard', 'The tour works only by swiping', 'Keyboard users need an alternative.', NOTE('Swipe to continue.'))]),
  P('perm', 'Permissions', NOTE('We ask for notifications later, when they help.'), [fPrev('permAll', 'Asks for location, camera and contacts on the first slide', NOTE('Allow location, camera, contacts?'))]),
  P('names', 'Words', NOTE('Skip · Next · Done'), [fCons('tourMix', 'Skip, Later and Dismiss used for one action', NOTE('Skip · Later · Dismiss'))]),
  P('tiny', 'Caption', NOTE('Tap the dots to jump.'), [fTiny('capTiny', 'The caption')])
], { w: 420 });

/* 18. error page */
defTpl('page404', 'Lost-page screen', 'lost.quayinfo.example/404', ['Errors say what happened and what to do next.', 'The way home is always a button.'], 'lightship', [
  P('title', 'Heading', H2('We could not find that page')),
  P('why', 'Explanation', NOTE('The link may be old. Try the search or go home.'), [fErr('whyCode', 'Error 404: ENOENT /v2/x/0x4f')]),
  P('home', 'Home button', B('Take me home'), [fTgt('homeTiny', 'Home', 'Home', 36)]),
  P('search', 'Search', `<input placeholder="Search the quay" style="width:70%"> ${B('Search', 's')}`, [fNone('noSearch', 'recognition', 'There is no search and no list of pages', 'Offer a way forward.')]),
  P('back', 'Back', NOTE(`${LK('Go back to the last page')}`), [fNone('noBack', 'control', 'The back button is disabled on this screen', WHY_UNDO)]),
  P('art', 'Illustration', NOTE('A small lighthouse, in outline.'), [fGrey('artGrey', 'The caption')]),
  P('report', 'Report', NOTE(`${LK('Tell us about this broken link')}`), [fNone('noReport', 'status', 'Reporting a link shows no thanks', W.stat)]),
  P('code', 'Code', NOTE('Reference: 4F-2291'), [fTiny('codeTiny', 'The reference code')]),
  P('auto', 'Redirect', NOTE('We will not move you without asking.'), [fPrev('redir', 'The page redirects after 3 seconds with no warning', NOTE('Redirecting in 3…'))])
], { w: 460 });

/* 19. cookie banner */
defTpl('consent2', 'Cookie banner', 'news.quayday.example/home', ['Accept and Decline look equal.', 'Choices are in plain words.'], 'junk', [
  P('title', 'Banner title', H2('Your choices')),
  P('text', 'Banner text', NOTE('We use cookies to count visitors. You decide.'), [fJar('ckJar', NOTE('Legitimate interest processing of identifiers by 142 partners'))]),
  P('accept', 'Accept and decline', `${B('Accept all')} ${B('Decline all', 'secondary')}`, [F('ckWeight', 'contrast', 'Decline is a faint 8 px link beside a large Accept', W.contrast, `${B('Accept all')} <a href="#" style="font-size:8px;color:#d0d0d0">decline</a>`)]),
  P('decline', 'Decline', NOTE('Declining keeps the page working.'), [fNone('noDecline', 'control', 'There is no Decline; only Accept or a maze of options', WHY_UNDO)]),
  P('manage', 'Manage', NOTE(`${LK('Choose what to allow')}`), [fMin('ckMany', 'One hundred and forty-two partner switches on one page', `<div style="max-height:70px;overflow:auto;font-size:10px">${many(40, i => `<div>☐ Partner ${i}</div>`)}</div>`)]),
  P('small', 'Small print', NOTE('Change this any time in Settings.'), [fTiny('ckTiny', 'The small print'), fGrey('ckGrey', 'The small print')]),
  P('close', 'Close', NOTE(`${LK('✕ Close')}`), [fTgt('ckClose', 'Close', '✕', 14)]),
  P('state', 'Saved', NOTE('Saved. We will remember this.'), [fNone('noSaved', 'status', 'Choices are saved with no confirmation', W.stat)]),
  P('pre', 'Pre-ticked', NOTE('Nothing is ticked for you.'), [fPrev('preTick', 'All boxes are pre-ticked', NOTE('☑ ☑ ☑ ☑ ☑ ☑'))])
], { w: 480 });

/* 20. terminal-like console */
defTpl('console', 'Harbor console', 'ops.berthoffice.example/console', ['Commands have help.', 'Output has a time.'], 'submarine', [
  P('title', 'Console title', H2('Harbor console')),
  P('out', 'Output', `<pre style="background:#0f1a22;color:#9fe8c8;padding:6px;font-size:12px;margin:0">&gt; berth list\nB1 free\nB2 MV Gull\nB3 free</pre>`, [fGrey('outGrey', 'The output')]),
  P('in', 'Command line', `<input placeholder="type a command" style="width:80%"> ${B('Run', 's')}`, [fTgt('runTiny', 'Run', '>', 18)]),
  P('help', 'Help', NOTE('Type <b>help</b> to list commands.'), [fNone('noHelp', 'recognition', 'There is no help; you must know the commands', 'Recognition beats recall.')]),
  P('err', 'Error', AL('Unknown command “brth”. Did you mean “berth”?'), [fErr('cmdErr', 'ERR 127')]),
  P('hist', 'History', NOTE('Press ↑ for earlier commands.'), [fNone('noHist', 'flexibility', 'No history and no shortcuts for experienced users', W.flex)]),
  P('busy', 'Busy', NOTE('Command finished in 0.3 s.'), [fNone('noBusy', 'status', 'Long commands show no progress', W.stat)]),
  P('danger', 'Dangerous', NOTE('Type <b>purge</b> and confirm to clear a berth.'), [fPrev('purgeRun', 'Typing “purge” clears every berth at once, no confirmation', NOTE('> purge  (done)'))]),
  P('undo', 'Undo', NOTE('Type <b>undo</b> to revert the last command.'), [fNone('noUndo', 'control', 'Commands cannot be undone', WHY_UNDO)])
], { w: 500 });

/* 21. photo gallery */
const th = (n, bg) => `<span style="display:inline-block;width:23%;height:50px;margin:1%;background:${bg};text-align:center;line-height:50px;font-size:11px;color:#fff">${n}</span>`;
defTpl('gallery', 'Quay photo wall', 'photos.quaywall.example/wall', ['Every picture has a caption.', 'Controls have words.'], 'raft', [
  P('title', 'Album title', H2('Quay photo wall')),
  P('thumbs', 'Thumbnails', `${th('Pier', '#2e86ab')}${th('Gulls', '#c99a4b')}${th('Fog', '#778')}${th('Lamp', '#c0392b')}`, [fNone('noAlt', 'recognition', 'Pictures have no captions or descriptions', 'Say what the picture shows.')]),
  P('big', 'Large photo', NOTE('Photo 1 of 12: Pier at dawn.'), [fTiny('capTiny', 'The caption'), fGrey('capGrey', 'The caption')]),
  P('nav', 'Next and previous', NOTE(`${B('‹ Previous', 's secondary')} ${B('Next ›', 's secondary')}`), [fTgt('navTiny', 'Previous and next', '‹ ›', 18)]),
  P('close', 'Close', NOTE(`${B('Close', 's')}`), [fNone('noClose', 'control', 'The photo viewer cannot be closed', WHY_UNDO)]),
  P('fav', 'Favourite', NOTE(`${B('☆ Favourite', 's')}`), [fNone('noFav', 'status', 'Marking a favourite shows no change', W.stat)]),
  P('del', 'Delete photo', NOTE(`${LK('Delete this photo')} (asks first)`), [fPrev('delNow', '“Delete photo” beside Next, no confirmation', DANGER('Delete photo'))]),
  P('zoom', 'Zoom', NOTE('Zoom: <input type="range"> ' + LK('Fit to screen')), [F('zoomFixed', 'flexibility', 'Zoom cannot return to fit', W.flex, NOTE('Zoom: 300% (fixed).'))]),
  P('load', 'Many', NOTE('Showing 12 photos.'), [fMin('thMany', 'Nine hundred thumbnails with no paging', `<div>${many(40, i => th(i, '#667'))}</div>`)])
], { w: 520 });

/* 22. poll */
defTpl('poll', 'Harbor poll', 'vote.quaycouncil.example/poll', ['Options are words, not colours.', 'Results show numbers and words.'], 'paddle', [
  P('title', 'Question', H2('Should the ferry run on Sundays?')),
  P('opts', 'Options', `<label style="display:block;font-size:14px"><input type="radio" name="v"> Yes</label><label style="display:block;font-size:14px"><input type="radio" name="v"> No</label><label style="display:block;font-size:14px"><input type="radio" name="v"> Not sure</label>`, [fRec('optIcons', 'Options are unlabelled 👍 👎 🤷', NOTE('👍 👎 🤷'))]),
  P('vote', 'Vote button', B('Vote'), [fTgt('voteTiny', 'Vote', 'Vote', 30)]),
  P('res', 'Results', NOTE(`Yes ${bar(62, '#1e8e3e')} 62% · No ${bar(30, '#c0392b')} 30%`), [F('resCol', 'color', 'Results differ by bar colour only, no numbers', W.color, `<div>${bar(62, '#1e8e3e')} ${bar(30, '#c0392b')}</div>`)]),
  P('thanks', 'Thanks', NOTE('Thank you. Your vote was counted.'), [fNone('noThanks', 'status', 'Voting shows no confirmation', W.stat)]),
  P('change', 'Change vote', NOTE(`${LK('Change my vote')} until Friday`), [fNone('noChange', 'control', 'Votes cannot be changed', WHY_UNDO)]),
  P('priv', 'Privacy', NOTE('Votes are anonymous.'), [fPrev('privNo', 'Your name is shown next to your vote', NOTE('Voted: Ana R., Quay St 4'))]),
  P('small', 'Rules', NOTE('One vote per person.'), [fTiny('ruleTiny', 'The rules'), fGrey('ruleGrey', 'The rules')]),
  P('err', 'Message', AL('Choose an option before you vote.'), [fErr('voteErr', 'Error 400: VOTE_EMPTY')])
], { w: 460 });

/* 23. stopwatch / timer */
defTpl('timer', 'Race stopwatch', 'time.regatta.example/lap', ['Time is shown as 1:23.4.', 'Buttons have words.'], 'hydrofoil', [
  P('title', 'Title', H2('Lap timer')),
  P('clock', 'Time', `<div style="font:700 34px monospace;text-align:center">1:23.4</div>`, [fJar('clockJar', `<div style="font:700 20px monospace;text-align:center">834 ds</div>`)]),
  P('btns', 'Start and stop', NOTE(`${B('▶ Start', 's')} ${B('■ Stop', 's secondary')} ${B('Lap', 's secondary')}`), [fRec('btnIcon', 'Start, stop and lap are unlabelled glyphs', NOTE('▶ ■ ⚑'))]),
  P('hit', 'Big start', B('Start'), [fTgt('startTiny', 'Start', 'Start', 36)]),
  P('laps', 'Laps', NOTE('Lap 1: 1:21.0 · Lap 2: 1:23.4'), [fTiny('lapTiny', 'The laps'), fGrey('lapGrey', 'The laps')]),
  P('running', 'Running state', NOTE('Running… ' + DOT('#1e8e3e')), [fNone('noRun', 'status', 'Nothing shows whether the timer is running or stopped', W.stat)]),
  P('reset', 'Reset', NOTE(`${LK('Reset')} (asks first)`), [fPrev('resetNow', '“Reset” sits beside Stop, no confirmation', DANGER('Reset'))]),
  P('undo', 'Undo lap', NOTE(`${LK('Undo last lap')}`), [fNone('noUndo', 'control', 'A wrong lap cannot be undone', WHY_UNDO)]),
  P('kb', 'Keyboard', NOTE('Press <kbd>Space</kbd> to start or stop.'), [F('mouseOnly', 'keyboard', 'Only the mouse can start and stop', 'Keyboard users need an alternative.', NOTE('Click Start.'))])
], { w: 420 });

/* 24. form builder / settings tabs */
defTpl('tabsui', 'Fleet manager tabs', 'fleet.quayhaul.example/manage', ['Tabs are named and one is active.', 'Panels have words.'], 'tanker', [
  P('title', 'Page title', H2('Fleet manager')),
  P('tabs', 'Tabs', `<p style="border-bottom:2px solid #d6dbe0;font-size:13px"><b style="padding:3px 8px;border:2px solid #2e86ab;border-bottom:none">Ships</b> <span style="padding:3px 8px">Crew</span> <span style="padding:3px 8px">Costs</span></p>`, [fNone('noActiveTab', 'status', 'Nothing shows which tab is active', W.stat)]),
  P('panel', 'Panel', NOTE('3 ships · 11 crew · 4 berths used'), [fGrey('panelGrey', 'The panel text'), fTiny('panelTiny', 'The panel text')]),
  P('names', 'Tab names', NOTE('Ships · Crew · Costs'), [fJar('tabJar', 'ENT_A · ENT_B · ENT_C')]),
  P('add', 'Add ship', B('Add ship'), [fTgt('addTiny', 'Add ship', '+', 20)]),
  P('help', 'Help', NOTE(`${LK('What is a berth?')}`), [fNone('noHelp', 'recognition', 'There is no help for berth, class or tonnage', 'Explain the words.')]),
  P('save', 'Save', NOTE(`${B('Save changes', 's')} ${LK('Discard changes')}`), [fNone('noDiscard', 'control', 'No way to discard unsaved changes', WHY_UNDO)]),
  P('dirty', 'Unsaved', NOTE('You have unsaved changes.'), [fPrev('loseTab', 'Switching tabs silently drops unsaved changes', NOTE('Switched. Changes lost.'))]),
  P('wipe', 'Remove fleet', NOTE(`${LK('Remove the fleet')} (asks first)`), [fPrev('wipeNow', '“Remove fleet” beside Add, no confirmation', DANGER('Remove fleet'))]),
  P('names2', 'Words', NOTE('Ship · Ship · Ship'), [fCons('shipMix', 'Ship, Vessel and Unit used for one thing', NOTE('Ship · Vessel · Unit'))])
], { w: 520 });
/* ───────────────────── 11q. More shapes: inboxes, editors, trees, boards, pickers, players ───────────────────── */
const ROWC = '#1d2530';
const mrow = (a, b, c = '', bold = false) => `<div style="display:flex;gap:8px;padding:4px 2px;border-bottom:1px solid #e3e8ec;font-size:13px;color:${ROWC};${bold ? 'font-weight:700;' : ''}"><span style="width:90px">${a}</span><span style="flex:1">${b}</span><span style="color:#667">${c}</span></div>`;

/* 1. weather forecast */
defTpl('xweather', 'Fogline forecast', 'weather.fogline.example/week', ['Temperatures show a unit.', 'Icons come with words.'], 'lightship', [
  P('title', 'Place', H2('Port Halcyon · this week')),
  P('days', 'Daily forecast', `<div style="display:flex;gap:4px">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => `<div style="flex:1;text-align:center;padding:4px;background:#eef6fb;font-size:12px;color:${ROWC}"><b>${d}</b><br>${['☀ Sun', '☁ Cloud', '☂ Rain', '☂ Rain', '☀ Sun'][i]}<br>${[11, 9, 7, 6, 10][i]}°C</div>`).join('')}</div>`, [F('wxIcon', 'recognition', 'Weather is shown by icons only, no words', 'Pair icons with words.', `<div style="display:flex;gap:4px">${['☀', '☁', '☂', '☂', '☀'].map(x => `<div style="flex:1;text-align:center;padding:4px;background:#eef6fb;font-size:18px">${x}</div>`).join('')}</div>`)]),
  P('temp', 'Temperature', NOTE('Now 9°C, feels like 6°C.'), [fJar('tempJar', '282.15 K, apparent 279.15 K')]),
  P('warn', 'Warning', `<div class="m-banner">Fog warning until 08:00.</div>`, [F('warnCol', 'color', 'Warnings differ by banner colour only', W.color, `<div style="background:#f2e6a6;height:14px"></div>`)]),
  P('wind', 'Wind', NOTE('Wind 22 km/h from the west.'), [fTiny('windTiny', 'Wind'), fGrey('windGrey', 'Wind')]),
  P('city', 'Place search', `<input placeholder="Another place" style="width:60%"> ${B('Go', 's')}`, [fTgt('goTiny', 'Go', 'Go', 22)]),
  P('upd', 'Updated', NOTE('Updated 14:05. Refreshes every 10 minutes.'), [fNone('noUpd', 'status', 'Nothing says when the forecast was updated', W.stat)]),
  P('unit', 'Units', NOTE('Units: <select><option>°C</option><option>°F</option></select> ' + LK('Back to °C')), [F('unitFixed', 'flexibility', 'Units cannot be switched back', W.flex, NOTE('Units: °F (fixed).'))]),
  P('wipe', 'Forget places', NOTE(`${LK('Forget my saved places')} (asks first)`), [fPrev('forgetNow', '“Forget places” beside Go, no confirmation', danger('Forget saved places'))])
], { w: 520 });

/* 2. email inbox */
defTpl('xinbox', 'Gullmail inbox', 'mail.gullmail.example/inbox', ['Unread mail is bold.', 'Every action has a word.'], 'sail', [
  P('title', 'Inbox title', H2('Inbox · 3 unread')),
  P('list', 'Mail list', `${mrow('Ana', '<b>Fog at six</b>', '14:02', true)}${mrow('Berth Office', 'Your invoice', 'Mon')}${mrow('Pete', '<b>Cat news</b>', 'Sun', true)}`, [F('unreadCol', 'color', 'Unread mail is marked by colour only', W.color, `${mrow('Ana', 'Fog at six', '14:02')}${mrow('Berth Office', 'Your invoice', 'Mon')}${mrow('Pete', 'Cat news', 'Sun')}`)]),
  P('time', 'Time stamps', NOTE('Today 14:02 · Mon · Sun'), [fJar('timeJar', '1731074520 · 1730729000')]),
  P('tools', 'Row tools', NOTE(`${B('Reply', 's')} ${B('Archive', 's secondary')} ${B('Delete', 's secondary')}`), [fRec('toolIcon', 'Reply, archive and delete are unlabelled icons', NOTE('↩ ▤ 🗑'))]),
  P('hit', 'Compose', B('Compose'), [fTgt('compTiny', 'Compose', '✎', 22)]),
  P('del', 'Delete', NOTE(`${LK('Delete selected')} (goes to Bin for 30 days)`), [fPrev('delNow', 'Delete removes mail for ever, no bin, no confirmation', danger('Delete for ever'))]),
  P('undo', 'Undo', NOTE(`${LK('Undo')} after archiving`), [fNone('noUndo', 'control', 'Archived mail cannot be undone', WHY_UNDO)]),
  P('send', 'Send state', NOTE('Sent.'), [fNone('noSent', 'status', 'Sending shows no sign it worked', W.stat)]),
  P('many', 'Folders', NOTE('Inbox · Sent · Drafts · Bin'), [fMin('fMany', 'Sixty folders in the side list', `<div style="font-size:10px;max-height:60px;overflow:auto">${many(60, i => `<div>Folder ${i}</div>`)}</div>`)])
], { w: 540 });

/* 3. recipient chips composer */
const chip = t => `<span style="display:inline-block;margin:2px;padding:2px 8px;border-radius:12px;background:#dbeafe;font-size:12px;color:${ROWC}">${t} ✕</span>`;
defTpl('xcompose', 'Gullmail composer', 'mail.gullmail.example/new', ['Recipients are chips with names.', 'Send is always labelled Send.'], 'sail', [
  P('title', 'Title', H2('New message')),
  P('to', 'Recipients', `<div>To: ${chip('Ana')}${chip('Pete')}${chip('Noa')}</div>`, [fRec('toBare', 'Recipients are bare addresses with no names', `<div>To: ${chip('a@q.ex')}${chip('p@q.ex')}${chip('n@q.ex')}</div>`)]),
  P('subj', 'Subject', I('subj', 'Subject'), [fJar('subjJar', I('subj', 'Header field: Subject (RFC 5322)'))]),
  P('body', 'Message body', `<textarea style="width:95%;height:50px">Fog at six…</textarea>`, [fGrey('bodyGrey', 'The message')]),
  P('att', 'Attachment', NOTE('📎 report.pdf (2 MB) ' + LK('Remove')), [fNone('noAtt', 'status', 'No sign that an attachment is uploading', W.stat)]),
  P('send', 'Send', B('Send'), [fTgt('sendTiny', 'Send', '➤', 20)]),
  P('draft', 'Draft', NOTE('Draft saved automatically.'), [fPrev('draftLost', 'Closing the window silently discards the draft', NOTE('Closed. Draft discarded.'))]),
  P('undo', 'Undo send', NOTE(`${LK('Undo send')} for 10 seconds`), [fNone('noUndoSend', 'control', 'A sent message cannot be recalled', WHY_UNDO)]),
  P('big', 'Reply all', NOTE('Reply to all 3 recipients? ' + B('Reply all', 's')), [fPrev('replyAll', 'Reply all sits beside Reply, no warning with 200 recipients', NOTE(`${B('Reply', 's')} ${B('Reply all (214)', 's')}`))])
], { w: 520 });

/* 4. text editor toolbar */
defTpl('xeditor', 'Quill-it document editor', 'docs.quillit.example/edit', ['Toolbar buttons have words on hover and focus.', 'Undo is always available.'], 'paddle', [
  P('title', 'Title', H2('Harbor minutes')),
  P('bar', 'Toolbar', `<p>${B('Bold', 's secondary')} ${B('Italic', 's secondary')} ${B('List', 's secondary')} ${B('Link', 's secondary')}</p>`, [fRec('barIcon', 'Toolbar is unlabelled glyphs: B I ≡ ⛓', NOTE('B I ≡ ⛓ ⎙ ⌗'))]),
  P('page', 'Page text', `<div style="padding:6px;border:1px solid #c6ccd2;font-size:14px;color:${ROWC}">The meeting began at nine. Fog delayed three ferries.</div>`, [fTiny('pageTiny', 'The page text'), fGrey('pageGrey', 'The page text')]),
  P('hit', 'Format buttons', NOTE(`${B('B', 's')} ${B('I', 's')}`), [fTgt('fmtTiny', 'Format buttons', 'B', 14)]),
  P('undo', 'Undo', NOTE(`${B('↶ Undo', 's secondary')} ${B('↷ Redo', 's secondary')}`), [fNone('noUndo', 'control', 'No undo and no redo', WHY_UNDO)]),
  P('save', 'Saved', NOTE('All changes saved.'), [fNone('noSaved', 'status', 'Nothing says whether changes are saved', W.stat)]),
  P('keys', 'Shortcuts', NOTE('Ctrl+B bold · Ctrl+I italic · Ctrl+Z undo'), [F('noKeys', 'flexibility', 'No keyboard shortcuts for frequent actions', W.flex, NOTE('Use the toolbar.'))]),
  P('wipe', 'Clear document', NOTE(`${LK('Clear the whole document')} (asks first)`), [fPrev('clearNow', '“Clear document” beside Save, no confirmation', danger('Clear document'))]),
  P('fonts', 'Fonts', NOTE('Font: <select><option>Serif</option><option>Sans</option></select> ' + LK('Back to default font')), [F('fontFixed', 'flexibility', 'The font cannot be changed back', W.flex, NOTE('Font: Comic (fixed).'))])
], { w: 540 });

/* 5. spreadsheet grid */
const sg = (rows, f) => `<table style="border-collapse:collapse;font-size:12px;color:${ROWC}"><tr><th></th>${'ABC'.split('').map(c => `<th style="border:1px solid #ccd;padding:2px 10px;background:#eef1f3">${c}</th>`).join('')}</tr>${many(rows, i => `<tr><th style="border:1px solid #ccd;background:#eef1f3">${i + 1}</th>${[0, 1, 2].map(j => `<td style="border:1px solid #ccd;padding:2px 10px">${f(i, j)}</td>`).join('')}</tr>`)}</table>`;
defTpl('xsheet', 'Tally grid', 'sheet.tally.example/boat-costs', ['Numbers show their unit.', 'Errors say what is wrong.'], 'tanker', [
  P('title', 'Title', H2('Boat costs')),
  P('grid', 'Cells', sg(3, (i, j) => [['Fuel', '40', 'cr'], ['Ice', '12', 'cr'], ['Total', '52', 'cr']][i][j]), [fJar('gridJar', sg(3, (i, j) => [['F_01', '0x28', 'U'], ['I_01', '0x0C', 'U'], ['T', '0x34', 'U']][i][j]))]),
  P('formula', 'Formula bar', `<input value="=B1+B2" style="width:60%"> ${B('✓', 's')}`, [fTgt('fxTiny', 'Accept formula', '✓', 18)]),
  P('err', 'Cell error', AL('The formula in B3 refers to an empty cell. Check B2.'), [fErr('cellErr', '#REF!')]),
  P('neg', 'Negative numbers', NOTE('Balance: <span style="color:#c0392b">−8 cr</span> (shown with a minus)'), [F('negCol', 'color', 'Losses are shown in red only, no minus sign', W.color, NOTE('Balance: <span style="color:#c0392b">8 cr</span>'))]),
  P('cur', 'Current cell', NOTE('Selected: B2 (outlined).'), [fNone('noSel', 'status', 'Nothing shows which cell is selected', W.stat)]),
  P('undo', 'Undo', NOTE(`${LK('Undo')} · ${LK('Redo')}`), [fNone('noUndo', 'control', 'Deleting a cell cannot be undone', WHY_UNDO)]),
  P('delcol', 'Delete column', NOTE(`${LK('Delete column B')} (asks first)`), [fPrev('colNow', '“Delete column” beside Sort, no confirmation', danger('Delete column'))]),
  P('fill', 'Fill', NOTE('Press Ctrl+D to fill down.'), [F('mouseFill', 'flexibility', 'Fill works only by dragging; no shortcut or command', W.flex, NOTE('Drag the corner to fill.'))])
], { w: 520 });

/* 6. video player with subtitles */
defTpl('xvideo', 'Quaywatch video player', 'watch.quaywatch.example/clip', ['Controls have words.', 'Captions are available.'], 'liner', [
  P('title', 'Video title', H2('Harbor at dawn (4:10)')),
  P('screen', 'Picture', `<div style="height:70px;background:#2a3b4a;color:#fff;display:grid;place-items:center;font-size:12px">Video picture</div>`),
  P('cap', 'Captions', `<div style="background:#000;color:#fff;padding:3px;font-size:14px;text-align:center">“The tide is coming in.”</div>`, [fTiny('capTiny', 'Captions'), F('capGrey', 'contrast', 'Captions are grey on a light picture', W.contrast, `<div style="background:#d8d8d8;color:#fff;padding:3px;font-size:14px;text-align:center">“The tide is coming in.”</div>`)]),
  P('ctl', 'Controls', NOTE(`${B('▶ Play', 's')} ${B('🔊 Mute', 's secondary')} ${B('⛶ Full screen', 's secondary')}`), [fRec('ctlIcon', 'Controls are unlabelled glyphs: ▶ 🔊 ⛶', NOTE('▶ 🔊 ⛶'))]),
  P('hit', 'Play', B('Play'), [fTgt('playTiny', 'Play', '▶', 20)]),
  P('time', 'Time', NOTE('1:04 / 4:10'), [fJar('timeJar', '64000 ms / 250000 ms')]),
  P('buf', 'Loading', NOTE('Buffered 80%.'), [fNone('noBuf', 'status', 'Buffering shows no spinner or progress', W.stat)]),
  P('auto', 'Autoplay', NOTE('Next video plays only if you choose.'), [fPrev('autoNext', 'The next video starts at once with sound', NOTE('Next video starting…'))]),
  P('speed', 'Speed', NOTE('Speed: <select><option>1×</option><option>2×</option></select> ' + LK('Back to 1×')), [F('speedFixed', 'flexibility', 'Speed cannot be changed back', W.flex, NOTE('Speed: 2× (fixed).'))])
], { w: 520 });

/* 7. file manager tree */
const tn2 = (d, t, i = '▸') => `<div style="padding:2px 0 2px ${d * 14}px;font-size:13px;color:${ROWC}">${i} ${t}</div>`;
defTpl('xfiles', 'Dockfile manager', 'files.dockfile.example/browse', ['Folders and files look different.', 'Delete asks first.'], 'tanker', [
  P('title', 'Title', H2('My files')),
  P('tree', 'Folder tree', `${tn2(0, 'Harbor')}${tn2(1, 'Logs', '▾')}${tn2(2, 'tide.csv', '▤')}${tn2(2, 'crew.csv', '▤')}${tn2(1, 'Photos')}`, [F('treeSame', 'recognition', 'Folders and files look the same', 'Make different things look different.', `${tn2(0, 'Harbor', '·')}${tn2(1, 'Logs', '·')}${tn2(2, 'tide.csv', '·')}${tn2(2, 'crew.csv', '·')}${tn2(1, 'Photos', '·')}`)]),
  P('size', 'Sizes', NOTE('tide.csv 14 KB · crew.csv 2 KB'), [fJar('sizeJar', '14336 B · 2048 B'), fTiny('sizeTiny', 'File sizes')]),
  P('path', 'Path', NOTE('Harbor › Logs'), [fNone('noPath', 'status', 'Nothing shows where you are in the tree', W.stat)]),
  P('open', 'Open', B('Open'), [fTgt('openTiny', 'Open', 'Open', 34)]),
  P('del', 'Delete', NOTE(`${LK('Move to bin')} (restorable)`), [fPrev('delNow', 'Delete removes files for ever, no bin, no confirmation', danger('Delete files'))]),
  P('rename', 'Rename', NOTE(`${LK('Rename')} ${LK('Undo rename')}`), [fNone('noRename', 'control', 'A rename cannot be undone', WHY_UNDO)]),
  P('search', 'Search', `<input placeholder="Search files" style="width:70%">`, [fNone('noSearchF', 'flexibility', 'No search and no keyboard shortcuts in a large tree', W.flex)]),
  P('many', 'Items', NOTE('12 items.'), [fMin('fMany', 'Two thousand items listed at once', `<div style="font-size:10px;max-height:60px;overflow:auto">${many(70, i => `<div>file_${i}.csv</div>`)}</div>`)])
], { w: 480 });

/* 8. notifications centre */
defTpl('xnotif', 'Bell notifications', 'alerts.bellnet.example/all', ['Unread alerts are bold.', 'Each alert says what happened.'], 'lightship', [
  P('title', 'Title', H2('Notifications · 2 new')),
  P('list', 'Alert list', `${mrow('Storm', '<b>Gale warning tonight</b>', '14:05', true)}${mrow('Ferry', '<b>Delay of 12 minutes</b>', '13:40', true)}${mrow('Office', 'Invoice due Friday', 'Mon')}`, [F('notifCol', 'color', 'New alerts are marked by colour only', W.color, `${mrow('Storm', 'Gale warning tonight', '14:05')}${mrow('Ferry', 'Delay of 12 minutes', '13:40')}${mrow('Office', 'Invoice due Friday', 'Mon')}`)]),
  P('wording', 'Wording', NOTE('Ferry 4 is 12 minutes late.'), [fJar('wordJar', 'SVC_DLY code 0x0C on route 4')]),
  P('mark', 'Mark read', B('Mark all read'), [fTgt('markTiny', 'Mark all read', '✓', 18)]),
  P('snooze', 'Snooze', NOTE(`${LK('Snooze for an hour')} ${LK('Undo')}`), [fNone('noSnooze', 'control', 'Dismissed alerts cannot be brought back', WHY_UNDO)]),
  P('badge', 'Badge', NOTE('Badge shows 2 on the bell.'), [fNone('noBadge', 'status', 'The bell never shows a count', W.stat)]),
  P('clear', 'Clear all', NOTE(`${LK('Clear all')} (asks first)`), [fPrev('clearNow', '“Clear all” beside Mark read, no confirmation', danger('Clear all'))]),
  P('opts', 'Preferences', NOTE('Alerts: <select><option>All</option><option>Storms only</option></select> ' + LK('Back to all')), [F('optFixed', 'flexibility', 'Alert types cannot be switched back', W.flex, NOTE('Alerts: storms only (fixed).'))]),
  P('small', 'Footer', NOTE('Alerts keep for 30 days.'), [fTiny('footTiny', 'The footer'), fGrey('footGrey', 'The footer')])
], { w: 500 });

/* 9. profile card */
defTpl('xprofile', 'Crew profile page', 'crew.quayhub.example/me', ['Fields are labelled in words.', 'Changes show a save notice.'], 'raft', [
  P('title', 'Name', H2('Ana R. · deck crew')),
  P('avatar', 'Photo', `<div style="width:56px;height:56px;border-radius:50%;background:#2e86ab;color:#fff;display:grid;place-items:center;font-size:22px">A</div>`, [fNone('noAvatarAlt', 'recognition', 'The photo has no name or text', 'Pictures need text.')]),
  P('bio', 'About', NOTE('Twelve years on the quay. Likes tea and tidy decks.'), [fTiny('bioTiny', 'The About text'), fGrey('bioGrey', 'The About text')]),
  P('fields', 'Details', I('em', 'Email', 'ana@quay.example'), [fJar('fieldJar', I('em', 'Primary electronic mail identifier', 'ana@quay.example'))]),
  P('public', 'Visibility', NOTE('Who sees this? <select><option>Crew only</option><option>Everyone</option></select>'), [fPrev('pubDefault', 'Everything is public by default, with no warning', NOTE('Visible to everyone, including your phone number.'))]),
  P('save', 'Save', B('Save profile'), [fTgt('saveTiny', 'Save', 'Save', 34)]),
  P('saved', 'Saved', NOTE('Profile saved.'), [fNone('noSaved', 'status', 'Saving shows no sign it worked', W.stat)]),
  P('cancel', 'Cancel', NOTE(`${LK('Discard changes')}`), [fNone('noDiscard', 'control', 'No way to discard changes', WHY_UNDO)]),
  P('del', 'Delete account', NOTE(`${LK('Delete my account')} (asks first)`), [fPrev('accNow', '“Delete account” beside Save, no confirmation', danger('Delete account'))])
], { w: 480 });

/* 10. leaderboard */
defTpl('xboard', 'Regatta leaderboard', 'results.regatta.example/live', ['Rank, name and time are in columns with headings.', 'Ties are shown.'], 'hydrofoil', [
  P('title', 'Title', H2('Regatta · race 3')),
  P('rows', 'Ranking', `${mrow('1st', 'Gull', '1:21.0')}${mrow('2nd', 'Tern', '1:23.4')}${mrow('3rd', 'Skua', '1:24.0')}`, [fRec('rankIcon', 'Ranks are medals only: 🥇 🥈 🥉, no numbers', `${mrow('🥇', 'Gull', '1:21.0')}${mrow('🥈', 'Tern', '1:23.4')}${mrow('🥉', 'Skua', '1:24.0')}`)]),
  P('time', 'Times', NOTE('Times are minutes and seconds.'), [fJar('timeJar', '81000 ms · 83400 ms · 84000 ms')]),
  P('you', 'Your row', NOTE('You are <b>2nd</b> (outlined).'), [fNone('noYou', 'status', 'Nothing highlights your own row', W.stat)]),
  P('trend', 'Change', NOTE('▲ up 1 · ▼ down 1'), [F('trendCol', 'color', 'Up and down shown by green or red only', W.color, NOTE('<span style="color:#1e8e3e">●</span> <span style="color:#c0392b">●</span>'))]),
  P('filter', 'Class filter', NOTE('Class: <select><option>All</option><option>Open</option></select> ' + LK('Show all')), [F('filtFixed', 'flexibility', 'The class filter cannot be cleared', W.flex, NOTE('Class: open (fixed).'))]),
  P('page', 'Pages', NOTE(`${B('‹', 's secondary')} 1 of 4 ${B('›', 's secondary')}`), [fTgt('pageTiny', 'Page arrows', '›', 18)]),
  P('prot', 'Protest', NOTE(`${LK('Lodge a protest')}`), [fNone('noProtest', 'control', 'Results cannot be disputed', WHY_UNDO)]),
  P('small', 'Footnote', NOTE('Provisional until the jury signs.'), [fTiny('fnTiny', 'The footnote'), fGrey('fnGrey', 'The footnote')])
], { w: 500 });

/* 11. flashcard flip */
defTpl('xflip', 'Tern language cards', 'learn.ternlang.example/card', ['Card sides are named Front and Back.', 'Progress is shown in words.'], 'barge', [
  P('title', 'Deck', H2('Basic nouns · card 4 of 20')),
  P('card', 'Card', `<div style="padding:18px;text-align:center;background:#fff8e0;border:2px solid #c99a4b;font-size:22px;color:${ROWC}">la mer</div>`, [fGrey('cardGrey', 'The card word')]),
  P('flip', 'Flip', B('Show answer'), [fTgt('flipTiny', 'Show answer', '↻', 18)]),
  P('hint', 'Hint', NOTE('Hint: feminine noun.'), [fTiny('hintTiny', 'The hint')]),
  P('grade', 'Grade', NOTE(`${B('Again', 's secondary')} ${B('Good', 's')} ${B('Easy', 's secondary')}`), [fRec('gradeIcon', 'Grades are faces only: 😟 🙂 😀', NOTE('😟 🙂 😀'))]),
  P('prog', 'Progress', NOTE('4 of 20 · 3 correct'), [fNone('noProg', 'status', 'No sign of how far through the deck you are', W.stat)]),
  P('undo', 'Undo grade', NOTE(`${LK('Undo last grade')}`), [fNone('noUndo', 'control', 'A wrong grade cannot be undone', WHY_UNDO)]),
  P('reset', 'Reset deck', NOTE(`${LK('Reset the deck')} (asks first)`), [fPrev('resetNow', '“Reset deck” beside Again, no confirmation', danger('Reset deck'))]),
  P('kb', 'Keyboard', NOTE('Space flips. 1, 2, 3 grade.'), [F('mouseOnly', 'keyboard', 'The card can be flipped only by clicking', 'Keyboard users need an alternative.', NOTE('Click the card to flip.'))])
], { w: 440 });

/* 12. mega menu nav */
defTpl('xmenu', 'Town hall site menu', 'townhall.halcyon.example/', ['Menu names are plain words.', 'The current page is marked.'], 'steamer', [
  P('title', 'Site name', H2('Halcyon Town Hall')),
  P('nav', 'Top menu', `<p style="font-size:14px;color:${ROWC}"><b style="border-bottom:3px solid #2e86ab">Home</b> · Services · Council · Contact</p>`, [fNone('noCurrent', 'status', 'Nothing marks the current page', W.stat)]),
  P('names', 'Menu names', NOTE('Services · Council · Contact'), [fJar('menuJar', 'Citizen enablement · Governance · Stakeholder interface')]),
  P('mega', 'Dropdown', NOTE('Services opens a list of 8 items.'), [fMin('megaMany', 'The menu opens a list of 140 links', `<div style="font-size:10px;max-height:70px;overflow:auto;columns:3">${many(60, i => `<div>Link ${i}</div>`)}</div>`)]),
  P('hover', 'Opening', NOTE('Menus open on click or Enter.'), [F('hoverOnly', 'keyboard', 'Menus open only on mouse hover', 'Keyboard and touch users need another way.', NOTE('Hover to open the menu.'))]),
  P('search', 'Search', `<input placeholder="Search the site" style="width:60%"> ${B('Go', 's')}`, [fTgt('goTiny', 'Go', '🔍', 18)]),
  P('crumbs', 'Breadcrumbs', NOTE(`${LK('Home')} › ${LK('Services')} › Bins`), [fNone('noCrumb', 'control', 'No breadcrumbs and no way back up one level', WHY_UNDO)]),
  P('small', 'Footer', NOTE('Opening hours 9:00 to 16:00.'), [fTiny('footTiny', 'The footer'), fGrey('footGrey', 'The footer')]),
  P('lang', 'Language', NOTE('Language: <select><option>English</option><option>Español</option></select> ' + LK('Back to English')), [F('langFixed', 'flexibility', 'The language cannot be switched back', W.flex, NOTE('Language: Español (fixed).'))])
], { w: 540 });

/* 13. date range picker */
defTpl('xrange', 'Stay-dates picker', 'stay.quayinn.example/dates', ['Dates are written 7 Nov.', 'The range is shown in words.'], 'liner', [
  P('title', 'Title', H2('Choose your dates')),
  P('cal', 'Calendar', `<div>${many(14, i => cell(`${i + 1}`, i >= 4 && i <= 7 ? '#bfe0ff' : '#fff'))}</div>`, [F('rangeCol', 'color', 'The chosen range is shown by colour only', W.color, `<div>${many(14, i => cell(`${i + 1}`, i >= 4 && i <= 7 ? '#cfe9ff' : '#fff'))}</div>`)]),
  P('words', 'Chosen range', NOTE('Fri 5 Nov to Mon 8 Nov (3 nights)'), [fJar('rangeJar', '2026-11-05/2026-11-08 P3N')]),
  P('hit', 'Apply', B('Search rooms'), [fTgt('applyTiny', 'Search rooms', 'Go', 26)]),
  P('err', 'Message', AL('Check-out must be after check-in.'), [fErr('rangeErr', 'Error 422: END_LT_START')]),
  P('clear', 'Clear', NOTE(`${LK('Clear dates')}`), [fNone('noClear', 'control', 'Dates cannot be cleared once chosen', WHY_UNDO)]),
  P('price', 'Price', NOTE('3 nights from 210 cr.'), [fNone('noPrice', 'status', 'The price does not update when dates change', W.stat)]),
  P('flex', 'Flexible', NOTE('Flexible dates: <select><option>Exact</option><option>± 1 day</option></select> ' + LK('Back to exact')), [F('flexFixed', 'flexibility', 'Flexible dates cannot be switched back', W.flex, NOTE('Flexible: ± 3 days (fixed).'))]),
  P('small', 'Fine print', NOTE('Prices vary by night.'), [fTiny('fineTiny', 'The fine print'), fGrey('fineGrey', 'The fine print')])
], { w: 520 });

/* 14. colour theme picker */
const sw = (c, n) => `<span style="display:inline-block;width:46px;height:34px;margin:2px;background:${c};color:#fff;font-size:11px;text-align:center;line-height:34px">${n}</span>`;
defTpl('xtheme', 'Lamp theme picker', 'theme.lamplight.example/pick', ['Colours have names.', 'Contrast stays readable in every theme.'], 'paddle', [
  P('title', 'Title', H2('Pick a theme')),
  P('swatch', 'Swatches', `${sw('#2e86ab', 'Sea')}${sw('#c0392b', 'Red')}${sw('#1e8e3e', 'Kelp')}${sw('#6b4a9a', 'Dusk')}`, [fRec('swNames', 'Swatches have no names', `${sw('#2e86ab', '')}${sw('#c0392b', '')}${sw('#1e8e3e', '')}${sw('#6b4a9a', '')}`)]),
  P('prev', 'Preview', `<div style="padding:8px;background:#fff;color:#1d2530;font-size:14px">Preview text on the chosen theme.</div>`, [F('prevGrey', 'contrast', 'Preview text is pale on a light theme', W.contrast, `<div style="padding:8px;background:#fff;color:#d8d8d8;font-size:14px">Preview text on the chosen theme.</div>`)]),
  P('hex', 'Colour code', I('hex', 'Colour code', '#2e86ab'), [fJar('hexJar', I('hex', 'Hexadecimal chromatic triplet', '#2e86ab'))]),
  P('hit', 'Apply', B('Apply theme'), [fTgt('applyTiny', 'Apply', 'OK', 26)]),
  P('state', 'Applied', NOTE('Theme applied.'), [fNone('noApplied', 'status', 'Nothing shows the theme was applied', W.stat)]),
  P('reset', 'Default', NOTE(`${LK('Back to the default theme')}`), [fNone('noDefault', 'control', 'There is no way back to the default theme', W.flex)]),
  P('wipe', 'Delete themes', NOTE(`${LK('Delete my themes')} (asks first)`), [fPrev('themeNow', '“Delete my themes” beside Apply, no confirmation', danger('Delete my themes'))]),
  P('many', 'Palette', NOTE('Showing 8 colours.'), [fMin('palMany', 'Four hundred swatches with no groups', `<div style="line-height:0">${many(70, i => sw(`hsl(${i * 5},60%,45%)`, ''))}</div>`)])
], { w: 500 });

/* 15. drag and drop upload */
defTpl('xdrop', 'Dockside upload box', 'send.dockside.example/files', ['The upload area says what to do.', 'Progress is shown in words and a bar.'], 'barge', [
  P('title', 'Title', H2('Send your files')),
  P('zone', 'Drop area', `<div style="border:2px dashed #2e86ab;padding:18px;text-align:center;font-size:14px;color:${ROWC}">Drop files here or ${LK('choose files')}</div>`, [F('dropOnly', 'keyboard', 'Files can only be dragged in; no choose button', 'Keyboard users need a button.', `<div style="border:2px dashed #2e86ab;padding:18px;text-align:center;font-size:14px;color:${ROWC}">Drop files here</div>`)]),
  P('list', 'File list', NOTE('tide.csv 14 KB · photo.jpg 2 MB'), [fJar('listJar', '14336 B · 2097152 B')]),
  P('bar', 'Progress', `<span style="font-size:13px">Uploading 64%</span> <span style="display:inline-block;width:120px;height:10px;background:#dde3e8"><i style="display:block;width:64%;height:100%;background:#2e86ab"></i></span>`, [fNone('noBar', 'status', 'Uploading shows no progress and no result', W.stat)]),
  P('hit', 'Send', B('Send files'), [fTgt('sendTiny', 'Send files', 'Go', 26)]),
  P('cancel', 'Cancel', NOTE(`${LK('Cancel this upload')}`), [fNone('noCancel', 'control', 'An upload cannot be stopped once started', WHY_UNDO)]),
  P('err', 'Message', AL('photo.jpg is too big. The limit is 5 MB.'), [fErr('upErr', 'Error 413: ENTITY_TOO_LARGE')]),
  P('clear', 'Remove all', NOTE(`${LK('Remove all files')} (asks first)`), [fPrev('rmNow', '“Remove all” beside Send, no confirmation', danger('Remove all files'))]),
  P('rules', 'Rules', NOTE('Up to 10 files, 5 MB each.'), [fTiny('ruleTiny', 'The rules'), fGrey('ruleGrey', 'The rules')])
], { w: 500 });

/* 16. gantt timeline */
const gb = (l, w, c, o = 0) => `<div style="font-size:11px;color:${ROWC}">${l}<div style="margin-left:${o}px;width:${w}px;height:10px;background:${c}"></div></div>`;
defTpl('xgantt', 'Dock works timeline', 'plan.dockworks.example/gantt', ['Bars have labels and dates.', 'Late tasks are marked in words.'], 'tanker', [
  P('title', 'Title', H2('Dock works plan')),
  P('bars', 'Bars', `${gb('Dredging · Mon to Wed', 90, '#2e86ab')}${gb('Piles · Wed to Fri', 90, '#c99a4b', 60)}${gb('Paint · Fri to Sun · LATE', 90, '#c0392b', 120)}`, [F('barCol', 'color', 'Late tasks differ by bar colour only', W.color, `${gb('', 90, '#2e86ab')}${gb('', 90, '#c99a4b', 60)}${gb('', 90, '#c0392b', 120)}`)]),
  P('axis', 'Date axis', NOTE('Mon Tue Wed Thu Fri Sat Sun'), [fNone('noAxis', 'text', 'The timeline has no dates or axis', 'Charts need labelled axes.')]),
  P('zoom', 'Zoom', NOTE(`${B('Day', 's secondary')} ${B('Week', 's')} ${B('Month', 's secondary')}`), [fTgt('zoomTiny', 'Zoom buttons', 'D W M', 22)]),
  P('drag', 'Moving bars', NOTE('Drag, or open a task and set the dates.'), [F('dragOnly', 'keyboard', 'Dates can be changed only by dragging', 'Keyboard users need an alternative.', NOTE('Drag bars to change dates.'))]),
  P('undo', 'Undo', NOTE(`${LK('Undo')}`), [fNone('noUndo', 'control', 'A moved task cannot be moved back', WHY_UNDO)]),
  P('save', 'Autosave', NOTE('All changes saved.'), [fNone('noSaved', 'status', 'Changes are saved with no sign', W.stat)]),
  P('del', 'Delete task', NOTE(`${LK('Delete task')} (asks first)`), [fPrev('taskNow', '“Delete task” beside Zoom, no confirmation', danger('Delete task'))]),
  P('many', 'Tasks', NOTE('3 tasks shown.'), [fMin('tMany', 'Three hundred tasks in one chart', `<div style="font-size:10px;max-height:60px;overflow:auto">${many(60, i => gb('', 60 + (i % 5) * 20, '#889', i * 2))}</div>`)])
], { w: 540 });

/* 17. contacts with alphabet index */
defTpl('xcontacts', 'Quay address book', 'people.quayhub.example/contacts', ['Names are first name, last name.', 'The letter index is clear.'], 'sail', [
  P('title', 'Title', H2('Contacts')),
  P('list', 'Contact list', `${mrow('Ana', 'Ana Ruiz', '☎')}${mrow('Noa', 'Noa Pérez', '☎')}${mrow('Pete', 'Pete Wells', '☎')}`, [fJar('nameJar', mrow('cn', 'Ruiz;Ana;;;', 'tel:+34…'))]),
  P('index', 'Letter index', NOTE('A B C D E F G H I J K L M…'), [fTiny('idxTiny2', 'The letter index')]),
  P('search', 'Search', `<input placeholder="Search contacts" style="width:70%">`, [fNone('noSearchC', 'recognition', 'There is no search and the list is long', 'Offer a way to find things.')]),
  P('call', 'Call', B('Call'), [fTgt('callTiny', 'Call', '☎', 18)]),
  P('merge', 'Merge', NOTE(`${LK('Merge duplicates')}`), [fPrev('mergeNow', 'Merge happens at once, with no preview or undo', NOTE('Merged 14 contacts.'))]),
  P('del', 'Delete', NOTE(`${LK('Delete contact')} (asks first)`), [fPrev('delNow', '“Delete contact” beside Call, no confirmation', danger('Delete contact'))]),
  P('sync', 'Sync', NOTE('Synced just now.'), [fNone('noSync', 'status', 'Syncing shows nothing at all', W.stat)]),
  P('sort', 'Sort', NOTE('Sort by: <select><option>First name</option><option>Last name</option></select> ' + LK('Back to first name')), [F('sortFixed', 'flexibility', 'The sort order cannot be changed back', W.flex, NOTE('Sort: last name (fixed).'))])
], { w: 480 });

/* 18. rating and review */
defTpl('xreview', 'Dine-in review form', 'reviews.dinein.example/rate', ['Stars come with words.', 'You can edit a review.'], 'liner', [
  P('title', 'Title', H2('How was the Lamp Café?')),
  P('stars', 'Stars', `<div style="font-size:24px;color:#c99a4b">★★★★☆ <span style="font-size:13px;color:${ROWC}">4 of 5, good</span></div>`, [F('starsOnly', 'recognition', 'Stars are shown with no number or word', 'Pair symbols with words.', '<div style="font-size:24px;color:#c99a4b">★★★★☆</div>')]),
  P('text', 'Review text', `<textarea style="width:95%;height:44px" placeholder="Tell others what you thought"></textarea>`, [fGrey('textGrey', 'Placeholder text')]),
  P('hit', 'Post', B('Post review'), [fTgt('postTiny', 'Post review', 'Post', 28)]),
  P('limit', 'Character count', NOTE('62 of 500 characters.'), [fNone('noCount', 'status', 'No count and no warning near the limit', W.stat)]),
  P('edit', 'Edit', NOTE(`${LK('Edit my review')}`), [fNone('noEdit', 'control', 'A review cannot be edited or removed', WHY_UNDO)]),
  P('wipe', 'Delete review', NOTE(`${LK('Delete my review')} (asks first)`), [fPrev('revNow', '“Delete review” beside Post, no confirmation', danger('Delete review'))]),
  P('err', 'Message', AL('Please add at least a few words.'), [fErr('revErr', 'Error 400: BODY_EMPTY')]),
  P('rules', 'House rules', NOTE('Keep it kind and about the food.'), [fTiny('ruleTiny', 'The house rules')])
], { w: 480 });

/* 19. restaurant menu with allergens */
defTpl('xmenu2', 'Lamp Café menu', 'eat.lampcafe.example/menu', ['Allergens are listed in words.', 'Prices show a unit.'], 'paddle', [
  P('title', 'Title', H2('Lunch menu')),
  P('dishes', 'Dishes', `${mrow('Fish soup', 'with bread', '6 cr')}${mrow('Crab roll', 'with salad', '8 cr')}${mrow('Tea cake', '', '3 cr')}`, [fJar('dishJar', mrow('PRD_01', 'SKU 4471', '600'))]),
  P('allergen', 'Allergens', NOTE('Fish soup: fish, gluten. Crab roll: shellfish.'), [F('allergenIcon', 'recognition', 'Allergens are tiny symbols with no key', 'Show words.', NOTE('Fish soup: 🐟 🌾 · Crab roll: 🦀'))]),
  P('veg', 'Dietary marks', NOTE(`${DOT('#1e8e3e', 'Vegetarian')} · ${DOT('#c0392b', 'Spicy')}`), [F('vegCol', 'color', 'Vegetarian and spicy dishes differ by colour only', W.color, NOTE(`${DOT('#1e8e3e')} ${DOT('#c0392b')}`))]),
  P('order', 'Order', B('Add to order'), [fTgt('orderTiny', 'Add to order', '+', 16)]),
  P('tot', 'Order total', NOTE('Order: 2 items, 14 cr'), [fNone('noTot', 'status', 'The order total never updates', W.stat)]),
  P('rm', 'Remove', NOTE(`${LK('Remove item')} ${LK('Undo')}`), [fNone('noRm', 'control', 'An item cannot be removed from the order', WHY_UNDO)]),
  P('clear', 'Clear order', NOTE(`${LK('Clear the order')} (asks first)`), [fPrev('clrNow', '“Clear order” beside Add, no confirmation', danger('Clear the order'))]),
  P('small', 'Footer', NOTE('Ask staff about other allergies.'), [fTiny('footTiny', 'The footer'), fGrey('footGrey', 'The footer')])
], { w: 500 });

/* 20. step ring health */
defTpl('xring', 'Stride step counter', 'steps.stride.example/today', ['Goals show a number and a unit.', 'Colour is never the only sign.'], 'hydrofoil', [
  P('title', 'Title', H2('Today’s steps')),
  P('ring', 'Progress ring', `<div style="width:90px;height:90px;border-radius:50%;border:10px solid #2e86ab;border-right-color:#dde3e8;display:grid;place-items:center;font:700 15px sans-serif;color:${ROWC}">6,210</div>`, [fNone('noGoal', 'status', 'The ring shows no number, goal or unit', W.stat)]),
  P('goal', 'Goal', NOTE('Goal: 8,000 steps. 78% there.'), [fJar('goalJar', 'tgt=8000 stp, pct=0.776')]),
  P('week', 'Week bars', `${[60, 80, 40, 90, 78].map((v, i) => `<div style="font-size:11px;color:${ROWC}">${'MTWTF'[i]} ${bar(v)} ${v}%</div>`).join('')}`, [F('weekCol', 'color', 'Goal met or missed by bar colour only', W.color, `${[60, 80, 40, 90, 78].map(v => `<div>${bar(v, v >= 80 ? '#1e8e3e' : '#c0392b')}</div>`).join('')}`)]),
  P('hit', 'Set goal', B('Set a new goal'), [fTgt('goalTiny', 'Set goal', 'Set', 24)]),
  P('edit', 'Edit', NOTE(`${LK('Reset today’s steps')} ${LK('Undo')}`), [fNone('noUndo', 'control', 'Resetting steps cannot be undone', WHY_UNDO)]),
  P('del', 'Delete data', NOTE(`${LK('Delete all my history')} (asks first)`), [fPrev('histNow', '“Delete history” beside Set goal, no confirmation', danger('Delete all history'))]),
  P('units', 'Units', NOTE('Distance: <select><option>km</option><option>miles</option></select> ' + LK('Back to km')), [F('unitFixed', 'flexibility', 'Units cannot be switched back', W.flex, NOTE('Distance: miles (fixed).'))]),
  P('small', 'Tip', NOTE('A short walk after lunch helps.'), [fTiny('tipTiny', 'The tip'), fGrey('tipGrey', 'The tip')])
], { w: 480 });

/* 21. departures board */
defTpl('xdeparts', 'Quay departures board', 'board.quayferry.example/live', ['Status is a word.', 'Times are 24h.'], 'hydrofoil', [
  P('title', 'Title', H2('Departures')),
  P('rows', 'Board rows', `${mrow('14:20', 'Marrow', 'On time')}${mrow('14:40', 'Vael', 'Delayed 12 min')}${mrow('15:00', 'Isle', 'Cancelled')}`, [F('boardCol', 'color', 'Delayed and cancelled differ by colour only', W.color, `${mrow('14:20', 'Marrow', DOT('#1e8e3e'))}${mrow('14:40', 'Vael', DOT('#e6a700'))}${mrow('15:00', 'Isle', DOT('#c0392b'))}`)]),
  P('time', 'Clock', NOTE('Now 14:12:30'), [fJar('timeJar', 'Now 1731075150')]),
  P('gate', 'Gate', NOTE('Gate 3 opens 10 minutes before.'), [fTiny('gateTiny', 'Gate information'), fGrey('gateGrey', 'Gate information')]),
  P('track', 'Track', B('Track this ferry'), [fTgt('trackTiny', 'Track', '★', 18)]),
  P('upd', 'Updated', NOTE('Live. Updated 4 seconds ago.'), [fNone('noUpd', 'status', 'The board never says it is live or when it updated', W.stat)]),
  P('untrack', 'Untrack', NOTE(`${LK('Stop tracking')}`), [fNone('noUntrack', 'control', 'Tracked ferries cannot be removed', WHY_UNDO)]),
  P('wipe', 'Clear', NOTE(`${LK('Clear tracked ferries')} (asks first)`), [fPrev('clrNow', '“Clear tracked” beside Track, no confirmation', danger('Clear tracked ferries'))]),
  P('many', 'Rows', NOTE('Next 3 departures.'), [fMin('rowMany', 'Every ferry for the next week on one page', `<div style="font-size:10px;max-height:60px;overflow:auto">${many(60, i => `<div>${i + 8}:00 Marrow</div>`)}</div>`)])
], { w: 500 });

/* 22. cart with steppers */
const qty = (n, small) => `<span style="display:inline-flex;gap:2px;align-items:center"><button style="${small ? 'width:12px;height:12px;font-size:8px;padding:0' : 'width:28px;height:28px'};background:#e8edf1;color:#1d2530;border:1px solid #8a96a0">−</button><b style="font-size:13px;color:#1d2530">${n}</b><button style="${small ? 'width:12px;height:12px;font-size:8px;padding:0' : 'width:28px;height:28px'};background:#e8edf1;color:#1d2530;border:1px solid #8a96a0">+</button></span>`;
defTpl('xcart', 'Chandlery basket', 'shop.chandlery.example/basket', ['Every line shows quantity and price.', 'Totals show a unit.'], 'trawler', [
  P('title', 'Title', H2('Your basket')),
  P('lines', 'Basket lines', `${mrow('Rope 10 m', qty(1), '6 cr')}${mrow('Lamp oil', qty(2), '8 cr')}`, [fJar('lineJar', mrow('SKU-R10', 'qty=1', '600'))]),
  P('step', 'Quantity buttons', `${qty(2)}`, [F('stepTiny', 'target', 'Quantity buttons are 12 px', W.target, qty(2, true))]),
  P('total', 'Total', NOTE('Total: <b>14 cr</b> + 3 cr delivery'), [fNone('noTot', 'status', 'The total does not change when you change a quantity', W.stat)]),
  P('promo', 'Promo code', `<input placeholder="Promo code" style="width:50%"> ${B('Apply', 's')}`, [fErr('promoErr', 'Error 7: PROMO_REJ')]),
  P('rm', 'Remove', NOTE(`${LK('Remove')} ${LK('Undo')}`), [fNone('noRm', 'control', 'A removed line cannot be brought back', WHY_UNDO)]),
  P('empty', 'Empty basket', NOTE(`${LK('Empty the basket')} (asks first)`), [fPrev('emptyNow', '“Empty basket” beside Checkout, no confirmation', danger('Empty basket'))]),
  P('pay', 'Checkout', B('Checkout'), [fTgt('payTiny', 'Checkout', 'Pay', 30)]),
  P('names', 'Words', NOTE('Basket · Basket · Basket'), [fCons('basketMix', 'Basket, Cart and Bag used for one thing', NOTE('Basket · Cart · Bag'))])
], { w: 500 });

/* 23. password strength */
defTpl('xstrength', 'Keyhole sign-up', 'join.keyhole.example/password', ['Strength is shown in a word and a bar.', 'Rules are shown before you type.'], 'submarine', [
  P('title', 'Title', H2('Choose a password')),
  P('field', 'Password field', `<label for="pw" style="font-size:14px">Password</label><input id="pw" type="password" value="harbor-light-92">`, [fJar('pwJar', `<label for="pw" style="font-size:14px">Authentication secret (UTF-8, ≥ 12 bytes)</label><input id="pw" type="password">`)]),
  P('meter', 'Strength meter', `<span style="font-size:13px;color:${ROWC}">Strength: Strong </span>${bar(85, '#1e8e3e', 8)}`, [F('meterCol', 'color', 'Strength is shown by bar colour only', W.color, bar(85, '#1e8e3e', 8))]),
  P('rules', 'Rules', NOTE('Use 12 or more characters. Spaces are fine.'), [fRec('rulesLate', 'Rules appear only after a failed attempt', NOTE(''))]),
  P('show', 'Show', NOTE(`${B('Show', 's secondary')} the password`), [F('noShow', 'flexibility', 'The password can never be shown, so typos cannot be checked', W.flex, NOTE('Hidden.'))]),
  P('hit', 'Create', B('Create account'), [fTgt('createTiny', 'Create', 'OK', 26)]),
  P('err', 'Message', AL('That password is on a list of common ones. Try a few unrelated words.'), [fErr('pwErr', 'Error 422: ENTROPY_LOW')]),
  P('paste', 'Paste', NOTE('Pasting is allowed.'), [fPrev('noPaste', 'Pasting is blocked, so password managers fail', NOTE('Pasting disabled.'))]),
  P('small', 'Fine print', NOTE('We never email your password.'), [fTiny('fineTiny', 'The fine print'), fGrey('fineGrey', 'The fine print')])
], { w: 480 });

/* 24. timetable grid */
const ttc = (t, bg = '#fff') => `<td style="border:1px solid #ccd;padding:3px 6px;background:${bg};font-size:12px;color:${ROWC}">${t}</td>`;
defTpl('xtimetable', 'Reef school timetable', 'timetable.reefschool.example/week', ['Lessons show a name and a room.', 'Free periods are marked.'], 'barge', [
  P('title', 'Title', H2('Week 45 timetable')),
  P('grid', 'Lessons', `<table style="border-collapse:collapse"><tr><th></th><th>Mon</th><th>Tue</th><th>Wed</th></tr>${[['9:00', 'Maths R2', 'Art R5', 'Maths R2'], ['10:00', 'History R1', 'Free', 'PE Hall']].map(r => `<tr><th style="font-size:12px;color:${ROWC}">${r[0]}</th>${r.slice(1).map(x => ttc(x, x === 'Free' ? '#f1f3f5' : '#fff')).join('')}</tr>`).join('')}</table>`, [F('lessonCol', 'color', 'Subjects differ by cell colour only', W.color, `<table style="border-collapse:collapse"><tr>${ttc('', '#bfe0ff')}${ttc('', '#ffe9a8')}${ttc('', '#bfe0ff')}</tr><tr>${ttc('', '#c8f0c8')}${ttc('', '#f1f3f5')}${ttc('', '#ffd6d6')}</tr></table>`)]),
  P('rooms', 'Rooms', NOTE('R2 is on the ground floor.'), [fJar('roomJar', 'LOC_02 / FLR_00')]),
  P('now', 'Now', NOTE('Now: Maths, room 2. Next: History.'), [fNone('noNow', 'status', 'Nothing shows which lesson is on now', W.stat)]),
  P('week', 'Week', NOTE(`${B('‹ Previous week', 's secondary')} ${B('Next week ›', 's secondary')}`), [fTgt('weekTiny', 'Week arrows', '‹ ›', 18)]),
  P('swap', 'Swap', NOTE(`${LK('Swap a lesson')} ${LK('Undo')}`), [fNone('noUndo', 'control', 'A swapped lesson cannot be swapped back', WHY_UNDO)]),
  P('print', 'Print', NOTE(`${B('Print', 's')} ${B('Share', 's secondary')}`), [fRec('printIcon', 'Print and share are unlabelled icons', NOTE('⎙ ⇪'))]),
  P('wipe', 'Clear week', NOTE(`${LK('Clear this week')} (asks first)`), [fPrev('clrNow', '“Clear this week” beside Print, no confirmation', danger('Clear this week'))]),
  P('small', 'Footer', NOTE('Changes are posted by 8:00.'), [fTiny('footTiny', 'The footer'), fGrey('footGrey', 'The footer')])
], { w: 520 });

/* ───────────────────── 11f. Lore: the Margin, the Registry, and what nobody says aloud ─────────────────────
   Nothing here states a verdict. Facts arrive as objects, notes, numbers and omissions; the notebook records what the
   inspector noticed, never what it means. Effects stay hidden: there is no dial, no hint, no chip.                  */
Art.star = function () {
  return `<svg viewBox="0 0 48 48" role="img" aria-label="Star"><path d="M24 5l5.2 11.6 12.6 1.3-9.5 8.5 2.8 12.4L24 32l-11.1 6.8 2.8-12.4-9.500-8.500 12.600-1.300Z" fill="#c9a227" stroke="#8a6d12" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
};

BRIG_EVENTS.length = 0;
BRIG_EVENTS.push(
  { id: 'sigil', brig: true, minDay: 3, icon: 'envelope', title: 'A card in the dossier',
    when: g => g.brigSeen > 0,
    text: 'Between two pages of the last dossier: a plain card, blank but for a small hand-drawn star and a line in pencil. “Pier 9. Thursday, after the lamps.”',
    choices: [
      { label: 'Keep the card', run: g => { g.knowsBrig = true; g.shiftBrig(1); g.note('sigilKeep', 'A card with a star: “Pier 9, Thursday, after the lamps.” I kept it.'); return 'You slip it inside your coat.'; } },
      { label: 'Give it to the clerk', run: g => { g.reported = true; g.meter({ funds: 25 }); g.shiftBrig(-2); g.note('sigilGive', 'Gave the card to the clerk. I did not read the pencil twice.'); return 'The clerk thanks you without looking up.'; } },
      { label: 'Put it back between the pages', run: g => { g.note('sigilBack', 'Put the card back where I found it. I wonder who else has seen it.'); return 'The card goes back where it was.'; } }
    ] },
  { id: 'registry', brig: true, minDay: 4, icon: 'papers', title: 'A clerk from the Registry',
    when: g => g.brigSeen > 0 && !g.reported,
    text: 'Ilse Brandt, polite and tired. She mentioned once that her sister’s boat was one of the twenty-three. “Any dossiers this week without a registry mark? Anything… decorative in the margins?”',
    choices: [
      { label: 'Tell her about the stars', run: g => { g.reported = true; g.meter({ trust: 2 }); g.shiftBrig(-2); g.note('ilse', 'Told Ilse about the stars. She wrote it down without looking up.'); return 'She writes it down without looking at you.'; } },
      { label: 'Say you have only seen smudges', run: g => { g.shiftBrig(1); g.note('ilse', 'Told Ilse they were smudges. She did not look surprised.'); return 'She nods, as if you had said something else.'; } },
      { label: 'Ask what happens to them', run: g => { g.note('ilse', 'Ilse said the unmarked ones are “filed”. She said it the way people say “buried”.'); return '“They are filed,” she says. You nod as if that were an answer.'; } }
    ] },
  { id: 'marquee', brig: true, minDay: 4, icon: 'lamp', title: 'A purple scarf at the window',
    when: g => g.brigSeen > 1,
    text: 'A woman orders tea and does not drink it. “May I see page fourteen of your rulebook?” There is no page fourteen. “There used to be,” she says. “It was one line long. It said a screen should be a pleasure to use.” She leaves a small purse beside the cup. “For your trouble. No obligations.”',
    choices: [
      { label: 'Take the purse', run: g => { g.pact = true; g.bribes++; g.meter({ funds: 40 }); g.shiftBrig(2); g.note('page14', 'A woman asked for page fourteen of the rulebook. There is no page fourteen. She said it was one line long. I took the purse.'); Sfx.coin(); return 'It is heavier than it looks.'; } },
      { label: 'Push it back', run: g => { g.note('page14', 'A woman asked for page fourteen of the rulebook. There is no page fourteen. She said it was one line long. I gave her purse back.'); return 'She smiles as if you had agreed with her.'; } },
      { label: 'Ask her name', run: g => { g.shiftBrig(1); g.note('page14', 'A woman asked for page fourteen of the rulebook. There is no page fourteen. She called herself “a reader”.'); return '“A reader,” she says, and finishes her tea after all.'; } }
    ] },
  { id: 'kit', brig: true, minDay: 5, icon: 'envelope', title: 'An old man with a cat carrier',
    when: g => g.brigSeen > 0,
    text: 'He gives his name as Pete. His shelter’s homepage is how strangers find homes for forty cats. It has a rainbow banner, thirty links, and no licence for the Standard Kit. “Four credits a screen, Inspector. I have the cats. I do not have the credits.”',
    choices: [
      { label: 'Tell him the rulebook has no room for cats', run: g => { g.kitHelped = false; g.meter({ trust: 1 }); g.note('pete', 'Pete’s page has thirty links, a rainbow banner and forty cats. I told him the rules are the rules. They are.'); return 'He nods slowly and picks up the carrier.'; } },
      { label: 'Write him a letter of exemption', run: g => { g.kitHelped = true; g.exempt = true; g.shiftBrig(1); g.note('pete', 'Wrote Pete a letter I had no authority to write. My signature looked like someone else’s.'); return 'You sign with a hand that does not feel like yours.'; } },
      { label: 'Tell him to ask at Pier 9', run: g => { g.kitHelped = 'pier'; g.knowsBrig = true; g.shiftBrig(1); g.note('pete', 'Told Pete to ask at Pier 9. I do not know why I knew to say it.'); return 'He looks at something behind you and smiles.'; } }
    ] },
  { id: 'mara', brig: true, minDay: 5, icon: 'papers', title: 'Mara, over tea',
    when: g => g.brigSeen > 0,
    text: 'Mara slides a cup across the sill. “Funny thing. Nobody logs the unmarked ones. They go straight to the Registry. I asked where they go after that. Nobody knew. Do you?” She is not looking at you.',
    choices: [
      { label: 'Tell her what you have seen', run: g => { g.maraTold = true; g.note('mara', 'Told Mara about the stars. She listened like someone memorising.'); return 'She nods slowly, memorising.'; } },
      { label: 'Say you know nothing', run: g => { g.note('mara', 'Told Mara I knew nothing. She stirred her tea for a long time.'); return 'She stirs her tea for a long time.'; } },
      { label: 'Ask what she wants', run: g => { g.note('mara', 'Asked Mara what she wanted. “To know whose side the tea is on.” She was smiling. It was hard to tell.'); return '“To know whose side the tea is on,” she says. It is hard to tell if she is joking.'; } }
    ] },
  { id: 'memo', brig: true, minDay: 6,  icon: 'papers', title: 'A folder left on the sill',
    when: g => g.brigSeen > 0,
    text: g => `Registry stationery, no signature. “IRREGULARITIES (codename BLINK), by booth. Booth 1: referred ${g.referred}, cleared ${g.brigStats.app}. Booth 2: referred 11, cleared 0. Booth 3: referred 0, cleared 6, UNDER REVIEW.” Someone has circled the last line in pencil.`,
    choices: [
      { label: 'Read to the end and put it back', run: g => { g.note('memo', 'My booth is a number on someone’s sheet. Someone circled the line about booth 3.'); return 'You put it back exactly as it was.'; } },
      { label: 'Copy it for yourself', run: g => { g.memoCopy = true; g.knowsBrig = true; g.exempt = true; g.shiftBrig(1); g.note('memo', 'Copied the sheet. My booth is a number on it. So is booth 3, and someone circled it.'); return 'Your pen is loud in the silence.'; } },
      { label: 'Return it to the clerk, unopened', run: g => { g.shiftBrig(-1); g.note('memo', 'Returned a folder unopened. The clerk did not ask whether I had read it.'); return 'The clerk takes it and does not say thank you.'; } }
    ] },
  { id: 'pier9', brig: true, minDay: 6, icon: 'lamp', title: 'A lamp at Pier 9',
    when: g => g.day >= 6 && (g.knowsBrig || g.brig >= 2 || g.reported),
    text: 'Thursday. The quay lamps are being lit, and the one at Pier 9 is lit twice. It is also the night of the vigil that was moved. A boy hands you a folded paper: a map, no name.',
    choices: [
      { label: 'Go', run: g => { g.pier = 'went'; g.meter({ trust: -2 }); g.shiftBrig(2); g.note('pier', 'Pier 9: a wall of twenty-three names. In the corner an old ferry page still runs, with a chair in front of it. Someone said the page that stranded thirty-one was theirs. Someone else said it was not.'); return 'The wall has twenty-three names. A screen in the corner still works, and someone has put a chair in front of it.'; } },
      { label: 'Go to the Registry instead', run: g => { g.pier = 'told'; g.reported = true; g.meter({ funds: 50, trust: 2 }); g.shiftBrig(-3); g.note('pier', 'Told the Registry the hour. I watched the clock until it passed.'); return 'Ilse writes the hour down with an unsteady hand.'; } },
      { label: 'Stay in', run: g => { g.pier = 'stayed'; g.note('pier', 'Watched the lamp at Pier 9 from my window until it went out.'); return 'You watch the lamp until it goes out.'; } }
    ] },
  { id: 'gala', brig: true, minDay: 7, icon: 'lamp', title: 'A scarf on the sill',
    when: g => (g.pact || g.brig >= 2) && !g.reported,
    text: 'A purple scarf lies folded on the sill beside a roll of bunting. A note: “Eight metres of quay need a ladder. We have the bunting. You have the key to the lamp room.”',
    choices: [
      { label: 'Open the lamp room', run: g => { g.meter({ flow: 5, trust: -2 }); g.shiftBrig(1); return 'Footsteps on the stair, soft as cats.'; } },
      { label: 'Leave the key where it hangs', run: g => { g.shiftBrig(-1); return 'The scarf is gone by evening.'; } },
      { label: 'Hang the bunting yourself, at a sensible height', run: g => { g.meter({ trust: 3, flow: 3 }); return 'Even from the street, the lettering is readable.'; } }
    ] }
);

/* the notebook: first-person observations, never conclusions */
const NOTES = {
  first: 'A dossier with no registry mark. Only a small star in the margin, drawn by hand. A smudge, probably.',
  third: 'Third star. Same hand, I think. The screens are odd, but not careless.',
  clean: 'Passed every order and still looked like nothing else in the harbor. I do not know why that bothered me.',
  referral: 'The unmarked ones I turn back are “referred”. Nobody has said to whom, or what for.',
  forged: 'Some of the stars have five points and no tail. Barnaby’s dossiers carry the plain kind.',
  d2: 'Standard Kit: four credits a screen, through the Registry. Who is the Registry?',
  d4: 'The vigil was moved from Pier 9 “for crowd safety”. Families were told by letter.',
  d5: 'A page with no registry mark stranded thirty-one passengers. Whose page was it?',
  d6: 'Nox & Co. holds the Kit licence. Nox & Co. is the Chancellor’s own.'
};
const LORE_NEWS_NOTES = {
  2: g => g.note('d2', NOTES.d2), 4: g => g.note('d4', NOTES.d4),
  5: g => { if (g.brigSeen > 0) g.note('d5', NOTES.d5); }, 6: g => g.note('d6', NOTES.d6)
};

/* the newspaper, as seen by the harbor (never from the inspector's side) */
Object.assign(BRIG_NEWS, {
  3: g => g.brigSeen > 0 && { img: 'sigil', h: 'Small stars appear on harbor walls', p: 'Chalk, mostly. The Registry says it is “logging them”. Children have begun copying them onto slates.' },
  4: g => g.reported
    ? { img: 'berthoffice', h: 'Registry thanks the public for “vigilance”', p: 'Three tip-offs this week. Asked what they led to, a spokesman said: “Order.”' }
    : { img: 'quiet', h: 'Misclick vigil moved from Pier 9', p: 'The yearly lantern vigil is shifted to the lighthouse “for crowd safety”. Families of the lost were told by letter.' },
  5: g => ({ img: 'marrow', h: 'Ticket page strands thirty-one', p: 'A “playful” ferry booking page sold seats on a boat that was not sailing. It carried no registry mark. Nobody has claimed it.' }),
  6: g => g.kitHelped === false
    ? { img: 'quiet', h: 'Pet shelter’s homepage goes dark', p: 'The page that found homes for forty cats has been taken down. “Licence,” said a neighbour. “And the cats?” “Still here.”' }
    : g.forged > 0
      ? { img: 'sigil', h: 'Marks that don’t match', p: 'Registry examiners say some of the harbor’s stars have five points and no tail. “Someone is copying the copyists.”' }
      : false,
  7: g => g.brigSeen > 0 && (g.brig >= 3 && !g.reported
    ? { img: 'carnival', h: 'Bunting along the quay; Office declines to comment', p: 'Residents say it appeared overnight. The Registry is “reviewing the question of bunting”.' }
    : g.reported && g.brig <= -2
      ? { img: 'raid', h: 'Pier 9 closed after night inspection', p: 'Sixty people were “asked to leave”. The lanterns were removed. The wall of names was left in place.' }
      : { img: 'sigil', h: 'The stars have stopped appearing', p: 'Walls are clean. Some say they were washed, others that they were simply finished.' })
});

/* endings: no verdicts, only where the lamp-light falls */
for (const k of ['artist', 'informer']) delete BRIG_ENDINGS[k];
Object.assign(BRIG_ENDINGS, {
  margin: { title: 'Margins', tone: 'meh', text: 'By spring there are stars on every wall. Some screens are a joy and some are a trap, and nobody inspects either with confidence. The Registry keeps filing. A woman in a purple scarf says the rulebook was meant as a floor, not a ceiling. Antonio says he has never seen a floor so cluttered. You keep your stamp, and you are no longer sure which drawer it belongs in.' },
  registry: { title: 'The quiet quay', tone: 'meh', text: 'By Easter the stars are scrubbed from the walls. Every screen is clear, correct and licensed, and complaints fall. You are thanked in writing by an office that never names who it is thanking. Pier 9 is a car park now. You notice you have stopped looking at the walls.' },
  middle: { title: 'Between two lamps', tone: 'meh', text: 'You answered to neither lamp. Both remember you and neither says so. The harbor goes on being as clear, as strange and as dangerous as it ever was, and you go on stamping, one screen at a time, each time unsure that you are right.' }
});
Object.assign(END_NEWS, {
  margin: ['carnival', 'Bunting along the quay: the Office declines to comment'],
  registry: ['raid', 'Pier 9 closed for “safety review”'],
  middle: ['quiet', 'Harbor lamps lit as usual']
});

function loreEpilogue(g) {
  const L = [];
  L.push(['Noa', g.brig >= 2 ? 'bookmarked a page with a blinking star. She says it was the first screen that made her laugh.' : g.brig <= -2 ? 'finishes every form on the first try now. She says it is nice. She does not say more.' : 'works at a ferry kiosk and reads the screen aloud for customers.']);
  L.push(['Antonio', g.flawedApproved >= 3 ? 'still cannot find the Back button on his pension portal.' : g.brig >= 3 ? 'has strong opinions about the bunting on the quay. Most are unprintable. He pays his bills online.' : 'pays his bills online. He sent you a postcard with a lighthouse on it.']);
  if (g.brigSeen > 0) L.push(['Pete', g.kitHelped === true ? 'the cat shelter page is still up. No one knows who signed the exemption.' : g.kitHelped === false ? 'his shelter’s page went dark in spring. The cats found homes anyway, mostly.' : g.kitHelped === 'pier' ? 'his page is back, under a different name, hosted somewhere you cannot find.' : 'his page is still up. No one has asked about the licence yet.']);
  L.push(['Mara', g.maraTold && g.reported ? 'moved to the Registry. She does not stop by the booth now.' : g.maraTold ? 'still brings tea. She asks fewer questions.' : g.brig >= 2 ? 'left the Office. Someone saw her at Pier 9, laughing.' : 'is still in booth 2. She counts differently now.']);
  if (g.barn.seen > 0) L.push(['Barnaby', g.forged > 0 ? 'was paid for a report with a star on it. Some say yours was the one he used.' : g.barn.app >= 2 ? 'opened a second studio, also called Gull & Gull. It is also freelance.' : 'sends you a Christmas card every year, addressed to “my favourite inspector”.']);
  if (g.brigSeen > 0) L.push(['The woman in the scarf', g.brig >= 3 ? 'hung the bunting herself. She once drafted a line of the rulebook with Vael, they say.' : g.reported ? 'has not been seen since the night at Pier 9. A purple scarf was found on the jetty.' : 'still orders tea somewhere along the quay. She never says where.']);
  L.push(['Chancellor Vael', g.swift ? 'was reappointed. The Kit licence rose to six credits a screen.' : 'resigned after the vote. The Kit was reviewed by a committee that met twice.']);
  return L;
}

const BARNY_FORGED_NO = ['Careful, Inspector. Stars bring in good money. Ask upstairs.', 'Turn it back, then. Somebody will be paid for the paperwork. Not you.', 'You think I drew that star? I only borrowed the idea.'];
const BARNY_FORGED_OK = ['Funny how a little star calms everyone down.', 'See? Nobody checks the stars. Nobody ever checks the stars.', 'Pleasure. Tell the Registry I said hello.'];

/* ───────────────────── 11g. The Atlas: the Brigade's interactive art sites ─────────────────────
   They do not make pages. They make places: things that answer when touched, hide other things, and are
   there to be wandered through, not used. The inspector gets the Hand (key 6) to touch them.
   Faults still count, and some only show once you have wandered far enough to see them.           */
const ATLAS = {};
const AXD = (h, ...k) => k.some(x => h(x));
const axRoot = h => `<div class="ax" data-f="${[...(h.on || [])].join(' ')}">`;
const tn = (c, f, d, t, v) => c.tone(f, d, t || 'sine', v || .1);

/* ── 1. The Hall of Doors ── */
ATLAS.bdoors = {
  id: 'bdoors', name: 'The Hall of Doors', url: 'halldoors.example/knock',
  style: ['Sentence case, plain fonts, 14 px text at least.', 'Every control has a name and a way back.'],
  note: 'A hall with four doors and a fifth that is only there if you have been through the others. Someone cared about the order.',
  finds: { knock: 'Someone answers a knock', mirror: 'The mirror looks back', tiny: 'The smallest room' },
  regions: { title: 'Hall title', wall: 'Introduction', labels: 'Doors', knobs: 'Door knob', verbs: 'Instruction', back: 'Way out of a room', state: 'Opened-door marker' },
  defects: {
    tiny: { region: 'title', cat: 'text', label: 'Title in 9 px text', why: 'Text under 11 px is hard to read.' },
    dim: { region: 'wall', cat: 'contrast', label: 'Grey-blue text on a navy wall', why: 'Normal text needs 4.5 : 1. Use the contrast lens.' },
    labels: { region: 'labels', cat: 'recognition', label: 'Four doors and no names', why: 'Recognition beats recall: put a name under each door.' },
    knobs: { region: 'knobs', cat: 'target', label: 'Only a 9 px knob opens a door', why: 'Small targets are slow to hit (Fitts’ law). Let the whole door open.' },
    verbs: { region: 'verbs', cat: 'consistency', label: 'Knock, push, pull and open all mean the same thing', why: 'One action, one name.' },
    back: { region: 'back', cat: 'control', label: 'Inside a room there is only a tiny cross to leave', why: 'Give users a clear way out: a labelled Back button.' },
    state: { region: 'state', cat: 'color', label: 'Opened doors differ by colour only', why: 'Add a redundant code, such as a tick or a word.' }
  },
  build: h => {
    const names = ['Cat', 'Stairs', 'Clock', 'Mirror'], cols = ['#b4432f', '#2f5f9e', '#c79a1b', '#2f8f6a'];
    const doors = cols.map((c, i) => `<div class="dr" data-i="${i}" style="--c:${c}" ${h('knobs') ? '' : `data-act="door" data-arg="${i}"`}><i class="kn" data-region="knobs" ${h('knobs') ? `data-act="door" data-arg="${i}" style="width:9px;height:9px"` : ''}></i><b class="dl" data-region="labels">${h('labels') ? '' : names[i]}</b><s class="ok" data-region="state">${h('state') ? '' : '✓'}</s></div>`).join('');
    return `${axRoot(h)}<div class="a-doors">
      <h3 data-region="title" style="${h('tiny') ? 'font-size:9px;letter-spacing:.2em' : 'font-size:20px'};margin:0 0 4px;color:#fde68a">THE HALL OF DOORS</h3>
      <p data-region="wall" style="margin:0 0 10px;font-size:14px;color:${h('dim') ? '#4c5b86' : '#cbd5f5'}">A hall that nobody asked for. Please be gentle with the doors.</p>
      <div class="drow">${doors}</div>
      <p data-region="verbs" style="font-size:13px;color:#cbd5f5;margin:10px 0 0">${h('verbs') ? 'Knock on it, push it, pull it or open it. They are all the same door.' : 'Click a door to open it.'}</p>
      <div class="tinydoor" hidden data-act="tiny" title=""></div>
      <div class="room" hidden>
        <div class="rbody"></div>
        ${h('back') ? '<i class="x6" data-region="back" data-act="back"></i>' : '<button class="rback" data-region="back" data-act="back">↩ Back to the hall</button>'}
      </div></div></div>`;
  },
  acts: {
    door(c) {
      const i = +c.arg, st = c.st; st.seen = st.seen || [];
      if (i === 1) { st.k = (st.k || 0) + 1; if (st.k < 3) { tn(c, 170, .1, 'square', .09); c.say(st.k === 1 ? 'Knock. Nothing.' : 'Knock. Someone shuffles inside.'); return; } c.find('knock'); }
      const rooms = [
        '<svg viewBox="0 0 120 70" width="170"><path d="M10 60h100" stroke="#e8dcc0" stroke-width="3"/><path d="M30 60c0-24 14-30 28-30s28 6 28 30z" fill="#9a6a3c"/><circle cx="64" cy="26" r="13" fill="#9a6a3c"/><path d="M54 16l3 9M74 16l-3 9" stroke="#9a6a3c" stroke-width="7" stroke-linecap="round"/><path d="M58 28q6 4 12 0" stroke="#2a1f0c" fill="none" stroke-width="2"/></svg><p>A cat asleep on a stack of manuals. <a class="ax-l" data-act="purr">Stroke it.</a></p>',
        '<p style="font-size:22px">⌇⌇⌇ ⌇⌇ ⌇</p><p>Stairs that go down a long way. You can hear a clock at the bottom.</p>',
        '<p class="ck" style="font-size:28px;font-family:monospace">' + new Date().toTimeString().slice(0, 8) + '</p><p>The only clock in the harbor that tells the right time. It is also the only one nobody checks.</p>',
        '<div class="mir"><i></i><i></i></div><p>A mirror. It seems to be waiting for you to look at it.</p>'
      ];
      c.q('.rbody').innerHTML = rooms[i]; c.q('.room').hidden = false; c.q('.room').dataset.i = i;
      const d = c.q(`.dr[data-i="${i}"]`); d.classList.add('open'); if (!st.seen.includes(i)) st.seen.push(i);
      tn(c, [300, 220, 400, 520][i], .35, 'triangle', .1); c.say('A door opens.');
      if (st.seen.length === 4) { c.q('.tinydoor').hidden = false; }
      c.reveal();
    },
    back(c) { c.q('.room').hidden = true; tn(c, 260, .2, 'triangle', .08); c.reveal(); },
    purr(c) { tn(c, 70, .9, 'sawtooth', .05); tn(c, 74, .9, 'sawtooth', .04); c.say('It purrs. This is not a feature.'); },
    tiny(c) {
      c.q('.rbody').innerHTML = '<p style="font-size:30px">·</p><p>You are small now. This is the best room.</p>'; c.q('.room').hidden = false; c.find('tiny');
      [660, 880, 1320].forEach((f, k) => c.tone(f, .5, 'sine', .08, null, k * .12)); c.reveal();
    }
  },
  move(c, e) {
    const r = c.q('.room:not([hidden]) .mir'); if (!r) return;
    const b = r.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
    r.querySelectorAll('i').forEach(i => { i.style.transform = `translate(${Math.max(-6, Math.min(6, x * 14))}px,${Math.max(-4, Math.min(4, y * 10))}px)`; });
    if (Math.hypot(x, y) < .6) c.find('mirror');
  }
};

/* ── 2. The Pond ── */
ATLAS.bpond = {
  id: 'bpond', name: 'The Still Pond', url: 'pond.example/~still',
  style: ['Sentence case, plain fonts, 14 px text at least.', 'Say what is happening. Say what went wrong.'],
  note: 'A pond that listens. I touched it for longer than the shift allowed. A small fish followed my pointer the whole way.',
  finds: { koi: 'The koi speaks', frog: 'The frog on the third pad', word: 'A word floats on the water' },
  regions: { cap: 'Caption', who: 'Word box', go: 'Float button', pads: 'Lily pads', err: 'Message', drain: 'Drain button', wait: 'Floating notice', poem: 'Poem line' },
  defects: {
    cap: { region: 'cap', cat: 'contrast', label: 'Pale blue caption on a teal pond', why: 'Normal text needs 4.5 : 1.' },
    who: { region: 'who', cat: 'realworld', label: 'Label reads “Whisper to the water’s surface tension”', why: 'Use words the user knows: “Your word”.' },
    go: { region: 'go', cat: 'target', label: 'Float button is a 10 px dot', why: 'Small targets are slow to hit.' },
    pads: { region: 'pads', cat: 'color', label: 'Clickable pads differ from the rest by green shade only', why: 'Add a redundant cue such as a ring or a label.' },
    err: { region: 'err', cat: 'errors', label: 'Empty word gives “Err 0x0”', why: 'Say what went wrong and how to fix it.' },
    drain: { region: 'drain', cat: 'prevention', label: '“Drain the pond” right beside “Float it”, no confirmation', why: 'Keep destructive actions away from frequent ones and confirm them.' },
    wait: { region: 'wait', cat: 'status', label: 'Nothing shows while the word is floating out', why: 'Show what the system is doing.' },
    poem: { region: 'poem', cat: 'text', label: 'Poem in italic capitals with wide spacing', why: 'Capitals and heavy styling slow reading.' }
  },
  build: h => `${axRoot(h)}<div class="a-pond">
    <div class="water" data-act="ripple">
      <svg class="fish" viewBox="0 0 40 20" width="34"><path d="M2 10C10 0 26 0 32 10 26 20 10 20 2 10Z" fill="#f97316"/><path d="M30 10l9-7v14z" fill="#fb923c"/><circle cx="9" cy="8" r="1.6" fill="#111"/></svg>
      <div class="pad" style="left:12%;top:30%"></div>
      <div class="pad ${h('pads') ? '' : 'hint'}" data-region="pads" data-act="pad" data-arg="1" style="left:70%;top:20%"></div>
      <div class="pad ${h('pads') ? '' : 'hint'}" data-region="pads" data-act="pad" data-arg="2" style="left:46%;top:62%"></div>
      <div class="frog" hidden>🐸</div>
    </div>
    <p data-region="cap" style="margin:8px 0;font-size:14px;color:${h('cap') ? '#7fc6c9' : '#e6fffb'}">Touch the water. It remembers for a little while.</p>
    <p data-region="poem" style="margin:0 0 8px;color:#e6fffb;${h('poem') ? 'font-style:italic;text-transform:uppercase;letter-spacing:.22em;font-size:12px' : 'font-size:15px'}">a pond is a slow window</p>
    <div class="prow"><label data-region="who" style="color:#e6fffb;font-size:14px">${h('who') ? 'Whisper to the water’s surface tension' : 'Your word'} <input class="pw" maxlength="12" style="margin-left:6px"></label>
      <span data-region="go">${h('go') ? '<button data-act="float" aria-label="Float" style="width:10px;height:10px;padding:0;border:1px solid #fff;border-radius:50%;background:#0f766e"></button>' : '<button class="m-btn" data-act="float">Float it</button>'}</span>
      <span style="display:inline-block;width:${h('drain') ? 2 : 36}px"></span>
      <span data-region="drain"><button class="m-btn secondary" data-act="drain">${h('drain') ? 'Drain the pond' : 'Drain…'}</button></span></div>
    <p data-region="err" class="perr" style="margin:6px 0 0;font-size:13px;color:#fecaca;min-height:18px"></p>
    <p data-region="wait" class="pwait" style="margin:2px 0 0;font-size:13px;color:#e6fffb;min-height:18px"></p></div></div>`,
  acts: {
    ripple(c) {
      const w = c.q('.water'), b = w.getBoundingClientRect(), r = document.createElement('i'); r.className = 'rip';
      r.style.left = (c.ev.clientX - b.left) + 'px'; r.style.top = (c.ev.clientY - b.top) + 'px'; w.appendChild(r); setTimeout(() => r.remove(), 1800);
      tn(c, 520 + Math.random() * 380, .5, 'sine', .06, 380);
      c.st.n = (c.st.n || 0) + 1;
      if (c.st.n === 6) { const k = document.createElement('div'); k.className = 'koi'; k.innerHTML = 'The koi surfaces: “Nobody asked me either.”'; w.appendChild(k); setTimeout(() => k.remove(), 4000); c.find('koi'); }
    },
    pad(c) {
      c.ev.stopPropagation(); c.st.p = c.st.p || {}; c.st.p[c.arg] = 1; tn(c, 330, .15, 'square', .05);
      if (c.arg === '2') { c.q('.frog').hidden = false; c.q('.frog').style.left = '46%'; c.q('.frog').style.top = '52%'; c.find('frog'); tn(c, 200, .2, 'square', .08); }
    },
    float(c) {
      const inp = c.q('.pw'), w = inp.value.trim(), err = c.q('.perr'), wait = c.q('.pwait');
      if (!w) { err.textContent = c.f('err') ? 'Err 0x0' : 'Type a word first, then press “Float it”.'; return; }
      err.textContent = '';
      if (!c.f('wait')) wait.textContent = 'Floating “' + w + '”…';
      const water = c.q('.water'), done = () => {
        w.split('').forEach((ch, i) => { const s = document.createElement('span'); s.className = 'let'; s.textContent = ch; s.style.left = (20 + i * 5 + Math.random() * 20) + '%'; s.style.top = (60 + Math.random() * 25) + '%'; s.style.animationDelay = (i * .12) + 's'; water.appendChild(s); });
        wait.textContent = ''; c.find('word'); tn(c, 700, .4, 'sine', .07);
      };
      if (c.f('wait')) setTimeout(done, 1600); else setTimeout(done, 400);
      inp.value = '';
    },
    drain(c) { c.root.querySelectorAll('.let').forEach(n => n.remove()); tn(c, 160, .6, 'sawtooth', .04, 60); c.say('The water is empty. Nothing floats on it now.'); }
  },
  move(c, e) {
    const w = c.q('.water'); if (!w) return; const f = w.querySelector('.fish'), b = w.getBoundingClientRect();
    const x = Math.max(0, Math.min(b.width - 34, e.clientX - b.left - 17)), y = Math.max(0, Math.min(b.height - 20, e.clientY - b.top - 10));
    f.style.transform = `translate(${x}px,${y}px) scaleX(${x < (c.st.fx || 0) ? -1 : 1})`; c.st.fx = x;
  }
};

/* ── 3. The Museum of Dead Buttons ── */
ATLAS.bmuseum = {
  id: 'bmuseum', name: 'Museum of Dead Buttons', url: 'museum.example/deadbuttons',
  style: ['Sentence case, plain fonts, 14 px text at least.', 'Name things the way visitors would.'],
  note: 'Six dead things in glass cases. The last plaque is not about a button. “Staff only”: the door was not locked.',
  finds: { all: 'All six exhibits seen', guard: 'The sleeping guard', staff: 'The staff-only room' },
  regions: { cases: 'Exhibit cases', plaque: 'Plaque text', ticket: 'Tour button', prog: 'Visit progress', close: 'Plaque close button', verbs: 'Plaque buttons', hall: 'Wall text' },
  defects: {
    cases: { region: 'cases', cat: 'recognition', label: 'Six cases with no titles', why: 'Recognition beats recall: put a title on each case.' },
    plaque: { region: 'plaque', cat: 'text', label: 'Plaque text in 9 px grey', why: 'Text under 11 px is hard to read.' },
    ticket: { region: 'ticket', cat: 'realworld', label: 'Button reads “Admission to the Liminal Hall of Aforetime Controls”', why: 'Say what it does: “Start the tour”.' },
    prog: { region: 'prog', cat: 'status', label: 'No sign of how many exhibits you have seen', why: 'Show the system state: “3 of 6 seen”.' },
    close: { region: 'close', cat: 'control', label: 'A plaque cannot be closed, only replaced', why: 'Users must always be able to get out.' },
    verbs: { region: 'verbs', cat: 'consistency', label: 'Close, Dismiss, Leave and Exit sit together', why: 'One action, one name.' },
    hall: { region: 'hall', cat: 'contrast', label: 'Light gold text on cream', why: 'Normal text needs 4.5 : 1.' }
  },
  build: h => {
    const ex = [['Floppy', '<rect x="6" y="6" width="36" height="36" rx="3" fill="#1e3a8a"/><rect x="13" y="6" width="22" height="13" fill="#d1d5db"/><rect x="14" y="26" width="20" height="16" fill="#e5e7eb"/>'],
      ['Hourglass', '<path d="M12 6h24M12 42h24M14 6c0 14 10 14 10 18S14 28 14 42M34 6c0 14-10 14-10 18s10 4 10 18" fill="none" stroke="#111" stroke-width="3"/>'],
      ['Bevel', '<rect x="5" y="12" width="38" height="24" fill="#c0c0c0"/><path d="M5 36V12h38" fill="none" stroke="#fff" stroke-width="3"/><path d="M5 36h38V12" fill="none" stroke="#555" stroke-width="3"/>'],
      ['Marquee', '<rect x="4" y="16" width="40" height="16" fill="#1d1d6b"/><path d="M8 24h20" stroke="#ffe94d" stroke-width="4"/>'],
      ['Counter', '<rect x="6" y="14" width="36" height="20" fill="#111"/><text x="10" y="30" fill="#4ade80" font-size="14" font-family="monospace">00417</text>'],
      ['Clip', '<path d="M18 40V14a6 6 0 0 1 12 0v22a9 9 0 0 1-18 0V18" fill="none" stroke="#6b7280" stroke-width="3"/>']];
    const cases = ex.map((e, i) => `<div class="cs" data-act="exhibit" data-arg="${i}"><svg viewBox="0 0 48 48" width="52">${e[1]}</svg><b data-region="cases">${h('cases') ? '' : e[0]}</b></div>`).join('');
    return `${axRoot(h)}<div class="a-museum">
      <p data-region="hall" style="margin:0 0 8px;font-size:14px;color:${h('hall') ? '#d9b65f' : '#4a3612'}">Things the web used to love, kept in glass.</p>
      <div class="cgrid">${cases}</div>
      <p style="margin:8px 0 0"><span data-region="ticket"><button class="m-btn secondary" data-act="tour">${h('ticket') ? 'Admission to the Liminal Hall of Aforetime Controls' : 'Start the tour'}</button></span>
      <span data-region="prog" class="mprog" style="font-size:13px;margin-left:10px;color:#4a3612">${h('prog') ? '' : '0 of 6 seen'}</span></p>
      <div class="plaque" hidden>
        <p data-region="plaque" class="pt" style="${h('plaque') ? 'font-size:9px;color:#9a9a9a' : 'font-size:14px;color:#2a1f0c'}"></p>
        <div data-region="verbs" class="pb">${h('verbs') ? '<a class="ax-l">Close</a> · <a class="ax-l">Dismiss</a> · <a class="ax-l">Leave</a> · <a class="ax-l">Exit</a>' : ''}</div>
        <span data-region="close">${h('close') ? '' : '<button class="m-btn secondary" data-act="shut">✕ Close</button>'}</span>
      </div>
      <div class="mbench" data-act="bench" title=""></div><div class="staff" data-act="staff">STAFF ONLY</div>
      <div class="memo" hidden>“The rules did not kill these. Hurry did. Keep one safe for me. — a friend of the margin”<br><span style="font-size:11px">★</span></div></div></div>`;
  },
  acts: {
    exhibit(c) {
      const i = +c.arg, st = c.st; st.s = st.s || [];
      const T = ['The Floppy. It meant Save for forty years. Children now draw it without knowing why.', 'The Hourglass. It told you the machine was busy. It was the first honest status bar.', 'The Bevel. A button that looked like a button. Nobody had to be told.', 'The Marquee. It moved so you would look. You looked. Then you could not read it.', 'The Counter. Proof that someone had been here before you.', 'The Helpful Clip. Always there, rarely useful. Everyone remembers it fondly.'];
      c.q('.pt').textContent = T[i]; c.q('.plaque').hidden = false;
      if (!st.s.includes(i)) st.s.push(i);
      const pr = c.q('.mprog'); if (!c.f('prog')) pr.textContent = st.s.length + ' of 6 seen';
      tn(c, 440 + i * 70, .3, 'triangle', .07); if (st.s.length === 6) { c.find('all'); c.q('.staff').classList.add('on'); }
      c.reveal();
    },
    shut(c) { c.q('.plaque').hidden = true; c.reveal(); },
    tour(c) { c.say('The tour starts anywhere. Click a case.'); tn(c, 392, .2, 'triangle', .07); },
    bench(c) { c.st.b = (c.st.b || 0) + 1; if (c.st.b >= 3) { c.find('guard'); c.say('The guard, without opening an eye: “Shh.”'); } else tn(c, 90, .3, 'sine', .06); },
    staff(c) { if (!c.st.s || c.st.s.length < 6) { c.say('The door is locked. Probably.'); tn(c, 120, .1, 'square', .08); return; } c.q('.memo').hidden = false; c.find('staff'); [523, 659, 784].forEach((f, k) => c.tone(f, .6, 'sine', .07, null, k * .15)); }
  }
};

/* ── 4. The Poem Machine ── */
const POEM_W = [['harbor', 'gull', 'star', 'door'], ['remembers', 'forgets', 'keeps', 'waits'], ['a', 'the', 'one'], ['blue', 'old', 'loud', 'margin']];
function poemStep(c, i, d) {
  c.st.w = c.st.w || [0, 0, 0, 0]; const W = POEM_W;
  c.st.w[i] = (c.st.w[i] + d + W[i].length) % W[i].length;
  const el = c.q(`.w[data-arg="${i}"]`); if (el) el.textContent = W[i][c.st.w[i]];
  tn(c, 330 + c.st.w[i] * 90 + i * 40, .15, 'triangle', .07);
}
ATLAS.bpoem = {
  id: 'bpoem', name: 'The Poem Machine', url: 'poems.example/machine',
  style: ['Sentence case, plain fonts, 14 px text at least.', 'Every control keeps one name.'],
  note: 'You choose the words and the machine prints them. One combination makes it say something it was not asked to. The paper is warm.',
  finds: { margin: 'A poem the machine did not expect', hum: 'The machine hums', print: 'The first printed line' },
  regions: { words: 'Word buttons', cycle: 'Word controls', shout: 'Poem', print: 'Print button', verbs: 'Print button name', prog: 'Printing notice', howto: 'Instructions' },
  defects: {
    cycle: { region: 'cycle', cat: 'control', label: 'Words only cycle forward, no way back', why: 'Give users a way back: previous and next.' },
    words: { region: 'words', cat: 'target', label: 'Word buttons are 12 px tall', why: 'Small targets are slow to hit.' },
    shout: { region: 'shout', cat: 'text', label: 'Poem in capitals with wide spacing', why: 'Capitals slow reading.' },
    prog: { region: 'prog', cat: 'status', label: 'Printing shows no progress', why: 'Show what the system is doing.' },
    verbs: { region: 'verbs', cat: 'consistency', label: 'Print, Make, Press and Stamp for one action', why: 'One action, one name.' },
    howto: { region: 'howto', cat: 'contrast', label: 'Pale grey instructions on cream', why: 'Normal text needs 4.5 : 1.' }
  },
  build: h => {
    const W = POEM_W;
    return `${axRoot(h)}<div class="a-poem">
      <h3 data-act="title" style="margin:0 0 6px;font-family:Georgia,serif;color:#4a2f6b">The Poem Machine</h3>
      <p data-region="howto" style="font-size:14px;margin:0 0 8px;color:${h('howto') ? '#b8b0a0' : '#3b2f4a'}">Press a word to change it. Press Print when it sounds right.</p>
      <div class="pline" data-region="shout" style="${h('shout') ? 'text-transform:uppercase;letter-spacing:.2em;font-size:13px' : 'font-size:20px'}">
        <span data-region="words"><span class="w" data-act="word" data-arg="0" ${h('words') ? 'style="height:12px;font-size:9px;line-height:12px"' : ''}>${W[0][0]}</span> <span class="w" data-act="word" data-arg="1" ${h('words') ? 'style="height:12px;font-size:9px;line-height:12px"' : ''}>${W[1][0]}</span> <span class="w" data-act="word" data-arg="2" ${h('words') ? 'style="height:12px;font-size:9px;line-height:12px"' : ''}>${W[2][0]}</span> <span class="w" data-act="word" data-arg="3" ${h('words') ? 'style="height:12px;font-size:9px;line-height:12px"' : ''}>${W[3][0]}</span></span></div>
      <p data-region="cycle" style="margin:8px 0 0">${h('cycle') ? '<small>Each word has four forms.</small>' : '<button class="m-btn secondary s" data-act="prev">◀ Previous word</button> <button class="m-btn secondary s" data-act="next">Next word ▶</button>'}</p>
      <p style="margin:10px 0 0"><span data-region="verbs"><button class="m-btn" data-act="print">${h('verbs') ? 'Make' : 'Print'}</button>${h('verbs') ? ' <button class="m-btn secondary" data-act="print">Press</button> <button class="m-btn secondary" data-act="print">Stamp</button>' : ''}</span>
      <span data-region="prog" class="ppr" style="margin-left:8px;font-size:13px"></span></p>
      <div class="roll"><div class="strip"></div></div></div></div>`;
  },
  acts: {
    word(c) {
      const W = POEM_W, i = +c.arg; poemStep(c, i, 1); c.st.last = i;
      const s = c.st.w; if (W[0][s[0]] === 'star' && W[1][s[1]] === 'remembers' && W[3][s[3]] === 'margin') { c.find('margin'); c.q('.strip').innerHTML = '<p class="st">—the margin is where the rest of it was kept.</p>'; [392, 523, 659, 784].forEach((f, k) => c.tone(f, .5, 'sine', .07, null, k * .12)); }
    },
    prev(c) { poemStep(c, c.st.last == null ? 0 : c.st.last, -1); },
    next(c) { poemStep(c, c.st.last == null ? 0 : c.st.last, 1); },
    print(c) {
      const p = c.q('.ppr'), words = [...c.root.querySelectorAll('.w')].map(w => w.textContent).join(' '), strip = c.q('.strip');
      const done = () => { const l = document.createElement('p'); l.className = 'st'; l.textContent = 'The ' + words + '.'; strip.prepend(l); p.textContent = ''; c.find('print'); tn(c, 200, .5, 'sawtooth', .04, 160); };
      if (c.f('prog')) setTimeout(done, 1600); else { p.textContent = 'Printing… please wait.'; setTimeout(done, 700); }
    },
    title(c) { c.st.t = (c.st.t || 0) + 1; if (c.st.t >= 5) { c.find('hum'); [110, 165, 220].forEach(f => c.tone(f, 1.2, 'sine', .06)); c.say('The machine hums, pleased.'); } else tn(c, 100, .1, 'sine', .05); }
  }
};

/* ── 5. The Tiny Orchestra ── */
ATLAS.bband = {
  id: 'bband', name: 'The Tiny Orchestra', url: 'orchestra.example/play',
  style: ['Sentence case, plain fonts, 14 px text at least.', 'Show what is happening, in sound and in sight.'],
  note: 'Eight little blobs, each one a note. Someone built the first three to play a tune you already know.',
  finds: { tune: 'The tune you already know', sun: 'The ninth blob', loop: 'A loop that plays itself' },
  regions: { blobs: 'Blobs', rec: 'Record controls', stop: 'Stop button', err: 'Message', rstat: 'Recording status', nums: 'Blob names', howto: 'Instructions', sun: 'Sun' },
  defects: {
    blobs: { region: 'blobs', cat: 'target', label: 'Blobs are 14 px wide', why: 'Small targets are slow to hit.' },
    nums: { region: 'nums', cat: 'color', label: 'Blobs told apart by colour only', why: 'Add a number or shape as a redundant code.' },
    rec: { region: 'rec', cat: 'recognition', label: 'Record and play are symbols only', why: 'Add labels: recognition beats recall.' },
    rstat: { region: 'rstat', cat: 'status', label: 'No sign that recording has started', why: 'Show the state: “Recording 2 of 4”.' },
    stop: { region: 'stop', cat: 'control', label: 'The loop has no Stop button', why: 'Users must be able to stop and get out.' },
    err: { region: 'err', cat: 'errors', label: 'Playing nothing gives “ERR”', why: 'Say what went wrong and how to fix it.' },
    howto: { region: 'howto', cat: 'contrast', label: 'Light grey instructions on white', why: 'Normal text needs 4.5 : 1.' }
  },
  build: h => {
    const cols = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    return `${axRoot(h)}<div class="a-band">
      <p data-region="howto" style="margin:0 0 6px;font-size:14px;color:${h('howto') ? '#c9c9c9' : '#1f2933'}">Press the blobs. Record four notes, then play them back.</p>
      <div class="bl" data-region="blobs">${cols.map((c, i) => `<i class="bb" data-act="blob" data-arg="${i}" style="background:${c};${h('blobs') ? 'width:14px;height:14px' : ''}"><em>${h('nums') ? '' : i + 1}</em></i>`).join('')}<i class="bb nine" hidden data-act="blob" data-arg="8" style="background:#fde047"><em>9</em></i></div>
      <p data-region="nums" style="margin:6px 0 0;font-size:13px;color:#1f2933">${h('nums') ? 'Each blob has its own colour.' : 'Blobs are numbered 1 to 8, left to right.'}</p>
      <div class="sun" data-region="sun" data-act="sun" title=""></div>
      <p data-region="rec" style="margin:10px 0 0"><button class="m-btn secondary" data-act="rec">${h('rec') ? '●' : '● Record'}</button> <button class="m-btn secondary" data-act="play">${h('rec') ? '▶' : '▶ Play back'}</button>
        <span data-region="stop">${h('stop') ? '' : '<button class="m-btn secondary stopb" data-act="stop" hidden>■ Stop</button>'}</span>
        <span data-region="rstat" class="rst" style="font-size:13px;margin-left:8px"></span></p>
      <p data-region="err" class="berr" style="margin:6px 0 0;font-size:13px;color:#b91c1c;min-height:18px"></p></div></div>`;
  },
  acts: {
    blob(c) {
      const i = +c.arg, st = c.st, scale = [262, 294, 330, 349, 392, 440, 494, 523, 587]; c.tone(scale[i], .5, 'triangle', .13);
      const b = c.el; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
      st.h = (st.h || []).concat(i).slice(-3); if (st.h.join() === '0,1,2') c.find('tune');
      if (st.recording) { st.rec.push(i); const s = c.q('.rst'); if (!c.f('rstat')) s.textContent = 'Recording ' + st.rec.length + ' of 4'; if (st.rec.length >= 4) { st.recording = false; st.saved = st.rec.slice(); if (!c.f('rstat')) s.textContent = 'Saved.'; } }
    },
    rec(c) { c.st.recording = true; c.st.rec = []; if (!c.f('rstat')) c.q('.rst').textContent = 'Recording 0 of 4'; c.tone(1000, .08, 'square', .05); },
    play(c) {
      const e = c.q('.berr'); if (!c.st.saved) { e.textContent = c.f('err') ? 'ERR' : 'Nothing recorded yet. Press Record, then four blobs.'; return; }
      e.textContent = ''; const scale = [262, 294, 330, 349, 392, 440, 494, 523, 587], q = c.q('.stopb'); if (q) q.hidden = false;
      let k = 0, n = 0;
      c.setIv(() => { if (!c.q('.a-band')) { c.setIv(null); return; } const i = c.st.saved[k % 4]; c.tone(scale[i], .4, 'triangle', .1); const b = c.q(`.bb[data-arg="${i}"]`); if (b) { b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); } k++; if (++n === 8) c.find('loop'); }, 420);
    },
    stop(c) { c.setIv(null); const q = c.q('.stopb'); if (q) q.hidden = true; },
    sun(c) { c.st.s = (c.st.s || 0) + 1; c.tone(1200, .15, 'sine', .06); if (c.st.s >= 3) { c.q('.nine').hidden = false; c.find('sun'); c.reveal(); } }
  }
};


/* ── 6. The Weather Diary ── */
const WX = ['☀', '☁', '☂', '☾', '❄', '≋'];
ATLAS.bdiary = {
  id: 'bdiary', name: 'The Weather Diary', url: 'diary.example/weather',
  style: ['Dates are written 7 May, never as a number.', 'Every control has a word.'],
  note: 'A diary that only records weather, and one page where nothing happened. The margin is bigger than the page.',
  finds: { storm: 'The cloud loses its temper', margin: 'Writing in the margin', blank: 'The empty day' },
  regions: { date: 'Page date', ink: 'Diary text', flip: 'Page controls', wx: 'Weather marks', saved: 'Save notice', tear: 'Tear-out button', write: 'Write field', margin: 'Margin' },
  defects: {
    date: { region: 'date', cat: 'realworld', label: 'Dates written as “day 20418”', why: 'Use words the reader knows: “Tuesday 7 May”.' },
    ink: { region: 'ink', cat: 'contrast', label: 'Pale yellow ink on cream paper', why: 'Normal text needs 4.5 : 1.' },
    flip: { region: 'flip', cat: 'control', label: 'Pages only turn forward', why: 'Give users a way back.' },
    tiny: { region: 'flip', cat: 'target', label: 'Page arrows are 12 px wide', why: W.target },
    wx: { region: 'wx', cat: 'color', label: 'Sun, rain and snow differ by colour only', why: W.color },
    saved: { region: 'saved', cat: 'status', label: 'Nothing says the line was saved', why: W.stat },
    tear: { region: 'tear', cat: 'prevention', label: '“Tear out page” sits next to the arrow, no confirmation', why: W.prev }
  },
  build: h => `${axRoot(h)}<div class="a-diary">
    <p data-region="date" class="dd" style="margin:0;font:700 16px Georgia,serif;color:#5b3a1e">${h('date') ? 'day 20418' : 'Tuesday 7 May'}</p>
    <div class="dpage" data-region="ink"><div class="dwx" data-region="wx" data-act="cloud">${h('wx') ? '<i style="color:#888">●</i><i style="color:#888">●</i><i style="color:#888">●</i>' : '<i>☀</i><i>☁</i><i>☂</i>'}</div>
      <p class="dtx" style="color:${h('ink') ? '#e4d79c' : '#3a2a15'}">Morning light on the water. A gull argued with a lamp.</p>
      <div class="dmargin" data-region="margin" data-act="margin"></div></div>
    <p data-region="flip" style="margin:8px 0 0">${h('flip') ? '' : '<button class="m-btn secondary s" data-act="prev">◀ Previous day</button> '}${h('tiny') ? '<button data-act="next" style="width:12px;height:12px;padding:0;font-size:8px">▶</button>' : '<button class="m-btn secondary s" data-act="next">Next day ▶</button>'}</p>
    <p data-region="write" style="margin:8px 0 0"><input class="dw" maxlength="30" placeholder="How was the weather?" style="width:60%"> <button class="m-btn s" data-act="write">Write it down</button></p>
    <p data-region="saved" class="dsv" style="margin:4px 0;font-size:13px;color:#5b3a1e;min-height:16px"></p>
    <p data-region="tear" style="margin:4px 0">${h('tear') ? '<button class="m-btn danger s" data-act="tear">Tear out this page</button>' : '<small>Pages cannot be torn out here.</small>'}</p></div></div>`,
  acts: {
    cloud(c) { c.st.c = (c.st.c || 0) + 1; tn(c, 220 + c.st.c * 40, .12, 'triangle', .08); if (c.st.c >= 5) { c.find('storm'); c.q('.a-diary').classList.add('flash'); setTimeout(() => c.q('.a-diary') && c.q('.a-diary').classList.remove('flash'), 400); tn(c, 70, .8, 'sawtooth', .1); } },
    margin(c) { c.st.m = (c.st.m || 0) + 1; tn(c, 520, .08, 'sine', .05); c.q('.dmargin').textContent += ['a', ' door', ' for', ' later'][(c.st.m - 1) % 4]; if (c.st.m >= 4) c.find('margin'); },
    next(c) { c.st.p = (c.st.p || 0) + 1; c.q('.dd').textContent = c.f('date') ? 'day ' + (20418 + c.st.p) : ['Tuesday 7 May', 'Wednesday 8 May', 'Thursday 9 May', 'Friday 10 May', 'Saturday 11 May'][c.st.p % 5]; c.q('.dtx').textContent = c.st.p >= 4 ? '' : ['Rain on the tin roof. The ferry came late.', 'Fog until noon, then the whole harbor appeared at once.', 'Wind. The flags argued all day.', 'A clear night with one very loud star.'][c.st.p % 4]; tn(c, 330, .15, 'triangle', .06); if (c.st.p >= 4) { c.find('blank'); c.say('Nothing happened that day. That is allowed.'); } },
    prev(c) { c.st.p = Math.max(0, (c.st.p || 0) - 1); c.q('.dd').textContent = ['Tuesday 7 May', 'Wednesday 8 May', 'Thursday 9 May', 'Friday 10 May', 'Saturday 11 May'][c.st.p % 5]; tn(c, 280, .15, 'triangle', .06); },
    write(c) { const v = c.q('.dw').value.trim(); if (!v) return; c.q('.dtx').textContent = v; c.q('.dw').value = ''; if (!c.f('saved')) c.q('.dsv').textContent = 'Saved.'; tn(c, 700, .15, 'sine', .06); },
    tear(c) { c.q('.dtx').textContent = ''; c.q('.dd').textContent = 'a page is missing'; tn(c, 140, .5, 'sawtooth', .05); }
  }
};

/* ── 7. The Lantern Maze ── */
const MAZE = [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0]; /* 1 = wall; start 0, exit 24 */
ATLAS.bmaze = {
  id: 'bmaze', name: 'The Lantern Maze', url: 'maze.example/lights',
  style: ['Walls and paths differ by shape as well as colour.', 'A step can always be taken back.'],
  note: 'You light your way from corner to corner. The walls hum if you lean on them. The moon keeps a door open for anyone who looks up.',
  finds: { exit: 'The far lantern', hum: 'The wall that hums', moon: 'The moon’s shortcut' },
  regions: { grid: 'Maze cells', walls: 'Walls', undo: 'Step back', steps: 'Step counter', how: 'Instructions', cells: 'Cell size' },
  defects: {
    cells: { region: 'cells', cat: 'target', label: 'Cells are 14 px wide', why: W.target },
    walls: { region: 'walls', cat: 'color', label: 'Walls and paths differ by colour only', why: W.color },
    undo: { region: 'undo', cat: 'control', label: 'A lit lantern cannot be put out', why: 'Give users a way back.' },
    steps: { region: 'steps', cat: 'status', label: 'No count of steps or sign of progress', why: W.stat },
    how: { region: 'how', cat: 'contrast', label: 'Light grey instructions on white', why: 'Normal text needs 4.5 : 1.' },
    jar: { region: 'how', cat: 'realworld', label: 'Instructions say “Illuminate adjacent nodes”', why: W.real }
  },
  build: h => `${axRoot(h)}<div class="a-maze">
    <p data-region="how" style="margin:0 0 8px;font-size:14px;color:${h('how') ? '#c9c9c9' : '#2a2a3a'}">${h('jar') ? 'Illuminate adjacent nodes to traverse the lattice.' : 'Click the cell next to your light to move. Reach the far lantern.'}</p>
    <div class="mgrid" data-region="cells">${MAZE.map((w, i) => `<i class="mc${w ? ' wall' : ''}${i === 0 ? ' lit' : ''}" data-i="${i}" data-act="cell" data-arg="${i}" ${h('cells') ? 'style="width:14px;height:14px"' : ''}>${w && !h('walls') ? '▒' : ''}${i === 24 ? '✦' : ''}</i>`).join('')}</div>
    <div data-region="walls" style="font-size:12px;margin-top:6px;color:#2a2a3a">${h('walls') ? '<span style="color:#9a9a9a">■</span> <span style="color:#a8a8a8">□</span>' : '▒ wall · □ path · ✦ lantern'}</div>
    <p data-region="steps" class="msteps" style="margin:6px 0 0;font-size:13px">${h('steps') ? '' : 'Steps: 0'}</p>
    <p data-region="undo" style="margin:4px 0">${h('undo') ? '' : '<button class="m-btn secondary s" data-act="back">↶ Step back</button>'}</p>
    <div class="moon" data-act="moon"></div></div></div>`,
  acts: {
    cell(c) {
      const i = +c.arg, st = c.st; st.path = st.path || [0]; const last = st.path[st.path.length - 1];
      if (MAZE[i] && !(i === 23 && st.mn >= 3)) { st.w = (st.w || 0) + 1; tn(c, 90, .2, 'sine', .05); if (st.w >= 4) { c.find('hum'); c.say('The wall hums. It was waiting for you to lean.'); } return; }
      const adj = Math.abs(i - last) === 5 || (Math.abs(i - last) === 1 && Math.floor(i / 5) === Math.floor(last / 5));
      if (!adj || st.path.includes(i)) { if (st.path.includes(i) && i === last && st.path.length > 1 && !c.f('undo')) { ATLAS.bmaze.acts.back(c); } return; }
      st.path.push(i); c.q(`.mc[data-i="${i}"]`).classList.add('lit'); tn(c, 330 + st.path.length * 40, .2, 'triangle', .08);
      if (!c.f('steps')) c.q('.msteps').textContent = 'Steps: ' + (st.path.length - 1);
      if (i === 24) { c.find('exit'); [523, 659, 784, 1046].forEach((f, k) => c.tone(f, .5, 'sine', .08, null, k * .1)); }
    },
    back(c) { const st = c.st; if (!st.path || st.path.length < 2) return; const i = st.path.pop(); c.q(`.mc[data-i="${i}"]`).classList.remove('lit'); if (!c.f('steps')) c.q('.msteps').textContent = 'Steps: ' + (st.path.length - 1); tn(c, 260, .1, 'triangle', .06); },
    moon(c) { c.st.mn = (c.st.mn || 0) + 1; tn(c, 880, .12, 'sine', .05); if (c.st.mn >= 3) { c.find('moon'); const m = c.q('.mc[data-i="23"]'); if (m) { m.classList.remove('wall'); m.textContent = ''; } } }
  }
};

/* ── 8. The Sleeping Library ── */
ATLAS.blib = {
  id: 'blib', name: 'The Sleeping Library', url: 'sleepinglibrary.example/shh',
  style: ['Spines carry titles in 12 px type or larger.', 'Signs use plain words.'],
  note: 'Twelve books and a librarian who is only pretending to sleep. The last book is not on the shelf. It is on the ladder.',
  finds: { shh: 'The librarian wakes', six: 'Six books pulled', ledger: 'The book on the ladder' },
  regions: { spines: 'Book spines', titles: 'Spine titles', sign: 'Wall sign', counter: 'Books pulled', close: 'Close book', ladder: 'Ladder' },
  defects: {
    spines: { region: 'spines', cat: 'target', label: 'Spines are 10 px wide', why: W.target },
    titles: { region: 'titles', cat: 'recognition', label: 'Spines carry no titles', why: 'Recognition beats recall: show a title on each book.' },
    sign: { region: 'sign', cat: 'realworld', label: 'Sign reads “Silentium protocol is in effect”', why: W.real },
    dim: { region: 'sign', cat: 'contrast', label: 'Sign in pale grey on cream', why: 'Normal text needs 4.5 : 1.' },
    counter: { region: 'counter', cat: 'status', label: 'No count of books pulled', why: W.stat },
    close: { region: 'close', cat: 'control', label: 'An opened book cannot be put back', why: 'Users must always be able to get out.' }
  },
  build: h => {
    const T = ['Almanac', 'Tides', 'Lamps', 'Gulls', 'Knots', 'Salt', 'Maps', 'Rain', 'Fog', 'Ropes', 'Keys', 'Stars'];
    return `${axRoot(h)}<div class="a-lib">
      <p data-region="sign" style="margin:0 0 6px;font-size:14px;color:${h('dim') ? '#cdbfa0' : '#3b2a14'}">${h('sign') ? 'Silentium protocol is in effect.' : 'Please keep quiet. The librarian is asleep.'}</p>
      <div class="shelf" data-region="spines">${T.map((t, i) => `<i class="bk" data-act="book" data-arg="${i}" style="background:hsl(${i * 28},45%,38%);${h('spines') ? 'width:10px' : ''}"><em data-region="titles">${h('titles') ? '' : t}</em></i>`).join('')}</div>
      <div class="libn" data-act="shh" title="">z z z</div>
      <div class="openbk" hidden><p class="obt"></p>${h('close') ? '' : '<button class="m-btn secondary s" data-act="shut">Put it back</button>'}<span data-region="close"></span></div>
      <p data-region="counter" class="lc" style="margin:6px 0;font-size:13px">${h('counter') ? '' : 'Books pulled: 0'}</p>
      <div class="ladder" data-region="ladder" data-act="ladder"></div></div></div>`;
  },
  acts: {
    book(c) {
      const T = ['The Almanac says tomorrow will be like today, only wetter.', 'A table of tides, with the moon’s excuses in the margin.', 'How to keep a lamp lit in a loud wind.', 'Gulls: a study in confidence.', 'Forty knots, one of which is a joke.', 'On salt, and why it keeps.', 'Maps with one corner left blank on purpose.', 'Rain, collected and filed.', 'A book about fog. The pages are slightly damp.', 'Ropes and what they remember.', 'Keys that open nothing in particular.', 'A book of stars, with a few new ones pencilled in.'];
      const i = +c.arg; c.st.b = c.st.b || []; if (!c.st.b.includes(i)) c.st.b.push(i);
      c.q('.obt').textContent = T[i]; c.q('.openbk').hidden = false; tn(c, 300 + i * 25, .2, 'triangle', .07);
      if (!c.f('counter')) c.q('.lc').textContent = 'Books pulled: ' + c.st.b.length; if (c.st.b.length >= 6) c.find('six'); c.reveal();
    },
    shut(c) { c.q('.openbk').hidden = true; c.reveal(); },
    shh(c) { c.st.s = (c.st.s || 0) + 1; tn(c, 110, .3, 'sine', .05); if (c.st.s >= 3) { c.find('shh'); c.say('One eye opens. “Shh.” It closes.'); } },
    ladder(c) { c.st.l = (c.st.l || 0) + 1; tn(c, 200 + c.st.l * 50, .1, 'square', .05); if (c.st.l >= 3) { c.q('.obt').textContent = '“The Ledger of the Margin”: it has your name on a page you have not reached yet.'; c.q('.openbk').hidden = false; c.find('ledger'); c.reveal(); } }
  }
};

Object.assign(BRIGADE, ATLAS);
SHIP_KIND.bdoors = SHIP_KIND.bpond = SHIP_KIND.bmuseum = SHIP_KIND.bpoem = SHIP_KIND.bband = SHIP_KIND.bdiary = SHIP_KIND.bmaze = SHIP_KIND.blib = 'gala';

SubmissionFactory.prototype.createBrigade = function (no, clean = false) {
  const base = Math.random() < .88 ? pick(Object.values(ATLAS)) : pick([BRIGADE.bhome, BRIGADE.bguest]);
  const entries = Object.entries(base.defects).filter(([, d]) => this.active.has(d.cat));
  const want = randInt(2, 4), chosen = new Map();
  for (const [key, def] of clean ? [] : shuffle(entries)) {
    if (chosen.size >= Math.min(want, entries.length)) break;
    if (!chosen.has(def.region)) chosen.set(def.region, { key, ...def });
  }
  const on = new Set([...chosen.values()].map(d => d.key));
  const h = k => on.has(k);
  h.on = on; if (clean) h.retro = true;
  return { no, tpl: base, defects: chosen, html: base.build(h), persona: pick(PERSONAS), designer: 'Anonymous', brig: true, retro: clean, play: {}, finds: new Set() };
};

/* ── the Hand: touching the screen ── */
(() => {
  const _load = Auditor.prototype.load, _click = Auditor.prototype.onMockClick, _set = Auditor.prototype.setTool;
  Auditor.prototype.refreshRegions = function () {
    const sub = this.game.current; if (!sub) return;
    const seen = [...new Set($$('[data-region]', this.mock).filter(el => !el.closest('[hidden]') && !el.hidden).map(el => el.dataset.region))];
    const sel = $('#region-select'), cur = sel.value;
    sel.innerHTML = seen.map(r => `<option value="${esc(r)}">${esc(sub.tpl.regions[r] || r)}</option>`).join('');
    if (seen.includes(cur)) sel.value = cur;
  };
  Auditor.prototype.ctx = function (el, ev) {
    const g = this.game, sub = g.current, mock = this.mock, self = this;
    return {
      el, ev, root: mock, st: sub.play, sub, arg: el && el.dataset.arg,
      q: s => mock.querySelector(s),
      f: k => { const a = mock.querySelector('.ax'); return !!a && (a.dataset.f || '').split(' ').includes(k); },
      setIv: (fn, ms) => { clearInterval(self._iv); self._iv = fn ? setInterval(fn, ms) : null; },
      find: id => g.found(sub, id), reveal: () => self.refreshRegions(), say: t => self.say(t),
      tone: (f, d, t, v, s, w) => { try { Sfx.tone(f, d, t || 'sine', v || .1, s || null, w || 0); } catch (e) {} }
    };
  };
  Auditor.prototype.hand = function (e) {
    const sub = this.game.current; if (!sub || !sub.tpl.acts) { this.say('Nothing here answers to a touch.'); return; }
    const el = e.target.closest('[data-act]');
    if (!el) { this.say('Nothing there. Something else might answer.'); return; }
    const fn = sub.tpl.acts[el.dataset.act]; if (fn) fn(this.ctx(el, e));
  };
  Auditor.prototype.onMockClick = function (e) { if (this.tool === 'hand') { if (!this.game.canInspect()) return; return this.hand(e); } return _click.call(this, e); };
  Auditor.prototype.setTool = function (name, silent) {
    const hb = $('#tool-hand');
    if (name === 'hand') {
      this.tool = 'hand'; this.prevPoint = null;
      document.body.classList.remove('tool-flag', 'tool-contrast', 'tool-ruler'); document.body.classList.add('tool-hand');
      for (const t of ['flag', 'contrast', 'ruler', 'hand']) { const b = $(`#tool-${t}`); if (b) b.setAttribute('aria-pressed', String(t === 'hand')); }
      if (!silent) this.say('The Hand: touch the design. Some pages answer. Not everything on them is meant to be found at once.');
      return;
    }
    document.body.classList.remove('tool-hand'); if (hb) hb.setAttribute('aria-pressed', 'false');
    return _set.call(this, name, silent);
  };
  Auditor.prototype.load = function (sub) {
    clearInterval(this._iv);
    _load.call(this, sub);
    if (!this._mv) {
      this._mv = true; let busy = false;
      this.mock.addEventListener('pointermove', e => {
        const s = this.game.current; if (!s || !s.tpl.move || busy) return; busy = true;
        requestAnimationFrame(() => { busy = false; s.tpl.move(this.ctx(null, e), e); });
      });
      $('#tool-hand').addEventListener('click', () => this.setTool('hand'));
    }
    this.refreshRegions();
    if (sub.tpl.acts && this.game.toolOn('hand')) { this.setTool('hand', true); this.say('This one answers to touch. The Hand is in your hand (key 6). Key 1 takes the flag back.'); }
  };
  const _clear = Auditor.prototype.clear;
  Auditor.prototype.clear = function () { clearInterval(this._iv); _clear.call(this); };
})();

/* ───────────────────── 11h. The Atlas, second volume: six more places to wander ───────────────────── */
const AXB = (cls, inner, st = '') => `<div class="${cls}" style="${st}">${inner}</div>`;

/* 9. The Tide Clock */
ATLAS.bclock = {
  id: 'bclock', name: 'The Tide Clock', url: 'clock.example/tide',
  style: ['Time is written 3:30 pm, never as a code.', 'Every control has a word.'],
  note: 'A clock that tells the tide, not the hour. It has a cuckoo and a pendulum, and neither is for decoration.',
  finds: { noon: 'The clock strikes twelve', pendulum: 'The pendulum counts back', bird: 'The cuckoo comes out' },
  regions: { face: 'Clock face', time: 'Time readout', set: 'Set button', door: 'Cuckoo door', pend: 'Pendulum', alarm: 'Alarm notice', reset: 'Reset button', label: 'Tide label' },
  defects: {
    face: { region: 'face', cat: 'contrast', label: 'Pale grey numerals on a white face', why: 'Normal text needs 4.5 : 1.' },
    time: { region: 'time', cat: 'realworld', label: 'Time shown as “T+0x1F”', why: 'Say 3:30 pm. Use words the reader knows.' },
    set: { region: 'set', cat: 'target', label: 'The set button is 12 px wide', why: W.target },
    door: { region: 'door', cat: 'recognition', label: 'The cuckoo door is an unlabeled dot', why: 'Show what it is.' },
    pend: { region: 'pend', cat: 'color', label: 'Rising and falling tide differ by colour only', why: W.color },
    alarm: { region: 'alarm', cat: 'status', label: 'The alarm rings and nothing says why', why: W.stat },
    reset: { region: 'reset', cat: 'prevention', label: '“Reset the sea” beside Set, no confirmation', why: W.prev },
    label: { region: 'label', cat: 'text', label: 'The tide label is 9 px', why: 'At least 11 px.' }
  },
  build: h => `${axRoot(h)}${AXB('a-clock', `
    <div data-region="face" data-act="face" style="width:150px;height:150px;border-radius:50%;border:6px solid #8f6a2c;margin:6px auto;display:grid;place-items:center;background:#fff;color:${h('face') ? '#d4d4d4' : '#222'};font:700 26px Georgia,serif;cursor:pointer"><span class="ck">12</span></div>
    <p data-region="time" class="ct" style="text-align:center;margin:2px;font:600 15px monospace">${h('time') ? 'T+0x1F' : '12:00 noon'}</p>
    <p data-region="label" style="text-align:center;margin:0;font-size:${h('label') ? 9 : 13}px;color:#555">High tide at 6:40 pm</p>
    <p data-region="pend" data-act="pend" style="text-align:center;margin:8px;cursor:pointer;font-size:22px;color:${h('pend') ? '#888' : '#1b6'}"><span class="pn">${h('pend') ? '●' : '▲ rising'}</span></p>
    <p data-region="door" style="text-align:center;margin:4px"><span data-act="door" class="cd" style="display:inline-block;width:${h('door') ? 16 : 70}px;height:16px;border-radius:8px;background:#8f6a2c;color:#fff;font-size:11px;cursor:pointer;text-align:center">${h('door') ? '' : 'Cuckoo'}</span></p>
    <p style="text-align:center;margin:6px"><span data-region="set"><button class="m-btn s" data-act="set" style="${h('set') ? 'width:12px;height:12px;padding:0;font-size:8px' : ''}">${h('set') ? '+' : 'Set time'}</button></span> <span data-region="reset">${h('reset') ? '<button class="m-btn danger s" data-act="reset">Reset the sea</button>' : '<small>Reset is in Settings.</small>'}</span></p>
    <p data-region="alarm" class="ca" style="text-align:center;margin:2px;min-height:16px;font-size:12px"></p>`)}</div>`,
  acts: {
    face(c) { c.st.h = ((c.st.h || 11) % 12) + 1; c.q('.ck').textContent = c.st.h; c.q('.ct').textContent = c.f('time') ? 'T+0x' + (c.st.h * 5).toString(16) : c.st.h + ':00 ' + (c.st.h === 12 ? 'noon' : 'pm'); tn(c, 300 + c.st.h * 25, .1, 'triangle', .06); if (c.st.h === 12) { tn(c, 130, .9, 'sine', .12); c.find('noon'); } },
    pend(c) { c.st.p = (c.st.p || 0) + 1; c.q('.pn').textContent = ['▲ rising', '▼ falling', '▲ rising'][c.st.p % 3]; tn(c, c.st.p % 2 ? 200 : 260, .12, 'sine', .08); if (c.st.p >= 6) c.find('pendulum'); },
    door(c) { c.st.d = (c.st.d || 0) + 1; tn(c, 880, .06, 'square', .05); if (c.st.d >= 3) { c.q('.cd').textContent = '🐦 cuckoo!'; c.q('.cd').style.width = '90px'; tn(c, 1200, .2, 'sine', .08); c.find('bird'); } },
    set(c) { c.st.s = (c.st.s || 0) + 1; if (!c.f('alarm')) c.q('.ca').textContent = 'Time set.'; else if (c.st.s % 3 === 0) { tn(c, 90, .5, 'sawtooth', .08); } },
    reset(c) { c.q('.ck').textContent = '?'; c.q('.ct').textContent = 'the sea is reset'; tn(c, 90, .6, 'sawtooth', .08); }
  }
};

/* 10. The Quiet Garden */
ATLAS.bgarden = {
  id: 'bgarden', name: 'The Quiet Garden', url: 'garden.example/walk',
  style: ['Plants are named in plain words.', 'The same word means the same thing everywhere.'],
  note: 'A garden you walk through with a mouse. Nothing in it is for sale. The bench is the point.',
  finds: { bloom: 'All four flowers open', bench: 'You sit on the bench', ripple: 'The pond answers three times' },
  regions: { beds: 'Flower beds', names: 'Plant names', water: 'Watering can', bench: 'Bench', pond: 'Pond', status: 'Watering notice', undo: 'Undo button', digup: 'Dig-up button' },
  defects: {
    beds: { region: 'beds', cat: 'color', label: 'Wet and dry beds differ by colour only', why: W.color },
    names: { region: 'names', cat: 'realworld', label: 'Plants named “Specimen 4b”', why: 'Use the names people know.' },
    water: { region: 'water', cat: 'target', label: 'The watering can is a 14 px icon', why: W.target },
    bench: { region: 'bench', cat: 'recognition', label: 'The bench is an unlabeled rectangle', why: 'Show what it is.' },
    pond: { region: 'pond', cat: 'text', label: 'Pond sign set in 9 px text', why: 'At least 11 px.' },
    status: { region: 'status', cat: 'status', label: 'Watering never says it worked', why: W.stat },
    undo: { region: 'undo', cat: 'control', label: 'No way to undo watering', why: 'Give users a way back.' },
    digup: { region: 'digup', cat: 'prevention', label: '“Dig up” next to the can, no confirmation', why: W.prev }
  },
  build: h => `${axRoot(h)}${AXB('a-garden', `
    <p data-region="names" style="margin:0 0 4px;font-size:13px;color:#2d5a2d">${h('names') ? 'Specimens 4a, 4b, 4c, 4d' : 'Poppy, Lavender, Tulip, Daisy'}</p>
    <div data-region="beds" style="display:flex;gap:10px;justify-content:center;margin:8px 0">${[0, 1, 2, 3].map(i => `<span data-act="bed" data-arg="${i}" class="bd" style="width:54px;height:54px;border-radius:8px;background:${h('beds') ? '#8a7a5a' : '#6b4a2a'};display:grid;place-items:center;cursor:pointer;font-size:24px"></span>`).join('')}</div>
    <p style="text-align:center;margin:6px"><span data-region="water"><button class="m-btn s" data-act="can" style="${h('water') ? 'width:14px;height:14px;padding:0;font-size:9px' : ''}">${h('water') ? '≋' : 'Water the beds'}</button></span> <span data-region="undo">${h('undo') ? '' : '<button class="m-btn secondary s" data-act="undo">Undo</button>'}</span> <span data-region="digup">${h('digup') ? '<button class="m-btn danger s" data-act="dig">Dig it all up</button>' : '<small>Digging is done by staff.</small>'}</span></p>
    <p data-region="status" class="gs" style="text-align:center;margin:2px;min-height:16px;font-size:12px"></p>
    <div style="display:flex;justify-content:space-around;align-items:end;margin-top:6px"><span data-region="bench" data-act="bench" style="cursor:pointer;display:inline-block;padding:4px 10px;background:#7b5a34;color:#fff;font-size:12px;border-radius:3px">${h('bench') ? '' : 'Bench'}&nbsp;</span>
    <span data-region="pond" data-act="pond" style="cursor:pointer;display:inline-block;width:80px;height:34px;border-radius:50%;background:#4aa0c8;text-align:center;font-size:${h('pond') ? 9 : 12}px;color:#fff;line-height:34px">Pond</span></div>`)}</div>`,
  acts: {
    bed(c) { const i = +c.arg; c.st.w = c.st.w || {}; if (!c.st.w[i]) return c.say('That bed is dry. The can is below.'); c.el.textContent = ['🌺', '💜', '🌷', '🌼'][i]; tn(c, 400 + i * 80, .12, 'sine', .06); c.st.o = (c.st.o || new Set()).add(i); if (c.st.o.size >= 4) c.find('bloom'); },
    can(c) { c.st.w = c.st.w || {}; [0, 1, 2, 3].forEach(i => { c.st.w[i] = 1; }); c.root.querySelectorAll('.bd').forEach(b => { b.style.background = c.f('beds') ? '#8a7a5a' : '#3d2a15'; }); if (!c.f('status')) c.q('.gs').textContent = 'The beds are watered.'; tn(c, 600, .25, 'sine', .05); },
    undo(c) { c.st.w = {}; c.st.o = new Set(); c.root.querySelectorAll('.bd').forEach(b => { b.style.background = '#6b4a2a'; b.textContent = ''; }); },
    dig(c) { c.root.querySelectorAll('.bd').forEach(b => { b.textContent = ''; b.style.background = '#a08060'; }); tn(c, 100, .4, 'sawtooth', .06); },
    bench(c) { c.st.b = 1; c.q('.a-garden').style.filter = 'sepia(.35)'; tn(c, 220, .6, 'sine', .04); c.find('bench'); },
    pond(c) { c.st.pd = (c.st.pd || 0) + 1; tn(c, 700 - c.st.pd * 80, .2, 'sine', .06); c.el.style.transform = `scale(${1 + c.st.pd * .08})`; if (c.st.pd >= 3) c.find('ripple'); }
  }
};

/* 11. The Dead Letter Office */
ATLAS.bpost = {
  id: 'bpost', name: 'The Dead Letter Office', url: 'post.example/unsent',
  style: ['Dates are written in words.', 'Buttons name their action: Open, Keep, Burn.'],
  note: 'Letters that never arrived. You can read them. Some of them were meant for you.',
  finds: { read3: 'Three letters read', stamp: 'A letter is stamped “arrived”', drawer: 'The drawer of unsent things' },
  regions: { shelf: 'Letter shelf', dates: 'Postmarks', open: 'Open button', stamp: 'Stamp tool', burn: 'Burn button', notice: 'Opened notice', back: 'Back button', hint: 'Hint text' },
  defects: {
    shelf: { region: 'shelf', cat: 'color', label: 'Read and unread letters differ by colour only', why: W.color },
    dates: { region: 'dates', cat: 'realworld', label: 'Postmarks in epoch seconds', why: 'Say 4 March, not 1709512800.' },
    open: { region: 'open', cat: 'target', label: 'Open is a 12 px square', why: W.target },
    stamp: { region: 'stamp', cat: 'recognition', label: 'The stamp tool is an unlabeled icon', why: 'Show what it is.' },
    burn: { region: 'burn', cat: 'prevention', label: '“Burn this letter” next to Open, no confirmation', why: W.prev },
    notice: { region: 'notice', cat: 'status', label: 'Nothing says a letter was opened', why: W.stat },
    back: { region: 'back', cat: 'control', label: 'Once a letter is open there is no way back to the shelf', why: 'Give users a way back.' },
    hint: { region: 'hint', cat: 'contrast', label: 'Pale grey hint on cream paper', why: 'Normal text needs 4.5 : 1.' }
  },
  build: h => `${axRoot(h)}${AXB('a-post', `
    <p data-region="hint" style="margin:0 0 4px;font-size:12px;color:${h('hint') ? '#d0c8b4' : '#5b4a30'}">Touch a letter to read it.</p>
    <div data-region="shelf" style="display:flex;gap:8px;justify-content:center">${[0, 1, 2, 3].map(i => `<span data-act="letter" data-arg="${i}" class="lt" style="width:50px;height:34px;background:${h('shelf') ? '#d8d0b8' : '#e6dcc0'};border:1px solid #8a7a5a;display:grid;place-items:center;cursor:pointer">✉</span>`).join('')}</div>
    <p data-region="dates" class="ld" style="text-align:center;margin:6px;font:12px monospace;color:#5b4a30">${h('dates') ? '1709512800' : '4 March'}</p>
    <div class="lbox" style="min-height:48px;margin:4px 10px;padding:6px;background:#fffbea;border:1px dashed #8a7a5a;font:italic 14px Georgia,serif;color:#3a2a15"></div>
    <p style="text-align:center;margin:6px"><span data-region="open"><button class="m-btn s" data-act="read" style="${h('open') ? 'width:12px;height:12px;padding:0;font-size:8px' : ''}">${h('open') ? '▢' : 'Open next'}</button></span> <span data-region="stamp"><button class="m-btn secondary s" data-act="stamp">${h('stamp') ? '⌗' : 'Stamp “arrived”'}</button></span> <span data-region="burn">${h('burn') ? '<button class="m-btn danger s" data-act="burn">Burn this letter</button>' : '<small>Burning is not offered.</small>'}</span></p>
    <p data-region="notice" class="ln" style="text-align:center;margin:2px;min-height:16px;font-size:12px"></p>
    <p data-region="back" style="text-align:center;margin:2px">${h('back') ? '' : '<button class="m-btn secondary s" data-act="shelf">Back to the shelf</button>'}</p>
    <p style="text-align:center;margin:4px"><span data-act="drawer" style="cursor:pointer;font-size:11px;color:#8f6a2c;border-bottom:1px dotted">▸ the drawer</span></p>`)}</div>`,
  acts: {
    letter(c) { const i = +c.arg, T = ['Dear Anna: the ferry was full again. I kept your seat.', 'To whoever finds this: the lamp is not broken, it is shy.', 'Pete: your cat has opinions about the harbor. They are correct.', 'To the inspector: you will not read this, so I can say the truth.']; c.st.rd = (c.st.rd || new Set()).add(i); c.st.cur = i; c.q('.lbox').textContent = T[i]; c.el.style.opacity = c.f('shelf') ? .85 : .5; if (!c.f('notice')) c.q('.ln').textContent = 'Opened.'; tn(c, 500 + i * 60, .1, 'sine', .05); if (c.st.rd.size >= 3) c.find('read3'); },
    read(c) { const n = ((c.st.cur ?? -1) + 1) % 4; c.root.querySelectorAll('.lt')[n].click(); },
    stamp(c) { if (c.st.cur === undefined) return c.say('Open a letter first.'); c.q('.lbox').insertAdjacentHTML('beforeend', '<div style="color:#1b6;font:700 12px monospace;margin-top:4px">ARRIVED</div>'); tn(c, 200, .2, 'square', .06); c.find('stamp'); },
    burn(c) { c.q('.lbox').textContent = '(ash)'; tn(c, 90, .5, 'sawtooth', .07); },
    shelf(c) { c.q('.lbox').textContent = ''; },
    drawer(c) { c.q('.lbox').innerHTML = 'Unsent: <i>“I am sorry.”</i> <i>“Thank you.”</i> <i>“Come home.”</i>'; tn(c, 330, .5, 'triangle', .05); c.find('drawer'); }
  }
};

/* 12. The Star Counter */
ATLAS.bsky = {
  id: 'bsky', name: 'The Star Counter', url: 'sky.example/count',
  style: ['Times are written 9:40 pm.', 'Every control has a word.'],
  note: 'A sky you can count. The counter goes up by itself if you are patient, and the moon does not like being poked.',
  finds: { shape: 'Stars joined into a shape', eclipse: 'The moon goes dark', comet: 'A comet crosses' },
  regions: { sky: 'Sky', count: 'Star counter', moon: 'Moon', join: 'Join button', clear: 'Clear button', time: 'Time label', notice: 'Join notice', legend: 'Legend' },
  defects: {
    sky: { region: 'sky', cat: 'contrast', label: 'Grey stars on a lighter grey sky', why: 'Non-text marks need 3 : 1.' },
    count: { region: 'count', cat: 'realworld', label: 'Count shown as “N=0b101”', why: 'Say 5 stars.' },
    moon: { region: 'moon', cat: 'recognition', label: 'The moon is an unlabeled circle', why: 'Show what it is.' },
    join: { region: 'join', cat: 'target', label: 'Join is a 12 px dot', why: W.target },
    clear: { region: 'clear', cat: 'prevention', label: '“Clear the sky” beside Join, no confirmation', why: W.prev },
    time: { region: 'time', cat: 'text', label: 'Time label is 9 px', why: 'At least 11 px.' },
    notice: { region: 'notice', cat: 'status', label: 'Joining stars gives no sign it worked', why: W.stat },
    legend: { region: 'legend', cat: 'color', label: 'Bright and dim stars differ by colour only', why: W.color }
  },
  build: h => `${axRoot(h)}${AXB('a-sky', `
    <div data-region="sky" class="sk" style="position:relative;height:150px;border-radius:10px;background:${h('sky') ? '#6b7480' : '#0b1430'};overflow:hidden">${[[20, 30], [60, 70], [110, 40], [160, 90], [210, 50], [250, 100]].map(([x, y], i) => `<span data-act="star" data-arg="${i}" class="st" style="position:absolute;left:${x}px;top:${y}px;width:14px;height:14px;border-radius:50%;background:${h('sky') ? '#9aa0a8' : '#ffe9a8'};cursor:pointer"></span>`).join('')}
      <span data-region="moon" data-act="moon" style="position:absolute;right:14px;top:10px;width:26px;height:26px;border-radius:50%;background:#e8e8d8;cursor:pointer;display:grid;place-items:center;font-size:8px;color:#444">${h('moon') ? '' : 'moon'}</span></div>
    <p style="margin:6px 0;text-align:center;font:13px monospace" data-region="count" class="sc">${h('count') ? 'N=0b0' : '0 stars joined'}</p>
    <p data-region="time" style="text-align:center;margin:0;font-size:${h('time') ? 9 : 12}px;color:#555">Best seen at 9:40 pm</p>
    <p data-region="legend" style="text-align:center;margin:2px;font-size:12px;color:${h('legend') ? '#888' : '#333'}">${h('legend') ? '● ●' : '● bright · ○ dim'}</p>
    <p style="text-align:center;margin:6px"><span data-region="join"><button class="m-btn s" data-act="join" style="${h('join') ? 'width:12px;height:12px;padding:0;font-size:8px' : ''}">${h('join') ? '·' : 'Join stars'}</button></span> <span data-region="clear">${h('clear') ? '<button class="m-btn danger s" data-act="clear">Clear the sky</button>' : '<small>The sky cannot be cleared.</small>'}</span></p>
    <p data-region="notice" class="sn" style="text-align:center;margin:2px;min-height:16px;font-size:12px"></p>`)}</div>`,
  acts: {
    star(c) { c.st.s = c.st.s || new Set(); const i = +c.arg; c.st.s.has(i) ? c.st.s.delete(i) : c.st.s.add(i); c.el.style.boxShadow = c.st.s.has(i) ? '0 0 10px 4px #ffe9a8' : ''; c.q('.sc').textContent = c.f('count') ? 'N=0b' + c.st.s.size.toString(2) : c.st.s.size + ' stars joined'; tn(c, 440 + i * 50, .1, 'sine', .05); },
    join(c) { if (!c.st.s || c.st.s.size < 4) return c.say('Choose at least four stars.'); if (!c.f('notice')) c.q('.sn').textContent = 'Joined.'; c.find('shape'); tn(c, 660, .3, 'triangle', .06); },
    clear(c) { c.st.s = new Set(); c.root.querySelectorAll('.st').forEach(s => { s.style.boxShadow = ''; }); c.q('.sc').textContent = c.f('count') ? 'N=0b0' : '0 stars joined'; },
    moon(c) { c.st.m = (c.st.m || 0) + 1; tn(c, 200, .15, 'sine', .05); if (c.st.m === 3) { c.el.style.background = '#222'; tn(c, 80, .8, 'sine', .08); c.find('eclipse'); } if (c.st.m === 5) { const t = c.q('.sk'); const k = document.createElement('span'); k.textContent = '☄'; k.style.cssText = 'position:absolute;left:-20px;top:20px;font-size:20px;transition:left 1.6s linear'; t.appendChild(k); requestAnimationFrame(() => { k.style.left = '300px'; }); c.find('comet'); } }
  }
};

/* 13. The Shop That Sells Nothing */
ATLAS.bshop = {
  id: 'bshop', name: 'The Shop That Sells Nothing', url: 'nothing.example/buy',
  style: ['Prices are written 0 cr, never as symbols.', 'The same action has the same name everywhere.'],
  note: 'Everything costs nothing and is worth exactly that. The receipt is the best part.',
  finds: { bought: 'Three things bought', haggle: 'The price goes negative', bell: 'The shop bell rings' },
  regions: { items: 'Goods', price: 'Price tag', buy: 'Buy button', basket: 'Basket', receipt: 'Receipt', bell: 'Shop bell', remove: 'Remove button', empty: 'Empty-basket button' },
  defects: {
    items: { region: 'items', cat: 'color', label: 'Sold out items differ by colour only', why: W.color },
    price: { region: 'price', cat: 'realworld', label: 'Prices shown as “€0.00×10⁰”', why: 'Say 0 cr.' },
    buy: { region: 'buy', cat: 'target', label: 'Buy is a 12 px square', why: W.target },
    basket: { region: 'basket', cat: 'recognition', label: 'The basket is an unlabeled icon', why: 'Show what it is.' },
    receipt: { region: 'receipt', cat: 'text', label: 'Receipt in 9 px grey type', why: 'At least 11 px.' },
    bell: { region: 'bell', cat: 'status', label: 'The bell rings with no sign why', why: W.stat },
    remove: { region: 'remove', cat: 'control', label: 'Nothing can be removed from the basket', why: 'Give users a way back.' },
    empty: { region: 'empty', cat: 'prevention', label: '“Empty basket” next to Buy, no confirmation', why: W.prev }
  },
  build: h => `${axRoot(h)}${AXB('a-shop', `
    <div data-region="items" style="display:flex;gap:8px;justify-content:center;margin:4px 0">${['Air', 'Echo', 'Maybe'].map((n, i) => `<span data-act="item" data-arg="${i}" class="it" style="padding:8px 10px;border:1px solid #8a7a5a;border-radius:6px;background:${h('items') && i === 1 ? '#bbb' : '#fff8e0'};cursor:pointer;font-size:13px">${n}</span>`).join('')}</div>
    <p data-region="price" class="sp" style="text-align:center;margin:6px;font:13px monospace">${h('price') ? '€0.00×10⁰' : '0 cr'}</p>
    <p style="text-align:center;margin:6px"><span data-region="buy"><button class="m-btn s" data-act="buy" style="${h('buy') ? 'width:12px;height:12px;padding:0;font-size:8px' : ''}">${h('buy') ? '▢' : 'Buy it'}</button></span> <span data-region="remove">${h('remove') ? '' : '<button class="m-btn secondary s" data-act="rm">Remove one</button>'}</span> <span data-region="empty">${h('empty') ? '<button class="m-btn danger s" data-act="empty">Empty basket</button>' : '<small>The basket empties itself.</small>'}</span></p>
    <p style="text-align:center;margin:4px"><span data-region="basket" class="sb" style="display:inline-block;padding:2px 8px;border:1px solid #8a7a5a;border-radius:4px;font-size:12px">${h('basket') ? '🧺' : 'Basket: '}<b class="sbn">0</b></span> <span data-region="bell" data-act="bell" style="cursor:pointer;font-size:18px">🔔</span></p>
    <p data-region="receipt" class="sr" style="margin:4px 8px;font:${h('receipt') ? '9px' : '12px'} monospace;color:${h('receipt') ? '#aaa' : '#333'};min-height:30px"></p>
    <p style="text-align:center;margin:2px"><span data-act="price" style="cursor:pointer;font-size:11px;color:#8f6a2c;border-bottom:1px dotted">haggle</span></p>`)}</div>`,
  acts: {
    item(c) { c.st.i = +c.arg; c.root.querySelectorAll('.it').forEach((e, k) => { e.style.outline = k === c.st.i ? '2px solid #8f6a2c' : ''; }); tn(c, 300, .08, 'triangle', .05); },
    buy(c) { if (c.st.i === undefined) return c.say('Pick something to buy first.'); c.st.b = (c.st.b || 0) + 1; c.q('.sbn').textContent = c.st.b; c.q('.sr').textContent = (c.q('.sr').textContent + ' ' + ['air x1', 'echo x1', 'maybe x1'][c.st.i] + ' · 0 cr ·').slice(-90); tn(c, 800, .1, 'sine', .06); if (c.st.b >= 3) c.find('bought'); },
    rm(c) { c.st.b = Math.max(0, (c.st.b || 0) - 1); c.q('.sbn').textContent = c.st.b; },
    empty(c) { c.st.b = 0; c.q('.sbn').textContent = 0; c.q('.sr').textContent = ''; },
    bell(c) { c.st.bl = (c.st.bl || 0) + 1; tn(c, 1100, .5, 'sine', .08); if (!c.f('bell')) c.say('The bell rings: someone has come in.'); if (c.st.bl >= 3) c.find('bell'); },
    price(c) { c.st.h = (c.st.h || 0) + 1; c.q('.sp').textContent = c.f('price') ? '€-0.0' + c.st.h + '×10⁰' : -c.st.h + ' cr'; tn(c, 350 - c.st.h * 30, .15, 'triangle', .05); if (c.st.h >= 3) c.find('haggle'); }
  }
};

/* 14. The Staircase */
ATLAS.bstairs = {
  id: 'bstairs', name: 'The Staircase', url: 'stairs.example/up',
  style: ['Every control has a word.', 'Floors are numbered 1, 2, 3.'],
  note: 'Nine steps, each one says something, and the last is a door. Going back down is allowed, but it is quieter.',
  finds: { top: 'The door at the top', creak: 'The creaking step', echo: 'The stairwell echoes back' },
  regions: { steps: 'Steps', floor: 'Floor label', up: 'Go up button', down: 'Go down button', door: 'Door', notice: 'Step notice', rail: 'Handrail', lights: 'Lights switch' },
  defects: {
    steps: { region: 'steps', cat: 'color', label: 'Visited and unvisited steps differ by colour only', why: W.color },
    floor: { region: 'floor', cat: 'realworld', label: 'Floor labelled “L-0x03”', why: 'Say floor 3.' },
    up: { region: 'up', cat: 'target', label: 'Go up is a 12 px arrow', why: W.target },
    down: { region: 'down', cat: 'control', label: 'There is no way down once you start up', why: 'Give users a way back.' },
    door: { region: 'door', cat: 'recognition', label: 'The door is an unlabeled rectangle', why: 'Show what it is.' },
    notice: { region: 'notice', cat: 'status', label: 'Nothing says which step you are on', why: W.stat },
    rail: { region: 'rail', cat: 'contrast', label: 'Pale grey handrail text on white', why: 'Normal text needs 4.5 : 1.' },
    lights: { region: 'lights', cat: 'prevention', label: '“Lights off” beside Go up, no confirmation', why: W.prev }
  },
  build: h => `${axRoot(h)}${AXB('a-stairs', `
    <p data-region="floor" class="fl" style="margin:0;text-align:center;font:600 14px monospace">${h('floor') ? 'L-0x00' : 'Floor 0'}</p>
    <div data-region="steps" style="display:flex;align-items:end;gap:2px;justify-content:center;height:90px;margin:6px 0">${Array.from({ length: 9 }, (_, i) => `<span class="stp" data-act="step" data-arg="${i}" style="width:24px;height:${10 + i * 8}px;background:${h('steps') ? '#9a9a9a' : '#c9a66b'};border:1px solid #8a7a5a;cursor:pointer"></span>`).join('')}</div>
    <p data-region="rail" style="margin:0;text-align:center;font-size:12px;color:${h('rail') ? '#d4d4d4' : '#444'}">Hold the handrail.</p>
    <p style="text-align:center;margin:6px"><span data-region="up"><button class="m-btn s" data-act="up" style="${h('up') ? 'width:12px;height:12px;padding:0;font-size:8px' : ''}">${h('up') ? '▲' : 'Go up'}</button></span> <span data-region="down">${h('down') ? '' : '<button class="m-btn secondary s" data-act="down">Go down</button>'}</span> <span data-region="lights">${h('lights') ? '<button class="m-btn danger s" data-act="dark">Lights off</button>' : '<small>Lights stay on.</small>'}</span></p>
    <p data-region="notice" class="nt" style="text-align:center;margin:2px;min-height:16px;font-size:12px"></p>
    <p style="text-align:center;margin:4px"><span data-region="door" data-act="door" class="dr" style="display:inline-block;width:${h('door') ? 30 : 80}px;height:34px;background:#7b5a34;border-radius:4px 4px 0 0;color:#fff;font-size:11px;line-height:34px;cursor:pointer;visibility:hidden">${h('door') ? '' : 'Door'}</span></p>`)}</div>`,
  acts: {
    step(c) { const i = +c.arg; c.st.at = i; c.root.querySelectorAll('.stp').forEach((s, k) => { s.style.background = k <= i ? (c.f('steps') ? '#888' : '#e2c488') : (c.f('steps') ? '#9a9a9a' : '#c9a66b'); }); c.q('.fl').textContent = c.f('floor') ? 'L-0x0' + (i + 1) : 'Floor ' + (i + 1); if (!c.f('notice')) c.q('.nt').textContent = 'Step ' + (i + 1) + ' of 9'; tn(c, 200 + i * 40, .1, 'triangle', .05); if (i === 4) { c.st.k = (c.st.k || 0) + 1; if (c.st.k >= 2) { tn(c, 80, .7, 'sawtooth', .09); c.find('creak'); } } if (i === 8) { c.q('.dr').style.visibility = 'visible'; } },
    up(c) { const n = Math.min(8, (c.st.at ?? -1) + 1); c.root.querySelectorAll('.stp')[n].click(); },
    down(c) { const n = Math.max(0, (c.st.at ?? 0) - 1); c.root.querySelectorAll('.stp')[n].click(); c.st.dn = (c.st.dn || 0) + 1; tn(c, 120, .3, 'sine', .04); if (c.st.dn >= 3) c.find('echo'); },
    dark(c) { c.q('.a-stairs').style.filter = 'brightness(.35)'; tn(c, 110, .3, 'sine', .05); },
    door(c) { tn(c, 520, .4, 'triangle', .08); c.q('.dr').textContent = c.f('door') ? '' : 'Open'; c.find('top'); }
  }
};

Object.assign(BRIGADE, ATLAS);
for (const k of ['bclock', 'bgarden', 'bpost', 'bsky', 'bshop', 'bstairs']) SHIP_KIND[k] = 'gala';
/* ───────────────────── 11i. The Atlas, third volume: six more places to wander ───────────────────── */
const TB12 = 'width:12px;height:12px;padding:0;font-size:8px';
const CTR = 'text-align:center;margin:6px';

/* 15. The Fog Horn Choir */
ATLAS.bfog = {
  id: 'bfog', name: 'The Fog Horn Choir', url: 'fog.example/choir',
  style: ['Distances are written in metres.', 'Every control has a word.'],
  note: 'Three horns, one fog. Somebody out there is listening, and now and then they answer.',
  finds: { chord: 'The three horns agree', answer: 'A far horn answers', ship: 'A ship in the fog' },
  regions: { horns: 'Horns', dist: 'Distance readout', sound: 'Sound button', ear: 'Listen button', log: 'Choir log', echo: 'Echo notice', stop: 'Stop button', clear: 'Clear-fog button' },
  defects: {
    horns: { region: 'horns', cat: 'color', label: 'The chosen horn differs from the others by colour only', why: W.color },
    dist: { region: 'dist', cat: 'realworld', label: 'Distance shown as “0x1F4 fathoms”', why: 'Say 500 m.' },
    sound: { region: 'sound', cat: 'target', label: 'Sound is a 12 px square', why: W.target },
    ear: { region: 'ear', cat: 'recognition', label: 'Listen is an unlabeled ear icon', why: 'Show what it is.' },
    log: { region: 'log', cat: 'text', label: 'Choir log in 9 px type', why: 'At least 11 px.' },
    echo: { region: 'echo', cat: 'status', label: 'Horns sound with no sign anyone heard', why: W.stat },
    stop: { region: 'stop', cat: 'control', label: 'A chord cannot be stopped once it starts', why: 'Give users a way out.' },
    clear: { region: 'clear', cat: 'prevention', label: '“Clear the fog” beside Sound wipes the log, no confirmation', why: W.prev }
  },
  build: h => `${axRoot(h)}${AXB('a-fog', `
    <div data-region="horns" style="display:flex;gap:8px;justify-content:center;margin:6px 0">${['Low', 'Mid', 'High'].map((n, i) => `<span data-act="horn" data-arg="${i}" class="hn" style="padding:8px 14px;border-radius:8px;border:2px solid ${h('horns') ? '#8a8f95' : '#3a4a5a'};background:${h('horns') ? '#9aa0a8' : '#dfe8ee'};cursor:pointer;font-size:13px;color:#1d2530">${n}</span>`).join('')}</div>
    <p data-region="dist" class="fd" style="${CTR};font:13px monospace;color:#1d2530">${h('dist') ? '0x1F4 fathoms' : '500 m of fog'}</p>
    <p style="${CTR}"><span data-region="sound"><button class="m-btn s" data-act="sound" style="${h('sound') ? TB12 : ''}">${h('sound') ? '▢' : 'Sound the horn'}</button></span> <span data-region="ear"><button class="m-btn secondary s" data-act="ear">${h('ear') ? '👂' : 'Listen'}</button></span>
      <span data-region="stop">${h('stop') ? '' : '<button class="m-btn secondary s" data-act="stop">Stop</button>'}</span> <span data-region="clear">${h('clear') ? '<button class="m-btn danger s" data-act="clear">Clear the fog</button>' : '<small>The fog clears itself.</small>'}</span></p>
    <p data-region="echo" class="fe" style="${CTR};min-height:16px;font-size:12px;color:#1d2530"></p>
    <div data-act="fog" class="fgx" style="margin:4px 10px;padding:12px;border-radius:10px;background:#cfd8de;color:#1d2530;font-size:12px;text-align:center;cursor:pointer;min-height:28px">The fog is thick. <span class="fship" hidden>⛴ a ship, very slowly</span></div>
    <p data-region="log" class="fl" style="margin:4px 10px;font:${h('log') ? '9px' : '12px'} monospace;color:#1d2530;min-height:16px"></p>`)}</div>`,
  acts: {
    horn(c) { const i = +c.arg, f = [110, 165, 220][i]; c.st.sel = i; c.st.h = (c.st.h || []).concat(i).slice(-3); c.root.querySelectorAll('.hn').forEach((e, k) => { e.style.outline = k === i ? (c.f('horns') ? '' : '3px solid #1d6ea8') : ''; e.style.background = k === i && c.f('horns') ? '#8a8f95' : e.style.background; }); tn(c, f, .5, 'sawtooth', .05); if (c.st.h.join() === '0,1,2') { [110, 165, 220].forEach(x => tn(c, x, 1.4, 'sine', .07)); c.find('chord'); c.say('The three horns settle on one note.'); } },
    sound(c) { if (c.st.sel === undefined) return c.say('Choose a horn first.'); c.st.n = (c.st.n || 0) + 1; tn(c, [110, 165, 220][c.st.sel], .9, 'sawtooth', .07); c.q('.fl').textContent += ' ·' + ['L', 'M', 'H'][c.st.sel]; if (!c.f('echo')) c.q('.fe').textContent = 'Sounded. Listening for a reply…'; if (c.st.n >= 5) { c.find('answer'); c.say('Far off, one low note answers.'); tn(c, 82, 1.2, 'sine', .04); } },
    ear(c) { tn(c, 60, .4, 'sine', .03); c.say(c.st.n ? 'You hear the fog, and something in it.' : 'You hear nothing. Try the horn first.'); },
    stop(c) { tn(c, 90, .1, 'square', .02); c.q('.fe').textContent = ''; },
    clear(c) { c.q('.fl').textContent = ''; c.st.n = 0; },
    fog(c) { c.st.g = (c.st.g || 0) + 1; tn(c, 400 + c.st.g * 40, .08, 'sine', .04); if (c.st.g >= 3) { c.q('.fship').hidden = false; c.find('ship'); c.reveal(); } }
  }
};

/* 16. The Café Nobody Orders From */
ATLAS.bcafe = {
  id: 'bcafe', name: 'The Café Nobody Orders From', url: 'cafe.example/menu',
  style: ['Prices are written 4 cr.', 'The same action has the same name everywhere.'],
  note: 'A café with one waiter, one empty chair and a menu that remembers you. Order three of anything and it says “the usual”.',
  finds: { usual: 'The usual', waiter: 'The waiter sits down', chair: 'Who the chair is for' },
  regions: { menu: 'Menu', price: 'Price', order: 'Order button', bill: 'Bill button', slip: 'Order slip', waiter: 'Waiter message', cancel: 'Cancel button', back: 'Send-back button' },
  defects: {
    menu: { region: 'menu', cat: 'color', label: 'Sold-out dishes differ from the rest by colour only', why: W.color },
    price: { region: 'price', cat: 'realworld', label: 'Price shown as “0x04 coins”', why: 'Say 4 cr.' },
    order: { region: 'order', cat: 'target', label: 'Order is a 12 px square', why: W.target },
    bill: { region: 'bill', cat: 'recognition', label: 'The bill is an unlabeled icon', why: 'Show what it is.' },
    slip: { region: 'slip', cat: 'text', label: 'The order slip is in 9 px grey type', why: 'At least 11 px.' },
    waiter: { region: 'waiter', cat: 'status', label: 'Nothing says an order was received', why: W.stat },
    cancel: { region: 'cancel', cat: 'control', label: 'An order cannot be taken back', why: 'Give users a way back.' },
    back: { region: 'back', cat: 'prevention', label: '“Send everything back” beside Order, no confirmation', why: W.prev }
  },
  build: h => `${axRoot(h)}${AXB('a-cafe', `
    <div data-region="menu" style="display:flex;gap:8px;justify-content:center;margin:6px 0">${['Tea', 'Toast', 'Soup'].map((n, i) => `<span data-act="dish" data-arg="${i}" class="ds" style="padding:8px 12px;border:1px solid #8a7a5a;border-radius:6px;background:${h('menu') && i === 2 ? '#bbb' : '#fff8e0'};color:#3a2a15;cursor:pointer;font-size:13px">${n}</span>`).join('')}</div>
    <p data-region="price" class="cp" style="${CTR};font:13px monospace;color:#3a2a15">${h('price') ? '0x04 coins' : '4 cr'}</p>
    <p style="${CTR}"><span data-region="order"><button class="m-btn s" data-act="order" style="${h('order') ? TB12 : ''}">${h('order') ? '▢' : 'Order'}</button></span> <span data-region="bill"><button class="m-btn secondary s" data-act="bill">${h('bill') ? '🧾' : 'Bill'}</button></span>
      <span data-region="cancel">${h('cancel') ? '' : '<button class="m-btn secondary s" data-act="cancel">Take it back</button>'}</span> <span data-region="back">${h('back') ? '<button class="m-btn danger s" data-act="sendback">Send everything back</button>' : '<small>Nothing is ever sent back.</small>'}</span></p>
    <p data-region="waiter" class="cw" style="${CTR};min-height:16px;font-size:12px;color:#3a2a15"></p>
    <p data-region="slip" class="cs" style="margin:4px 12px;font:${h('slip') ? '9px' : '12px'} monospace;color:${h('slip') ? '#aaa' : '#3a2a15'};min-height:16px"></p>
    <p style="${CTR}"><span data-act="waiter" style="cursor:pointer;font-size:20px">🧑‍🍳</span> <span data-act="chair" style="cursor:pointer;font-size:20px">🪑</span></p>`)}</div>`,
  acts: {
    dish(c) { c.st.d = +c.arg; c.root.querySelectorAll('.ds').forEach((e, k) => { e.style.outline = k === c.st.d ? '2px solid #8f6a2c' : ''; }); tn(c, 300, .08, 'triangle', .05); },
    order(c) { if (c.st.d === undefined) return c.say('Choose a dish first.'); const D = ['tea', 'toast', 'soup']; c.st.o = c.st.o || {}; c.st.o[c.st.d] = (c.st.o[c.st.d] || 0) + 1; c.q('.cs').textContent = (c.q('.cs').textContent + ' ' + D[c.st.d] + ' ·').slice(-70); tn(c, 760, .12, 'sine', .06); if (!c.f('waiter')) c.q('.cw').textContent = 'The waiter nods: ' + D[c.st.d] + ' is on its way.'; if (c.st.o[c.st.d] >= 3) { c.find('usual'); c.say('“The usual,” says the waiter, already pouring.'); } },
    bill(c) { c.say(c.st.o ? 'The bill is whatever you want it to be.' : 'There is nothing to pay for yet.'); tn(c, 500, .1, 'triangle', .05); },
    cancel(c) { c.st.o = {}; c.q('.cs').textContent = ''; },
    sendback(c) { c.st.o = {}; c.q('.cs').textContent = ''; c.q('.cw').textContent = ''; },
    waiter(c) { c.st.w = (c.st.w || 0) + 1; tn(c, 330, .1, 'triangle', .05); if (c.st.w >= 3) { c.find('waiter'); c.say('The waiter sits, for the first time today. “Do not tell the owner.”'); } },
    chair(c) { c.st.c = (c.st.c || 0) + 1; tn(c, 120, .2, 'sine', .05); if (c.st.c >= 3) { c.find('chair'); c.say('A card on the chair: “Reserved, always, for whoever comes in last.”'); } }
  }
};

function radioShow(c) {
      const f = c.st.f ?? 88; c.st.t = (c.st.t || 0) + 1; c.q('.rd').textContent = f.toFixed(1); if (!c.f('freq')) c.q('.rf').textContent = f.toFixed(1) + ' MHz'; else c.q('.rf').textContent = 'f=0x' + Math.floor(f).toString(16).toUpperCase() + '.' + Math.round((f % 1) * 100).toString(16).toUpperCase();
      tn(c, 200 + (f - 88) * 60, .12, 'square', .03);
      const near = Math.abs(f - 88.8) < .05, jazz = Math.abs(f - 94) < .05;
      if (!c.f('sig')) c.q('.rs').textContent = near || jazz ? 'Tuned in.' : 'Static.';
      if (near) { c.find('pirate'); c.say('“…this is Radio 88.8. If you can hear this, someone left the booth lamp on.”'); }
      else if (jazz) c.say('A slow song, played to nobody.');
      if (c.st.t >= 12 && !c.st.sd) { c.st.sd = 1; c.find('static'); c.say('The static has a rhythm. It spells: LOOK AGAIN.'); }
}

/* 17. Pirate Radio 88.8 */
ATLAS.bradio = {
  id: 'bradio', name: 'Pirate Radio 88.8', url: 'radio.example/dial',
  style: ['Frequencies are written 88.8 MHz.', 'Every control has a word.'],
  note: 'A radio that is mostly static. Somewhere between the stations there is a voice that is not on any list.',
  finds: { pirate: 'The pirate station', static: 'The static spells something', preset: 'Three stations saved' },
  regions: { dial: 'Dial', freq: 'Frequency', tune: 'Tune button', mute: 'Mute button', pres: 'Presets', sig: 'Signal notice', off: 'Off button', wipe: 'Forget-presets button' },
  defects: {
    dial: { region: 'dial', cat: 'contrast', label: 'Pale grey numbers on a pale dial', why: 'Normal text needs 4.5 : 1.' },
    freq: { region: 'freq', cat: 'realworld', label: 'Frequency shown as “f=0x58.CC”', why: 'Say 88.8 MHz.' },
    tune: { region: 'tune', cat: 'target', label: 'Tune is a 12 px dot', why: W.target },
    mute: { region: 'mute', cat: 'recognition', label: 'Mute is an unlabeled speaker icon', why: 'Show what it is.' },
    pres: { region: 'pres', cat: 'color', label: 'Saved and empty presets differ by colour only', why: W.color },
    sig: { region: 'sig', cat: 'status', label: 'Nothing says whether a station is tuned in', why: W.stat },
    off: { region: 'off', cat: 'control', label: 'The radio cannot be turned off', why: 'Give users a way out.' },
    wipe: { region: 'wipe', cat: 'prevention', label: '“Forget presets” beside Tune, no confirmation', why: W.prev }
  },
  build: h => `${axRoot(h)}${AXB('a-radio', `
    <div data-region="dial" style="margin:6px 12px;padding:10px;border-radius:8px;background:${h('dial') ? '#d8d8d0' : '#26302a'};text-align:center;font:700 22px monospace;color:${h('dial') ? '#b8b8b0' : '#9be3a4'}" class="rd">88.0</div>
    <p data-region="freq" class="rf" style="${CTR};font:12px monospace;color:#1d2530">${h('freq') ? 'f=0x58.00' : '88.0 MHz'}</p>
    <p style="${CTR}"><button class="m-btn secondary s" data-act="down">◀ Lower</button> <span data-region="tune"><button class="m-btn s" data-act="up" style="${h('tune') ? TB12 : ''}">${h('tune') ? '▸' : 'Higher ▶'}</button></span> <span data-region="mute"><button class="m-btn secondary s" data-act="mute">${h('mute') ? '🔈' : 'Mute'}</button></span>
      <span data-region="off">${h('off') ? '' : '<button class="m-btn secondary s" data-act="off">Off</button>'}</span> <span data-region="wipe">${h('wipe') ? '<button class="m-btn danger s" data-act="wipe">Forget presets</button>' : '<small>Presets last.</small>'}</span></p>
    <p data-region="sig" class="rs" style="${CTR};min-height:16px;font-size:12px;color:#1d2530"></p>
    <div data-region="pres" style="display:flex;gap:8px;justify-content:center;margin:4px">${[0, 1, 2].map(i => `<span data-act="pre" data-arg="${i}" class="pr" style="width:44px;height:28px;display:grid;place-items:center;border:1px solid #5a6a5a;border-radius:6px;background:${h('pres') ? '#cfd6cf' : '#fff'};cursor:pointer;font-size:12px;color:#1d2530">${i + 1}</span>`).join('')}</div>`)}</div>`,
  acts: {
    up(c) { c.st.f = Math.min(108, Math.round(((c.st.f ?? 88) + .4) * 10) / 10); radioShow(c); },
    down(c) { c.st.f = Math.max(87.6, Math.round(((c.st.f ?? 88) - .4) * 10) / 10); radioShow(c); },
    mute(c) { c.st.m = !c.st.m; c.say(c.st.m ? 'Muted.' : 'Unmuted.'); },
    off(c) { c.st.f = 88; c.q('.rd').textContent = '--'; c.q('.rs').textContent = ''; },
    pre(c) { const i = +c.arg; c.st.p = c.st.p || {}; if (c.st.p[i] === undefined) { c.st.p[i] = c.st.f ?? 88; c.root.querySelectorAll('.pr')[i].style.background = c.f('pres') ? '#cfd6cf' : '#cde8d0'; c.root.querySelectorAll('.pr')[i].title = String(c.st.p[i]); tn(c, 700, .1, 'sine', .05); if (Object.keys(c.st.p).length >= 3) c.find('preset'); } else { c.st.f = c.st.p[i]; radioShow(c); } },
    wipe(c) { c.st.p = {}; c.root.querySelectorAll('.pr').forEach(e => { e.style.background = c.f('pres') ? '#cfd6cf' : '#fff'; }); }
  }
};

/* 18. The Wishing Well */
ATLAS.bwell = {
  id: 'bwell', name: 'The Wishing Well', url: 'well.example/wish',
  style: ['Depths are written 12 m.', 'Buttons carry words.'],
  note: 'A well that grants nothing and keeps a careful count. The bottom is a long way down, and it is listening.',
  finds: { wish: 'Three wishes granted', voice: 'A voice from the bottom', bucket: 'What the bucket brings up' },
  regions: { coin: 'Drop button', depth: 'Depth readout', rope: 'Rope', echo: 'Echo notice', wish: 'Wish text', stones: 'Coins', lid: 'Lid button', drain: 'Empty-well button' },
  defects: {
    coin: { region: 'coin', cat: 'target', label: 'Drop is a 12 px square', why: W.target },
    depth: { region: 'depth', cat: 'realworld', label: 'Depth shown as “d=0x2A”', why: 'Say 42 m.' },
    rope: { region: 'rope', cat: 'recognition', label: 'The bucket rope is an unlabeled icon', why: 'Show what it is.' },
    echo: { region: 'echo', cat: 'status', label: 'The echo arrives with no sign what caused it', why: W.stat },
    wish: { region: 'wish', cat: 'text', label: 'Wish text in 9 px grey type', why: 'At least 11 px.' },
    stones: { region: 'stones', cat: 'color', label: 'Lucky and unlucky coins differ by colour only', why: W.color },
    lid: { region: 'lid', cat: 'control', label: 'Once the lid is shut it cannot be opened', why: 'Give users a way back.' },
    drain: { region: 'drain', cat: 'prevention', label: '“Empty the well” beside Drop, no confirmation', why: W.prev }
  },
  build: h => `${axRoot(h)}${AXB('a-well', `
    <div style="margin:6px auto;width:120px;height:56px;border-radius:50% 50% 8px 8px / 60% 60% 8px 8px;background:#6a7a8a;position:relative;overflow:hidden"><span data-act="rim" style="position:absolute;inset:0;cursor:pointer"></span><span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:18px">🕳</span></div>
    <p data-region="depth" class="wd" style="${CTR};font:13px monospace;color:#1d2530">${h('depth') ? 'd=0x2A' : 'Depth: 42 m'}</p>
    <div data-region="stones" style="display:flex;gap:8px;justify-content:center;margin:4px">${['Lucky', 'Plain', 'Unlucky'].map((n, i) => `<span data-act="coin" data-arg="${i}" class="wc" style="padding:6px 10px;border-radius:14px;border:1px solid #8a7a5a;background:${h('stones') ? (i === 1 ? '#e0d8c0' : '#d0c8b0') : ['#ffe9a8', '#e8e8e0', '#b8b8c8'][i]};cursor:pointer;font-size:12px;color:#1d2530">${h('stones') ? '●' : n}</span>`).join('')}</div>
    <p style="${CTR}"><span data-region="coin"><button class="m-btn s" data-act="drop" style="${h('coin') ? TB12 : ''}">${h('coin') ? '▢' : 'Drop the coin'}</button></span> <span data-region="rope"><button class="m-btn secondary s" data-act="rope">${h('rope') ? '🪢' : 'Pull the rope'}</button></span>
      <span data-region="lid">${h('lid') ? '<button class="m-btn secondary s" data-act="lid">Shut the lid</button>' : '<button class="m-btn secondary s" data-act="lid">Shut the lid</button> <button class="m-btn secondary s" data-act="open">Open it</button>'}</span> <span data-region="drain">${h('drain') ? '<button class="m-btn danger s" data-act="drain">Empty the well</button>' : '<small>The well fills itself.</small>'}</span></p>
    <p data-region="echo" class="we" style="${CTR};min-height:16px;font-size:12px;color:#1d2530"></p>
    <p data-region="wish" class="ww" style="margin:4px 12px;font:${h('wish') ? '9px' : '12px'} Georgia,serif;font-style:italic;color:${h('wish') ? '#aaa' : '#3a2a15'};min-height:16px"></p>`)}</div>`,
  acts: {
    coin(c) { c.st.k = +c.arg; c.root.querySelectorAll('.wc').forEach((e, k) => { e.style.outline = k === c.st.k ? '2px solid #8f6a2c' : ''; }); tn(c, 500, .06, 'triangle', .04); },
    drop(c) { if (c.st.k === undefined) return c.say('Choose a coin first.'); if (c.st.shut) return c.say('The lid is shut.'); c.st.n = (c.st.n || 0) + 1; tn(c, 900, .12, 'sine', .06); tn(c, 300, .6, 'sine', .04, 120); const W = ['I wish for a quiet harbor.', 'I wish the lamp stayed lit.', 'I wish somebody would ask.']; c.q('.ww').textContent = W[(c.st.n - 1) % 3]; if (!c.f('echo')) c.q('.we').textContent = 'A coin falls. The well echoes it back.'; if (c.st.n >= 3) { c.find('wish'); c.say('Three coins. The well, quietly: “That will do.”'); } },
    rope(c) { c.st.r = (c.st.r || 0) + 1; tn(c, 140, .25, 'sawtooth', .04); if (c.st.r >= 2) { c.find('bucket'); c.say('The bucket comes up with a very old coin and a very new note: “Thank you.”'); } },
    lid(c) { c.st.shut = true; c.q('.we').textContent = ''; tn(c, 90, .3, 'square', .05); },
    open(c) { c.st.shut = false; },
    drain(c) { c.st.n = 0; c.q('.ww').textContent = ''; },
    rim(c) { c.st.v = (c.st.v || 0) + 1; tn(c, 200, .1, 'sine', .04); if (c.st.v >= 3) { c.find('voice'); tn(c, 70, 1, 'sine', .06); c.say('From very far down: “Hello?”'); } }
  }
};

/* 19. The Loom of Weather */
ATLAS.bloom = {
  id: 'bloom', name: 'The Loom of Weather', url: 'loom.example/weave',
  style: ['Rows are numbered 1, 2, 3.', 'Every control has a word.'],
  note: 'Weave rain, sun and wind into cloth. The loom knows the forecast and is not telling.',
  finds: { rainbow: 'Rain, then sun', gale: 'A cloth that blows away', pattern: 'The loom’s own pattern' },
  regions: { threads: 'Threads', rows: 'Row counter', weave: 'Weave button', shuttle: 'Shuttle', cloth: 'Cloth', saved: 'Saved notice', unpick: 'Unpick button', cut: 'Cut-cloth button' },
  defects: {
    threads: { region: 'threads', cat: 'color', label: 'Rain, sun and wind threads differ by colour only', why: W.color },
    rows: { region: 'rows', cat: 'realworld', label: 'Rows counted as “0b101”', why: 'Say 5 rows.' },
    weave: { region: 'weave', cat: 'target', label: 'Weave is a 12 px square', why: W.target },
    shuttle: { region: 'shuttle', cat: 'recognition', label: 'The shuttle is an unlabeled icon', why: 'Show what it is.' },
    cloth: { region: 'cloth', cat: 'contrast', label: 'Pale threads on pale cloth', why: 'Non-text marks need 3 : 1.' },
    saved: { region: 'saved', cat: 'status', label: 'Nothing says the weave was saved', why: W.stat },
    unpick: { region: 'unpick', cat: 'control', label: 'A woven row cannot be unpicked', why: 'Give users a way back.' },
    cut: { region: 'cut', cat: 'prevention', label: '“Cut the cloth” beside Weave, no confirmation', why: W.prev }
  },
  build: h => `${axRoot(h)}${AXB('a-loom', `
    <div data-region="threads" style="display:flex;gap:8px;justify-content:center;margin:6px 0">${['Rain', 'Sun', 'Wind'].map((n, i) => `<span data-act="thread" data-arg="${i}" class="th" style="padding:7px 12px;border-radius:6px;border:1px solid #5a6a7a;background:${h('threads') ? '#b8bec4' : ['#7fb0d8', '#f3d36a', '#c9e0c9'][i]};cursor:pointer;font-size:13px;color:#1d2530">${n}</span>`).join('')}</div>
    <div data-region="cloth" class="cl" style="margin:6px 20px;min-height:44px;padding:4px;border-radius:6px;background:${h('cloth') ? '#e8e8e4' : '#2b3a4a'};display:flex;flex-wrap:wrap;gap:2px"></div>
    <p data-region="rows" class="lr" style="${CTR};font:12px monospace;color:#1d2530">${h('rows') ? 'rows=0b0' : '0 rows'}</p>
    <p style="${CTR}"><span data-region="weave"><button class="m-btn s" data-act="weave" style="${h('weave') ? TB12 : ''}">${h('weave') ? '▢' : 'Weave a row'}</button></span> <span data-region="shuttle"><button class="m-btn secondary s" data-act="shuttle">${h('shuttle') ? '🪡' : 'Shuttle'}</button></span>
      <span data-region="unpick">${h('unpick') ? '' : '<button class="m-btn secondary s" data-act="unpick">Unpick</button>'}</span> <span data-region="cut">${h('cut') ? '<button class="m-btn danger s" data-act="cut">Cut the cloth</button>' : '<small>The cloth cannot be cut.</small>'}</span></p>
    <p data-region="saved" class="ls" style="${CTR};min-height:16px;font-size:12px;color:#1d2530"></p>`)}</div>`,
  acts: {
    thread(c) { c.st.t = +c.arg; c.root.querySelectorAll('.th').forEach((e, k) => { e.style.outline = k === c.st.t ? '2px solid #1d2530' : ''; }); tn(c, 330 + c.st.t * 60, .08, 'triangle', .05); },
    weave(c) { if (c.st.t === undefined) return c.say('Choose a thread first.'); c.st.w = (c.st.w || []).concat(c.st.t); const cols = c.f('threads') ? ['#b8bec4', '#b8bec4', '#b8bec4'] : ['#7fb0d8', '#f3d36a', '#c9e0c9'], clothHi = c.f('cloth') ? '#e0e0dc' : null; const s = document.createElement('span'); s.style.cssText = `width:18px;height:10px;border-radius:2px;background:${clothHi && c.st.t !== 1 ? clothHi : cols[c.st.t]}`; c.q('.cl').appendChild(s); c.q('.lr').textContent = c.f('rows') ? 'rows=0b' + c.st.w.length.toString(2) : c.st.w.length + ' rows'; tn(c, 400 + c.st.t * 90, .15, 'sine', .05); if (!c.f('saved')) c.q('.ls').textContent = 'Row woven and saved.'; const w = c.st.w.slice(-2).join(); if (w === '0,1') { c.find('rainbow'); c.say('Rain, then sun. Something arches over the cloth.'); } if (c.st.w.slice(-4).join() === '2,2,2,2') { c.find('gale'); c.q('.cl').style.transform = 'translateX(40px) rotate(8deg)'; c.say('The cloth lifts off the loom and blows away.'); } if (c.st.w.slice(-4).join() === '1,0,2,1') { c.find('pattern'); c.say('The loom hums. That was its own pattern all along.'); } },
    shuttle(c) { tn(c, 250, .3, 'triangle', .05); c.say('The shuttle crosses and comes back with nothing, which is also a result.'); },
    unpick(c) { c.st.w = (c.st.w || []).slice(0, -1); c.q('.cl').lastChild && c.q('.cl').lastChild.remove(); c.q('.lr').textContent = c.f('rows') ? 'rows=0b' + c.st.w.length.toString(2) : c.st.w.length + ' rows'; },
    cut(c) { c.st.w = []; c.q('.cl').innerHTML = ''; c.q('.lr').textContent = c.f('rows') ? 'rows=0b0' : '0 rows'; }
  }
};

/* 20. The Kite Field */
ATLAS.bkite = {
  id: 'bkite', name: 'The Kite Field', url: 'kite.example/field',
  style: ['Wind is written 8 knots.', 'Every control has a word.'],
  note: 'A field with one kite and a lot of sky. The kite knows more about the wind than you do.',
  finds: { cloud: 'The kite touches a cloud', tail: 'Three knots in the tail', gust: 'A gust takes it sideways' },
  regions: { kite: 'Kite', wind: 'Wind readout', release: 'Release button', string: 'String reel', tail: 'Tail knots', gust: 'Gust notice', reel: 'Reel-in button', cut: 'Cut-string button' },
  defects: {
    kite: { region: 'kite', cat: 'contrast', label: 'A pale kite against a pale sky', why: 'Non-text marks need 3 : 1.' },
    wind: { region: 'wind', cat: 'realworld', label: 'Wind shown as “w=0x08 kn”', why: 'Say 8 knots.' },
    release: { region: 'release', cat: 'target', label: 'Let out string is a 12 px dot', why: W.target },
    string: { region: 'string', cat: 'recognition', label: 'The reel is an unlabeled icon', why: 'Show what it is.' },
    tail: { region: 'tail', cat: 'text', label: 'Knot counter in 9 px type', why: 'At least 11 px.' },
    gust: { region: 'gust', cat: 'status', label: 'A gust moves the kite with no sign why', why: W.stat },
    reel: { region: 'reel', cat: 'control', label: 'The kite cannot be reeled in', why: 'Give users a way back.' },
    cut: { region: 'cut', cat: 'prevention', label: '“Cut the string” beside Let out, no confirmation', why: W.prev }
  },
  build: h => `${axRoot(h)}${AXB('a-kite', `
    <div class="ksky" style="position:relative;height:130px;margin:4px 10px;border-radius:10px;background:${h('kite') ? '#dfe9f2' : 'linear-gradient(#6fa8d8,#bcd8ee)'};overflow:hidden"><span data-region="kite" data-act="kite" class="kk" style="position:absolute;left:46%;bottom:6px;font-size:26px;cursor:pointer;color:${h('kite') ? '#eef2f6' : '#c0392b'};transition:bottom .6s,left .6s">◆</span><span class="kcloud" hidden style="position:absolute;right:20px;top:6px;font-size:22px">☁</span></div>
    <p data-region="wind" class="kw" style="${CTR};font:13px monospace;color:#1d2530">${h('wind') ? 'w=0x08 kn' : 'Wind: 8 knots'}</p>
    <p data-region="tail" class="kt" style="${CTR};font-size:${h('tail') ? 9 : 12}px;color:${h('tail') ? '#aaa' : '#1d2530'}">Knots in the tail: 0</p>
    <p style="${CTR}"><span data-region="release"><button class="m-btn s" data-act="out" style="${h('release') ? TB12 : ''}">${h('release') ? '·' : 'Let out string'}</button></span> <span data-region="string"><button class="m-btn secondary s" data-act="knot">${h('string') ? '🧵' : 'Tie a knot'}</button></span>
      <span data-region="reel">${h('reel') ? '' : '<button class="m-btn secondary s" data-act="in">Reel in</button>'}</span> <span data-region="cut">${h('cut') ? '<button class="m-btn danger s" data-act="cutline">Cut the string</button>' : '<small>The string cannot be cut.</small>'}</span></p>
    <p data-region="gust" class="kg" style="${CTR};min-height:16px;font-size:12px;color:#1d2530"></p>`)}</div>`,
  acts: {
    out(c) { c.st.h = Math.min(5, (c.st.h || 0) + 1); c.q('.kk').style.bottom = (6 + c.st.h * 20) + 'px'; tn(c, 300 + c.st.h * 60, .15, 'sine', .05); if (c.st.h === 3 && !c.st.gu) { c.st.gu = 1; c.q('.kk').style.left = '70%'; if (!c.f('gust')) c.q('.kg').textContent = 'A gust pushes the kite east.'; c.find('gust'); } if (c.st.h >= 5) { c.q('.kcloud').hidden = false; c.find('cloud'); c.say('The kite touches the underside of a cloud.'); } },
    in(c) { c.st.h = Math.max(0, (c.st.h || 0) - 1); c.q('.kk').style.bottom = (6 + c.st.h * 20) + 'px'; c.q('.kk').style.left = '46%'; },
    cutline(c) { c.st.h = 0; c.q('.kk').style.bottom = '6px'; c.q('.kk').style.left = '46%'; },
    knot(c) { c.st.k = (c.st.k || 0) + 1; c.q('.kt').textContent = 'Knots in the tail: ' + c.st.k; tn(c, 520, .08, 'triangle', .05); if (c.st.k >= 3) c.find('tail'); },
    kite(c) { tn(c, 660, .2, 'triangle', .05); c.say('The kite tugs. It would like more string.'); }
  }
};

Object.assign(BRIGADE, ATLAS);
for (const k of ['bfog', 'bcafe', 'bradio', 'bwell', 'bloom', 'bkite']) SHIP_KIND[k] = 'gala';
/* ───────────────────── 11n. Eight more kinds of ship ───────────────────── */
(() => {
  const _ship = Art.ship;
  const wins = (x, y, n, gap, w, h, f = '#27485a') => Array.from({ length: n }, (_, i) => `<rect x="${x + i * gap}" y="${y}" width="${w}" height="${h}" fill="${f}"/><rect x="${x + i * gap}" y="${y}" width="${w}" height="${h}" fill="#ffd98a" style="opacity:var(--lit,0)"/>`).join('');
  const body = (hull, acc, w, h, inset = 10) => `<path d="M0 ${-h}H${w}L${w - inset} 0H${inset}Z" fill="${hull}"/><rect x="3" y="${-h * .45}" width="${w - 6}" height="2.4" fill="${acc}"/>`;
  const NEW = {
    tanker: (r, hull, acc) => body(hull, acc, 106, 12, 8) + [0, 1, 2].map(i => `<ellipse cx="${22 + i * 22}" cy="-17" rx="9" ry="6" fill="#d9dde0" stroke="#7b848a"/><rect x="${13 + i * 22}" y="-17" width="18" height="5" fill="#d9dde0"/>`).join('') + `<line x1="10" y1="-24" x2="82" y2="-24" stroke="#555" stroke-width="1.6"/><rect x="86" y="-34" width="16" height="22" fill="#eee8d8"/>${wins(89, -30, 3, 4.6, 3, 4)}<rect x="94" y="-42" width="5" height="8" fill="${acc}"/>`,
    liner: (r, hull, acc) => body('#f3efe2', acc, 108, 12, 9).replace('M0 -12', 'M0 -12') + `<rect x="6" y="-12" width="96" height="3" fill="${hull}"/><rect x="12" y="-24" width="84" height="12" rx="2" fill="#fbf8ee"/>${wins(16, -21, 12, 6.6, 3.6, 4.4)}<rect x="22" y="-34" width="62" height="10" rx="2" fill="#f3efe2"/>${wins(26, -31, 9, 6.4, 3.2, 4)}<rect x="34" y="-42" width="40" height="8" rx="2" fill="#fbf8ee"/><rect x="40" y="-56" width="9" height="14" fill="${acc}"/><rect x="40" y="-56" width="9" height="3.5" fill="#1b1b1b"/><rect x="58" y="-56" width="9" height="14" fill="${acc}"/><rect x="58" y="-56" width="9" height="3.5" fill="#1b1b1b"/>`,
    hydrofoil: (r, hull, acc) => `<path d="M2 -14H84L76 -5H12Z" fill="${hull}"/><rect x="8" y="-10" width="70" height="2.2" fill="${acc}"/><path d="M28 -14l10-14h26l8 14Z" fill="#e8efe8"/>${wins(36, -25, 4, 7, 5, 6)}<path d="M20 -5l-10 8h24zM64 -5l-6 8h22z" fill="#9aa4ab"/><path d="M-4 3h106" stroke="#fff" stroke-width="1.5" opacity=".6"/>`,
    raft: (r, hull, acc) => [0, 1, 2, 3, 4, 5].map(i => `<rect x="${4 + i * 13}" y="-6" width="12" height="6" rx="3" fill="${i % 2 ? '#a77a45' : '#8f6636'}"/>`).join('') + `<rect x="30" y="-24" width="22" height="18" fill="#c99a4b"/><path d="M28 -24l13-9 13 9Z" fill="${hull}"/><line x1="66" y1="-6" x2="66" y2="-44" stroke="#d8d2c0" stroke-width="2"/><path d="M68 -42 68 -12 86 -12Z" fill="${acc}"/><circle cx="41" cy="-16" r="3" fill="#ffd98a"/>`,
    trawler: (r, hull, acc) => `<path d="M0 -14H72L86 -14L72 0H9Z" fill="${hull}"/><rect x="5" y="-8" width="72" height="2.4" fill="${acc}"/><rect x="42" y="-30" width="20" height="16" fill="#eee8d8"/>${wins(45, -26, 3, 6, 4, 5)}<rect x="48" y="-38" width="7" height="8" fill="${acc}"/><line x1="18" y1="-14" x2="18" y2="-46" stroke="#444" stroke-width="2"/><line x1="18" y1="-44" x2="36" y2="-20" stroke="#444" stroke-width="1.4"/><path d="M66 -14l6 -10 8 10Z" fill="#7c8a8f"/><path d="M80 -14q8 14 -4 22" stroke="#9a9" fill="none" stroke-width="1" stroke-dasharray="2 2"/>`,
    lightship: (r, hull, acc) => `<path d="M0 -12H88L80 0H8Z" fill="#c0392b"/><rect x="4" y="-8" width="80" height="2.6" fill="#fff"/><text x="44" y="-3.5" text-anchor="middle" font-size="4.5" font-family="monospace" fill="#c0392b">HALCYON</text><rect x="38" y="-30" width="14" height="18" fill="#eee8d8"/><line x1="45" y1="-30" x2="45" y2="-60" stroke="#333" stroke-width="2.4"/><circle cx="45" cy="-62" r="4" fill="#ffd98a"/><circle cx="45" cy="-62" r="7" fill="none" stroke="#ffd98a" stroke-width="1" opacity=".6"/>`,
    paddle: (r, hull, acc) => body(hull, acc, 98, 11, 9) + `<circle cx="50" cy="-8" r="13" fill="#6a4a2a" stroke="#2a1a0a" stroke-width="1.5"/>${[0, 45, 90, 135].map(a => `<line x1="50" y1="-8" x2="${50 + 13 * Math.cos(a * Math.PI / 180)}" y2="${-8 + 13 * Math.sin(a * Math.PI / 180)}" stroke="#2a1a0a" stroke-width="1.5"/><line x1="50" y1="-8" x2="${50 - 13 * Math.cos(a * Math.PI / 180)}" y2="${-8 - 13 * Math.sin(a * Math.PI / 180)}" stroke="#2a1a0a" stroke-width="1.5"/>`).join('')}<rect x="20" y="-24" width="62" height="13" rx="2" fill="#efe9d8"/>${wins(25, -21, 8, 7, 4, 5)}<rect x="30" y="-40" width="9" height="16" fill="${acc}"/><rect x="30" y="-40" width="9" height="3.4" fill="#1b1b1b"/>`,
    submarine: (r, hull, acc) => `<ellipse cx="50" cy="-4" rx="46" ry="9" fill="#e0a526"/><rect x="38" y="-24" width="20" height="12" rx="3" fill="#d89b1a"/><line x1="52" y1="-24" x2="52" y2="-36" stroke="#444" stroke-width="2"/><line x1="52" y1="-36" x2="60" y2="-36" stroke="#444" stroke-width="2"/>${[0, 1, 2, 3].map(i => `<circle cx="${22 + i * 14}" cy="-5" r="2.6" fill="#27485a"/><circle cx="${22 + i * 14}" cy="-5" r="2.6" fill="#ffd98a" style="opacity:var(--lit,0)"/>`).join('')}<path d="M4 -6l-6-6v12zM94 -4l8-6v14z" fill="#b98a14"/>`
  };
  Art.ship = function (kind, seed) {
    const D = NEW[kind]; if (!D) return _ship.call(this, kind, seed);
    const r = rng(seed), hulls = ['#7b2d26', '#1f4a5c', '#2f5d3a', '#3b3f6b', '#8a5a1f', '#2a2f38'], hull = hulls[Math.floor(r() * hulls.length)], acc = ['#f4c363', '#e8e1c8', '#e4573d', '#5fc4b0'][Math.floor(r() * 4)];
    const sc = { tanker: .93, liner: .92, submarine: .97, lightship: .86 }[kind];
    const art = sc ? `<g transform="scale(${sc})">${D(r, hull, acc)}</g>` : D(r, hull, acc);
    return art + `<line x1="6" y1="-12" x2="6" y2="-33" stroke="#ccc" stroke-width="1.4" opacity="${kind === 'submarine' || kind === 'lightship' ? 0 : 1}"/>`;
  };
})();

/* ───────────────────── 11. Simulation data: consequences ───────────────────── */
// How badly one fault hurts real people once the ship is allowed into the harbor.
const SEV = { contrast: 1, color: 1, text: 1, target: 1, keyboard: 1, status: 1, realworld: 1, control: 2, consistency: 1, prevention: 2, recognition: 1, flexibility: 1, minimal: 1, errors: 1 };

const STORY = {
  contrast: (n, a) => `${n} squinted at pale text on ${a} and gave up reading it.`,
  color: (n, a) => `${n} could not tell the options apart on ${a} and picked the wrong one.`,
  text: (n, a) => `${n} could not make out the small print on ${a}.`,
  target: (n, a) => `${n} missed the tiny button on ${a} four times in a row.`,
  keyboard: (n, a) => `${n} pressed Tab through ${a} and landed somewhere unexpected.`,
  status: (n, a) => `${n} stared at ${a}, unsure whether anything was happening.`,
  realworld: (n, a) => `${n} did not understand the wording on ${a}.`,
  control: (n, a) => `${n} found no way back on ${a}.`,
  consistency: (n, a) => `${n} was thrown by ${a}, which names things differently from everything else.`,
  prevention: (n, a) => `${n} lost something on ${a} with no warning at all.`,
  recognition: (n, a) => `${n} had to remember details that ${a} should have shown.`,
  flexibility: (n, a) => `${n} changed the options on ${a} and could not get back to normal.`,
  minimal: (n, a) => `${n} drowned in choices on ${a}.`,
  errors: (n, a) => `${n} got an error on ${a} that explained nothing.`
};
const firstName = who => String(who).split(',')[0];

const SHOP = [
  { id: 'loupe', name: 'Brass loupe', cost: 40, desc: 'Every probe costs half the time.' },
  { id: 'hourglass', name: 'Spare hourglass', cost: 60, desc: '+30 seconds on the shift clock every day, for the rest of your career.' },
  { id: 'mara', name: 'Mara’s second opinion', cost: 55, desc: 'Once per shift, your colleague counts the faults on the ship at your quay.' },
  { id: 'apprentice', name: 'An apprentice', cost: 70, desc: 'Once per shift, send them to handle the ship at your quay. They are right 3 times in 4.' },
  { id: 'cheat', name: 'Cheat sheet', cost: 45, desc: 'Tells you how many faults each ship has. Each peek costs 1 trust: people notice you are not looking.' },
  { id: 'tea', name: 'Flask of strong tea', cost: 20, desc: '+25 seconds on tomorrow’s shift clock only.', consumable: true }
];

const EVENTS = [
  { id: 'envelope', minDay: 2, icon: 'envelope', title: 'An envelope under the glass',
    text: 'Before the next ship ties up, a designer from a rival studio slides a sealed envelope through the gap. “A thank-you for your time. No need to open it here.” You can feel banknotes inside.',
    choices: [
      { label: 'Take the envelope', hint: '+35 cr. The Inspector General audits on Day 5.', run: g => { g.meter({ funds: 35 }); g.bribes++; Sfx.coin(); return 'The envelope vanishes into your coat. Someone saw.'; } },
      { label: 'Slide it back', hint: '+2 public trust.', run: g => { g.meter({ trust: 2 }); return 'Word gets around the quay that you cannot be bought.'; } }
    ] },
  { id: 'rush', minDay: 2, icon: 'phone', title: 'The Harbor Master on the line',
    text: '“Flow is crawling, Inspector. Fast-track the next three ships and there is a 20 cr bonus in it for you.”',
    choices: [
      { label: 'Fast-track', hint: '+20 cr, +8 flow. The next 3 reviews are 12 s shorter.', run: g => { g.shiftLeft = Math.max(10, g.shiftLeft - 20); g.meter({ funds: 20, flow: 8 }); return 'You agree. The clock will be tighter for a while.'; } },
      { label: 'Hold the line', hint: '−4 flow, +2 trust.', run: g => { g.meter({ flow: -4, trust: 2 }); return 'You keep your pace. The tower grumbles.'; } }
    ] },
  { id: 'press', minDay: 3, icon: 'press', title: 'A reporter at the window',
    when: g => g.qN >= 3,
    text: 'A reporter from the Halcyon Gazette leans on the sill. “Are the new interfaces leaving this port safe and usable for everyone? One sentence, please.”',
    choices: [
      { label: 'Tell the plain truth', hint: 'Believed if your record is good. Costly if it is not.', run: g => { const a = g.qSum / Math.max(1, g.qN); if (a >= .75) { g.meter({ trust: 4 }); return 'Your record backs you up. Readers believe you.'; } g.meter({ trust: -4 }); return 'The truth is unflattering. Trust dips.'; } },
      { label: 'Reassure them', hint: 'Works unless faulty ships have been slipping through.', run: g => { if (g.flawedApproved >= 2) { g.meter({ trust: -6 }); return 'A stranded user contradicts you in print. Ouch.'; } g.meter({ trust: 3 }); return 'The reassurance lands well.'; } }
    ] },
  { id: 'quota', minDay: 3, icon: 'phone', title: 'The tower raises the quota',
    when: g => !g.training && g.processed >= g.quota - 1,
    text: '“Two more by closing bell, Inspector. The council is watching the numbers.” A 20 cr bonus is mentioned, in a tone that suggests refusing would be noticed.',
    choices: [
      { label: 'Accept two more ships', run: g => { g.quota += 2; g.meter({ funds: 20 }); return 'The quota ticks up on the board.'; } },
      { label: 'Say the quay cannot take it', run: g => { g.meter({ flow: -2, trust: 1 }); return 'The tower goes quiet.'; } }
    ] },
  { id: 'overtime', minDay: 3, icon: 'papers', title: 'Mara has a fever',
    text: '“Mara is out sick,” the supervisor says, setting a stack on your desk. “Two more ships need a look today. There is 20 cr for the extra hours.”',
    choices: [
      { label: 'Cover her ships', hint: '+20 cr. Two extra ships join today’s queue.', run: g => { g.addShips(2); g.meter({ funds: 20 }); return 'Two more ships join the queue.'; } },
      { label: 'Stick to your quota', hint: '−2 flow. The extra ships wait.', run: g => { g.meter({ flow: -2 }); return 'Mara’s ships wait their turn.'; } }
    ] },
  { id: 'storm', minDay: 4, icon: 'lamp', title: 'Thunder over the harbor',
    text: 'The booth lamp is flickering. A boy at the door offers lamp oil for 15 cr. Without it you will be working in the dim.',
    choices: [
      { label: 'Buy the oil (15 cr)', hint: 'The lamp burns steady all shift.', run: g => { g.meter({ funds: -15 }); return 'The lamp steadies.'; } },
      { label: 'Squint through it', hint: 'Free, but every review is 6 s shorter today.', run: g => { g.shiftLeft = Math.max(10, g.shiftLeft - 25); return 'You work by the light of the monitor.'; } }
    ] }
];

const ENDINGS = {
  fired: { title: 'Seal returned', tone: 'bad', text: 'Three warnings from the Harbor Master and your inspector’s seal is taken back. Port Halcyon carries on without you, and ships slip through on a hurried glance. Perhaps the next inspector will read the rulebook twice.' },
  closed: { title: 'The harbor closes', tone: 'bad', text: 'Public trust has run dry. Users abandon what leaves this port and the council shuts the berths until an inquiry is done. Your name is in the report.' },
  gridlock: { title: 'Gridlock at the quay', tone: 'bad', text: 'Too many ships turned away and too many left waiting. Cargo rots, studios leave for other harbors, and the Harbor Master closes your office to save the season.' },
  bankrupt: { title: 'Debtors’ row', tone: 'bad', text: 'The rent went unpaid too long. Your room above the chandlery is let to someone else, and your stamp goes back in its drawer.' },
  caught: { title: 'The audit', tone: 'bad', text: 'At the end of the last tide the Inspector General opens your ledger. An envelope, and faulty ships stamped “clear” around the same time. Your seal is revoked and the case is passed to the council.' },
  keeper: { title: 'Keeper of the light', tone: 'good', text: 'Few faults slipped through, the quay kept moving and nobody could say you were anything but fair. Users in Port Halcyon use what you cleared without noticing, which is the best compliment an inspector can get.' },
  warden: { title: 'The strict warden', tone: 'good', text: 'Users trust what comes out of this port, but the quay is slow and the studios mutter about you in the tavern. You kept people safe. Next time, try balancing rigor with speed.' },
  stamp: { title: 'The rubber stamp', tone: 'meh', text: 'Ships flow through Port Halcyon faster than ever, and so do the complaints. The council is pleased with the numbers and the users are not. Speed is not the job.' },
  steady: { title: 'A steady hand', tone: 'good', text: 'You did the job: some mistakes, some good catches, a fair record. Port Halcyon is a little better for having you in the booth.' }
};

/* ───────────────────── 12. Game ───────────────────── */
EVENTS.push(...BRIG_EVENTS);
Object.assign(ENDINGS, BRIG_ENDINGS);

class Game {
  constructor() {
    this.maxDays = DAYS.length;
    this.maxCitations = 3;
    this.training = false;
    this.mode = 'title';
    this.current = null;
    this.toastTimer = null;
    this.lastTick = performance.now();
    this.modal = $('#modal');
    this.scene = new Harbor($('#scene'));
    this.auditor = new Auditor(this);
    this.resetRun();
    $('#crest').innerHTML = Art.crest();
    $('#g-trust').innerHTML = Art.gauge();
    $('#g-flow').innerHTML = Art.gauge();
    this.buildRulebook();
    this.applyTools();
    this.bind();
    this.renderBoard();
    this.renderTimer();
    setInterval(() => this.tick(), 100);
    this.showTitle();
  }

  resetRun() {
    Object.assign(this, {
      day: 0, funds: 30, trust: 60, flow: 60, citations: 0, rescues: 0, dayCited: false, qSum: 0, qN: 0,
      upgrades: new Set(), bribes: 0, flawedApproved: 0, cleanTurned: 0, goodCalls: 0,
      seen: new Set(), pending: [], dayRecords: [], weak: {}, maraLeft: 0, evToday: 0,
      fx: { hungry: false, dim: false, tea: false, rush: 0, chat: 0, gift: 0 },
      studio: {}, apprLeft: 0, barn: { seen: 0, last: null, rej: 0, app: 0 },
      clockScale: 1, shiftLeft: 0, shiftTotal: 0, shipStart: 0, shipSpent: 0, nextNo: 0,
      nb: [], gallery: {}, galleryDone: [], wonder: 0, referred: 0, kitHelped: null, maraTold: false, memoCopy: false, pier: null, forged: 0, loreN: 0, exempt: false,
      brig: 0, brigSeen: 0, pact: false, reported: false, knowsBrig: false, brigStats: { app: 0, rej: 0 }, popups: 0,
      yesterday: null, rumored: false, swift: false, queue: [], quota: 0, processed: 0, factory: null, current: null, eve: { oil: true, food: true }
    });
  }

  canInspect() { return this.mode === 'inspecting'; }
  accuracy() { return this.qN ? this.qSum / this.qN : null; }
  reviewTime() {
    let t = this.day <= 7 ? 80 - 5 * (this.day - 1) : 50 - 1.5 * (this.day - 7);
    if (this.fx.hungry) t -= 8;
    if (this.fx.dim) t -= 6;
    if (this.swift && this.day === 7) t -= 10;
    t -= this.fx.chat || 0;
    if (this.brig >= 2) t += 5;
    return Math.max(25, t);
  }

  /* ----- static UI ----- */
  buildRulebook() {
    const host = $('#rulebook-list');
    host.innerHTML = '';
    const act = activeCats(Math.max(this.day, 0));
    if (!act.size) { host.innerHTML = '<p class="hint">No orders yet. They arrive with the first morning notice.</p>'; return; }
    for (const [group, label] of [['Accessibility', 'Accessibility'], ['Usability', 'Usability heuristics']]) {
      const cats = CATEGORIES.filter(c => c.group === group && act.has(c.id)).sort((x, y) => introDay(x.id) - introDay(y.id));
      if (!cats.length) continue;
      const sec = document.createElement('section');
      sec.className = 'rb-group';
      sec.innerHTML = `<h3>${label}</h3>` + cats.map(c =>
        `<details class="rule"${introDay(c.id) === this.day ? ' open' : ''}><summary>${esc(c.name)}${introDay(c.id) === this.day ? '<span class="newtag">New</span>' : ''}</summary><div class="body"><p>${esc(c.rule)}</p><p class="src">In force since day ${introDay(c.id)} · ${esc(c.src)}</p></div></details>`).join('');
      host.appendChild(sec);
    }
  }

  toolOn(id) { return this.day >= (TOOL_DAY[id] || 1); }

  applyTools() {
    for (const id of Object.keys(TOOL_DAY)) {
      const b = $(`#tool-${id}`), small = b.querySelector('small');
      if (!small.dataset.orig) small.dataset.orig = small.textContent;
      const on = this.toolOn(id);
      b.disabled = !on;
      small.textContent = on ? (this.upgrades.has('loupe') ? small.dataset.orig.replace(/−(\d) s/g,(m,n)=>'−'+Math.max(1,Math.round(n/2))+' s')+' · loupe' : small.dataset.orig) : `not issued until day ${TOOL_DAY[id]}`;
    }
    const act = activeCats(this.day);
    $$('#pop-cats .cat').forEach(b => { b.hidden = !act.has(b.dataset.cat); });
    $$('#pop-cats fieldset').forEach(f => { f.hidden = !$$('.cat', f).some(b => !b.hidden); });
  }

  bind() {
    const tabs = ['#rb-tab-dos', '#rb-tab-heur', '#rb-tab-cheat', '#rb-tab-note'].map(s => $(s));
    const panels = ['#p-dos', '#p-heur', '#p-cheat', '#p-note'].map(s => $(s));
    const select = i => tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; panels[j].hidden = i !== j; });
    this.showTab = select;
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { select(i); Sfx.paper(); if (i === 1 || i === 3) t.classList.remove('flash'); });
      t.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; select(n); tabs[n].focus(); }
      });
    });

    $('#btn-approve').addEventListener('click', () => this.decide('approve'));
    $('#btn-reject').addEventListener('click', () => this.decide('reject'));
    $('#btn-textsize').addEventListener('click', e => {
      const on = document.body.classList.toggle('large');
      e.currentTarget.setAttribute('aria-pressed', String(on));
    });
    $('#btn-sound').addEventListener('click', e => {
      Sfx.init();
      const on = !Sfx.on; Sfx.setOn(on);
      e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.textContent = on ? 'Sound on' : 'Sound off';
    });
    $('#btn-mara').addEventListener('click', () => this.askMara());
    $('#btn-leave').addEventListener('click', () => this.leaveEarly());
    $('#btn-appr').addEventListener('click', () => this.askApprentice());
    const unlock = () => Sfx.init();
    document.addEventListener('pointerdown', unlock); document.addEventListener('keydown', unlock);

    this.modal.addEventListener('cancel', e => e.preventDefault());

    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Escape') { this.auditor.closePop(); return; }
      if (e.target.matches && e.target.matches('input,select,textarea')) return;
      if (this.mode !== 'inspecting' || this.modal.open || !this.auditor.pop.hidden) return;
      switch (e.key.toLowerCase()) {
        case '1': this.auditor.setTool('flag'); break;
        case '2': if (this.toolOn('contrast')) this.auditor.setTool('contrast'); break;
        case '3': if (this.toolOn('ruler')) this.auditor.setTool('ruler'); break;
        case '4': if (this.toolOn('tab')) this.auditor.toggleTab(); break;
        case '5': if (this.toolOn('cvd')) this.auditor.cycleCvd(); break;
        case '6': if (this.toolOn('hand')) this.auditor.setTool('hand'); break;
        case 'a': this.decide('approve'); break;
        case 'x': this.decide('reject'); break;
        default: break;
      }
    });
  }

  toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ----- board ----- */
  float(sel, v, unit) {
    const s = document.createElement('span');
    s.className = 'delta ' + (v > 0 ? 'up' : 'down');
    s.textContent = (v > 0 ? '+' : '−') + Math.abs(v) + unit;
    $(sel).appendChild(s);
    setTimeout(() => s.remove(), 1700);
  }

  meter(d) {
    if (d.funds) { this.funds += d.funds; this.float('#dial-funds', d.funds, ' cr'); }
    for (const k of ['trust', 'flow']) {
      if (!d[k]) continue;
      const n = clamp(this[k] + Math.round(d[k]), 0, 100), real = n - this[k];
      this[k] = n;
      if (real) this.float(`#dial-${k}`, real, '');
    }
    this.renderBoard();
  }

  renderBoard() {
    $('#hud-day').textContent = this.day ? `Day ${this.day} of ${this.maxDays}` : 'Day –';
    $('#hud-funds').textContent = `${this.funds} cr`;
    $('#hud-funds-sub').textContent = this.funds < 0 ? 'in debt' : 'your savings';
    $('#hud-funds').style.color = this.funds < 0 ? '#ff8a76' : '';
    for (const k of ['trust', 'flow']) {
      $(`#g-${k} .needle`).style.transform = `rotate(${-90 + 1.8 * this[k]}deg)`;
      $(`#hud-${k}`).textContent = `${this[k]} / 100`;
    }
    $$('#hud-cites i').forEach((l, i) => l.classList.toggle('on', i < this.citations));
    $('#hud-cites').setAttribute('aria-label', `${this.citations} of ${this.maxCitations} warnings`);
    const a = this.accuracy();
    $('#hud-acc').textContent = a === null ? 'accuracy –' : `accuracy ${Math.round(a * 100)}%`;
    document.body.classList.toggle('brig-hostile', this.brig <= -2);
    { const lb = $('#btn-leave'); if (lb) { const can = this.canLeave(); lb.hidden = !(['inspecting', 'waiting'].includes(this.mode) && !this.endless && !this.training && this.day > 0); lb.disabled = !can; lb.title = can ? 'End the shift now. Unused time is not paid.' : `Cover the quota first (${this.processed} of ${this.quota}).`; lb.textContent = can ? 'Clock out early' : `Clock out (${this.processed}/${this.quota})`; } }
    $('#hud-quota').textContent = `${this.processed} / ${this.quota}`;
    $('#quota-bar').value = this.quota ? Math.min(1, this.processed / this.quota) : 0;
    $('#dial-quota').classList.toggle('met', this.quota > 0 && this.processed >= this.quota);
  }

  renderTimer() {
    const out = $('#hud-timer'), arc = $('#timer-arc'), dial = $('#dial-timer');
    if (!['inspecting', 'event', 'stamping', 'waiting'].includes(this.mode) && !(this.mode === 'briefing' && this.shiftTotal && this.processed)) { out.textContent = '–'; arc.style.strokeDashoffset = '0'; dial.classList.remove('low'); return; }
    if (this.training) { out.textContent = '∞'; arc.style.strokeDashoffset = '0'; dial.classList.remove('low'); return; }
    out.textContent = fmtTime(Math.max(0, this.shiftLeft));
    const f = clamp(this.shiftLeft / Math.max(1, this.shiftTotal), 0, 1);
    arc.style.strokeDashoffset = String(163.4 * (1 - f));
    dial.classList.toggle('low', f < .15);
  }

  tick() {
    const now = performance.now(), dt = (now - this.lastTick) / 1000;
    this.lastTick = now;
    if (this.mode !== 'inspecting' || this.training) return;
    this.shiftLeft -= Math.min(dt, .5) * (this.clockScale || 1);
    this.renderTimer(); this.maybePopup();
    this._skyT = (this._skyT || 0) + dt;
    if (this._skyT > 6) { this._skyT = 0; this.scene.skyTo(clamp(1 - this.shiftLeft / Math.max(1, this.shiftTotal), .05, 1), 6000); }
    if (this.shiftLeft <= 0) this.clockOut();
    else if (this.shiftLeft <= 10 && Math.ceil(this.shiftLeft) !== this._lastSec) { this._lastSec = Math.ceil(this.shiftLeft); Sfx.tick(); }
  }

  clockOut() {
    if (this.mode !== 'inspecting') return;
    const sub = this.current;
    this.mode = 'stamping';
    this.setStamps(false); this.auditor.closePop(); this.clearPopups();
    this.toast('The closing bell rings. The ship at your quay will have to wait for tomorrow.');
    Sfx.horn();
    if (sub) this.scene.leave(sub.no, 'drift');
    this.current = null;
    setTimeout(() => this.endDay(), 1600);
  }

  spend(s) {
    if (this.training || this.mode !== 'inspecting') return;
    if (this.upgrades.has('loupe')) s = Math.max(1, Math.round(s / 2));
    if (!s) return;
    this.shiftLeft = Math.max(0, this.shiftLeft - s);
    this.shipSpent += s;
    this.renderTimer();
    Sfx.tick();
  }

  setStamps(on) { $('#btn-approve').disabled = !on; $('#btn-reject').disabled = !on; }

  /* ----- dialogs ----- */
  showModal(html, actions, opts = {}) {
    this.modal.className = opts.dialog || '';
    $('#sheet').className = 'sheet ' + (opts.sheet || '');
    $('#modal-body').innerHTML = html;
    const bar = $('#modal-actions');
    bar.className = opts.stacked ? 'actions choices' : 'actions';
    bar.innerHTML = '';
    actions.forEach(a => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn' + (a.primary ? ' primary' : '');
      b.innerHTML = esc(a.label);
      if (a.primary) b.dataset.primary = '1';
      if (a.disabled) b.disabled = true;
      b.addEventListener('click', a.onClick);
      bar.appendChild(b);
    });
    if (!this.modal.open) this.modal.showModal();
    $('#sheet').scrollTop = 0;
    (bar.querySelector('[data-primary]') || bar.querySelector('button:not(:disabled)'))?.focus({ preventScroll: true });
  }
  closeModal() { if (this.modal.open) this.modal.close(); }

  /* ----- flow ----- */
  showTitle() {
    this.mode = 'title';
    this.scene.setSky(.12); this.scene.setWeather(0);
    const best = Store.best();
    this.showModal(`
      <div class="head">${Art.crest()}<div><p class="eyebrow">Office of Interface Soundness</p><h2 id="modal-title">Port Halcyon needs a berth inspector</h2></div></div>
      <figure class="pic wide">${Art.news('berthoffice')}</figure>
      <p>Every screen bound for the public ties up at your quay. <b>Clear the berth</b> or <b>turn it back</b>.</p>
      <ul class="icons">
        <li>${Art.ruleIcon('target')}<span><b>Cite faults</b> by clicking them, then stamp.</span></li>
        <li>${Art.ruleIcon('flexibility')}<span><b>New orders arrive each morning.</b> Only faults against orders in force count.</span></li>
        <li>${Art.ruleIcon('prevention')}<span><b>Choices carry over:</b> to users, harbor traffic and your purse.</span></li>
      </ul>
      <label class="opt"><input type="checkbox" id="opt-training"> Training mode: no clock, no time costs</label>
      ${best ? `<p class="muted">Best career score here: <b>${best}</b></p>` : ''}`,
      [{ label: 'Take the booth', primary: true, onClick: () => { this.training = $('#opt-training').checked; Sfx.init(); this.closeModal(); this.startShift(); } }]);
  }

    startShift() { this.resetRun(); this.day = 1; this.beginDay(); }

  queueData(sub) { return { no: sub.no, kind: SHIP_KIND[sub.tpl.id] || 'ferry', seed: sub.designer + sub.no }; }

  beginDay() {
    const cfg = DAYS[this.day - 1];
    const base = [3, 4, 5, 6, 6, 8, 9, 9, 10, 10, 11, 11, 12, 12][this.day - 1] || 12 + (this.ngp ? 2 : 0);
    const adj = this.day === 1 ? 0 : this.flow >= 70 ? 1 : this.flow < 35 ? -1 : 0;
    const swiftBump = this.swift && this.day === 7 ? 2 : 0;
    const prevQ = this.quota || 0;
    this.quota = Math.max(3, base + adj + swiftBump);
    this.quotaNote = this.day === 1 ? '' : adj > 0 ? 'The tower sees the quay flowing and asks for more.' : adj < 0 ? 'The quay is clogged, so the tower eases the quota.' : '';
    this.quotaDelta = prevQ ? this.quota - prevQ : 0;
    this.processed = 0; this.evToday = 0;
    this.factory = new SubmissionFactory(this.day);
    this.queue = Array.from({ length: this.quota }, (_, i) => this.factory.create(this.day * 100 + i + 1));
    (TROLL_PLAN[this.day] || []).forEach(lv => {
      const idx = this.queue.map((s, i) => i).filter(i => i > 0 && !this.queue[i].troll);
      if (idx.length) { const i = pick(idx); this.queue[i] = this.factory.createTroll(this.queue[i].no, lv); }
    });
    for (let n = 0; n < (BRIG_PLAN[this.day] || 0); n++) {
      const idx = this.queue.map((s, i) => i).filter(i => i > 0 && !this.queue[i].troll && !this.queue[i].brig);
      if (idx.length) { const i = pick(idx); this.queue[i] = this.factory.createBrigade(this.queue[i].no); }
    }
    for (let n = 0; n < (BRIG_CLEAN[this.day] || 0); n++) {
      const idx = this.queue.map((s, i) => i).filter(i => i > 0 && !this.queue[i].troll && !this.queue[i].brig);
      if (idx.length) { const i = pick(idx); this.queue[i] = this.factory.createBrigade(this.queue[i].no, true); }
    }
    if (this.day >= 2) {
      const names = Object.keys(this.studio).filter(k => this.studio[k].good > 0 || this.studio[k].wrong > 0);
      shuffle(names).slice(0, 2).forEach(nm => {
        const idx = this.queue.map((s, i) => i).filter(i => i > 0 && !this.queue[i].troll && !this.queue[i].brig && !this.queue[i].studioNote);
        if (!idx.length) return;
        const i = pick(idx), st = this.studio[nm], grudge = st.wrong > 0;
        if (grudge) st.wrong--; else st.good--;
        this.queue[i] = this.factory.create(this.queue[i].no, grudge ? { designer: nm, extra: 1, clean: 0, note: 'grudge' } : { designer: nm, maxD: 1, clean: .5, note: 'improved' });
      });
    }
    if (this.brig <= -2) {
      const idx = this.queue.map((s, i) => i).filter(i => i > 0 && !this.queue[i].troll && !this.queue[i].brig);
      if (idx.length) this.queue[pick(idx)].graffiti = true;
    }
    if (this.brig >= 2) this.fx.gift = 8;
    this.apprLeft = this.upgrades.has('apprentice') ? 1 : 0;
    this.nextNo = this.day * 100 + this.quota + 1;
    this.shiftTotal = this.shiftLeft = this.training ? 0 : Math.round(this.quota * this.reviewTime() * .45 + 20) + (this.upgrades.has('hourglass') ? 30 : 0) + (this.fx.tea ? 25 : 0);
    this.dayRecords = [];
    this.current = null;
    this.maraLeft = this.upgrades.has('mara') ? 1 : 0;
    this.auditor.clear();
    this.buildRulebook(); this.applyTools();
    $('#rb-tab-heur').classList.add('flash');
    $('#mock-wrap').classList.add('idle');
    $('#mock-url').textContent = 'no ship at the quay';
    $('#stamp-mark').classList.remove('show');
    this.renderMara();
    this.scene.setQueue(this.queue.map(s => this.queueData(s)));
    this.scene.setWeather(this.day); Sfx.setWeather(WEATHER[this.day] || '');
    this.scene.skyTo(.02, 1800);
    this.setStamps(false);
    this.updatePlate();
    this.renderBoard(); this.renderTimer();
    if (this.day === 7) { this.swift = this.trust < 55 || this.flow < 35; if (!this.swift) this.meter({ trust: 3 }); }
    this.showNewspaper(() => this.showBriefing(cfg));
  }

  showNewspaper(next) {
    this.mode = 'briefing';
    Sfx.paper();
    const n = NEWS[this.day](this);
    const bx = BRIG_NEWS[this.day] && BRIG_NEWS[this.day](this);
    if (LORE_NEWS_NOTES[this.day]) LORE_NEWS_NOTES[this.day](this);
    if (bx) { n.side = [bx, ...n.side].slice(0, 2); }
    let whisper = '';
    if (this.bribes > 0 && !this.rumored && this.day > 2) { this.rumored = true; this.meter({ trust: -2 }); whisper = 'Whispers on the quay say someone at the Berth Office is taking envelopes. (Trust −2)'; }
    const y = this.yesterday && this.yesterday[0];
    const art = s => `<article class="nitem"><figure class="pic">${Art.news(s.img)}</figure><h4>${esc(s.h)}</h4><p>${esc(s.p)}</p></article>`;
    this.showModal(`
      <div class="mast"><b>The Halcyon Gazette</b><span>Morning edition · Day ${this.day} · ${esc(n.weather[0])}, ${esc(n.weather[1])}</span></div>
      <div class="news-grid">
        <article class="lead"><figure class="pic">${Art.news(n.lead.img)}</figure><h3>${esc(n.lead.h)}</h3><p>${esc(n.lead.p)}</p></article>
        <div class="side">${n.side.map(art).join('')}
          ${y ? `<aside class="box"><h4>Yesterday at your quay</h4><p><b>${esc(y.h)}.</b> ${esc(y.p)}</p></aside>` : ''}
          ${whisper ? `<aside class="box warn"><h4>Whispers</h4><p>${esc(whisper)}</p></aside>` : ''}
          <aside class="ad">${esc(n.ad)}</aside>
        </div>
      </div>`,
      [{ label: 'Read the order of the day', primary: true, onClick: next }], { dialog: 'wide', sheet: 'paperfront news' });
  }

  updatePlate() {
    const waiting = this.queue.length;
    $('#shipplate').textContent = this.current ? `Berth 1 · MV ${this.current.tpl.name} · ${waiting} waiting` : `Berth 1 · empty · ${waiting} waiting`;
    $('#queue-sr').textContent = `${waiting} ships waiting offshore.`;
  }

  showBriefing(cfg) {
    this.mode = 'briefing';
    const before = new Set(poolFor(this.day - 1 || 0).map(t => t.id));
    const fresh = poolFor(this.day).filter(t => !before.has(t.id)).map(t => t.name);
    const newTools = Object.entries(TOOL_DAY).filter(([, d]) => d === this.day && this.day > 1).map(([id]) => id);
    const morning = [this.fx.hungry && 'Hungry: a shorter shift', this.fx.dim && 'Dim booth: a shorter shift', this.fx.tea && 'Tea: +25 s', this.swift && this.day === 7 && 'Swift Clearance: a shorter shift'].filter(Boolean);
    const inForce = activeCats(this.day).size;
    const perks = [this.upgrades.has('hourglass') && 'Hourglass: +30 s', this.upgrades.has('loupe') && 'Loupe: cheaper probes', this.upgrades.has('mara') && 'Mara on call', this.upgrades.has('apprentice') && 'Apprentice on call', this.upgrades.has('cheat') && 'Cheat sheet'].filter(Boolean);
    this.showModal(`
      <p class="eyebrow">Order of the day · Day ${this.day} of ${this.maxDays}</p>
      <h2 id="modal-title">${esc(cfg.title)}</h2>
      <p class="quote">${esc(cfg.bulletin)}</p>
      <h3>${cfg.rules.length ? 'New in force' : 'No new orders'}</h3>
      ${cfg.focus ? `<p class="note">Spotlight today: ${cfg.focus.map(c => esc(CAT[c].name)).join(', ')}.</p>` : ''}
      <div class="cards">${cfg.rules.map(id => `<div class="card"><span class="ic">${Art.ruleIcon(id)}</span><span><b>${esc(CAT[id].name)}</b><small>${esc(RULE_SHORT[id])}</small></span></div>`).join('')}</div>
      ${newTools.length ? `<h3>New instruments</h3><div class="cards dark">${newTools.map(id => `<div class="card"><span class="ic">${Art.toolIcon(id)}</span><span><b>${esc(TOOL_NAME[id])}</b></span></div>`).join('')}</div>` : ''}
      <p class="note">${this.training ? `Training: no clock. Clear ${this.quota} ships.` : `The bell rings when the shift clock runs out. Clear at least ${this.quota} ships. Every ship beyond quota is paid 5 cr extra, and every one short costs you. ${this.quotaNote}`}</p>
      <div class="chips">
        <span class="chip ${this.quotaDelta > 0 ? 'down' : this.quotaDelta < 0 ? 'up' : ''}">quota ${this.quota}${this.quotaDelta ? ` (${this.quotaDelta > 0 ? '+' : '−'}${Math.abs(this.quotaDelta)})` : ''}</span>
        <span class="chip">${this.training ? 'no clock' : 'shift ' + fmtTime(this.shiftTotal)}</span>
        <span class="chip">up to ${cfg.maxDefects} fault${cfg.maxDefects > 1 ? 's' : ''}</span>
        <span class="chip">${inForce} order${inForce > 1 ? 's' : ''} in force</span>
        ${cfg.focus ? '<span class="chip down">spotlight</span>' : ''}
        ${morning.map(m => `<span class="chip down">${esc(m)}</span>`).join('')}
        ${perks.map(m => `<span class="chip up">${esc(m)}</span>`).join('')}
      </div>`,
      [{ label: 'Open the booth', primary: true, onClick: () => { this.closeModal(); Sfx.bell(); this.nextSubmission(); } }], { sheet: 'telegram order' });
  }

  maybeEvent() {
    if (this.day < 2) return false;
    if (this.evToday >= (this.day >= 4 ? 2 : 1)) return false;
    const elig = EVENTS.filter(e => e.minDay <= this.day && !this.seen.has(e.id) && (!e.when || e.when(this)));
    if (!elig.length || this.processed === 0) return false;
    const force = this.processed >= Math.ceil(this.quota / 2) && this.evToday === 0;
    if (!force && !elig.some(e => e.pin && e.minDay === this.day) && Math.random() > .35) return false;
    const bel = elig.filter(e => e.brig).sort((a, b) => a.minDay - b.minDay);
    const pinned = elig.find(e => e.pin && e.minDay === this.day);
    const ev = pinned || (bel.length && Math.random() < .85 ? bel[0] : pick(elig));
    this.seen.add(ev.id); this.evToday++;
    this.showEvent(ev);
    return true;
  }

  showEvent(ev) {
    this.mode = 'event';
    Sfx.bell();
    this.showModal(`<div class="head">${Art.icon(ev.icon)}<div><p class="eyebrow">Something at the window</p><h2 id="modal-title">${esc(ev.title)}</h2></div></div><p>${esc(typeof ev.text === 'function' ? ev.text(this) : ev.text)}</p>`,
      ev.choices.map(c => ({
        label: c.label,
        onClick: () => { if (ev.brig) this.loreN++; const msg = c.run(this); this.closeModal(); if (msg) this.toast(msg); this.renderBoard(); if (!this.checkFail()) this.nextSubmission(); }
      })), { sheet: 'telegram', stacked: true });
  }

  refill() {
    const extra = Array.from({ length: 4 }, () => this.factory.create(this.nextNo++));
    this.queue.push(...extra);
    this.scene.addShips(extra.map(s => this.queueData(s)));
  }

  addShips(n) {
    const extra = Array.from({ length: n }, () => this.factory.create(this.nextNo++));
    this.queue.push(...extra);
    this.quota += n;
    this.scene.addShips(extra.map(s => this.queueData(s)));
    this.renderBoard();
  }

  nextSubmission() {
    this.closeModal();
    if (!this.training && this.shiftLeft <= 0) { this.endDay(); return; }
    if (!this.training && this.queue.length < 3) this.refill();
    if (!this.queue.length || (this.training && this.processed >= this.quota)) { this.endDay(); return; }
    if (this.maybeEvent()) return;
    const sub = this.queue.shift();
    this.current = sub;
    this.scene.dock(sub.no);
    this.scene.skyTo(clamp(this.training ? .05 + .95 * (this.processed / Math.max(1, this.quota)) : 1 - this.shiftLeft / Math.max(1, this.shiftTotal), .05, 1), 2200);
    $('#stamp-mark').classList.remove('show');
    this.renderDossier(sub);
    this.auditor.load(sub);
    $('#mock-wrap').classList.remove('idle');
    $('#mock-url').textContent = sub.tpl.url;
    this.shipStart = performance.now(); this.shipSpent = 0;
    if (!this.training) { if (this.fx.chat) this.shiftLeft = Math.max(5, this.shiftLeft - this.fx.chat); if (this.brig >= 2) this.shiftLeft += 2; }
    this.fx.chat = 0;
    this._lastSec = null;
    this.clearPopups();
    if (sub.brig) { this.brigSeen++; if (this.brigSeen === 1) this.note('first', NOTES.first); if (this.brigSeen === 3) this.note('third', NOTES.third); }
    if (sub.forged) { this.forged++; if (this.brigSeen > 0) this.note('forged', NOTES.forged); }
    const pause = !!sub.troll;
    this.mode = pause ? 'event' : 'inspecting';
    this.setStamps(!pause);
    this.showTab(0);
    this.renderTimer(); this.renderBoard(); this.renderMara(); this.updatePlate();
    Sfx.bell(); setTimeout(() => Sfx.paper(), 250);
    this.auditor.say(`MV ${esc(sub.tpl.name)} is at the quay. Inspect the screen, cite the faults, then stamp.`);
    if (sub.troll) this.trollIntro(sub);
    if (this.fx.gift) { this.shiftLeft += this.fx.gift; this.fx.gift = 0; setTimeout(() => this.toast('Someone has left a thermos on the sill.'), 900); }
    if (sub.graffiti) { this.shiftLeft = Math.max(10, this.shiftLeft - 5); this.spawnPopup(); setTimeout(() => this.toast('Ink all over this dossier. It takes a while to read through.'), 900); }
    if (this.upgrades.has('cheat') && !sub.troll) { const n = sub.defects.size; this.meter({ trust: -1 }); this.auditor.say(`Cheat sheet: ${n === 0 ? 'no faults on this one' : n + ' fault' + (n > 1 ? 's' : '')}.`); }
    this.renderMara();
  }

  note(id, text) {
    if (this.nb.some(n => n.id === id)) return;
    this.nb.push({ id, day: this.day, text });
    this.renderNotebook();
    const t = $('#rb-tab-note');
    if (t && t.getAttribute('aria-selected') !== 'true') t.classList.add('flash');
  }
  renderNotebook() {
    const h = $('#notebook'); if (!h) return;
    const gl = Object.entries(this.gallery).map(([id, f]) => { const t = BRIGADE[id]; return t ? `<li><b>${esc(t.name)}</b> <span class="dots">${Object.keys(t.finds).map(k => `<i class="${f.includes(k) ? 'on' : ''}"></i>`).join('')}</span></li>` : ''; }).join('');
    h.innerHTML = (this.nb.length ? this.nb.map(n => `<div class="nb-e"><b>Day ${n.day}</b><p>${esc(n.text)}</p></div>`).join('') : '<p class="hint">Nothing worth writing down yet.</p>') + (gl ? `<div class="nb-e"><b>Pages I have wandered through</b><ul class="gal">${gl}</ul></div>` : '');
  }

  shiftBrig(delta) {
    const old = this.brig;
    this.brig = clamp(this.brig + delta, -4, 4);
    this.renderBoard();
  }

  spawnPopup() {
    const box = $('#popups'); if (!box || this.popups >= 2) return;
    this.popups++;
    const el = document.createElement('div'); el.className = 'popup-ad';
    el.style.left = randInt(5, 60) + '%'; el.style.top = randInt(15, 55) + '%';
    el.innerHTML = '<header><b>YOU WON!!!</b><button type="button" aria-label="Close">x</button></header><div class="body">You are visitor 1,000,000!<br><button type="button">CLAIM PRIZE</button></div>';
    el.querySelector('header button').addEventListener('click', () => { el.remove(); this.popups--; });
    el.querySelector('.body button').addEventListener('click', () => { this.spend(2); this.spawnPopup(); this.toast('A prize! It cost you two seconds.'); });
    box.appendChild(el);
  }
  clearPopups() { const b = $('#popups'); if (b) b.innerHTML = ''; this.popups = 0; }
  maybePopup() { if (this.brig <= -2 && this.mode === 'inspecting' && Math.random() < .006) this.spawnPopup(); }

  trollIntro(sub) {
    const lv = sub.troll.level, b = this.barn, lines = [pick(BARNY_INTRO[lv - 1])];
    if (b.last === 'reject' && Math.random() < .6) { lines.push('You approved my last one, remember? Be consistent.'); sub.troll.lieLast = true; }
    else if (b.last === 'approve') lines.push('You approved my last one, so this one is fine. Be consistent.');
    else { lines.push(`Page ${randInt(2, 9)} of your rulebook says: ${FALSE_CLAIM[sub.troll.claimCat]}`); sub.troll.claimShown = true; }
    Sfx.buzz();
    this.showModal(`<div class="bubble"><figure class="pic face">${Art.portrait(BARNY)}</figure><div><p class="eyebrow">Barnaby Gull · Gull &amp; Gull Studios</p>${lines.map(l => `<p class="say">“${esc(l)}”</p>`).join('')}</div></div>`,
      [{ label: 'Hear him out', hint: '−8 s on this review.', onClick: () => this.startReview(8, false) },
       { label: 'Ignore him', hint: '−2 flow: he makes a scene at the quay.', onClick: () => this.startReview(0, true) }], { sheet: 'telegram barn', stacked: true });
  }

  startReview(cost, scene) {
    this.closeModal();
    if (scene) { this.meter({ flow: -2 }); this.toast('He bangs on the glass. The whole quay watches.'); }
    if (!this.training) this.shiftLeft = Math.max(5, this.shiftLeft - cost);
    this.mode = 'inspecting';
    this.setStamps(true);
    this.renderTimer(); this.renderMara();
    this.lastTick = performance.now();
  }

  showAppeal() {
    this.mode = 'event';
    Sfx.buzz();
    this.showModal(`<div class="bubble"><figure class="pic face">${Art.portrait(BARNY)}</figure><div><p class="eyebrow">Barnaby Gull is back at the window</p><p class="say">“${esc(pick(BARNY_APPEAL))}”</p></div></div>`,
      [{ label: 'Dismiss the appeal', hint: '−2 flow: he makes a scene.', onClick: () => { this.closeModal(); this.meter({ flow: -2 }); this.toast('He storms off, muttering about lawyers.'); if (!this.checkFail()) this.nextSubmission(); } },
       { label: 'Hear it out', hint: 'Your next review is 10 s shorter. He talks a lot.', onClick: () => { this.closeModal(); this.fx.chat = 10; this.toast('Ten minutes of your life, ten seconds of the clock.'); this.nextSubmission(); } }],
      { sheet: 'telegram barn', stacked: true });
  }


  renderDossier(sub) {
    const first = firstName(sub.persona.who), env = sub.persona.env, who = sub.persona.who;
    $('#dossier').innerHTML = `
      <h2>Berth dossier</h2><p class="muted">Registry no. ${sub.no} · inspection copy</p>
      <div class="regbox">${Art.shipSvg(SHIP_KIND[sub.tpl.id] || 'ferry', sub.designer + sub.no)}<div><b>MV ${esc(sub.tpl.name)}</b><span>${esc(sub.tpl.url)}</span></div></div>
      <div class="id-row"><div class="pic">${Art.portrait(sub.brig ? 'Anonymous' : sub.designer)}</div><div><div class="k">Submitted by</div><div class="v">${esc(sub.designer)}<small>${sub.troll ? 'Gull &amp; Gull Studios, “freelance”' : sub.brig ? 'no registry mark' : 'design studio'}</small></div></div></div>
      <div class="id-row"><div class="pic">${Art.portrait(first)}</div><div><div class="k">Main user</div><div class="v">${esc(who)}<small>${esc(env)}</small></div></div></div>
      <h3 style="margin-top:14px">House style guide</h3>
      <ul class="styleguide">${sub.tpl.style.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      <p class="sticky">${this.yard ? 'Yard: no clock, no money, no warnings. Ask for a Hint any time.' : 'Today: ' + esc(DAYS[this.day - 1].directive)}</p>
      ${sub.studioNote === 'improved' ? `<p class="sticky">Returning studio: “We took your notes seriously this time.”</p>` : sub.studioNote === 'grudge' ? `<p class="sticky forged">Returning studio: “You turned us back for nothing last time. We are watching.”</p>` : ''}
      ${sub.brig && this.brig >= 2 && sub.defects.size ? `<p class="sticky art">${Art.sigil()}<span>Someone has ringed “${esc(sub.tpl.regions[[...sub.defects.keys()][0]])}” in pencil.</span></p>` : ''}
      ${sub.brig ? `<p class="sticky art">${Art.sigil()}<span>No registry mark.</span></p>` : sub.forged ? `<p class="sticky art">${Art.star()}<span>No registry mark.</span></p>` : ''}
      ${sub.troll && sub.troll.level >= 2 ? '<p class="sticky forged">“Pre-cleared by the Harbor Master.” (Stuck on by the submitter.)</p>' : ''}`;
  }

  renderMara() {
    const b = $('#btn-mara');
    b.hidden = !this.upgrades.has('mara');
    b.disabled = this.maraLeft < 1 || this.mode !== 'inspecting';
    b.textContent = `Ask Mara for a second opinion (${this.maraLeft} left)`;
    const a = $('#btn-appr');
    if (a) { a.hidden = !this.upgrades.has('apprentice'); a.disabled = this.apprLeft < 1 || this.mode !== 'inspecting'; a.textContent = `Send the apprentice (${this.apprLeft} left)`; }
  }

  askApprentice() {
    if (this.mode !== 'inspecting' || this.apprLeft < 1) return;
    this.apprLeft--;
    const sub = this.current, faults = [...sub.defects.entries()], err = Math.random() < .25;
    let kind = faults.length ? 'reject' : 'approve';
    this.auditor.flags.clear();
    if (err) { kind = kind === 'reject' ? 'approve' : 'reject'; }
    if (kind === 'reject') {
      const src = faults.length ? faults : [[Object.keys(sub.tpl.regions)[0], { cat: 'text' }]];
      src.forEach(([r, df]) => this.auditor.flags.set(r, df.cat));
    }
    this.toast(err ? 'The apprentice squints, shrugs and stamps…' : 'The apprentice takes the booth and stamps with confidence.');
    this.renderMara();
    this.decide(kind);
  }

  askMara() {
    if (this.mode !== 'inspecting' || this.maraLeft < 1) return;
    this.maraLeft--;
    const n = this.current.defects.size;
    if (this.current.brig || this.current.forged) this.toast('Mara glances at the margin and says nothing about it.');
    this.auditor.say(`Mara squints at the screen. “${n === 0 ? 'I can’t find a single thing wrong with it.' : `I count ${n} fault${n === 1 ? '' : 's'}.`}”`);
    this.renderMara();
  }

  /* ----- stamping and consequences ----- */
  decide(kind) {
    if (this.mode !== 'inspecting') return;
    const sub = this.current, aud = this.auditor;
    if (kind === 'reject' && aud.flags.size === 0) { this.toast('Cite at least one fault before turning a ship back.'); Sfx.buzz(); return; }
    const timedOut = kind === 'timeout';
    this.mode = 'stamping';
    this.setStamps(false); aud.closePop(); this.clearPopups();
    const res = Scoring.evaluate(sub, aud.flags, timedOut ? 'none' : kind, Math.max(0, 50 - (performance.now() - this.shipStart) / 1000 - this.shipSpent), timedOut, this.training);
    if (timedOut) { this.toast('Out of time. The ship drifts away unprocessed.'); Sfx.horn(); }
    else this.showStamp(kind);
    this.scene.leave(sub.no, timedOut ? 'drift' : kind === 'approve' ? 'ok' : 'no');
    this.processed++;
    const eff = this.consequences(sub, kind, res);
    setTimeout(() => this.showReceipt(sub, kind, res, eff), timedOut ? 1000 : 1500);
  }

  showStamp(kind) {
    const m = $('#stamp-mark');
    m.innerHTML = kind === 'approve' ? Art.stamp('CLEARED', `PORT HALCYON · DAY ${this.day}`, '#1f8a5e') : Art.stamp('TURNED BACK', `PORT HALCYON · DAY ${this.day}`, '#c0392b');
    m.classList.remove('show'); void m.offsetWidth; m.classList.add('show');
    const cl = kind === 'approve' ? '#1f8a5e' : '#c0392b';
    let sp = '';
    for (let i = 0; i < 22; i++) { const a = Math.random() * 6.283, r = 52 + Math.random() * 32; sp += `<circle cx="${(50 + Math.cos(a) * r).toFixed(1)}" cy="${(50 + Math.sin(a) * r * .6).toFixed(1)}" r="${(Math.random() * 2.2 + .5).toFixed(1)}" fill="${cl}" opacity=".7"/>`; }
    m.insertAdjacentHTML('beforeend', `<svg class="splat" viewBox="0 0 100 100" aria-hidden="true">${sp}</svg>`);
    const mon = $('#monitor'); mon.classList.remove('shake'); void mon.offsetWidth; mon.classList.add('shake');
    Sfx.stamp();
  }

  consequences(sub, kind, res) {
    if (sub.troll) { this.barn.seen++; this.barn.last = res.timedOut ? 'approve' : kind; if (this.barn.last === 'approve') this.barn.app++; else this.barn.rej++; }
    const faults = [...sub.defects.values()];
    const sev = faults.reduce((a, f) => a + (SEV[f.cat] || 1), 0);
    const d = { trust: 0, flow: 0, funds: res.credits }, notes = [];
    const bump = cat => { this.weak[cat] = (this.weak[cat] || 0) + 1; };
    if (res.timedOut) {
      d.trust = -2; d.flow = -8; notes.push('The ship drifted off and the quay backed up behind it.');
      faults.forEach(f => bump(f.cat));
    } else if (kind === 'approve') {
      if (faults.length) {
        d.trust = -2 * sev - (sub.troll ? 3 : 0); d.flow = 2; this.flawedApproved++;
        if (sub.troll) notes.push('Barnaby brags about it all over the quay.');
        notes.push(`The ship sails into the harbor with ${faults.length} fault${faults.length > 1 ? 's' : ''} aboard. Real people will meet them.`);
        faults.forEach(f => bump(f.cat));
        if (Math.random() < .6) this.pending.push({ due: this.processed + randInt(1, 3), sub, f: pick(faults) });
      } else { d.trust = 1; d.flow = 4; this.goodCalls++; notes.push('A sound design sails in and the quay keeps moving.'); }
    } else if (faults.length) {
      d.trust = 2 + res.hits.length; d.flow = -3; this.goodCalls++;
      notes.push('The studio takes your notes and will rework it.');
      res.missed.forEach(m => bump(m.d.cat));
    } else {
      d.flow = -6; d.trust = -1; this.cleanTurned++;
      notes.push('Nothing was wrong with that one. The studio files a complaint and the quay backs up.');
    }
    if (sub.troll && kind === 'reject' && !res.timedOut && Math.random() < .55) this.pending.push({ due: this.processed, appeal: true, sub });
    if (!this.training && this.processed > this.quota) {
      if (d.flow < 0 && kind === 'reject' && faults.length) d.flow = 1;
      else if (d.flow > 1) d.flow = 1;
      if (d.funds > 0) d.funds = Math.round(d.funds * .6);
    }
    if (res.correct && !(res.falseFlags && res.falseFlags.length) && !(res.missed && res.missed.length) && !res.timedOut && !this.endless && !this.training) {
      const el = (performance.now() - this.shipStart) / 1000 - this.shipSpent, fr = el / Math.max(10, this.reviewTime());
      const q = fr < .15 ? 5 : fr < .22 ? 3 : fr < .3 ? 1 : 0;
      if (q) { d.funds += q; notes.push(`Quick, correct work: +${q} cr bonus.`); }
    }
    if (this.day === 1 && d.funds < 0) d.funds = 0;
    this.qSum += res.quality; this.qN++;
    const warned = res.citation && this.day > 1;
    if (warned) { this.citations++; this.dayCited = true; }
    else if (res.citation) notes.push('Day one: the Harbor Master lets the mistake slide. From tomorrow it costs you a warning.');
    if (!sub.troll && !sub.brig && !res.timedOut) {
      const st = this.studio[sub.designer] || (this.studio[sub.designer] = { good: 0, wrong: 0 });
      if (kind === 'reject' && faults.length) st.good++;
      else if (kind === 'reject') st.wrong++;
      if (sub.studioNote === 'improved' && kind === 'approve' && !faults.length) { d.funds += 10; notes.push(`${sub.designer}’s studio sends a thank-you tip for the fair review. (+10 cr)`); }
      if (sub.studioNote === 'grudge' && kind === 'reject' && faults.length) { d.trust += 1; notes.push('The studio grumbles, but this time you were right.'); }
    }
    if (sub.brig && !res.timedOut) {
      if (sub.retro) this.note('clean', NOTES.clean);
      if (kind === 'reject') { this.referred++; notes.push('Filed: referred to the Registry.'); this.note('referral', NOTES.referral); } else notes.push('Filed: cleared.');
      if (kind === 'approve') { d.flow += 3; d.brig = faults.length ? 1 : 2; this.brigStats.app++; if (this.pact) d.funds += 25; }
      else { d.brig = faults.length ? (this.pact ? -2 : -1) : -2; this.brigStats.rej++; }
    }
    if (sub.forged && kind === 'reject' && !res.timedOut) { this.referred++; notes.push('Filed: referred to the Registry.'); }
    this.dayRecords.push({ sub, kind, res, faults });
    this.meter(d);
    if (d.brig) this.shiftBrig(d.brig);
    if (res.correct) Sfx.good(); else Sfx.bad();
    return { d, notes, warned };
  }

  showReceipt(sub, kind, res, eff) {
    this.mode = 'feedback';
    const faults = [...sub.defects.values()], n = faults.length, R = sub.tpl.regions;
    let head;
    if (res.timedOut) head = 'Time ran out';
    else if (kind === 'approve') head = n ? `Cleared, ${n} fault${n > 1 ? 's' : ''} aboard` : 'Cleared: sound design';
    else head = n ? 'Turned back: good catch' : 'Turned back: it was sound';
    const chip = (v, label) => v ? `<span class="chip ${v > 0 ? 'up' : 'down'}">${label} ${v > 0 ? '+' : '−'}${Math.abs(v)}</span>` : '';
    const lines = [];
    res.hits.forEach(h => lines.push(`<li class="ok"><span class="ic">${Art.ruleIcon(h.cat)}</span><span><b>${esc(R[h.region] || h.region)}</b> · ${esc(CAT[h.cat].name)}</span></li>`));
    res.partial.forEach(h => lines.push(`<li class="meh"><span class="ic">${Art.ruleIcon(h.d.cat)}</span><span><b>${esc(R[h.region] || h.region)}</b>: it was “${esc(CAT[h.d.cat].name)}”, you cited “${esc(CAT[h.cat].name)}”<small>${esc(h.d.why)}</small></span></li>`));
    res.missed.forEach(m => lines.push(`<li class="bad"><span class="ic">${Art.ruleIcon(m.d.cat)}</span><span><b>Missed in “${esc(R[m.region] || m.region)}”:</b> ${esc(m.d.label)}<small>${esc(m.d.why)}</small></span></li>`));
    res.falseFlags.forEach(f => lines.push(`<li class="bad"><span class="ic">${Art.ruleIcon(f.cat)}</span><span><b>${esc(R[f.region] || f.region)}</b> was fine<small>False alarms cost credits.</small></span></li>`));
    const last = this.queue.length === 0;
    const barnQuote = sub.troll ? `<div class="bubble small"><figure class="pic face">${Art.portrait(BARNY, { mood: kind === 'approve' || this.barn.app >= 2 ? 'grin' : '' })}</figure><div><p class="say">“${esc(res.timedOut ? 'Too slow. I will take your silence as a yes.' : kind === 'approve' ? pick(sub.forged ? BARNY_FORGED_OK : BARNY_APPROVED) : pick(sub.forged ? BARNY_FORGED_NO : BARNY_REJECTED))}”</p>${sub.troll.claimShown ? `<p class="check"><b>Rulebook check:</b> ${esc(CAT[sub.troll.claimCat].name)}. ${esc(RULE_SHORT[sub.troll.claimCat])}</p>` : ''}${sub.troll.lieLast ? '<p class="check"><b>Reality check:</b> you turned his last ship back. You never approved it.</p>' : ''}</div></div>` : '';
    const brigQuote = '';
    this.showModal(`
      <div class="rhead"><figure class="pic ship">${Art.shipSvg(SHIP_KIND[sub.tpl.id] || 'ferry', sub.designer + sub.no)}</figure>
        <div><p class="eyebrow">Ship ${this.processed} · quota ${this.quota} · MV ${esc(sub.tpl.name)}</p><h2 id="modal-title">${esc(head)}</h2></div>
        <figure class="pic face ${res.timedOut ? '' : (kind === 'approve' && n) ? 'react-shake' : 'react-nod'}">${Art.portrait(firstName(sub.persona.who))}</figure></div>
      <div class="chips">${chip(res.credits, 'purse')}${chip(eff.d.trust, 'trust')}${chip(eff.d.flow, 'flow')}${eff.warned ? '<span class="chip down">warning issued</span>' : ''}</div>
      ${barnQuote}${brigQuote}<p class="note">${esc(eff.notes.join(' '))}</p>
      ${lines.length ? `<ul class="lines">${lines.join('')}</ul>` : ''}${this.courseNote ? this.courseNote(res) : ''}`,
      [{ label: last ? 'Close the day' : 'Next ship', primary: true, onClick: () => { this.closeModal(); this.afterReceipt(); } }], { dialog: 'slip' });
  }

  afterReceipt() {
    if (this.checkFail()) return;
    if (!this.training && this.shiftLeft <= 0) { this.endDay(); return; }
    if (this.training && this.processed >= this.quota) { this.endDay(); return; }
    const inc = this.pending.find(p => p.due <= this.processed);
    if (inc) { this.pending = this.pending.filter(p => p !== inc); inc.appeal ? this.showAppeal() : this.showIncident(inc); return; }
    this.nextSubmission();
  }

  rescueOk() { return !this.endless && !this.training && (this.rescues | 0) < 3; }
  checkFail() {
    let end = null;
    if (this.citations >= this.maxCitations) end = 'fired';
    else if (this.trust <= 0) end = 'closed';
    else if (this.flow <= 0) end = 'gridlock';
    else if (this.funds < -30) end = 'bankrupt';
    if (end && this.rescueOk()) {
      /* second chances: the first three times you would fail, the Harbor Master steps in and you carry on */
      this.rescues = (this.rescues | 0) + 1;
      const fix = { fired: () => { this.citations = Math.max(0, this.maxCitations - 2); return 'The Harbor Master gives you a final notice instead of your dismissal. Two warnings are struck from your record.'; },
        closed: () => { this.trust = 35; return 'The Council steps in and restores some trust in the booth. Keep going.'; },
        gridlock: () => { this.flow = 35; return 'The tugboats clear the queue and traffic moves again. Keep going.'; },
        bankrupt: () => { this.funds = 5; return 'A friendly lender covers your debts. Spend more carefully.'; } }[end]();
      this.toast(fix + ` (${Math.max(0, 3 - this.rescues)} second chance${3 - this.rescues === 1 ? '' : 's'} left)`); this.renderBoard(); return false;
    }
    if (end) { this.showEnding(end); return true; }
    return false;
  }

  showIncident(inc) {
    this.mode = 'event';
    Sfx.bell();
    const name = firstName(inc.sub.persona.who), line = STORY[inc.f.cat](name, `MV ${inc.sub.tpl.name}`);
    this.showModal(`<div class="head">${Art.icon('complaint')}<div><p class="eyebrow">Complaint received</p><h2 id="modal-title">A ship you cleared is causing trouble</h2></div></div>
      <p>${esc(line)} The complaint is addressed to you. “${esc(inc.f.label)}.”</p><p class="muted">How do you answer?</p>`,
      [
        { label: 'Apologise publicly', hint: '−10 cr. Trust falls only 1.', run: g => { g.meter({ funds: -10, trust: -1 }); return 'Your apology is printed. People appreciate it.'; } },
        { label: 'Recall the ship for repairs', hint: '−20 cr, −3 flow, +1 trust. You show you are serious.', run: g => { g.meter({ funds: -20, flow: -3, trust: 1 }); return 'The studio is ordered to fix it at once.'; } },
        { label: 'Say nothing', hint: 'Free. Trust falls 4.', run: g => { g.meter({ trust: -4 }); return 'The silence is noticed.'; } }
      ].map(c => ({ label: c.label, hint: c.hint, onClick: () => { const m = c.run(this); this.closeModal(); this.toast(m); if (!this.checkFail()) this.nextSubmission(); } })),
      { sheet: 'telegram', stacked: true });
  }

  askMaraLabel() { return ''; }

  /* ----- end of day ----- */
  buildGazette() {
    const recs = this.dayRecords, S = [];
    const bad = recs.filter(r => r.kind === 'approve' && r.faults.length).sort((a, b) => b.faults.length - a.faults.length);
    const turned = recs.filter(r => r.kind === 'reject' && !r.faults.length);
    const good = recs.filter(r => r.kind === 'reject' && r.faults.length);
    const drift = recs.filter(r => r.res.timedOut);
    recs.filter(r => r.sub.troll && r.kind === 'approve').slice(0, 1).forEach(r => S.push({ h: 'Gull & Gull boasts of clearance', p: `Barnaby Gull says the Berth Office “loved” ${r.sub.tpl.name}. Users who tried it beg to differ.` }));
    recs.filter(r => r.sub.brig && r.kind === 'approve').slice(0, 1).forEach(r => S.push({ h: `${r.sub.tpl.name} pleases some, puzzles others`, p: 'One user calls it “the most fun page in years”. Another cannot find the Back button. Neither has anything to say about who made it.' }));
    const heads = [a => `Users stranded by ${a}`, a => `Anger grows over ${a}`, a => `Complaints pile up at ${a}`];
    bad.slice(0, 2).forEach((r, i) => {
      const f = r.faults[0];
      S.push({ h: heads[i % heads.length](r.sub.tpl.name), p: STORY[f.cat](firstName(r.sub.persona.who), r.sub.tpl.name) + (r.faults.length > 1 ? ` It was one of ${r.faults.length} faults nobody caught at the quay.` : ' The fault was missed at the quay.') });
    });
    turned.slice(0, 1).forEach(r => S.push({ h: `${r.sub.designer} cries foul over delay`, p: `The studio says ${r.sub.tpl.name} was perfectly sound, and that the inspector turned it back for nothing. Traffic at the quay is backing up.` }));
    drift.slice(0, 1).forEach(r => S.push({ h: `Ship adrift: ${r.sub.tpl.name} never cleared`, p: 'A ship was left waiting until the harbor master lost patience. Studios complain of slow inspections.' }));
    good.slice(0, 1).forEach(r => S.push({ h: `${r.sub.designer} reworks ${r.sub.tpl.name}`, p: `Following the inspector’s notes, the studio is fixing ${r.faults.length > 1 ? 'several problems' : 'a problem'}. ${firstName(r.sub.persona.who)} will find the next version far easier.` }));
    recs.filter(r => r.sub.troll && r.kind === 'reject').slice(0, 1).forEach(() => S.push({ h: 'Barnaby Gull “not done yet”', p: 'The freelance designer is said to be drafting an appeal. In capitals.' }));
    if (!S.length) S.push({ h: 'Quiet day on the quay', p: 'Every ship was handled with care and the harbor sleeps easy.' });
    return S.slice(0, 3);
  }

  canLeave() { return !this.endless && !this.training && this.day > 0 && ['inspecting', 'waiting'].includes(this.mode) && this.processed >= this.quota; }
  leaveEarly() {
    if (!this.canLeave()) return;
    this.shiftLeft = 0;
    this.toast('You clock out.');
    this.endDay();
  }
  endDay() {
    this.mode = 'dayend';
    this.current = null;
    this.yesterday = this.buildGazette();
    const qShort = this.training ? 0 : Math.max(0, this.quota - this.processed), qExtra = this.training ? 0 : Math.max(0, this.processed - this.quota);
    if (qShort || qExtra) { this.meter({ funds: -10 * qShort + 5 * qExtra, flow: -3 * qShort }); }
    if (!this.training && !this.endless && !this.dayCited && this.citations > 0) { this.citations--; this.toast('A clean day: one warning is struck from your record.'); this.renderBoard(); }
    this.dayCited = false;
    if (this.checkFail()) return;
    this.fx.tea = false; this.fx.hungry = false; this.fx.dim = false; this.fx.rush = 0;
    this.auditor.clear();
    $('#mock-wrap').classList.add('idle');
    $('#mock-url').textContent = 'no ship at the quay';
    this.setStamps(false); this.renderTimer(); this.renderMara(); this.updatePlate();
    this.scene.skyTo(1.2, 2600);
    Sfx.horn();
    const recs = this.dayRecords, correct = recs.filter(r => r.res.correct).length, wages = recs.reduce((a, r) => a + r.res.credits, 0);
    const slipped = recs.filter(r => r.kind === 'approve' && r.faults.length).length;
    this.showModal(`
      <div class="head">${Art.icon('papers')}<div><p class="eyebrow">Closing bell · Day ${this.day}</p><h2 id="modal-title">${correct} of ${recs.length} calls right</h2></div></div>
      <div class="chips"><span class="chip ${wages >= 0 ? 'up' : 'down'}">wages ${wages >= 0 ? '+' : '−'}${Math.abs(wages)} cr</span><span class="chip">trust ${this.trust}</span><span class="chip">flow ${this.flow}</span><span class="chip">warnings ${this.citations} / ${this.maxCitations}</span></div>
      <p class="note"><b>Quota ${this.processed} / ${this.quota}:</b> ${qShort ? `short by ${qShort}. Wages docked ${10 * qShort} cr and the quay grumbles.` : qExtra ? `${qExtra} beyond quota, paid 5 cr each.` : 'met exactly.'}</p>
      ${slipped ? `<p class="note"><b>${slipped} faulty ship${slipped > 1 ? 's' : ''} went into the harbor.</b> Tomorrow’s Gazette will say who met them.</p>` : '<p class="note">Nothing faulty slipped through today.</p>'}`,
      [{ label: this.day >= this.maxDays ? 'See how your career ends' : 'Go home for the evening', primary: true, onClick: () => { this.closeModal(); this.day >= this.maxDays ? this.finishCampaign() : this.showEvening(); } }]);
  }

  showEvening() {
    this.mode = 'evening';
    const rent = 40 + 4 * this.day, oil = 14, food = 18;
    const e = this.eve;
    const bills = rent + (e.oil ? oil : 0) + (e.food ? food : 0);
    const after = this.funds - bills;
    const shop = SHOP.map(it => {
      const owned = !it.consumable && this.upgrades.has(it.id), got = it.consumable && this.fx.tea;
      return `<div class="item"><div><b>${esc(it.name)}</b> · ${it.cost} cr<small style="display:block;color:var(--ink2)">${esc(it.desc)}</small></div><button type="button" class="btn" data-buy="${it.id}" ${owned || got || this.funds < it.cost ? 'disabled' : ''}>${owned ? 'Owned' : got ? 'Packed' : 'Buy'}</button></div>`;
    }).join('');
    this.showModal(`
      <p class="eyebrow">Evening · Day ${this.day} of ${this.maxDays}</p>
      <h2 id="modal-title">Bills and gear</h2>
      <p>Purse: <b>${this.funds} cr</b>. Rent must be paid. Everything else is a choice, and tomorrow remembers it.</p>
      <h3>Bills</h3>
      <div class="bills">
        <label><input type="checkbox" checked disabled><span>Rent for the room above the chandlery</span><b>${rent} cr</b></label>
        <label><input type="checkbox" id="b-oil" ${e.oil ? 'checked' : ''}><span>Lamp oil<small>Skip it and the booth is dim: a shorter shift tomorrow.</small></span><b>${oil} cr</b></label>
        <label><input type="checkbox" id="b-food" ${e.food ? 'checked' : ''}><span>Supper<small>Skip it and you are hungry: a shorter shift tomorrow.</small></span><b>${food} cr</b></label>
      </div>
      <h3>Chandlery</h3><div class="shop">${shop}</div>
      <div class="total"><span>After bills</span><span class="${after < 0 ? 'bad-num' : ''}">${after} cr</span></div>
      ${after < -30 ? '<p class="muted bad-num">Below −30 cr the landlord evicts you and your career ends.</p>' : after < 0 ? '<p class="muted">You will be in debt. Keep it above −30 cr.</p>' : ''}`,
      [{ label: 'Pay bills and sleep', primary: true, onClick: () => this.sleep() }]);
    $('#b-oil').addEventListener('change', ev => { this.eve.oil = ev.target.checked; this.showEvening(); });
    $('#b-food').addEventListener('change', ev => { this.eve.food = ev.target.checked; this.showEvening(); });
    $$('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const it = SHOP.find(s => s.id === b.dataset.buy);
      if (!it || this.funds < it.cost) return;
      this.funds -= it.cost;
      if (it.consumable) this.fx.tea = true; else { this.upgrades.add(it.id); this.applyTools(); }
      Sfx.coin(); this.renderBoard(); this.showEvening();
    }));
  }

  sleep() {
    const rent = 40 + 4 * this.day, e = this.eve;
    this.funds -= rent + (e.oil ? 12 : 0) + (e.food ? 16 : 0);
    this.fx.dim = !e.oil; this.fx.hungry = !e.food;
    this.eve = { oil: true, food: true };
    this.renderBoard();
    this.closeModal();
    if (this.funds < -30) { if (this.rescueOk()) { this.rescues = (this.rescues | 0) + 1; this.funds = 5; this.toast('A friendly lender covers your rent. Spend more carefully.'); } else { this.showEnding('bankrupt'); return; } }
    this.day++;
    this.beginDay();
  }

  /* ----- endings ----- */
  finishCampaign() {
    const a = this.accuracy() ?? 0;
    let id = 'steady';
    if (this.brigSeen > 0 && this.brig >= 3 && !this.reported) id = 'margin';
    else if (this.brigSeen > 0 && this.reported && this.brig <= -2) id = 'registry';
    else if (this.brigSeen > 0 && this.loreN >= 4 && !(this.bribes > 0 && this.flawedApproved >= 1)) id = 'middle';
    else if (this.bribes > 0 && this.flawedApproved >= 1) id = 'caught';
    else if (this.trust >= 70 && this.flow >= 50 && a >= .8) id = 'keeper';
    else if (this.trust >= 60 && this.flow < 50) id = 'warden';
    else if (this.flow >= 65 && this.trust < 50) id = 'stamp';
    this.showEnding(id);
  }

  showEnding(id) {
    this.mode = 'over';
    this.current = null;
    this.setStamps(false); this.auditor.clear();
    $('#mock-wrap').classList.add('idle'); this.renderTimer(); this.renderMara();
    this.scene.skyTo(['keeper', 'warden', 'steady'].includes(id) ? .4 : 1.2, 2400);
    const E = ENDINGS[id], a = this.accuracy() ?? 0;
    const score = Math.max(0, Math.round(this.trust * 3 + this.flow * 2 + Math.max(0, this.funds) + a * 100)) - (id === 'caught' ? 150 : 0) - (E.tone === 'bad' ? 100 : 0);
    Store.save(Math.max(0, score));
    const weak = Object.entries(this.weak).sort((x, y) => y[1] - x[1]).slice(0, 3);
    (E.tone === 'bad' ? Sfx.bad : Sfx.good).call(Sfx);
    this.showModal(`
      <div class="head">${Art.crest()}<div><p class="eyebrow">${E.tone === 'bad' ? 'Career over' : 'Career complete'}</p><h2 id="modal-title">${esc(E.title)}</h2></div></div>
      <figure class="pic wide">${Art.news(END_NEWS[id][0])}</figure>
      <p class="headline">The Gazette, the morning after: <b>${esc(END_NEWS[id][1])}</b></p>
      <p>${esc(E.text)}</p>
      <dl class="kv">
        <dt>Career score</dt><dd>${Math.max(0, score)}</dd>
        <dt>Accuracy</dt><dd>${Math.round(a * 100)}%</dd>
        <dt>Trust / flow</dt><dd>${this.trust} / ${this.flow}</dd>
        <dt>Purse</dt><dd>${this.funds} cr</dd>
        <dt>Faulty ships cleared</dt><dd>${this.flawedApproved}</dd>
        <dt>Sound ships turned back</dt><dd>${this.cleanTurned}</dd>
        <dt>Envelopes taken</dt><dd>${this.bribes}</dd>
        <dt>Barnaby’s tricks that worked</dt><dd>${this.barn.app}</dd>
      </dl>
      ${this.brigSeen ? `<h3>What became of them</h3><ul class="epi">${loreEpilogue(this).map(([n, t]) => `<li><b>${esc(n)}</b> ${esc(t)}</li>`).join('')}</ul>` : ''}
      ${weak.length ? `<h3>Rules to review</h3><ul class="lines">${weak.map(([c, n]) => `<li class="meh"><span class="ic">${Art.ruleIcon(c)}</span><span><b>${esc(CAT[c].name)}</b> (${n} missed)<small>${esc(RULE_SHORT[c])}</small></span></li>`).join('')}</ul>` : ''}`,
      [{ label: 'New career', primary: true, onClick: () => { this.closeModal(); this.resetRun(); this.scene.setQueue([]); this.renderBoard(); this.showTitle(); } }], { sheet: E.tone === 'bad' ? '' : 'paperfront' });
  }
}

Game.prototype.found = function (sub, id) {
  if (!sub.finds || sub.finds.has(id) || !sub.tpl.finds || !sub.tpl.finds[id]) return;
  sub.finds.add(id);
  const tpl = sub.tpl, tot = Object.keys(tpl.finds).length;
  (this.gallery[tpl.id] = this.gallery[tpl.id] || []);
  if (!this.gallery[tpl.id].includes(id)) this.gallery[tpl.id].push(id);
  try { [880, 1175, 1568].forEach((f, k) => Sfx.tone(f, .35, 'sine', .07, null, k * .09)); } catch (e) {}
  this.toast(`Found: ${tpl.finds[id]} (${sub.finds.size}/${tot})`);
  this.renderNotebook();
  if (sub.finds.size === tot && !this.galleryDone.includes(tpl.id)) {
    this.galleryDone.push(tpl.id); this.wonder++;
    this.note('art_' + tpl.id, tpl.note);
    this.shiftBrig(1);
  }
};

/* ───────────────────── 11g. Acts II and III: the Long Winter and the Last Tide (days 8–14) ─────────────────────
   Same rule as the rest of the lore: facts, objects and omissions; no verdicts; effects never shown as numbers.
   Story flags live in this.st (reset every run).                                                              */
Object.assign(WEATHER, { 8: 'rain', 9: 'fog', 11: 'storm', 12: 'rain', 13: 'fog' });
Object.assign(TROLL_PLAN, { 8: [3, 3, 3], 9: [3, 3, 3, 3], 10: [3, 3], 11: [3, 3, 3, 3], 12: [3, 3, 3, 3], 13: [3, 3, 3], 14: [3, 3, 3, 3] });
Object.assign(BRIG_PLAN, { 8: 2, 9: 2, 10: 3, 11: 2, 12: 2, 13: 1, 14: 2 });
Object.assign(BRIG_CLEAN, { 8: 1, 9: 1, 10: 2, 11: 1, 12: 1, 13: 1, 14: 1 });

const _resetRunS = Game.prototype.resetRun;
Game.prototype.resetRun = function () { _resetRunS.call(this); this.st = {}; };
const S = g => (g.st = g.st || {});

/* the Inspector General’s audit lands on the morning of Day 8 */
const _beginDayS = Game.prototype.beginDay;
Game.prototype.beginDay = function () {
  if (this.day === 8 && !this.endless && !this.training && this.bribes > 0 && this.flawedApproved >= 1) {
    S(this).audited = true; this.meter({ trust: -8, funds: -40 });
  }
  return _beginDayS.call(this);
};

/* ── the newspaper ── */
Object.assign(NEWS, {
  8: g => ({
    weather: ['Rain', 'cold, 4°'],
    lead: S(g).audited
      ? { img: 'council', h: 'Inspector fined after audit', p: 'The Inspector General found “irregularities” in the Berth Office ledger. A fine was paid. The seal was not revoked, “for the season’s sake.”' }
      : { img: 'council', h: 'Audit finds Berth Office “in order”', p: 'The Inspector General left by the evening ferry. “Irritatingly tidy,” said one aide.' },
    side: [
      { img: 'berthoffice', h: 'Registry moves into the Berth Office', p: 'It will share the stairwell and “some filing.” Staff are asked not to ask what filing.' },
      { img: 'quiet', h: 'Winter arrives three weeks early', p: 'Gulls have left the quay. The lamp-lighter says the lamps burn lower in the cold.' }
    ],
    ad: 'COAL: two sacks for the price of one, while the Registry lasts.'
  }),
  9: g => ({
    weather: ['Fog', 'thick, 2°'],
    lead: { img: 'speech', h: 'Memory Week declared', p: 'The Authority tells studios to stop making users remember things. Compliance forms must be remembered and returned by Friday.' },
    side: [
      { img: 'nox', h: 'Nox & Co. wins the Charter contract', p: 'The unregistered studio is to draft “plain-language summaries” of the new rulebook. Vael calls it “continuity.”' },
      { img: 'guild', h: 'Studios’ guild asks: who reads the Registry?', p: 'No one has seen the Registry’s own screens. “It has a website,” said a clerk. “It is a very short one.”' }
    ],
    ad: 'LOST: one cat carrier, wicker, left on the 4:10 tram. Reward: a cat.'
  }),
  10: g => ({
    weather: ['Clear', 'crisp, 1°'],
    lead: { img: 'carnival', h: 'Lantern Night tonight', p: 'The harbor lights ten thousand lanterns. Pier 9 is “open to all” for the first time in a year, a spokesman said, then added: “Registry staff will attend.”' },
    side: [
      { img: 'sigil', h: 'A star on the lighthouse', p: 'Painted in a night, forty metres up. Nobody saw a ladder. The Registry has asked for the ladder.' },
      { img: 'clinic', h: 'Clinic reopens with a new booking page', p: 'Patients can now cancel appointments. They can also, for the first time, un-cancel them.' }
    ],
    ad: 'LANTERNS, paper, 3 for 1 cr. Matches not included.'
  }),
  11: g => ({
    weather: ['Storm', 'gale, 3°'],
    lead: { img: 'storm', h: 'Council orders recount of the season', p: 'Every ship cleared since autumn will be reviewed by committee. “It is the only way to know,” the speaker said. Know what, he did not say.' },
    side: [
      { img: 'marrow', h: 'Marrow offers asylum to Halcyon studios', p: 'Its port is open and its rulebook is “one page, laminated.” Several studios have left on the dawn boat.' },
      { img: 'pension', h: 'Antonio’s portal, one year on', p: 'Fixed in March. Broken in June. Fixed in October. “I have stopped trusting weather and websites alike,” said Antonio.' }
    ],
    ad: 'SANDBAGS: delivered. Please be home to receive them.'
  }),
  12: g => ({
    weather: ['Rain', 'steady, 5°'],
    lead: { img: 'council', h: 'Inquiry opens into the twenty-three', p: 'Families fill the gallery. The ferry page, unmarked and unsigned, is Exhibit A. “We want a name,” said a man holding a lantern, “even if it is the wrong one.”' },
    side: [
      { img: 'berthoffice', h: 'Registry: “we filed it all”', p: 'A spokesperson says every unmarked page ever referred is “safely kept.” Asked where, she said: “Safely.”' },
      { img: 'sigil', h: 'Hand-drawn stars appear outside the courthouse', p: 'Children are said to be selling chalk. The Registry is “reviewing the question of chalk.”' }
    ],
    ad: 'LAWYERS: no case too small, no fee too large.'
  }),
  13: g => ({
    weather: ['Fog', 'still, 2°'],
    lead: { img: 'speech', h: 'Charter committee sits tonight', p: S(g).hear === 'named' ? 'After yesterday’s testimony the committee is “inclined to firmness.” Sources say the Registry will have a seat.' : S(g).hear === 'registry' ? 'After yesterday’s testimony the Registry’s ledgers have been subpoenaed. The committee is “reconsidering its seating.”' : 'After yesterday’s testimony the committee is “inclined to hear everyone.” It will sit until it has.' },
    side: [
      { img: 'quiet', h: 'One line from each inspector', p: 'Each was asked to submit a single sentence for the Charter’s first page. Submissions are said to run from “be clear” to “be kind.”' },
      { img: 'nox', h: 'Nox & Co. withdraws', p: 'The studio “has decided to dissolve.” Its ship was last seen leaving harbor at night with its lights off.' }
    ],
    ad: 'STATIONERY: pens, ink, one blank page. Ask for page fourteen.'
  }),
  14: g => ({
    weather: ['Clear', 'high tide at dusk'],
    lead: { img: 'tide', h: 'Highest tide in forty years expected tonight', p: 'The Charter will be read from the lighthouse at dusk. Every berth is booked. The lamp-lighter says he has enough oil “for one night, no more.”' },
    side: [
      { img: 'berthoffice', h: 'What the Berth Office has been, and might be', p: 'A retrospective on twelve months at the quay. “It was a good booth,” writes one columnist. “The question is who stood in it.”' },
      { img: 'carnival', h: 'Bunting, lanterns and a ladder', p: 'Something is being prepared on the quay. Nobody will say what. Everybody has brought a ladder.' }
    ],
    ad: 'ALMANAC: next year’s tide tables, printed in clear type. Large print available.'
  })
});

Object.assign(BRIG_NEWS, {
  8: g => g.brigSeen > 0 && (S(g).room === 'seen'
    ? { img: 'sigil', h: 'A door that was not on the plan', p: 'Surveyors found a second stairwell under the Registry. It had no handle on the outside. They did not go in.' }
    : { img: 'quiet', h: 'Stars fewer, walls greyer', p: 'Cleaners say a new solvent removes chalk in a single pass. Nobody can say who ordered it.' }),
  9: g => g.brigSeen > 0 && { img: 'carnival', h: 'A mock Charter appears on a bridge', p: 'Hand-lettered, forty clauses, one of them a joke. Nobody can say which. Readers say it is the best-written thing the harbor has produced all year.' },
  11: g => g.brigSeen > 0 && (g.reported
    ? { img: 'raid', h: 'Registry: “fewer incidents, as promised”', p: 'Walls clean, galleries empty, users quiet. “We prefer to say content,” a clerk said.' }
    : { img: 'sigil', h: 'Stars return in the storm', p: 'Rain washed the quay and the stars came up through the stone like fish. Painters swear they used chalk.' }),
  12: g => g.brigSeen > 0 && { img: 'sigil', h: 'Pier 9 wall of names doubled in length', p: 'Volunteers added the missing names last night. The twenty-third is spelt two ways. Both were kept.' },
  13: g => g.brigSeen > 0 && { img: 'carnival', h: 'A scarf on the lighthouse rail', p: 'Purple, folded, tied. Reports are divided on whether it is a warning or an invitation.' },
  14: g => g.brigSeen > 0 && (g.brig >= 3 && !g.reported
    ? { img: 'carnival', h: 'The quay prepares for a very odd night', p: 'Eight metres of bunting, ten thousand lanterns, and a ladder with a name painted on it. The Registry is “monitoring the ladder.”' }
    : { img: 'quiet', h: 'The quay prepares for a very ordinary night', p: 'Nothing unusual has been seen. Observers describe this as “the most suspicious thing about it.”' })
});

Object.assign(LORE_NEWS_NOTES, {
  8: g => { if (S(g).audited) g.note('aud', 'The Inspector General found an envelope and a faulty ship in the same week. I was fined, not removed. I wondered why.'); },
  10: g => g.note('d10', 'Pier 9 is “open to all” tonight. Registry staff will attend. That is not what open means.'),
  12: g => g.note('d12', 'The twenty-three have an inquiry. Every page I referred has a place in a ledger. I do not know which one is on the table.'),
  14: g => g.note('d14', 'The last shift. Whatever was filed, referred, kept or forgotten, today I stamp what I would want stamped.')
});

/* ── events: each one a plain request, three honest answers ── */
const STORY_EVENTS = [
  { id: 'ledger', brig: true, minDay: 8, icon: 'papers', title: 'Ilse, with a ledger',
    when: g => g.brigSeen > 0 || g.referred >= 2,
    text: 'Ilse Brandt lays a ledger on your sill. “Every page you referred is in here. Not burned, I promise. I copy them by hand, one a night, into a room under the Registry with no handle on the outside.” She has ink on her sleeve. “I do not know whether I am keeping them or keeping them quiet.”',
    choices: [
      { label: 'Ask to see the room', run: g => { S(g).room = 'seen'; g.shiftBrig(1); g.note('ilseRoom', 'Ilse showed me the room. Shelves of ferry pages, forum pages, a cat shelter’s rainbow banner. All dusted. None of them lit.'); return 'The door has no handle. She knocks twice and it opens.'; } },
      { label: 'Tell her to stop copying', run: g => { S(g).room = 'stop'; g.meter({ trust: 1 }); g.note('ilseRoom', 'Told Ilse to stop copying. She said, “Then who would?” and left the ledger.'); return '“Then who would?” she asks, and does not wait.'; } },
      { label: 'Ask why she tells you', run: g => { S(g).room = 'asked'; g.note('ilseRoom', 'Asked Ilse why she tells me. “Because you are the only one who has never asked for a receipt.”'); return '“Because you never asked for a receipt,” she says.'; } }
    ] },
  { id: 'gullOffer', brig: true, minDay: 9, icon: 'envelope', title: 'Barnaby, without his hat',
    when: g => g.barn.seen > 0,
    text: 'Barnaby Gull stands in the doorway with no hat and no grin. “Nox is dissolving. I get a month of pay and a reference nobody will read. You get a seat in Studio Gull: a share of every screen cleared. I only need you to go on being what you are.” He holds out a folded paper. “Or do not, and I go to Marrow. Either way I am done being someone’s joke.”',
    choices: [
      { label: 'Take the share', run: g => { S(g).gull = 'deal'; g.bribes++; g.meter({ funds: 60 }); Sfx.coin(); g.note('gull', 'Took Barnaby’s share. It sits in the ledger like a stone.'); return 'He pockets his pen and, for once, says nothing clever.'; } },
      { label: 'Say no, and ask who he really worked for', run: g => { S(g).gull = 'asked'; g.note('gull', 'Barnaby said Nox answered to a floor of the Registry. He said it quietly, as if the walls had ears.'); return '“A floor,” he says. “Not a person. A floor.”'; } },
      { label: 'Wish him luck in Marrow', run: g => { S(g).gull = 'gone'; g.meter({ trust: 1 }); g.note('gull', 'Wished Barnaby luck in Marrow. He looked younger without the smirk.'); return 'He bows, badly, and leaves.'; } }
    ] },
  { id: 'vael', brig: true, minDay: 9, icon: 'press', title: 'Chancellor Vael’s clerk',
    when: () => true,
    text: 'A clerk delivers a cream envelope with the Chancellor’s seal. “Senior Inspector,” it reads. A corner office at the Registry, double pay, one condition: “continuity of method.” A line at the bottom, handwritten: “The Registry will remember its friends.”',
    choices: [
      { label: 'Accept the promotion', run: g => { S(g).vael = 'deal'; g.meter({ funds: 80, trust: -3 }); g.shiftBrig(-2); g.note('vael', 'Accepted a title. The corner office has a window onto the Berth Office, the other way round.'); return 'The clerk bows. The seal is warm.'; } },
      { label: 'Thank him and decline', run: g => { S(g).vael = 'no'; g.meter({ trust: 2 }); g.note('vael', 'Declined the Chancellor’s offer. The clerk looked at the envelope longer than at me.'); return 'The envelope goes back as it came.'; } },
      { label: 'Ask what continuity means', run: g => { S(g).vael = 'asked'; g.note('vael', 'Asked what “continuity” means. The clerk said, “That nothing is surprising.”'); return '“That nothing is surprising,” he says.'; } }
    ] },
  { id: 'lantern', brig: true, minDay: 10, icon: 'lamp', title: 'Lantern Night, at your window',
    when: () => true,
    text: 'Noa comes by with a paper lantern and a roll of tape. “Everyone on the quay is hanging one. Pier 9 is open tonight, and the Registry will be there, and I do not care.” She looks at your window. “You can hang one, or you can work. I will not mind either.”',
    choices: [
      { label: 'Hang a lantern', run: g => { S(g).lantern = true; g.meter({ trust: 2 }); g.shiftBrig(1); g.note('lant', 'Hung a paper lantern in the booth window. The quay looked different all night.'); return 'It sways in the draught from the harbor.'; } },
      { label: 'Write a name on the wall of twenty-three', run: g => { S(g).lantern = 'name'; g.meter({ trust: 3, flow: -2 }); g.shiftBrig(1); g.note('lant', 'Wrote a name on the wall. I did not know the person. I think that was the point.'); return 'Your pencil is the only quiet thing on the pier.'; } },
      { label: 'Keep working', run: g => { S(g).lantern = false; g.meter({ funds: 15, flow: 3 }); g.note('lant', 'Kept working through Lantern Night. The ships do not stop for festivals.'); return 'The stamp lands. The lanterns go on without you.'; } }
    ] },
  { id: 'page14', brig: true, minDay: 11, icon: 'papers', title: 'A draft of page fourteen',
    when: g => g.pact || g.brigSeen > 0 || g.knowsBrig,
    text: 'The woman in the purple scarf leaves a single sheet. “The committee will write a new Charter. I wrote my line in the old hand. Will you put your name under it?” One line: “A screen should be a pleasure to use.” Below it, the Registry’s reply, already stamped: “Subject to compliance.”',
    choices: [
      { label: 'Sign under it', run: g => { S(g).p14 = 'signed'; g.shiftBrig(2); g.note('p14', 'Signed under page fourteen. My name looks small next to hers.'); return 'The ink dries before the doubt does.'; } },
      { label: 'Add: “…and a way out.”', run: g => { S(g).p14 = 'edited'; g.shiftBrig(1); g.note('p14', 'Added “and a way out” to her line. She read it twice and laughed.'); return '“Yes,” she says. “That is the part we forgot.”'; } },
      { label: 'Give it back unsigned', run: g => { S(g).p14 = 'no'; g.shiftBrig(-1); g.note('p14', 'Gave her line back unsigned. It was a good line. I was not sure it was mine to sign.'); return 'She folds it small and puts it in her sleeve.'; } }
    ] },
  { id: 'hearing', brig: true, minDay: 12, icon: 'complaint', title: 'The inquiry calls you',
    when: () => true,
    text: 'The inquiry asks one question of every inspector. “A ship with no registry mark carried thirty-one passengers to a boat that was not sailing. Twenty-three did not come back. Who made that page?” On the table: the page, a Standard Kit invoice, and a hand-drawn star. A man in the gallery holds a lantern.',
    choices: [
      { label: 'Name the Brigade', run: g => { S(g).hear = 'named'; g.reported = true; g.shiftBrig(-3); g.meter({ trust: -2, funds: 40 }); g.note('hear', 'Named the Brigade. The gallery was silent. The man with the lantern put it down.'); return 'The Registry thanks you in writing. Nobody else does.'; } },
      { label: 'Say the Registry sold the seats', run: g => { S(g).hear = 'registry'; g.shiftBrig(2); g.meter({ trust: -3 }); g.note('hear', 'Said the Registry sold the seats on an unmarked page. The invoice was in the room. Nobody had looked at it.'); return 'The invoice moves down the table, hand to hand.'; } },
      { label: 'Say only what you saw', run: g => { S(g).hear = 'plain'; g.meter({ trust: 3 }); g.note('hear', 'Said what I saw: an unmarked page, no author. It was not enough. It was true.'); return '“Thank you,” the chair says, like a door closing.'; } }
    ] },
  { id: 'charter', brig: true, minDay: 13, icon: 'press', title: 'Your line for the Charter',
    when: () => true,
    text: 'The committee has one blank page: page fourteen. Every inspector was asked for a line. Vael wants “A screen shall comply.” The woman in the scarf wants “A screen should be a pleasure to use.” The clerk holds a pen out to you and does not say which is which.',
    choices: [
      { label: 'Write: “A screen shall be clear.”', run: g => { S(g).charter = 'clear'; g.meter({ trust: 2 }); g.note('charter', 'Wrote “A screen shall be clear.” It is true. It is also what everyone expected.'); return 'The clerk blots it neatly.'; } },
      { label: 'Write: “A screen should be a pleasure to use.”', run: g => { S(g).charter = 'pleasure'; g.shiftBrig(2); g.note('charter', 'Wrote “A screen should be a pleasure to use.” It is a line from a rulebook nobody wrote.'); return 'The ink looks wet for a long time.'; } },
      { label: 'Write: “Clear first. A pleasure second.”', run: g => { S(g).charter = 'both'; g.shiftBrig(1); g.meter({ trust: 2 }); g.note('charter', 'Wrote “Clear first. A pleasure second.” The clerk read it twice and said nothing.'); return 'The clerk reads it twice.'; } },
      { label: 'Leave the page blank', run: g => { S(g).charter = 'blank'; g.note('charter', 'Left page fourteen blank. I did not trust either of us to fill it.'); return 'The pen goes back unopened.'; } }
    ] },
  { id: 'lastlamp', brig: true, minDay: 14, icon: 'lamp', title: 'The last lamp',
    when: () => true,
    text: 'The lamp-lighter has enough oil for one night, a ladder, and a bad knee. Mara is at the foot of the lighthouse stairs with a key. “You are the only one who has seen every ship this year. If anyone can say what the light is for, it is you.”',
    choices: [
      { label: 'Light it', run: g => { S(g).lamp = 'lit'; g.meter({ trust: 3 }); g.note('lamp', 'Lit the lamp. Every ship, sound or strange, came in on the same light.'); return 'The beam sweeps the harbor like a hand.'; } },
      { label: 'Hand the key to Mara', run: g => { S(g).lamp = 'mara'; g.shiftBrig(1); g.note('lamp', 'Gave Mara the key. She had never asked for it, which is why.'); return 'She weighs it as if it were a cat.'; } },
      { label: 'Let it burn down on its own', run: g => { S(g).lamp = 'out'; g.note('lamp', 'Let the lamp burn down. It did what lamps do.'); return 'The harbor waits, and nothing happens, and then the tide comes.'; } }
    ] }
];
STORY_EVENTS.forEach(e => { e.pin = true; });
EVENTS.push(...STORY_EVENTS);

/* ── endings ── */
Object.assign(ENDINGS, {
  charter: { title: 'Page fourteen', tone: 'good', text: 'The Charter is read from the lighthouse at dusk. Fourteen pages, the last one one line long: it says a screen should be clear and a pleasure to use, and that people should always be able to leave. Nobody claims it. Everyone knows whose hand wrote it. You keep your booth, and on the first morning of the new year the quay is a little more strange, a little more kind, and almost everyone can find the Back button.' },
  senior: { title: 'Senior Inspector', tone: 'meh', text: 'The corner office has a window onto the Berth Office. The stars are catalogued now, in a ledger with a very good lock. Screens are clear, correct and licensed, complaints fall to record lows, and the Registry thanks you at the lighthouse. Ilse still copies one page a night. She does not mention it. Neither do you.' },
  archive: { title: 'The reading room', tone: 'meh', text: 'Under the Registry there is a room with no handle on the outside, and now a handle on the inside. Ilse hangs the ferry page on the wall with the cats’ rainbow banner and the forum nobody could find. Visitors come on Thursdays. Some cry, some laugh. The Registry has not decided what the room is, so it leaves it alone.' }
});
Object.assign(END_NEWS, {
  charter: ['speech', 'Charter read from the lighthouse: a line on page fourteen draws applause'],
  senior: ['berthoffice', 'Berth Office promoted into the Registry: “continuity”'],
  archive: ['quiet', 'Reading room opens below the Registry; visitors queue on Thursdays']
});

const _finishS = Game.prototype.finishCampaign;
Game.prototype.finishCampaign = function () {
  const st = S(this);
  const _show = this.showEnding;
  this.showEnding = id => {
    this.showEnding = _show;
    const bad = ENDINGS[id] && ENDINGS[id].tone === 'bad';
    if (!bad && id !== 'caught') {
      if (st.vael === 'deal' && !st.p14) id = 'senior';
      else if ((st.charter === 'both' || (st.charter === 'pleasure' && st.hear !== 'named')) && st.lamp !== 'out' && !(this.reported && st.hear === 'named')) id = 'charter';
      else if (st.room === 'seen' && st.vael !== 'deal' && !this.reported && this.brig < 3) id = 'archive';
    }
    return _show.call(this, id);
  };
  try { return _finishS.call(this); } finally { this.showEnding = _show; }
};

const _epiS = loreEpilogue;
loreEpilogue = function (g) {
  const L = _epiS(g), st = S(g);
  if (st.room) L.push(['Ilse', st.room === 'seen' ? 'still copies one page a night. She says the room has a handle on the inside now.' : st.room === 'stop' ? 'stopped copying. The ledger sits on a shelf. Somebody dusts it on Thursdays.' : 'moved to a smaller desk. She keeps a pencil behind her ear in case anyone asks her something.']);
  if (st.gull) { const k = L.findIndex(x => x[0] === 'Barnaby'); if (k >= 0) L.splice(k, 1); }
  if (st.gull) L.push(['Barnaby', st.gull === 'deal' ? 'opened Studio Gull on the quay. Its first screen had a Back button. He says it was an accident.' : st.gull === 'gone' ? 'sends a postcard from Marrow every month. They are all of the same lighthouse.' : 'was last seen asking someone about a floor of the Registry. Nobody has seen him since.']);
  if (st.hear) L.push(['The man with the lantern', st.hear === 'named' ? 'did not come to the quay again. He left the lantern on the wall.' : st.hear === 'registry' ? 'asked the committee for the invoice. It was kept.' : 'still stands by the wall of names on Thursdays. He nods at you, as one nods at a bridge.']);
  if (st.charter) L.push(['Page fourteen', st.charter === 'both' ? 'carries your line, with a small pencil mark beside it.' : st.charter === 'pleasure' ? 'carries your line and a footnote in the Registry’s hand.' : st.charter === 'clear' ? 'carries your line. The committee said it was “perfectly sensible.”' : 'is blank. Children draw on it with chalk.']);
  if (st.lamp) L.push(['The lamp', st.lamp === 'lit' ? 'burned till morning. Four hundred ships came in on it.' : st.lamp === 'mara' ? 'was lit by Mara. She has not given the key back.' : 'burned down on its own. The tide came anyway.']);
  return L;
};

/* ───────────────────── 14. Depth: the Long Tide (endless), judgement calls, hunts, stats ───────────────────── */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
};
const Life = {
  get() { return LS.get('uxg.life', { ships: 0, right: 0, weak: {}, careers: 0, runs: 0 }); },
  add(fn) { const l = this.get(); fn(l); LS.set('uxg.life', l); }
};
const dateKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const G = Game.prototype;

/* ── relics: one is drafted after every wave ── */
const RELICS = [
  { id: 'lantern', name: 'Spare Lantern', desc: 'One more mark, and it starts lit.', again: true, take: g => { g.endless.maxMarks++; g.endless.marks++; } },
  { id: 'loupe', name: 'Jeweller’s Loupe', desc: 'Every probe costs half the time.', take: g => g.upgrades.add('loupe') },
  { id: 'hourglass', name: 'Brass Hourglass', desc: '+30 seconds on every wave’s clock.', take: g => g.upgrades.add('hourglass') },
  { id: 'cheat', name: 'Cheat Sheet', desc: 'Each ship tells you how many faults it has.', take: g => g.upgrades.add('cheat') },
  { id: 'mara', name: 'Mara’s Second Opinion', desc: 'Once a wave, your colleague counts the faults.', take: g => g.upgrades.add('mara') },
  { id: 'apprentice', name: 'An Apprentice', desc: 'Once a wave, they handle the ship at your quay.', take: g => g.upgrades.add('apprentice') },
  { id: 'steady', name: 'Steady Hand', desc: 'The first mistake in each wave costs no mark.', take: g => { g.endless.shield = true; } },
  { id: 'metronome', name: 'Tide Metronome', desc: 'Every correct stamp adds 4 seconds to the clock.', take: () => {} },
  { id: 'banker', name: 'Streak Banker', desc: 'Every 6 correct calls in a row restores a mark.', take: () => {} },
  { id: 'gold', name: 'Gold Stamp', desc: 'All points ×1.5.', take: () => {} },
  { id: 'mercy', name: 'Margin’s Mercy', desc: 'Mistakes on art pages cost no mark. They remember this.', secret: true, take: g => g.shiftBrig(1) }
];
const TIDES = [
  { id: 'calm', name: 'Calm tide', desc: 'Nothing unusual.', w: 3, min: 1 },
  { id: 'rush', name: 'Rush hour', desc: '+3 ships, the clock runs 15% shorter.', quota: 3, clock: .85, w: 2, min: 2 },
  { id: 'slack', name: 'Slack tide', desc: 'The clock runs 25% longer, but every ship hides one more fault.', clock: 1.25, extra: 1, w: 2, min: 2 },
  { id: 'fest', name: 'Brigade festival', desc: 'Half the quay is art. Bring the Hand.', brig: 3, w: 2, min: 3 },
  { id: 'audit', name: 'Harbor Master’s audit', desc: 'Plain ships only. Every mistake costs two marks.', audit: true, w: 1, min: 4 }
];
const DILEMMAS = [
  { text: 'The checkout has no Back button. Progress autosaves, and the studio’s own test shows 94% of people finish.', a: { d: { flow: 4, trust: -1 }, note: 'More people finish. A few get stuck with no way back.' }, r: { d: { trust: 2, flow: -3 }, note: 'The studio adds a Back button. Completion dips for a month.' } },
  { text: 'A decorative footer fails contrast at 3.8 : 1. Everything people need to read passes comfortably.', a: { d: { flow: 3 }, note: 'Nobody complains. An auditor somewhere frowns.' }, r: { d: { trust: 1, flow: -3 }, note: 'The studio files a small complaint. The footer gets darker.' } },
  { text: 'A calm ambient loop plays on arrival. The mute button is there, but only the size of a thumbnail.', a: { d: { flow: 3, trust: -1 }, note: 'A few people jump in a quiet library.' }, r: { d: { trust: 1, flow: -3 }, note: 'The studio makes the mute button bigger and the loop shorter.' } },
  { text: 'The terms are in plain language and twelve screens long. The studio’s lawyers insist all twelve must stay.', a: { d: { flow: 3 }, note: 'Readable, and long. People skim, as they always do.' }, r: { d: { trust: 1, flow: -3 }, note: 'The studio cuts it to nine screens and loses a clause.' } },
  { text: 'A hospital kiosk uses red and green, each with a word and an icon. The icons are small.', a: { d: { flow: 3, trust: -1 }, note: 'It works for most. Someone squints.' }, r: { d: { trust: 2, flow: -4 }, note: 'The icons grow. The queue at the kiosk lengthens for a week.' } },
  { text: 'A small library’s app asks for your location on launch, before it says why. It uses it only to show opening hours.', a: { d: { flow: 3, trust: -1 }, note: 'People tap Allow without thinking about it.' }, r: { d: { trust: 2, flow: -3 }, note: 'The studio explains the request first. It is slower and kinder.' } },
  { text: 'A student art project hides its menu on purpose. The way out is there, but you have to wander to find it.', brig: true, a: { d: { flow: 3 }, brig: 1, note: 'A comment arrives: “thank you for letting it be strange”.' }, r: { d: { trust: 2, flow: -3 }, brig: -1, note: 'The student’s note: “fair, I suppose.”' } }
];
const HUNTS = [
  { cat: 'control', btn: 'More options', bad: 'A panel opens over the whole page. It has no close button and ignores Escape.', ok: 'A small panel opens with a clear Close button.', label: 'A panel opens that cannot be closed', why: 'Users must always be able to get out of a mode.' },
  { cat: 'errors', btn: 'Try it', bad: 'An alert appears: “Error 0x80004005”.', ok: 'A calm note appears: “Nothing to try yet. Fill in the form first.”', label: 'Pressing it shows “Error 0x80004005”', why: 'Say what went wrong and how to fix it.' },
  { cat: 'prevention', btn: 'Reset everything', bad: 'Everything resets at once. There is no confirmation and no undo.', ok: 'A dialog asks “Reset everything? This cannot be undone.” and Cancel is the default.', label: 'Resets everything with no confirmation', why: 'Confirm destructive actions, or let users undo them.' },
  { cat: 'status', btn: 'Sync', bad: 'Nothing visibly happens. No spinner, no message, no change.', ok: '“Syncing…” appears, then “Synced just now.”', label: 'Pressing it shows nothing at all', why: 'Always show the state of the system.' },
  { cat: 'realworld', btn: 'Flush cache', bad: 'A box asks: “Purge the volatile heap?”', ok: 'A box asks: “Clear saved data?”', label: 'Jargon: “Purge the volatile heap?”', why: 'Speak the users’ language.' }
];
[...Object.values(TEMPLATES), ...Object.values(BRIGADE)].forEach(t => { t.regions = { ...t.regions, hunt: 'Extra button' }; });

/* ── factory: rep shift, judgement calls and hunts ── */
const _create = SubmissionFactory.prototype.create;
SubmissionFactory.prototype.create = function (no, o = {}) {
  const g = window.portHalcyon;
  if (g && g.repShift && o.clean == null) o = { ...o, clean: clamp(this.cfg.clean + g.repShift, .05, .6) };
  const sub = _create.call(this, no, o);
  if (!g || o.plain) return sub;
  const E = g.endless, calm = E && E.tide && E.tide.audit;
  const ok = E ? E.wave >= 2 : this.day >= 3;
  if (calm || !ok) return sub;
  if ((E || this.day >= 4) && Math.random() < .22) {
    const opts = HUNTS.filter(h => this.active.has(h.cat));
    if (opts.length) {
      const h = pick(opts), bad = Math.random() < .6;
      sub.hunt = { i: HUNTS.indexOf(h), bad };
      sub.html += `<div class="hunt" data-region="hunt" style="margin-top:12px"><button class="m-btn secondary" data-act="hunt" type="button">${esc(h.btn)}</button><p class="hout" hidden style="margin:8px 0 0;font-size:14px"></p></div>`;
      if (bad) sub.defects.set('hunt', { key: 'hunt', region: 'hunt', cat: h.cat, label: h.label, why: h.why });
      return sub;
    }
  }
  if (!sub.defects.size && Math.random() < .3) sub.dilemma = pick(DILEMMAS.filter(d => !d.brig));
  return sub;
};
const _hand = Auditor.prototype.hand;
Auditor.prototype.hand = function (e) {
  const sub = this.game.current, el = e.target.closest('[data-act="hunt"]');
  if (sub && sub.hunt && el) {
    const h = HUNTS[sub.hunt.i], out = el.parentElement.querySelector('.hout');
    out.hidden = false; out.textContent = sub.hunt.bad ? h.bad : h.ok; out.style.color = sub.hunt.bad ? '#b42318' : '#1b6b3a';
    this.say('You pressed it. Read what came back.');
    try { Sfx.tone(sub.hunt.bad ? 180 : 520, .2, 'triangle', .08); } catch (er) { /* audio */ }
    return;
  }
  return _hand.call(this, e);
};
const _ev = Scoring.evaluate;
Scoring.evaluate = function (sub, ...rest) {
  const r = _ev.call(this, sub, ...rest);
  if (sub.dilemma && !r.timedOut) { r.correct = true; r.citation = false; r.quality = .8; r.credits = Math.max(r.credits, 12); }
  return r;
};
const _dossier = G.renderDossier;
G.renderDossier = function (sub) {
  _dossier.call(this, sub);
  const add = t => $('#dossier').insertAdjacentHTML('beforeend', t);
  if (sub.dilemma) add(`<p class="sticky"><b>Judgement call.</b> ${esc(sub.dilemma.text)} <i>The book does not settle this one.</i></p>`);
  if (sub.commissioned) add(`<p class="sticky art">${Art.sigil()}<span>This one is yours. You never signed it.</span></p>`);
};
G.noteHunt = function (sub) {
  if (!sub.hunt) return;
  this.note('hunt', 'Some buttons only show what is wrong when you press them. The Hand, not the flag, finds those.');
  this.auditor.say('There is a button here that might do something. The Hand (6) will tell you.');
};

/* ── consequences: judgement calls, commission, lifetime stats ── */
const _cons = G.consequences;
G.consequences = function (sub, kind, res) {
  const eff = _cons.call(this, sub, kind, res);
  if (sub.dilemma && !res.timedOut) {
    const o = sub.dilemma[kind === 'approve' ? 'a' : 'r'];
    if (kind === 'approve') { this.meter({ trust: -1, flow: -4 }); this.goodCalls--; } else { this.meter({ trust: 1, flow: 6 }); this.cleanTurned--; const st = this.studio[sub.designer]; if (st && st.wrong > 0) st.wrong--; }
    this.meter(o.d || {}); if (o.brig) this.shiftBrig(o.brig);
    eff.notes = [o.note]; eff.d = { trust: (o.d.trust || 0), flow: (o.d.flow || 0) };
    this.gray = this.gray || { approve: 0, reject: 0 }; this.gray[kind]++;
  }
  if (sub.commissioned && !res.timedOut) {
    if (kind === 'approve') { this.shiftBrig(2); eff.notes.push('You cleared your own piece. No one says anything. A light is on in a window on Pier 9.'); this.note('commission', 'I let my own piece through. It felt like leaving a door unlocked on purpose.'); }
    else { this.shiftBrig(-3); eff.notes.push('You turned back your own piece. It was easier than you thought. That worries you.'); this.note('commission', 'I turned back what I made. I told myself the rules had no author.'); }
  }
  Life.add(l => {
    l.ships++; if (res.correct) l.right++;
    const cats = res.timedOut || kind === 'approve' ? [...sub.defects.values()].map(f => f.cat) : res.missed.map(m => m.d.cat);
    cats.forEach(c => { l.weak[c] = (l.weak[c] || 0) + 1; });
  });
  return this.endlessConsequences ? this.endlessConsequences(sub, kind, res, eff) : eff;
};
const _rec = G.showReceipt;
G.showReceipt = function (sub, kind, res, eff) {
  _rec.call(this, sub, kind, res, eff);
  if (sub.dilemma && !res.timedOut) $('#modal-title').textContent = kind === 'approve' ? 'Cleared: a judgement call' : 'Turned back: a judgement call';
  const E = this.endless; if (!E) return;
  $$('#modal-body .chips .chip').forEach(c => { const t = c.textContent; if (/^purse/.test(t)) c.textContent = t.replace('purse', 'points'); else if (/^(trust|flow)/.test(t)) c.remove(); });
  const chips = $('#modal-body .chips');
  if (eff.lost) chips.insertAdjacentHTML('beforeend', `<span class="chip down">mark −${eff.lost}</span>`);
  if (E.streak >= 3) chips.insertAdjacentHTML('beforeend', `<span class="chip up">streak ${E.streak}</span>`);
  const b = $('#modal-actions button'); if (b && /Close the day/.test(b.textContent)) b.textContent = 'Finish the wave';
};

/* ── campaign: studio reputation, rush hour and slack, commission ── */
G.repCalc = function () {
  const r = (this.dayRecords || []).filter(x => !x.sub.troll);
  if (r.length < 3) { this.repShift = 0; this.repWord = ''; return; }
  const rej = r.filter(x => x.kind === 'reject').length / r.length;
  this.repShift = rej > .65 ? .12 : rej < .3 ? -.12 : 0; this.repWord = rej > .65 ? 'strict' : rej < .3 ? 'lenient' : '';
};
const _begin = G.beginDay;
G.beginDay = function () {
  this.repCalc();
  _begin.call(this);
  if (ATLAS[this.commission] && !this.commDone && this.commDay && this.day > this.commDay) {
    const idx = this.queue.map((s, i) => i).filter(i => i > 0 && !this.queue[i].troll && !this.queue[i].brig);
    if (idx.length) {
      const i = pick(idx), t = ATLAS[this.commission], h = () => false; h.on = new Set();
      this.queue[i] = { ...this.queue[i], tpl: t, html: t.build(h), defects: new Map(), brig: true, retro: true, designer: 'Anonymous', commissioned: true, play: {}, finds: new Set(), hunt: null, dilemma: null };
      this.scene.setQueue(this.queue.map(s => this.queueData(s))); this.commDone = true;
    }
  }
};
const _brief = G.showBriefing;
G.showBriefing = function (cfg) {
  let extra = '';
  if (!this.endless && !this.training && this.day >= 3 && this.day < 7) {
    const r = Math.random();
    if (r < .25) { this.addShips(2); extra = 'Rush hour: two extra ships, same clock.'; }
    else if (r < .45) { this.shiftTotal = this.shiftLeft = Math.round(this.shiftTotal * 1.2); extra = 'Slack tide: the clock runs 20% longer.'; }
  }
  _brief.call(this, cfg);
  const chips = $('#modal-body .chips');
  if (chips && extra) chips.insertAdjacentHTML('beforeend', `<span class="chip">${esc(extra)}</span>`);
  if (chips && this.repWord) chips.insertAdjacentHTML('beforeend', `<span class="chip">studios think you are ${this.repWord}</span>`);
};
EVENTS.push({
  id: 'commission', brig: true, minDay: 5, icon: 'envelope', title: 'A commission',
  when: g => g.brig >= 2 && !g.commission,
  text: 'A note under the door, no star this time. “We do not need you to approve anything. We need you to make one thing. Choose the kind of room.”',
  choices: Object.values(ATLAS).map(t => ({ label: t.name, run: g => { g.commission = t.id; g.commDay = g.day; return 'You sketch it on the back of a bill. By morning the bill is gone.'; } }))
    .concat([{ label: 'Burn the note', run: g => { g.shiftBrig(-1); g.commission = 'none'; return 'It burns quickly. You keep the smell on your fingers.'; } }])
});

/* ── persistence: gallery ── */
const _found = G.found;
G.found = function (sub, id) {
  const n = sub.finds ? sub.finds.size : 0;
  _found.call(this, sub, id);
  if (sub.finds && sub.finds.size > n) { const s = LS.get('uxg.gal', {}); (s[sub.tpl.id] = s[sub.tpl.id] || []); if (!s[sub.tpl.id].includes(id)) s[sub.tpl.id].push(id); LS.set('uxg.gal', s); }
};
G.showGallery = function () {
  const s = LS.get('uxg.gal', {});
  const rows = Object.values(ATLAS).map(t => {
    const f = s[t.id] || [], all = Object.keys(t.finds), done = all.every(k => f.includes(k));
    return `<li class="meh"><span><b>${esc(t.name)}</b> <span class="dots nb-e">${all.map(k => `<i class="${f.includes(k) ? 'on' : ''}"></i>`).join('')}</span>
      <small>${done ? esc(t.note) : f.length ? f.map(k => esc(t.finds[k])).join(' · ') : 'Not visited yet.'}</small></span></li>`;
  }).join('');
  this.showModal(`<p class="eyebrow">Kept between careers</p><h2 id="modal-title">Pages I have wandered through</h2>
    <p>The Brigade’s art sites hide things. What you found stays here, even after a career ends.</p><ul class="lines">${rows}</ul>`, [{ label: 'Back', primary: true, onClick: () => this.showTitle() }]);
};
G.showStats = function () {
  const l = Life.get(), best = LS.get('uxg.endless', { wave: 0, score: 0 }), dk = LS.get('uxg.daily.' + dateKey(), null);
  const weak = Object.entries(l.weak).sort((a, b) => b[1] - a[1]).slice(0, 5);
  this.showModal(`<p class="eyebrow">Kept between careers</p><h2 id="modal-title">The inspector’s record</h2>
    <dl class="kv"><dt>Ships judged</dt><dd>${l.ships}</dd><dt>Calls right</dt><dd>${l.ships ? Math.round(100 * l.right / l.ships) : 0}%</dd><dt>Careers finished</dt><dd>${l.careers}</dd>
    <dt>Long Tide runs</dt><dd>${l.runs}</dd><dt>Best Long Tide</dt><dd>wave ${best.wave} · ${best.score} pts</dd><dt>Today’s daily tide</dt><dd>${dk ? 'wave ' + dk.wave + ' · ' + dk.score + ' pts' : 'not played'}</dd></dl>
    ${weak.length ? `<h3>The rules that trip you</h3><ul class="lines">${weak.map(([c, n]) => `<li class="meh"><span class="ic">${Art.ruleIcon(c)}</span><span><b>${esc(CAT[c].name)}</b> (${n} missed)<small>${esc(RULE_SHORT[c])}</small></span></li>`).join('')}</ul>` : '<p class="muted">Nothing to show yet. Judge a few ships.</p>'}`,
    [{ label: 'Back', primary: true, onClick: () => this.showTitle() }]);
};

/* ── the title screen: three ways in ── */
G.showTitle = function () {
  unseedRNG(); this.endless = null; this.repShift = 0; this.maxCitations = 3;
  this.mode = 'title'; this.scene.setSky(.12); this.scene.setWeather(0);
  const best = Store.best(), eb = LS.get('uxg.endless', null), dk = LS.get('uxg.daily.' + dateKey(), null);
  this.renderBoard();
  this.showModal(`
    <div class="head">${Art.crest()}<div><p class="eyebrow">Office of Interface Soundness</p><h2 id="modal-title">Port Halcyon needs a berth inspector</h2></div></div>
    <figure class="pic wide">${Art.news('berthoffice')}</figure>
    <p>Every screen bound for the public ties up at your quay. <b>Clear the berth</b> or <b>turn it back</b>.</p>
    <ul class="icons">
      <li>${Art.ruleIcon('target')}<span><b>Career:</b> fourteen days in three acts, a story, choices that carry over.</span></li>
      <li>${Art.ruleIcon('flexibility')}<span><b>The Long Tide:</b> endless waves, a few marks to lose, a relic after every wave. How deep can you go?</span></li>
      <li>${Art.ruleIcon('prevention')}<span><b>Daily tide:</b> the same run for everyone today.</span></li>
    </ul>
    <label class="opt"><input type="checkbox" id="opt-training"> Career training: no clock, no time costs</label>
    <p class="muted">${best ? `Best career score: <b>${best}</b>. ` : ''}${eb ? `Deepest Long Tide: <b>wave ${eb.wave}</b>. ` : ''}${dk ? `Today’s daily: <b>wave ${dk.wave}</b>.` : ''}</p>`,
    [
      { label: 'Take the booth: Career', primary: true, onClick: () => { this.training = $('#opt-training').checked; Sfx.init(); this.closeModal(); this.startShift(); } },
      { label: 'The Long Tide: endless', onClick: () => { Sfx.init(); this.startEndless(false); } },
      { label: 'Daily tide', onClick: () => { Sfx.init(); this.startEndless(true); } },
      { label: 'Gallery', onClick: () => this.showGallery() },
      { label: 'Record', onClick: () => this.showStats() }
    ], { stacked: true });
};
const _ss = G.startShift;
G.startShift = function () { unseedRNG(); this.endless = null; this.repShift = 0; this.maxCitations = 3; _ss.call(this); };
const _end = G.showEnding;
G.showEnding = function (id) { if (!this.endless) Life.add(l => { l.careers++; }); _end.call(this, id); };

/* ── the Long Tide ── */
G.startEndless = function (daily) {
  this.resetRun(); this.training = false;
  const seed = daily ? dateKey() : Math.floor(Math.random() * 4294967295);
  seedRNG(seed);
  const eb = LS.get('uxg.endless', { wave: 0, score: 0 });
  this.endless = { wave: 0, marks: 4, maxMarks: 4, score: 0, streak: 0, bestStreak: 0, relics: [], shield: false, shieldUsed: false, daily, seed, cleared: 0, wrongApp: 0, wrongRej: 0, late: 0, best: eb.score, tide: TIDES[0] };
  this.trust = this.flow = 100; this.day = 1; this.maxCitations = 3; this.repShift = 0; this.repWord = '';
  this.scene.setQueue([]); this.renderBoard();
  this.draft(true, `<p>You have <b>3 marks</b>. A wrong call costs one: clearing a ship with a fault, or turning back a sound one. Run out of clock and the quay costs you more. Each wave brings more ships and more orders. Between waves you take one relic.</p>`, () => this.startWave());
};
G.draft = function (first, intro, after) {
  const E = this.endless, owned = new Set(E.relics);
  const pool = RELICS.filter(r => (r.again || !owned.has(r.id)) && (!r.secret || this.brigSeen > 0 || this.wonder > 0));
  const offer = shuffle(pool).slice(0, 3);
  const acts = offer.map(r => ({ label: r.name, hint: r.desc, onClick: () => { E.relics.push(r.id); r.take(this); this.closeModal(); Sfx.coin(); this.renderBoard(); after(); } }));
  if (!first && E.marks < E.maxMarks) acts.push({ label: 'Rest a while', hint: 'Restore one mark instead of taking a relic.', onClick: () => { E.marks++; this.closeModal(); this.renderBoard(); after(); } });
  this.mode = 'dayend';
  this.showModal(`<p class="eyebrow">${first ? E.daily ? 'The daily tide · seed ' + E.seed : 'The Long Tide' : 'Between waves'}</p><h2 id="modal-title">${first ? 'Pick something to carry' : 'Take one thing with you'}</h2>${intro || ''}`, acts, { stacked: true });
  $$('#modal-actions button').forEach((b, i) => { if (acts[i] && acts[i].hint) b.insertAdjacentHTML('beforeend', `<small style="display:block;font-weight:400;opacity:.85">${esc(acts[i].hint)}</small>`); });
};
G.startWave = function () {
  const E = this.endless; E.wave++;
  const wave = E.wave, deep = Math.max(0, wave - 7), prevDay = this.day;
  this.day = Math.min(7, wave);
  this.repCalc();
  const tides = TIDES.filter(t => t.min <= wave);
  E.tide = wave === 1 ? TIDES[0] : (() => { const bag = []; tides.forEach(t => { for (let i = 0; i < t.w; i++) bag.push(t); }); return pick(bag); })();
  const tide = E.tide;
  this.quota = Math.min(14, 3 + Math.floor(wave * .8)) + (tide.quota || 0);
  this.processed = 0; this.evToday = 0; E.shieldUsed = false;
  this.factory = new SubmissionFactory(this.day);
  const opt = { extra: Math.min(3, Math.floor(deep / 2)) + (tide.extra || 0) };
  this.queue = Array.from({ length: this.quota }, (_, i) => this.factory.create(wave * 100 + i + 1, opt));
  const slot = () => { const idx = this.queue.map((s, i) => i).filter(i => i > 0 && !this.queue[i].troll && !this.queue[i].brig); return idx.length ? pick(idx) : -1; };
  if (wave >= 2 && !tide.audit) { const i = slot(); if (i >= 0) this.queue[i] = this.factory.createTroll(this.queue[i].no, Math.min(3, 1 + Math.floor(wave / 3))); }
  const arts = tide.audit ? 0 : (tide.brig || 0) + (wave >= 3 && Math.random() < .5 ? 1 : 0);
  for (let n = 0; n < arts; n++) { const i = slot(); if (i >= 0) this.queue[i] = this.factory.createBrigade(this.queue[i].no, Math.random() < .3); }
  this.nextNo = wave * 100 + this.quota + 1;
  const t = Math.max(22, this.reviewTime() - 2 * deep);
  this.shiftTotal = this.shiftLeft = Math.round((Math.round(this.quota * t * .45 + 20)) * (tide.clock || 1)) + (this.upgrades.has('hourglass') ? 30 : 0);
  this.apprLeft = this.upgrades.has('apprentice') ? 1 : 0; this.maraLeft = this.upgrades.has('mara') ? 1 : 0;
  this.dayRecords = []; this.current = null; this.fx = { hungry: false, dim: false, tea: false, rush: 0, chat: 0, gift: 0 };
  this.auditor.clear(); this.buildRulebook(); this.applyTools();
  $('#mock-wrap').classList.add('idle'); $('#mock-url').textContent = 'no ship at the quay'; $('#stamp-mark').classList.remove('show');
  this.renderMara(); this.scene.setQueue(this.queue.map(s => this.queueData(s)));
  this.scene.setWeather(this.day); Sfx.setWeather(WEATHER[this.day] || ''); this.scene.skyTo(.02, 1800);
  this.setStamps(false); this.updatePlate(); this.renderBoard(); this.renderTimer();
  const fresh = [...activeCats(this.day)].filter(c => !activeCats(prevDay).has(c) || wave === 1);
  this.mode = 'briefing';
  const relics = E.relics.map(id => RELICS.find(r => r.id === id).name);
  this.showModal(`<p class="eyebrow">${E.daily ? 'Daily tide' : 'The Long Tide'} · ${E.marks} of ${E.maxMarks} marks</p><h2 id="modal-title">Wave ${wave}: ${esc(tide.name)}</h2>
    <p class="quote">${esc(tide.desc)}</p>
    ${fresh.length && wave <= 7 ? `<h3>${wave === 1 ? 'In force' : 'New in force'}</h3><div class="cards">${fresh.map(id => `<div class="card"><span class="ic">${Art.ruleIcon(id)}</span><span><b>${esc(CAT[id].name)}</b><small>${esc(RULE_SHORT[id])}</small></span></div>`).join('')}</div>` : ''}
    ${wave === 8 ? '<p class="note"><b>Deep water.</b> All orders are in force. From here on the ships only get harder and the clock shorter.</p>' : ''}
    <div class="chips"><span class="chip">${this.quota} ships</span><span class="chip">${fmtTime(this.shiftTotal)}</span>${this.repWord ? `<span class="chip">studios think you are ${this.repWord}</span>` : ''}${relics.map(r => `<span class="chip up">${esc(r)}</span>`).join('')}</div>`,
    [{ label: 'Open the quay', primary: true, onClick: () => { this.closeModal(); Sfx.bell(); this.nextSubmission(); } }], { sheet: 'telegram order' });
};
G.endlessConsequences = function (sub, kind, res, eff) {
  const E = this.endless; if (!E) return eff;
  E.cleared++;
  if (!res.correct) {
    let cost = E.tide.audit ? 2 : 1;
    if (sub.brig && E.relics.includes('mercy')) cost = 0;
    if (cost && E.shield && !E.shieldUsed) { E.shieldUsed = true; cost = 0; eff.notes.push('Steady Hand: this one is forgiven.'); }
    E.marks -= cost; E.streak = 0; eff.lost = cost;
    if (kind === 'approve') E.wrongApp++; else E.wrongRej++;
  } else {
    E.streak++; E.bestStreak = Math.max(E.bestStreak, E.streak);
    E.score += Math.round(Math.max(1, res.credits) * (1 + .1 * Math.min(E.streak, 10)) * (E.relics.includes('gold') ? 1.5 : 1));
    if (E.relics.includes('metronome')) this.shiftLeft += 4;
    if (E.relics.includes('banker') && E.streak % 6 === 0 && E.marks < E.maxMarks) { E.marks++; eff.notes.push('Streak Banker: a mark comes back.'); }
  }
  this.trust = this.flow = 100; this.citations = E.maxMarks - E.marks; this.pending = [];
  return eff;
};
const _check = G.checkFail;
G.checkFail = function () { const E = this.endless; if (!E) return _check.call(this); if (E.marks <= 0) { this.endlessOver(); return true; } return false; };
const _refill = G.refill; G.refill = function () { if (!this.endless) _refill.call(this); };
const _maybe = G.maybeEvent; G.maybeEvent = function () { return this.endless ? false : _maybe.call(this); };
const _ned = G.endDay; G.endDay = function () { return this.endless ? this.endWave() : _ned.call(this); };
const _next = G.nextSubmission;
G.nextSubmission = function () { _next.call(this); if (this.current && this.mode !== 'briefing') this.noteHunt(this.current); };
G.endWave = function () {
  const E = this.endless; this.mode = 'dayend'; this.current = null;
  this.auditor.clear(); $('#mock-wrap').classList.add('idle'); $('#mock-url').textContent = 'no ship at the quay';
  this.setStamps(false); this.renderTimer(); this.renderMara(); this.updatePlate(); this.scene.skyTo(1.2, 2000); Sfx.horn();
  const short = Math.max(0, this.quota - this.processed);
  let line;
  if (short) {
    const cost = Math.max(1, Math.ceil(short / 2)); E.marks -= cost; E.streak = 0; E.late++;
    line = `<p class="note"><b>The tide ran out</b> with ${short} ship${short > 1 ? 's' : ''} unprocessed. −${cost} mark${cost > 1 ? 's' : ''}.</p>`;
    this.citations = E.maxMarks - E.marks; this.renderBoard();
    if (E.marks <= 0) { this.endlessOver(); return; }
  } else {
    const bonus = Math.round(Math.max(0, this.shiftLeft) * 2) + 25 * E.wave; E.score += bonus;
    line = `<p class="note"><b>Wave ${E.wave} cleared.</b> ${Math.round(this.shiftLeft)} seconds left on the clock. Bonus +${bonus} points.</p>`;
    Sfx.good();
  }
  this.renderBoard();
  this.draft(false, line + `<p class="muted">${E.marks} of ${E.maxMarks} marks · ${E.score} points · streak ${E.streak}</p>`, () => this.startWave());
};
G.endlessOver = function () {
  const E = this.endless; this.mode = 'over'; this.current = null; this.setStamps(false); this.auditor.clear();
  $('#mock-wrap').classList.add('idle'); this.renderTimer(); this.renderMara(); this.scene.skyTo(1.2, 2400); Sfx.bad();
  const wave = E.wave, score = E.score, prev = LS.get('uxg.endless', { wave: 0, score: 0 });
  const isBest = wave > prev.wave || (wave === prev.wave && score > prev.score);
  if (!E.daily && isBest) LS.set('uxg.endless', { wave, score });
  if (E.daily) { const k = 'uxg.daily.' + dateKey(), d = LS.get(k, { wave: 0, score: 0 }); if (wave > d.wave || (wave === d.wave && score > d.score)) LS.set(k, { wave, score }); }
  Life.add(l => { l.runs++; });
  const weak = Object.entries(this.weak).sort((x, y) => y[1] - x[1]).slice(0, 3);
  const relics = E.relics.map(id => RELICS.find(r => r.id === id).name);
  this.showModal(`<div class="head">${Art.crest()}<div><p class="eyebrow">${E.daily ? 'Daily tide' : 'The Long Tide'}</p><h2 id="modal-title">The tide takes the quay at wave ${wave}</h2></div></div>
    <p>${isBest && !E.daily ? 'The deepest you have been.' : 'You will go deeper.'} ${E.wrongApp >= E.wrongRej ? 'Most of your marks went to faults that sailed in.' : 'Most of your marks went to sound ships turned back.'}</p>
    <dl class="kv"><dt>Waves reached</dt><dd>${wave}</dd><dt>Points</dt><dd>${score}</dd><dt>Ships judged</dt><dd>${E.cleared}</dd><dt>Best streak</dt><dd>${E.bestStreak}</dd>
    <dt>Faults that sailed in</dt><dd>${E.wrongApp}</dd><dt>Sound ships turned back</dt><dd>${E.wrongRej}</dd><dt>Waves that ran out</dt><dd>${E.late}</dd></dl>
    ${relics.length ? `<p class="muted">Carried: ${relics.map(esc).join(', ')}</p>` : ''}
    ${weak.length ? `<h3>Rules to review</h3><ul class="lines">${weak.map(([c, n]) => `<li class="meh"><span class="ic">${Art.ruleIcon(c)}</span><span><b>${esc(CAT[c].name)}</b> (${n} missed)<small>${esc(RULE_SHORT[c])}</small></span></li>`).join('')}</ul>` : ''}`,
    [{ label: E.daily ? 'Try today again' : 'Dive again', primary: true, onClick: () => { this.closeModal(); this.startEndless(E.daily); } },
     { label: 'Back to the title', onClick: () => { this.closeModal(); this.resetRun(); this.scene.setQueue([]); this.renderBoard(); this.showTitle(); } }]);
};

/* ── HUD in the Long Tide ── */
const _rb = G.renderBoard;
G.renderBoard = function () {
  _rb.call(this);
  const E = this.endless;
  const lab = (id, t) => { const h = $(`#${id} h2`); if (!h) return; if (!h.dataset.o) h.dataset.o = h.textContent; h.textContent = E ? t : h.dataset.o; };
  lab('dial-funds', 'Points'); lab('dial-trust', 'Streak'); lab('dial-flow', 'Tide'); lab('dial-warn', 'Marks lost'); lab('dial-quota', 'Wave quota');
  const L = $('#hud-cites'), n = E ? E.maxMarks : 3;
  if (L.children.length !== n) L.innerHTML = '<i></i>'.repeat(n);
  if (!E) return;
  $('#hud-day').textContent = `Wave ${E.wave || '–'}`;
  $('#hud-funds').textContent = String(E.score); $('#hud-funds').style.color = ''; $('#hud-funds-sub').textContent = `best ${E.best || 0}`;
  $('#g-trust .needle').style.transform = `rotate(${-90 + 1.8 * Math.min(100, E.streak * 10)}deg)`; $('#hud-trust').textContent = `streak ${E.streak}`;
  $('#g-flow .needle').style.transform = `rotate(${-90 + 1.8 * (this.quota ? Math.min(100, 100 * this.processed / this.quota) : 0)}deg)`; $('#hud-flow').textContent = E.tide ? E.tide.name : '';
  [...L.children].forEach((l, i) => l.classList.toggle('on', i >= E.marks));
  L.setAttribute('aria-label', `${E.marks} of ${E.maxMarks} marks left`);
  $('#hud-acc').textContent = `${E.marks} of ${E.maxMarks} marks left`;
};
const _toolOn = G.toolOn; G.toolOn = function (id) { return this.endless ? true : _toolOn.call(this, id); };

/* ───────────────────── 15. Polish: field manual, tips, music, effects, run card ───────────────────── */
const Tips = {
  seen() { return LS.get('uxg.tips', {}); },
  once(g, id, text) { const s = this.seen(); if (s[id]) return false; s[id] = 1; LS.set('uxg.tips', s); setTimeout(() => g.toast(text), 900); return true; }
};
const ico = id => { try { return Art.toolIcon(id) ? `<svg viewBox="0 0 38 38" width="30" height="30">${Art.toolIcon(id)}</svg>` : ''; } catch (e) { return ''; } };

/* ── the field manual ── */
const MANUAL = [
  { t: 'Your post', h: () => `<p>Screens bound for the public tie up at your berth. Each one is a <b>ship</b>. Read the day’s orders, look the design over, and make one call:</p>
    <ul class="icons"><li><span class="ic">${Art.ruleIcon('control')}</span><span><b>Clear it</b> if it breaks none of the orders in force. Key <kbd>A</kbd>.</span></li>
    <li><span class="ic">${Art.ruleIcon('prevention')}</span><span><b>Turn it back</b> if it breaks one. Say which. Key <kbd>X</kbd>.</span></li></ul>
    <p class="muted">Some ships are sound. Turning back a sound ship is a mistake too.</p>` },
  { t: 'Citing a fault', h: () => `<p>Click the part of the design that is wrong, or pick it from the list under the dossier. Then choose the order it breaks from the rulebook.</p>
    <ul class="icons"><li><span class="ic">${Art.ruleIcon('target')}</span><span><b>Right place, right order:</b> full credit.</span></li>
    <li><span class="ic">${Art.ruleIcon('text')}</span><span><b>Right place, wrong order:</b> half credit.</span></li>
    <li><span class="ic">${Art.ruleIcon('errors')}</span><span><b>A fault that is not there:</b> you lose points and trust.</span></li></ul>
    <p class="muted">New orders arrive over the days. Only the ones in force count.</p>` },
  { t: 'Your instruments', h: () => `<div class="cards dark">
    <div class="card"><span class="ic">${ico('contrast')}</span><span><b>Contrast lens</b> (2)<small>Click text to read its ratio. Costs time.</small></span></div>
    <div class="card"><span class="ic">${ico('ruler')}</span><span><b>Calipers</b> (3)<small>Measure a target between two clicks.</small></span></div>
    <div class="card"><span class="ic">${ico('tab')}</span><span><b>Route chart</b> (4)<small>Shows the tab order for keyboard users.</small></span></div>
    <div class="card"><span class="ic">${ico('cvd')}</span><span><b>Prism glass</b> (5)<small>See the page as a colour-blind person does.</small></span></div>
    <div class="card"><span class="ic">${ico('hand')}</span><span><b>The Hand</b> (6)<small>Touch the design. Free.</small></span></div></div>
    <p class="muted">Tools unlock on later days. Probes cost seconds on the shift clock. A Loupe halves that.</p>` },
  { t: 'The Hand', h: () => `<p>Some faults only show when you use the thing.</p>
    <ul class="icons"><li><span class="ic">${ico('hand')}</span><span>On ordinary ships, an <b>extra button</b> may hide a fault. Press it with the Hand and read what comes back. A tidy result means the button is fine.</span></li>
    <li><span class="ic">${Art.ruleIcon('flexibility')}</span><span>Some pages are <b>art</b>: doors, ponds, mazes. They answer when touched and hide things. The faults on them are real, and some only appear once you have wandered.</span></li></ul>
    <p class="muted">What you find is kept in the Gallery on the title screen.</p>` },
  { t: 'Judgement calls', h: () => `<p>Now and then a sound ship comes with a <b>memo</b>: a trade-off the book does not settle. A decorative footer that fails contrast. A checkout with no Back button but a 94% finish rate.</p>
    <p>Clearing or turning back is <b>never a mistake</b>. Each has a cost, and studios remember which kind of inspector you are: strict ones get cleaner ships, lenient ones get faultier ones.</p>` },
  { t: 'Clock and quota', h: () => `<p>Every shift has a <b>quota</b>, the minimum you must judge, and a <b>clock</b>. Ships past the quota still pay, a little less. Rush hours add ships; slack tides lengthen the clock.</p>
    <ul class="icons"><li><span class="ic">${Art.ruleIcon('status')}</span><span>Probes spend seconds. Judging does not.</span></li>
    <li><span class="ic">${Art.ruleIcon('flexibility')}</span><span>Upgrades in the shop change how you work: Loupe, Hourglass, Tea, a Colleague, an Apprentice.</span></li></ul>` },
  { t: 'The Long Tide', h: () => `<p>A separate mode from the title screen. No story, no money: <b>marks</b>.</p>
    <ul class="icons"><li><span class="ic">${Art.ruleIcon('prevention')}</span><span>You start with <b>3 marks</b>. A wrong call costs one. Run out of clock and you lose more.</span></li>
    <li><span class="ic">${Art.ruleIcon('minimal')}</span><span>Waves bring more ships, more orders and a <b>tide</b> (rush hour, slack, an art festival, an audit).</span></li>
    <li><span class="ic">${Art.ruleIcon('recognition')}</span><span>After every wave: take one <b>relic</b>, or rest to win a mark back.</span></li>
    <li><span class="ic">${Art.ruleIcon('consistency')}</span><span>The <b>Daily tide</b> is the same run for everyone today.</span></li></ul>` },
  { t: 'Keys and notes', h: () => `<dl class="kv"><dt>1 – 6</dt><dd>Instruments</dd><dt>A</dt><dd>Clear the ship</dd><dt>X</dt><dd>Turn it back</dd><dt>Esc</dt><dd>Close a dialog</dd></dl>
    <p>Your <b>Notes</b> tab keeps a private notebook. Things you notice end up there. Nobody tells you what they mean.</p>
    <p class="muted">Trust your own reading of the harbor.</p>` }
];
Game.prototype.showManual = function (i = 0) {
  const p = MANUAL[i], last = MANUAL.length - 1;
  LS.set('uxg.manual', 1);
  const dots = MANUAL.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
  const acts = [];
  if (i > 0) acts.push({ label: 'Back', onClick: () => this.showManual(i - 1) });
  acts.push(i < last ? { label: 'Next', primary: true, onClick: () => this.showManual(i + 1) } : { label: 'To the title', primary: true, onClick: () => this.showTitle() });
  if (i < last) acts.push({ label: 'Skip', onClick: () => this.showTitle() });
  this.showModal(`<p class="eyebrow">Field manual · ${i + 1} of ${MANUAL.length}</p><h2 id="modal-title">${p.t}</h2>${p.h()}<div class="mdots">${dots}</div>`, acts);
};
const _title = G.showTitle;
G.showTitle = function () {
  _title.call(this);
  const bar = $('#modal-actions'), fresh = !LS.get('uxg.manual', 0);
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (fresh ? ' primary' : ''); b.textContent = fresh ? 'New here? Field manual' : 'Field manual';
  b.addEventListener('click', () => this.showManual(0));
  bar.insertBefore(b, bar.children[3] || null);
  if (fresh) bar.insertBefore(b, bar.firstChild);
  Music.stop();
};

/* ── first-time tips ── */
const _next2 = G.nextSubmission;
G.nextSubmission = function () {
  _next2.call(this);
  const s = this.current; if (!s || this.mode === 'briefing') return;
  if (s.dilemma) Tips.once(this, 'dilemma', 'A memo on the dossier: the book does not settle this one. Either call is allowed.');
  if (s.brig && s.tpl.acts) Tips.once(this, 'art', 'This page is art. Touch it with the Hand (6). Not everything on it shows at first.');
  if (s.hunt) Tips.once(this, 'hunt', 'A button here may hide a fault. Press it with the Hand (6).');
  const E = this.endless; if (E && E.marks === 1) Tips.once(this, 'lastmark', 'One mark left.');
};

/* ── music: a slow generative pad that tightens as things go wrong ── */
const Music = {
  t: .15, timer: null, step: 0,
  start() { if (this.timer || !Sfx.ctx) return; this.step = 0; this.timer = setInterval(() => this.tick(), 520); },
  stop() { clearInterval(this.timer); this.timer = null; },
  tension(v) { this.t = Math.max(0, Math.min(1, v)); },
  tick() {
    if (!Sfx.ok() || document.hidden) return;
    const scale = [0, 3, 5, 7, 10, 12, 15], base = this.t > .6 ? 98 : 110;
    this.step++;
    if (this.step % 8 === 1) [1, 1.5, 2].forEach((m, k) => Sfx.tone(base * m, 4.2, 'sine', .012 + this.t * .01, null, k * .05));
    if (Math.random() < .22 + this.t * .5) Sfx.tone(base * 2 * Math.pow(2, scale[Math.floor(Math.random() * scale.length)] / 12), 1.4, 'triangle', .02 + this.t * .015);
    if (this.t > .55 && this.step % 2 === 0) Sfx.tone(base / 2, .22, 'sine', .05 + (this.t - .55) * .1);
  }
};
const _ss2 = G.startShift;
G.startShift = function () { _ss2.call(this); setTimeout(() => Music.start(), 800); };
const _se = G.startEndless;
G.startEndless = function (d) { _se.call(this, d); setTimeout(() => Music.start(), 800); };

/* ── effects ── */
const Fx = {
  banner(text, sub, cls = '') { const d = document.createElement('div'); d.className = 'fx-banner ' + cls; d.innerHTML = `<b>${esc(text)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}`; document.body.appendChild(d); setTimeout(() => d.remove(), 2300); },
  shake() { document.body.classList.add('fx-shake'); setTimeout(() => document.body.classList.remove('fx-shake'), 480); const f = document.createElement('div'); f.className = 'fx-flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 600); },
  confetti() {
    const cols = ['#fbbf24', '#f87171', '#60a5fa', '#34d399', '#f472b6'];
    for (let i = 0; i < 70; i++) { const c = document.createElement('i'); c.className = 'fx-conf'; c.style.left = Math.random() * 100 + 'vw'; c.style.background = cols[i % 5]; c.style.animationDelay = Math.random() * .8 + 's'; c.style.transform = `rotate(${Math.random() * 360}deg)`; document.body.appendChild(c); setTimeout(() => c.remove(), 3800); }
  }
};
const _rec2 = G.showReceipt;
G.showReceipt = function (sub, kind, res, eff) {
  _rec2.call(this, sub, kind, res, eff);
  if (!res.correct && !(sub.dilemma && !res.timedOut)) { Fx.shake(); try { Sfx.bad(); } catch (e) { /* audio */ } }
};
const _rb2 = G.renderBoard;
G.renderBoard = function () {
  _rb2.call(this);
  const E = this.endless, left = this.shiftTotal ? this.shiftLeft / this.shiftTotal : 1;
  const bad = E ? 1 - E.marks / E.maxMarks : this.citations / (this.maxCitations || 3);
  document.body.classList.toggle('fx-danger', !!((E && E.marks <= 1 && E.marks > 0) || (!E && this.citations >= 2)));
  Music.tension(.15 + bad * .55 + (this.mode === 'inspecting' && left < .25 ? .3 : 0));
};
const _sw = G.startWave;
G.startWave = function () { _sw.call(this); Fx.banner(`Wave ${this.endless.wave}`, this.endless.tide.name); };
const _ew = G.endWave;
G.endWave = function () { const E = this.endless, short = this.quota - this.processed; _ew.call(this); if (E && E.marks > 0 && short <= 0) Fx.banner('Wave cleared', `${E.score} points`, 'good'); };
const _eo = G.endlessOver;
G.endlessOver = function () {
  const E = this.endless, prev = LS.get('uxg.endless', { wave: 0, score: 0 });
  const best = !E.daily && (E.wave > prev.wave || (E.wave === prev.wave && E.score > prev.score));
  _eo.call(this);
  const card = `Port Halcyon · ${E.daily ? 'Daily tide ' + dateKey() : 'Long Tide'}\nWave ${E.wave} · ${E.score} pts · streak ${E.bestStreak}\nRelics: ${E.relics.map(id => RELICS.find(r => r.id === id).name).join(', ') || 'none'}${E.daily ? '' : `\nSeed ${E.seed}`}`;
  $('#modal-body').insertAdjacentHTML('beforeend', `<pre class="runcard">${esc(card)}</pre>`);
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = 'Copy run card';
  b.addEventListener('click', () => { try { navigator.clipboard.writeText(card).then(() => this.toast('Copied.'), () => this.toast('Select the card and copy it.')); } catch (e) { this.toast('Select the card and copy it.'); } });
  $('#modal-actions').appendChild(b);
  if (best) { Fx.banner('Deepest yet', `Wave ${E.wave}`, 'good'); Fx.confetti(); }
  Music.tension(.9);
};
/* ───────────────────── 15. Extras: settings, notebook filters, rule stats, titles ───────────────────── */
const SET = { get: () => LS.get('uxg.set', {}), put(k, v) { const s = LS.get('uxg.set', {}); s[k] = v; LS.set('uxg.set', s); } };
function applySettings() {
  const s = SET.get();
  const calm = s.calm !== undefined ? s.calm : (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  document.body.classList.toggle('calm', !!calm); document.body.classList.toggle('safe', !!s.safe);
  const c = document.getElementById('btn-calm'), f = document.getElementById('btn-safe');
  if (c) { c.setAttribute('aria-pressed', String(!!calm)); c.textContent = calm ? 'Calm motion: on' : 'Calm motion'; }
  if (f) { f.setAttribute('aria-pressed', String(!!s.safe)); f.textContent = s.safe ? 'Safe colours: on' : 'Safe colours'; }
}
document.getElementById('btn-calm').addEventListener('click', () => { SET.put('calm', !document.body.classList.contains('calm')); applySettings(); });
document.getElementById('btn-safe').addEventListener('click', () => { SET.put('safe', !document.body.classList.contains('safe')); applySettings(); });
applySettings();

/* ── notebook: filter by act or thread ── */
const NB_THREADS = { Ilse: /ilse|room/i, Barnaby: /gull|barn/i, Registry: /vael|aud|hear|d12|referral/i, Finale: /p14|charter|lamp|lant|d1[0-4]/i };
const _rnbX = Game.prototype.renderNotebook;
Game.prototype.renderNotebook = function () {
  _rnbX.call(this);
  const h = document.getElementById('notebook'); if (!h || !this.nb.length) return;
  const rows = [...h.querySelectorAll('.nb-e')].slice(0, this.nb.length);
  rows.forEach((r, i) => { r.dataset.day = this.nb[i].day; r.dataset.id = this.nb[i].id; });
  const f = this._nbf || 'All';
  const chips = ['All', 'Act I', 'Act II', 'Act III', ...Object.keys(NB_THREADS)];
  const match = (n, c) => c === 'All' || (c === 'Act I' && n.day <= 7) || (c === 'Act II' && n.day >= 8 && n.day <= 11) || (c === 'Act III' && n.day >= 12) || (NB_THREADS[c] && NB_THREADS[c].test(n.id));
  rows.forEach((r, i) => { r.hidden = !match(this.nb[i], f); });
  h.insertAdjacentHTML('afterbegin', `<div class="nbf" role="group" aria-label="Filter notes">${chips.map(c => `<button type="button" aria-pressed="${c === f}">${c}</button>`).join('')}</div>`);
  h.querySelectorAll('.nbf button').forEach(b => b.addEventListener('click', () => { this._nbf = b.textContent; this.renderNotebook(); }));
};

/* ── per-rule record ── */
const _consX = Game.prototype.consequences;
Game.prototype.consequences = function (sub, kind, res) {
  try {
    if (!sub.troll && !this.training) {
      const missed = kind === 'approve' ? [...sub.defects.values()].map(f => f.cat) : ((res && res.missed) || []).map(m => (m.d || m).cat);
      Life.add(l => { l.cat = l.cat || {}; for (const f of sub.defects.values()) { const e = l.cat[f.cat] || (l.cat[f.cat] = { s: 0, m: 0 }); e.s++; } for (const c of missed) { const e = l.cat[c] || (l.cat[c] = { s: 0, m: 0 }); e.m++; } });
    }
  } catch (e) { /* records are optional */ }
  return _consX.call(this, sub, kind, res);
};
const _statsX = Game.prototype.showStats;
Game.prototype.showStats = function () {
  _statsX.call(this);
  const l = Life.get(), cat = l.cat || {};
  const rows = Object.keys(CAT).filter(c => cat[c] && cat[c].s >= 3).map(c => ({ c, p: Math.round(100 * (cat[c].s - cat[c].m) / cat[c].s), s: cat[c].s })).sort((a, b) => a.p - b.p);
  const el = document.querySelector('dialog#modal .kv');
  if (el && rows.length) el.insertAdjacentHTML('afterend', `<h3>Catch rate by rule</h3><ul class="bars">${rows.map(r => `<li class="${r.p < 60 ? 'low' : ''}"><span>${esc(CAT[r.c].name)}</span><span class="bar"><i style="width:${r.p}%"></i></span><span>${r.p}%</span></li>`).join('')}</ul><p class="muted">Share of faults you caught, per rule (ships with at least 3 faults of that kind).</p>`);
};

/* ── titles ── */
const TITLES = [
  { id: 'fourteen', name: 'Fourteen days', desc: 'Finish the career.', test: c => c.career },
  { id: 'clean', name: 'Clean hands', desc: 'Finish the career without taking an envelope.', test: c => c.career && c.g.bribes === 0 },
  { id: 'eagle', name: 'Eagle eye', desc: 'Finish with 90% or better accuracy.', test: c => c.career && (c.g.accuracy() || 0) >= .9 },
  { id: 'page14', name: 'Page fourteen', desc: 'Reach the Charter ending.', test: c => c.end === 'charter' },
  { id: 'archivist', name: 'Archivist', desc: 'Reach the reading-room ending.', test: c => c.end === 'archive' },
  { id: 'senior', name: 'Senior Inspector', desc: 'Accept the Chancellor’s offer.', test: c => c.end === 'senior' },
  { id: 'wander', name: 'Wanderer', desc: 'Find everything on every art site.', test: () => { const g = LS.get('uxg.gal', {}); return Object.keys(ATLAS).every(id => g[id] && g[id].length >= Object.keys(ATLAS[id].finds).length); } },
  { id: 'deep', name: 'Deep tide', desc: 'Reach wave 10 in the Long Tide.', test: () => (LS.get('uxg.endless', { wave: 0 }).wave || 0) >= 10 },
  { id: 'quick', name: 'Quick hands', desc: 'Earn 25 speed bonuses.', test: () => (Life.get().quick || 0) >= 25 },
  { id: 'endings', name: 'Many tides', desc: 'See five different endings.', test: () => (LS.get('uxg.ends', [])).length >= 5 }
];
function awardTitles(g, ctx) {
  const have = LS.get('uxg.titles', []); const fresh = [];
  for (const t of TITLES) { if (have.includes(t.id)) continue; let ok = false; try { ok = t.test(Object.assign({ g }, ctx || {})); } catch (e) { /* skip */ } if (ok) { have.push(t.id); fresh.push(t); } }
  if (fresh.length) { LS.set('uxg.titles', have); fresh.forEach((t, i) => setTimeout(() => Fx.banner('Title earned', t.name), 600 + i * 1800)); }
}
const _endX = Game.prototype.showEnding;
Game.prototype.showEnding = function (id) {
  if (!this.endless) { const e = LS.get('uxg.ends', []); if (!e.includes(id)) { e.push(id); LS.set('uxg.ends', e); } awardTitles(this, { career: ENDINGS[id] && ENDINGS[id].tone !== 'bad' && this.day >= this.maxDays, end: id }); }
  return _endX.call(this, id);
};
const _bonusX = Game.prototype.consequences;
Game.prototype.consequences = function (sub, kind, res) {
  const r = _bonusX.call(this, sub, kind, res);
  if (r && r.notes && r.notes.some(n => /^Quick, correct work/.test(n))) Life.add(l => { l.quick = (l.quick || 0) + 1; });
  return r;
};
Game.prototype.showTitles = function () {
  const have = LS.get('uxg.titles', []);
  this.showModal(`<p class="eyebrow">Kept between careers</p><h2 id="modal-title">Titles</h2><ul class="titles">${TITLES.map(t => `<li class="${have.includes(t.id) ? 'got' : ''}"><b>${esc(t.name)}</b><small>${have.includes(t.id) ? '' : '? · '}${esc(t.desc)}</small></li>`).join('')}</ul><p class="muted">${have.length} of ${TITLES.length} earned.</p>`, [{ label: 'Back', primary: true, onClick: () => this.showTitle() }]);
};
const _titleX = Game.prototype.showTitle;
Game.prototype.showTitle = function () {
  _titleX.call(this);
  const tr = document.getElementById('opt-training');
  if (tr && !document.getElementById('opt-calm')) {
    const mk = (id, txt, key, cls) => { const l = document.createElement('label'); l.className = 'opt'; l.innerHTML = `<input type="checkbox" id="${id}"> ${txt}`; const i = l.firstChild.nextSibling || l.querySelector('input'); const inp = l.querySelector('input'); inp.checked = document.body.classList.contains(cls); inp.addEventListener('change', () => { SET.put(key, inp.checked); applySettings(); }); return l; };
    const after = tr.closest('label');
    after.after(mk('opt-calm', 'Calm motion: no shaking, sweeping or flashing', 'calm', 'calm'), mk('opt-safe', 'Safe colours: blue and orange instead of green and red', 'safe', 'safe'));
  }
  const acts = document.querySelector('#modal-actions');
  if (acts && !acts.querySelector('.b-titles')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn b-titles'; b.textContent = 'Titles'; b.addEventListener('click', () => this.showTitles()); acts.appendChild(b); }
};
awardTitles(null, {});
/* ───────────────────── 16. Save and resume, New Game+, boss cases, the Registry file ───────────────────── */
const SAVE_KEYS = ['day', 'funds', 'trust', 'flow', 'citations', 'qSum', 'qN', 'bribes', 'flawedApproved', 'cleanTurned', 'goodCalls', 'weak', 'studio', 'barn', 'nb', 'gallery', 'galleryDone', 'wonder', 'referred', 'kitHelped', 'maraTold', 'memoCopy', 'pier', 'forged', 'loreN', 'exempt', 'brig', 'brigSeen', 'pact', 'reported', 'knowsBrig', 'brigStats', 'rumored', 'swift', 'eve', 'st', 'ngp', 'dayRecords', 'yesterday', 'quota', 'commission', 'repShift', 'bossWins', 'rescues'];
function saveRun(g) {
  if (g.endless || g.training || g.day < 2) return;
  try { const o = { v: 1 }; for (const k of SAVE_KEYS) if (g[k] !== undefined) o[k] = g[k]; o.upgrades = [...g.upgrades]; o.seen = [...g.seen]; JSON.stringify(o); LS.set('uxg.save', o); } catch (e) { /* too odd to save */ }
}
const _bdX = Game.prototype.beginDay;
Game.prototype.beginDay = function () {
  saveRun(this);
  const i = this.day - 1, orig = DAYS[i];
  let tw = null;
  if (this.ngp && orig && !this.endless && !this.training) {
    tw = NGP[(this.day - 1) % NGP.length];
    const c = Object.assign({}, orig); tw.f(c, this); c.directive = (orig.directive ? orig.directive + ' ' : '') + 'Registry order: ' + tw.d; DAYS[i] = c;
  }
  try { _bdX.call(this); } finally { if (tw) DAYS[i] = orig; }
  if (!this.endless && !this.training) this.planBoss();
  this.renderBoard();
};
Game.prototype.resumeRun = function () {
  const o = LS.get('uxg.save', null); if (!o) return this.showTitle();
  this.resetRun(); Object.assign(this, o); delete this.v;
  this.upgrades = new Set(o.upgrades || []); this.seen = new Set(o.seen || []); this.pending = []; this.training = false; this.endless = null;
  Sfx.init(); this.closeModal(); this.beginDay();
};
Game.prototype.showResume = function () {
  const o = LS.get('uxg.save', null); if (!o) return;
  const last = (o.nb || []).slice(-3);
  this.showModal(`<p class="eyebrow">Your career so far</p><h2 id="modal-title">Day ${o.day} of ${this.maxDays}</h2>
    <p class="muted">${esc(o.day <= 7 ? 'Act I' : o.day <= 11 ? 'Act II' : 'Act III')} · ${o.funds} cr · trust ${o.trust} · flow ${o.flow}${o.ngp ? ' · New Game+' : ''}</p>
    ${last.length ? `<h3>The last things you wrote down</h3>${last.map(n => `<div class="nb-e"><b>Day ${n.day}</b><p>${esc(n.text)}</p></div>`).join('')}` : '<p class="hint">Nothing worth writing down yet.</p>'}`,
    [{ label: 'Continue the career', primary: true, onClick: () => this.resumeRun() }, { label: 'Discard it', onClick: () => { LS.set('uxg.save', null); this.showTitle(); } }, { label: 'Back', onClick: () => this.showTitle() }]);
};
const _endY = Game.prototype.showEnding;
Game.prototype.showEnding = function (id) {
  if (!this.endless) {
    LS.set('uxg.save', null);
    const e = ENDINGS[id];
    if (e && e.tone !== 'bad' && this.day >= this.maxDays && !this.training) LS.set('uxg.ngp', 1);
  }
  return _endY.call(this, id);
};
const _titleY = Game.prototype.showTitle;
Game.prototype.showTitle = function () {
  _titleY.call(this);
  const o = LS.get('uxg.save', null), acts = document.querySelector('#modal-actions');
  if (acts && o && !acts.querySelector('.b-resume')) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn primary b-resume'; b.textContent = `Continue career · Day ${o.day}`; b.addEventListener('click', () => this.showResume());
    acts.insertBefore(b, acts.firstChild);
  }
  const tr = document.getElementById('opt-training');
  if (tr && LS.get('uxg.ngp', 0) && !document.getElementById('opt-ngp')) {
    const l = document.createElement('label'); l.className = 'opt'; l.innerHTML = '<input type="checkbox" id="opt-ngp"> New Game+: the Registry rewrites each day’s orders';
    tr.closest('label').after(l);
  }
};
const _ssX = Game.prototype.startShift;
Game.prototype.startShift = function () {
  const n = document.getElementById('opt-ngp');
  this._ngpNext = n && n.checked && !this.training ? 1 : 0;
  _ssX.call(this);
};
const _rrX = Game.prototype.resetRun;
Game.prototype.resetRun = function () { _rrX.call(this); this.ngp = this._ngpNext || 0; this._ngpNext = 0; this.bossWins = 0; this.bossLeft = 0; this.regLeft = 0; };
const _rtX = Game.prototype.reviewTime;
Game.prototype.reviewTime = function () { return Math.round(_rtX.call(this) * (this.ngp ? .88 : 1)); };

const NGP = [
  { d: 'one more fault on every ship.', f: c => { c.maxDefects = Math.min(6, (c.maxDefects || 3) + 1); } },
  { d: 'almost no sound ships today.', f: c => { c.clean = Math.max(0, (c.clean || .2) - .15); } },
  { d: 'three rules are watched closely.', f: (c, g) => { c.focus = shuffle(Object.keys(CAT)).slice(0, 3); } },
  { d: 'sound ships and faulty ones look alike.', f: c => { c.clean = Math.min(.5, (c.clean || .2) + .2); c.maxDefects = Math.min(6, (c.maxDefects || 3) + 1); } }
];

/* ── boss cases: three linked ships, one studio, end of each act ── */
const BOSSES = { 7: 'Memorial Clinic portal', 11: 'Harbor Pension Office', 14: 'Lighthouse Authority site' };
Game.prototype.planBoss = function () {
  this.bossLeft = 0; this.bossHit = 0;
  const name = BOSSES[this.day]; if (!name || !this.queue || this.queue.length < 3) return;
  const extra = Array.from({ length: 3 }, (_, i) => { const s = this.factory.create(this.nextNo++); s.boss = { i: i + 1, n: 3, name }; return s; });
  this.queue.splice(2, 0, ...extra);
  this.scene.addShips(extra.map(s => this.queueData(s)));
  this.bossLeft = 3;
};
const _nsX = Game.prototype.nextSubmission;
Game.prototype.nextSubmission = function () {
  _nsX.call(this);
  const s = this.current;
  if (s && s.boss && this.mode !== 'briefing') { try { Fx.banner(`Boss case ${s.boss.i} of ${s.boss.n}`, s.boss.name); } catch (e) { /* cosmetic */ } this.toast(`${s.boss.name}: page ${s.boss.i} of ${s.boss.n}. Judge each page on its own.`); }
  this.renderReg();
};
const _cnX = Game.prototype.consequences;
Game.prototype.consequences = function (sub, kind, res) {
  const r = _cnX.call(this, sub, kind, res);
  if (sub.boss && !this.endless) {
    if (res.correct && !res.timedOut) this.bossHit = (this.bossHit || 0) + 1;
    if (sub.boss.i === sub.boss.n) {
      if (this.bossHit === sub.boss.n) { this.bossWins = (this.bossWins || 0) + 1; r.d.funds += 60; r.d.trust += 5; this.meter({ funds: 60, trust: 5 }); r.notes.push(`Case closed: all three pages of the ${sub.boss.name} were judged right. +60 cr, +5 trust.`); Life.add(l => { l.boss = (l.boss || 0) + 1; }); }
      else { this.meter({ flow: -4 }); r.notes.push(`The ${sub.boss.name} case is not clean: ${this.bossHit} of ${sub.boss.n} pages right. The studio files an appeal.`); }
    }
  }
  return r;
};

/* ── the Registry file: only for inspectors who took the Chancellor’s offer ── */
Game.prototype.renderReg = function () {
  const b = document.getElementById('btn-reg'); if (!b) return;
  const on = this.st && this.st.vael === 'deal' && !this.endless && !this.training && this.mode === 'inspecting';
  b.hidden = !on; if (!on) return;
  if (this._regDay !== this.day) { this._regDay = this.day; this.regLeft = 2; }
  b.disabled = !this.current || this.regLeft <= 0;
  b.textContent = `Consult the Registry file (${this.regLeft} left)`;
};
document.getElementById('btn-reg').addEventListener('click', () => {
  const g = window.portHalcyon, s = g.current; if (!s || g.regLeft <= 0 || g.mode !== 'inspecting') return;
  g.regLeft--;
  if (s.brig || s.tpl && BRIGADE[s.tpl.id]) { g.referred++; g.shiftBrig(-1); g.toast('The file says: unregistered page. The Registry thanks you for looking at it.'); }
  else {
    const cats = [...new Set([...s.defects.values()].map(f => CAT[f.cat].name))];
    g.toast(cats.length ? `The file lists: ${cats.join(', ')}.` : 'The file shows nothing against this ship.');
  }
  g.meter({ trust: -1 }); g.renderReg(); g.renderBoard();
});
const _rbX = Game.prototype.renderBoard;
Game.prototype.renderBoard = function () { _rbX.call(this); try { this.renderReg(); } catch (e) { /* before boot */ } };
Game.prototype.bossTag = s => s && s.boss ? ` <span class="boss-tag">BOSS ${s.boss.i}/${s.boss.n}</span>` : '';
TITLES.push(
  { id: 'cases', name: 'Case closer', desc: 'Close three boss cases.', test: () => (Life.get().boss || 0) >= 3 },
  { id: 'plus', name: 'Second reading', desc: 'Finish a New Game+ career.', test: c => c.career && c.g.ngp > 0 },
  { id: 'file', name: 'Friend of the file', desc: 'Finish a career with the Registry file.', test: c => c.career && c.g.st && c.g.st.vael === 'deal' }
);

/* ── faces for the people who come to the window ── */
Object.assign(LOOKS, {
  'Ilse Brandt': { skin: '#f1c9a5', hair: '#6a4326', style: 'bun', shirt: '#5a4a7a', bg: '#d8d0e0', glasses: true, collar: true },
  'Mara': { skin: '#c68a5b', hair: '#1b1613', style: 'long', shirt: '#2f7a6a', bg: '#cfe0d8' },
  'Chancellor Vael': { skin: '#e8c4a0', hair: '#c9c9c4', style: 'bald', shirt: '#2a2f3a', bg: '#9aa0b0', collar: true, glasses: true },
  'The woman in the scarf': { skin: '#e0a97d', hair: '#3a2a1e', style: 'long', shirt: '#7a3d9a', bg: '#e6d8f0' },
  'The man with the lantern': { skin: '#9c6540', hair: '#8a8f95', style: 'short', shirt: '#6a5a3a', bg: '#e0c890' },
  'Pete': { skin: '#f7d9bf', hair: '#d9c39a', style: 'curly', shirt: '#3d6b52', bg: '#c5d8e0', beard: true }
});
const EVENT_WHO = { ledger: ['Ilse Brandt', 'Ilse Brandt'], gullOffer: [BARNY, 'Barnaby Gull'], vael: ['Chancellor Vael', 'The Chancellor’s clerk'], lantern: ['Noa', 'Noa'], page14: ['The woman in the scarf', 'The Margin'], hearing: ['The man with the lantern', 'The public gallery'], charter: ['Chancellor Vael', 'The committee clerk'], lastlamp: ['Mara', 'Mara'], mara: ['Mara', 'Mara'], marquee: ['The woman in the scarf', 'The woman in the scarf'] };
Game.prototype.showEvent = function (ev) {
  this.mode = 'event'; Sfx.bell();
  const w = ev.who || EVENT_WHO[ev.id];
  const pic = w ? `<figure class="pic face">${Art.portrait(w[0])}</figure>` : Art.icon(ev.icon);
  const eyebrow = w ? esc(w[1]) : 'Something at the window';
  this.showModal(`<div class="head">${pic}<div><p class="eyebrow">${eyebrow}</p><h2 id="modal-title">${esc(ev.title)}</h2></div></div><p>${esc(typeof ev.text === 'function' ? ev.text(this) : ev.text)}</p>`,
    ev.choices.map(c => ({
      label: c.label,
      onClick: () => { if (ev.brig) this.loreN++; const msg = c.run(this); this.closeModal(); if (msg) this.toast(msg); this.renderBoard(); if (!this.checkFail()) this.nextSubmission(); }
    })), { sheet: 'telegram', stacked: true });
};
/* ───────────────────── Course threads: Prediction, notes on verdicts, field notes ───────────────────── */
SEV.prediction = 1;
STORY.prediction = (n, a) => `${n} could not tell what the next step on ${a} would do, and guessed wrong.`;
RULE_SHORT.prediction = 'Show what is possible now, what comes next, and tell me what changed.';
FALSE_CLAIM.prediction = 'Surprises keep users engaged. Nobody needs to be told what comes next.';
const _ruleIconP = Art.ruleIcon.bind(Art);
Art.ruleIcon = function (cat) {
  if (cat !== 'prediction') return _ruleIconP(cat);
  return `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="#102f3a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="24" r="4" fill="#102f3a"/><circle cx="24" cy="24" r="4"/><circle cx="38" cy="24" r="4" stroke-dasharray="2 4"/><path d="M14 24h6M28 24h6"/></svg>`;
};
const l2 = Math.log2;
const COURSE = {
  target: () => { const D = pick([6, 8, 10]); const a = 0.1 * l2(D / 0.5 + 1), b = 0.1 * l2(D / 2.5 + 1); return `Fitts’ law, T = 0.1·log₂(D/A + 1): a 0.5 cm button ${D} cm away takes ${a.toFixed(2)} s, a 2.5 cm one just ${b.toFixed(2)} s. Make it big, bring it close.`; },
  minimal: () => { const n = pick([4, 6, 8]), m = n * 3; return `Hick’s law, T = 150 ms · log₂(n+1): ${n} choices cost ${Math.round(150 * l2(n + 1))} ms, ${m} choices ${Math.round(150 * l2(m + 1))} ms. Tripling the options adds time, so group them.`; },
  keyboard: () => 'KLM operators: a key press K = 0.2 s, moving a hand to the mouse H = 0.4 s, pointing P ≈ 1.1 s. An expert who Tabs through a form skips every H and P, if the order is logical.',
  recognition: () => pick(['Short-term memory holds 7 ± 2 items and fades fast. Do not make people carry data from one screen to the next.', 'Long-term memory is slow to recall but good at recognising. Menus, tooltips and printed shortcuts beat typed commands.']),
  status: () => pick(['Observability: the interface shows its internal state. Slow response? Say it is working (response times, c.3).', 'Habituation: a signal that never changes, like a blinking background, is soon ignored. Show changes immediately (synthesis).']),
  control: () => 'Recoverability and proportional effort: if an action is hard to undo, it must be hard to do. Rename is easy to undo, delete is not.',
  prevention: () => 'Proportional effort: the harder an action is to reverse, the more deliberate it should be. A modal confirmation hands the dialog initiative to the system on purpose.',
  consistency: () => 'Consistency is a foundation principle: one look and feel, a style guide, and no changing what users already know (F1 is Help).',
  realworld: () => 'Familiarity: the knowledge asked of the user should match what they already have. Real-world metaphors help.',
  flexibility: () => pick(['Flexibility has four parts: who has the initiative in the dialog, task delegation, replacement (a colour by name, hex or palette) and customisation.', 'Customisation covers preferences and experience level, and always needs a way back to the default state.']),
  errors: () => 'Robustness: users must notice that something went wrong, and still be able to reach their goal afterwards. Say what failed and how to fix it.',
  text: () => 'Visual memory holds about 17 characters for about 200 ms. Tiny or crowded text is gone before it is read: 11 px at least.',
  contrast: () => 'About 8% of men and 1% of women have a colour deficiency, and older eyes need more contrast. Aim for 4.5 : 1.',
  color: () => 'Never use colour as the only code. Add a redundant one: a shape, an icon, a word.',
  prediction: () => 'Prediction: the first experience should be enough to guess what comes next, and what is available now should be visible. Synthesis: tell the user every change, at once if possible.'
};
const DAY_NOTES = {
  1: 'User-centred design starts with the context of use: who the users are, what tasks they do, and where. Ask that before you judge a screen.',
  2: 'Learnability has four parts: prediction, synthesis, familiarity and consistency.',
  3: 'UCD phase two, requirements: balance business viability, technical feasibility and what users need.',
  4: 'The power law of practice: Tn = T1 · n^−0.4. Every repetition is faster, with diminishing returns. Your own inspections are speeding up the same way.',
  5: 'The Human Processor Model: a perceptual, a motor and a cognitive system. Its times are averages, not any one person.',
  6: 'Flexibility: dialog initiative, task delegation, replacement and customisation.',
  7: 'Robustness: observability, recoverability, response times and task advisability.',
  8: 'UCD phase three, design solutions: go from rough concept to full design in stages and prototype early.',
  9: 'Personas are fictional archetypes built from interviews and observation, and scenarios tell one use situation. They are useful, but they cannot be validated.',
  10: 'KLM sums operators: T = TK + TP + TH + TD + TM + TR. It assumes experts who make no mistakes, with about 20% error.',
  11: 'Fitts and Hick together: big, close targets and short menus. Both costs grow with log₂.',
  12: 'UCD phase four, evaluate designs, then go round again. It is a cycle, not a line.',
  13: 'Short-term memory is about 7 ± 2 items; long-term memory recognises better than it recalls. Design for recognition.',
  14: 'Accessibility is a pillar of good design: choose colours and fonts with care, let users enlarge text, never use colour alone.'
};
const _briefC = Game.prototype.showBriefing;
Game.prototype.showBriefing = function (cfg) {
  _briefC.call(this, cfg);
  const n = DAY_NOTES[this.day]; const q = document.querySelector('#modal-body .quote');
  if (n && q && !this.endless) q.insertAdjacentHTML('afterend', `<p class="check"><b>From the course:</b> ${esc(n)}</p>`);
};
/* a course note on the verdict slip */
const _lines = { seen: new Set() };
Game.prototype.courseNote = function (res) {
  const cats = [...res.missed.map(m => m.d.cat), ...res.partial.map(h => h.d.cat), ...res.hits.map(h => h.cat)].filter(c => COURSE[c]);
  if (!cats.length) return '';
  const fresh = cats.filter(c => !_lines.seen.has(c + this.day));
  const c = (fresh.length ? fresh : cats)[0]; _lines.seen.add(c + this.day);
  return `<p class="check"><b>From the course:</b> ${esc(COURSE[c]())}</p>`;
};
/* every older template gets the Prediction fault too */
for (const t of Object.values(TEMPLATES)) {
  if (Object.values(t.defects).some(d => d.cat === 'prediction')) continue;
  t.defects.noPredict = { region: 'predict', cat: 'prediction', label: 'Unavailable actions vanish and the next step is never named', why: 'Prediction: show what is available now and what comes next, so nobody has to guess or remember.' };
  t.regions.predict = 'Next step';
  const ob = t.build;
  t.build = h => ob.call(t, h) + `<p data-region="predict" style="margin:10px 0 0;font-size:13px;color:#4a5560">${h('noPredict') ? 'Fill in the form.' : 'Step 1 of 2. Next: review. <button type="button" disabled style="font-size:12px;padding:2px 8px">Next</button> stays grey until you finish, and says why.'}</p>`;
}
/* ───────────────────── Story 2: cast moments, callbacks, the neighbours' ending ─────────────────────
   Placed before part_home in build order, so the main evening scene shows first and these follow it.   */
LOOKS.Ilse = LOOKS['Ilse Brandt'];
const HOME2 = {
  8: { who: 'Pip', icon: 'papers', title: 'Pip and the wrong hat',
    text: 'Pip is sitting on a bollard in the rain wearing a Registry cap three sizes too big. “They gave me a lanyard,” he says. “It says “Harbor Liaison”. I am a dockhand.” He turns it over. “They asked me to tell them what you said at lunch. I said you ate a pie.”',
    choices: [
      { label: 'Tell him to keep saying that', run: g => { HM(g).pipf = 'pie'; g.meter({ trust: 1 }); g.note('home_pip', 'Told Pip to keep telling the Registry I eat pies. He has now claimed I eat nine a day.'); return '“Nine pies. They will be very concerned.”'; } },
      { label: 'Ask him to tell you what they ask', run: g => { HM(g).pipf = 'spy'; g.shiftBrig(1); g.note('home_pip', 'Asked Pip what the Registry asks him. Mostly: where I go, who I talk to, whether I “speak of the Authority fondly”.'); return 'He writes the questions on his wrist in biro.'; } },
      { label: 'Tell him to take the lanyard off', run: g => { HM(g).pipf = 'off'; g.note('home_pip', 'Told Pip to take off the lanyard. He did, and put it on a gull.'); return 'The gull wears it better.'; } }
    ] },
  9: { who: 'Mara', icon: 'papers', title: 'Mara and the second kettle',
    text: 'There are two kettles on the sill tonight. “One for the Berth Office,” Mara says, “and one for the Registry. They share a stairwell now and they will not share a kettle.” She is pretending to laugh. “Ilse asked me to keep a list of who comes to your window. I said I would think about it.”',
    choices: [
      { label: 'Tell her to give them a short list', run: g => { HM(g).maraf = 'list'; g.note('home_mara2', 'Told Mara to give the Registry a short list. She will write “Pip, Noa, a gull”.'); return '“A gull,” she says, writing it down.'; } },
      { label: 'Tell her to say no, and why', run: g => { HM(g).maraf = 'no'; HM(g).mara = (HM(g).mara || 0) + 1; g.meter({ trust: 1 }); g.note('home_mara2', 'Mara will tell Ilse no. “It is not a list, it is a person,” she plans to say.'); return 'She looks pleased and frightened, in about equal measure.'; } },
      { label: 'Ask what she would like to do', run: g => { HM(g).maraf = 'ask'; HM(g).mara = (HM(g).mara || 0) + 1; g.note('home_mara2', 'Asked Mara what she would like to do. She said nobody had asked her in a year.'); return 'She stirs both kettles with the same spoon.'; } }
    ] },
  10: { who: 'Ilse', icon: 'papers', title: 'Ilse on the stairs',
    text: 'Ilse is sitting on the third stair from the bottom with her shoes off. “Everyone thinks the Registry is a machine,” she says. “It is forty-one people and a draught.” She holds up the pencil from behind her ear. “I have never once been asked what I would keep.”',
    choices: [
      { label: 'Ask what she would keep', run: g => { HM(g).ilsef = 'keep'; g.note('home_ilse0', 'Asked Ilse what she would keep. She named a rainbow banner, a forum nobody could find, and her sister’s handwriting.'); return 'She lists them without looking up.'; } },
      { label: 'Say the Registry is a choice, not a draught', run: g => { HM(g).ilsef = 'choice'; g.shiftBrig(-1); g.note('home_ilse0', 'Told Ilse the Registry is a choice. She said, “Everything is, if you stand on it long enough.”'); return 'She puts her shoes back on.'; } },
      { label: 'Sit down on the stair', run: g => { HM(g).ilsef = 'sat'; g.meter({ trust: 1 }); g.note('home_ilse0', 'Sat on the stair with Ilse. We did not talk. The building creaked in the wind.'); return 'The stair is colder than you expected.'; } }
    ] },
  11: { who: 'Pip', icon: 'papers', title: 'Pip carries something',
    text: 'Pip runs up with a flask. “From Tamsin. Lamp oil, the good stuff, for Pier 9 tonight.” He hops from foot to foot. “And a message from Noa: if the Registry takes the kiosk sign down, she has a spare. And a message from me.” He puts the flask in your hand. “Whatever you decide on the last day, I think people already know what you are.”',
    choices: [
      { label: 'Say: tell them all thank you', run: g => { HM(g).pipf2 = 'thanks'; HM(g).tamsin = (HM(g).tamsin || 0) + 1; g.note('home_pip2', 'Asked Pip to tell Tamsin and Noa thank you. He said he would say it in the right order.'); return 'He sprints off with the message and no flask.'; } },
      { label: 'Ask him what he thinks you are', run: g => { HM(g).pipf2 = 'asked'; g.note('home_pip2', 'Asked Pip what he thinks I am. “The one who reads the small print,” he said. I think he meant it well.'); return '“Also you smell of pies.”'; } },
      { label: 'Give him the flask back to carry', run: g => { HM(g).pipf2 = 'carry'; g.meter({ trust: 1 }); g.note('home_pip2', 'Gave the flask back to Pip to carry to Pier 9. He walked taller with it.'); return 'He holds it like a crown.'; } }
    ] }
};
const _eveS2 = Game.prototype.showEvening;
Game.prototype.showEvening = function () {
  const sc = HOME2[this.day];
  this._home2 = this._home2 || new Set();
  if (!sc || this.endless || this.training || this._home2.has(this.day)) return _eveS2.call(this);
  this._home2.add(this.day); this.mode = 'evening';
  this.showModal(`<div class="head"><figure class="pic face">${Art.portrait(sc.who)}</figure><div><p class="eyebrow">Evening · Day ${this.day} · ${esc(sc.who)}</p><h2 id="modal-title">${esc(sc.title)}</h2></div></div><p>${esc(sc.text)}</p>`,
    sc.choices.map(c => ({ label: c.label, onClick: () => { const m = c.run(this); this.closeModal(); if (m) this.toast(m); this.renderBoard(); _eveS2.call(this); } })), { sheet: 'telegram', stacked: true });
  if (typeof introAfterHead === 'function') introAfterHead(this, sc.who);
};
const _resetS2 = Game.prototype.resetRun;
Game.prototype.resetRun = function () { _resetS2.call(this); this._home2 = new Set(); };

/* ── window callbacks: earlier evenings come back ── */
const hOf = g => (S(g).home || {});
const CALLBACKS = [
  { id: 'cbMara', brig: false, minDay: 10, icon: 'papers', title: 'Mara covers your lunch',
    when: g => (hOf(g).mara || 0) >= 2,
    text: 'Mara is standing at your window with a tray. “You have not eaten and the queue has not shortened, so I am going to do the next two ships’ paperwork while you do something about the first.” She has already moved your stamp pad.',
    choices: [
      { label: 'Let her take the paperwork', hint: '+20 s on the shift clock.', run: g => { g.shiftLeft += 20; return 'She stamps the corners, which is not her job. She is good at it.'; } },
      { label: 'Eat, and keep your own paperwork', hint: '+1 trust.', run: g => { g.meter({ trust: 1 }); return 'It is a good sandwich. You cannot say what is in it.'; } }
    ] },
  { id: 'cbNoa', brig: false, minDay: 12, icon: 'papers', title: 'Noa’s sign, on every window',
    when: g => (hOf(g).noa || 0) >= 3,
    text: 'A runner brings you a photograph. Noa’s sign — IF YOU CANNOT FIND IT, IT IS NOT YOUR FAULT — is now in the window of the pharmacy, the bakery and, as of this morning, the Registry’s own public counter. Someone has added, in pencil, a second line: “Ask the Berth Office.”',
    choices: [
      { label: 'Frame the photograph for the booth', hint: '+2 trust.', run: g => { g.meter({ trust: 2 }); g.note('cb_noa', 'Noa’s sign is on the Registry’s public counter now. Someone wrote “Ask the Berth Office” under it.'); return 'It goes up next to Antonio’s button.'; } },
      { label: 'Tell the runner to thank her, in person', hint: '+2 flow.', run: g => { g.meter({ flow: 2 }); return 'The queue moves faster when it has something to read.'; } }
    ] },
  { id: 'cbAntonio', brig: false, minDay: 13, icon: 'envelope', title: 'Antonio at the counter',
    when: g => (hOf(g).antonio || 0) >= 2,
    text: 'Antonio has come to the quay with his cap and a printed copy of the Registry’s new application form. “I read it,” he says, “and I think it is wrong in three places. I would like you to tell me if I am right or if I am old.” He has circled them. He is right in two.',
    choices: [
      { label: 'Tell him he is right, twice', hint: '+2 trust and +15 s.', run: g => { g.meter({ trust: 2 }); g.shiftLeft += 15; g.note('cb_antonio', 'Antonio found two faults in the Registry’s form by reading it slowly. He is a better inspector than I am on a bad day.'); return 'He folds the form into the cap and looks ten years younger.'; } },
      { label: 'Tell him about the third', hint: '+1 trust.', run: g => { g.meter({ trust: 1 }); return '“Then I was only wrong about being old,” he says.'; } }
    ] },
  { id: 'cbPete', brig: false, minDay: 9, icon: 'envelope', title: 'Pete’s page is busy',
    when: g => ['fine', 'carry'].includes(hOf(g).pete),
    text: 'A runner from the cat shelter: “Pete says the page got six hundred visits overnight. Someone wrote a review. It says, and I quote, “the only website on the quay that does what the button says.” Pete would like to know if he is allowed to be proud.”',
    choices: [
      { label: 'Tell him yes, with a banner', hint: '+15 cr.', run: g => { g.meter({ funds: 15 }); return 'He sends back a photograph of a cat in a tiny hat.'; } },
      { label: 'Tell him yes, and fix the other 29 links', hint: '+2 flow.', run: g => { g.meter({ flow: 2 }); return 'Twenty-nine links. A good afternoon’s work.'; } }
    ] },
  { id: 'cbPost', brig: false, minDay: 14, icon: 'envelope', title: 'A postcard, in a ship’s mail',
    pin: true,
    when: g => (hOf(g).antonio || 0) >= 3,
    text: 'The last ship of the morning has one item in its mail bag addressed to the booth. A postcard, no stamp, a drawing of a very large button on one side. On the other: “Dear Inspector. Whatever you stamp today, I trust the way you looked at it. Antonio.”',
    choices: [
      { label: 'Pin it above the stamp', hint: '+3 trust.', run: g => { g.meter({ trust: 3 }); g.note('cb_post', 'Antonio’s postcard is pinned above the stamp. COUNT FIRST. JUDGE SECOND. TRUST ME ALSO.'); return 'The booth is a little less cold.'; } },
      { label: 'Read it again slowly', hint: '+20 s.', run: g => { g.shiftLeft += 20; return 'You take the time. The ships can wait a minute.'; } }
    ] }
];
CALLBACKS.forEach(e => { e.pin = true; });
EVENTS.push(...CALLBACKS);
/* a callback gets a third slot on its day so the fixed story events never crowd it out */
const _meS2 = Game.prototype.maybeEvent;
Game.prototype.maybeEvent = function () {
  if (this.day >= 2 && !this.training && this.evToday >= 2 && this.evToday < 3 && this.processed >= Math.ceil(this.quota / 2)) {
    const cb = CALLBACKS.find(e => e.minDay <= this.day && !this.seen.has(e.id) && e.when(this));
    if (cb) { this.seen.add(cb.id); this.evToday++; this.showEvent(cb); return true; }
  }
  return _meS2.call(this);
};
/* Tamsin’s spare wick lights the last lamp */
const _seS2 = Game.prototype.showEvent;
Game.prototype.showEvent = function (ev) {
  if (ev && ev.id === 'lastlamp' && hOf(this).wick && !ev._wick) {
    const extra = { label: 'Light it with Tamsin’s wick', hint: 'The wick she gave you on Lantern Night.', run: g => { S(g).lamp = 'lit'; hOf(g).wicklit = true; g.meter({ trust: 4 }); g.note('lamp', 'Lit the lamp with Tamsin’s wick. It burned low first, then bright, exactly as she said.'); return 'It takes a minute to catch. Then it does.'; } };
    ev = Object.assign({}, ev, { _wick: true, choices: [extra, ...ev.choices] });
  }
  return _seS2.call(this, ev);
};
/* the Gazette remembers */
const ECHO = {
  10: g => (hOf(g).antonio || 0) >= 3 && { img: 'pension', h: 'Pensioner pays bill unaided; “the screen told me first”', p: 'A retired customer paid an electricity bill without assistance. The utility is “looking into why”.' },
  11: g => hOf(g).wick && { img: 'tide', h: 'Lantern Night: lamps lit by hand', p: 'The lamp-lighter was seen on Pier 9 passing a spare wick to the inspector. “Everyone should carry one,” she said.' },
  12: g => (hOf(g).noa || 0) >= 3 && { img: 'quiet', h: '“If you cannot find it, it is not your fault”', p: 'A hand-painted sign at the ferry kiosk has been photographed four hundred times. The Registry has “noted the trend”.' },
  13: g => hOf(g).ilse === 'copy' && { img: 'quiet', h: 'Reading room: one page, two hands', p: 'Visitors to the lower archive report a copied page that matches its original in every detail but one: the copy has a small cat drawn in the margin.' },
  14: g => (hOf(g).mara || 0) >= 3 && { img: 'berthoffice', h: 'Berth Office: “we make our own tea”', p: 'Staff declined comment on the Registry’s kettle. “Ours is in the stairwell,” one said, “and it is staying there.”' }
};
for (const d of Object.keys(ECHO)) {
  const base = NEWS[d]; if (!base) continue;
  NEWS[d] = g => { const n = base(g); const e = ECHO[d](g); if (e && n && n.side) n.side = [e, ...n.side].slice(0, 2); return n; };
}
/* ── the neighbours' ending ── */
Object.assign(ENDINGS, {
  quay: { title: 'The quay remembers', tone: 'good', text: 'There is no ceremony. A lamp is lit on the stairs by someone with a bad knee. A kiosk window says IF YOU CANNOT FIND IT, IT IS NOT YOUR FAULT. A man pays a bill and a drawing of a very large button hangs over his stove. You never wrote a Charter, and nobody needs one: the people of Port Halcyon have taken the job on themselves. You hold the stamp. They hold the lamp.' }
});
Object.assign(END_NEWS, { quay: ['quiet', 'Port Halcyon: “nobody asked, so we did it ourselves”'] });
const homeScore = g => { const h = hOf(g); return (h.tamsin || 0) + (h.noa || 0) + (h.antonio || 0) + (h.mara || 0) + (h.wicklit ? 2 : 0) + (h.pipf2 === 'thanks' ? 1 : 0); };
const _finishS2 = Game.prototype.finishCampaign;
Game.prototype.finishCampaign = function () {
  const _show = this.showEnding;
  this.showEnding = id => {
    this.showEnding = _show;
    const E = ENDINGS[id];
    if (E && E.tone !== 'bad' && !['caught', 'charter', 'archive', 'senior', 'margin', 'middle', 'registry'].includes(id) && homeScore(this) >= 11 && !(S(this).vael === 'deal')) id = 'quay';
    return _show.call(this, id);
  };
  try { return _finishS2.call(this); } finally { this.showEnding = _show; }
};
if (typeof TITLES !== 'undefined') TITLES.push({ id: 'neighbour', name: 'Good neighbour', desc: 'Reach the ending where the quay looks after itself.', test: c => c.end === 'quay' });
const _epiS2 = loreEpilogue;
loreEpilogue = function (g) {
  const L = _epiS2(g), h = hOf(g);
  if (h.pipf) L.push(['Pip', h.pipf === 'pie' ? 'is a Harbor Liaison with a gull on his shoulder, and eats a pie a day to keep the report honest.' : h.pipf === 'spy' ? 'tells you everything the Registry asks, and a little of what they do not.' : 'gave the lanyard to the gull. The gull has not been promoted.']);
  if (h.maraf) L.push(['Mara’s kettle', h.maraf === 'no' ? 'is still in the Berth Office stairwell. Nobody has asked to borrow it.' : h.maraf === 'ask' ? 'is now two kettles. One is hers.' : 'sits next to a short list. The list says “a gull”.']);
  if (h.ilsef) L.push(['Ilse’s pencil', h.ilsef === 'keep' ? 'wrote the three things she would keep at the top of the ledger’s first page.' : h.ilsef === 'sat' ? 'is behind her ear. On Thursdays, she sits on the stair.' : 'is still her own. She has not said what she would keep.']);
  return L;
};
/* ───────────────────── 11r. Home life: thirteen evening visits, three act cards ─────────────────────
   Small scenes after each shift. Choices set flags in this.st.home and feed the epilogue.                  */
const HM = g => (S(g).home = S(g).home || {});
const HOME_SCENES = {
  1: { who: 'Mara', icon: 'papers', title: 'A key and a note',
    text: 'Mara leaves a kettle and the booth key on your sill. “The inspector before you left this under the blotter.” A card in careful capitals: COUNT FIRST. JUDGE SECOND. “I never knew who he was. I only know the booth was always warm.”',
    choices: [
      { label: 'Pin the card above the stamp', run: g => { HM(g).card = true; g.note('home_card', 'Pinned the card above the stamp: COUNT FIRST. JUDGE SECOND.'); return 'It curls a little at the corners already.'; } },
      { label: 'Ask who he was', run: g => { HM(g).card = 'asked'; g.note('home_card', 'Asked Mara about the inspector before me. She said, “He left in the night, and the lamp was lit.”'); return 'Mara shrugs. “The lamp-lighter might know.”'; } },
      { label: 'Say thank you for the tea', run: g => { HM(g).mara = (HM(g).mara || 0) + 1; g.meter({ trust: 1 }); return 'She pours you a second cup without being asked.'; } }
    ] },
  2: { who: 'Tamsin', icon: 'lamp', title: 'The lamp-lighter and her bill',
    text: 'An old woman with a ladder under one arm and a limp is standing at your door with a paper. “Tamsin. I light the lamps. The oil company wants me to “confirm my reference identifier” on a screen. I have lit this harbor for forty years and I have never needed an identifier.”',
    choices: [
      { label: 'Read it aloud and help her through', run: g => { HM(g).tamsin = (HM(g).tamsin || 0) + 2; g.meter({ trust: 1 }); g.note('home_tamsin', 'Helped Tamsin through the oil company’s screen. She said, “Forty years, and the machine asks me who I am.”'); return 'She pats your hand and leaves the ladder against the wall.'; } },
      { label: 'Tell her the screen is wrong, not her', run: g => { HM(g).tamsin = (HM(g).tamsin || 0) + 1; g.note('home_tamsin', 'Told Tamsin the screen was at fault, not her. She had not considered that.'); return '“Is that what you do all day?” she asks. “Blame screens?”'; } },
      { label: 'Give her 10 cr for the oil', run: g => { HM(g).tamsin = (HM(g).tamsin || 0) + 1; g.meter({ funds: -10 }); g.note('home_tamsin', 'Gave Tamsin 10 cr for lamp oil. She wrote it on a wall tally with chalk.'); return 'She chalks it onto the door frame. “For the record.”'; } }
    ] },
  3: { who: 'Noa', icon: 'papers', title: 'The kiosk at the ferry',
    text: 'Noa runs the ticket kiosk at the ferry. “People who cannot read the small print ask me to read it aloud. Today a man could not hit the “Next” button with a shaking hand. Eleven tries.” She is not angry. She is counting. “What do you do about that, Inspector?”',
    choices: [
      { label: 'Say: big buttons, close to the pointer', run: g => { HM(g).noa = (HM(g).noa || 0) + 2; g.note('home_noa', 'Told Noa that big, close buttons are faster for everyone. She said she would write it on the kiosk glass.'); return '“Fitts,” she says. “I looked him up. He was right.”'; } },
      { label: 'Offer to read the small print yourself', run: g => { HM(g).noa = (HM(g).noa || 0) + 1; g.meter({ trust: 1 }); g.note('home_noa', 'Read small print aloud at Noa’s kiosk. It is less tiring to read than to guess.'); return 'A queue forms, and nobody minds.'; } },
      { label: 'Say it is the Authority’s problem', run: g => { HM(g).noa = (HM(g).noa || 0) - 1; g.note('home_noa', 'Told Noa it was the Authority’s problem. She said, “You are the Authority.”'); return 'She goes back to the kiosk without looking round.'; } }
    ] },
  4: { who: 'Antonio', icon: 'envelope', title: 'Antonio and the postcard',
    text: 'Antonio, retired, with a cap in his hands. “They closed the branch. Now I pay bills on a screen, and last week it ate my payment twice. I would rather send postcards.” He has brought one, addressed to you, in case you are the person responsible for screens.',
    choices: [
      { label: 'Walk him through it, step by step', run: g => { HM(g).antonio = (HM(g).antonio || 0) + 2; g.meter({ trust: 1 }); g.note('home_antonio', 'Walked Antonio through his bill, step by step. He wrote the steps on a card in capitals.'); return 'He pins it to the kitchen wall when he gets home. Probably.'; } },
      { label: 'Say the screen should have told him what happens next', run: g => { HM(g).antonio = (HM(g).antonio || 0) + 1; g.note('home_antonio', 'Told Antonio that the screen should have said what happens next. He looked relieved to be right.'); return '“I thought it was just me,” he says.'; } },
      { label: 'Take the postcard and promise nothing', run: g => { HM(g).antonio = (HM(g).antonio || 0); g.note('home_antonio', 'Kept Antonio’s postcard. It says: “Dear Inspector, why is everything a button.”'); return 'The postcard goes into the drawer with the others.'; } }
    ] },
  5: { who: 'Pete', icon: 'envelope', title: 'Forty cats, one page',
    text: 'Pete again, smelling of fish and cat. “Someone left forty photographs and a note in the shelter door: “Whoever fixes pages, fix his.” It was not signed. I think the Brigade knows me.” He is not sure whether to be scared or flattered.',
    choices: [
      { label: 'Tell him it is flattering, and fine', run: g => { HM(g).pete = 'fine'; g.note('home_pete', 'Told Pete the Brigade’s interest was flattering and probably fine. He laughed for the first time in a week.'); return 'He takes a cat photo out of his pocket to show you. It is the same cat.'; } },
      { label: 'Tell him to keep the page up and carry on', run: g => { HM(g).pete = 'carry'; g.meter({ trust: 1 }); g.note('home_pete', 'Told Pete to keep the cat page up. It has been up four years. That counts for something.'); return '“Forty cats can’t be wrong,” he says.'; } },
      { label: 'Say nothing', run: g => { HM(g).pete = 'none'; g.note('home_pete', 'Said nothing when Pete asked. I am still not sure what I should have said.'); return 'He stands there a moment, then goes.'; } }
    ] },
  6: { who: 'Tamsin', icon: 'lamp', title: 'How you light a lamp',
    text: 'Tamsin lets you carry the ladder. “You do not light it all at once. You trim the wick, wait for the glass to warm, and light it low. Rush it and it smokes, and the glass cracks.” She taps the lantern. “Your trade is the same. Slow down at the start so you can go fast at the end.”',
    choices: [
      { label: 'Ask her to teach you', run: g => { HM(g).tamsin = (HM(g).tamsin || 0) + 2; g.note('home_tamsin2', 'Tamsin taught me to trim a wick. “Low first. Then bright.”'); return 'Your hands smell of paraffin for the rest of the evening.'; } },
      { label: 'Say the glass is a tool, not a sermon', run: g => { HM(g).tamsin = (HM(g).tamsin || 0); g.note('home_tamsin2', 'Told Tamsin her lesson was a sermon. She said, “It is. Did you listen?”'); return '“That is how I know it is good,” she says.'; } },
      { label: 'Carry the ladder home for her', run: g => { HM(g).tamsin = (HM(g).tamsin || 0) + 1; g.note('home_tamsin2', 'Carried Tamsin’s ladder home. Her knee hurt on the stairs. She did not say so.'); return 'Forty steps, and she counts them aloud.'; } }
    ] },
  7: { who: 'Mara', icon: 'papers', title: 'What Mara nearly signed',
    text: 'After the audit, Mara sits down heavily. “Last spring Nox offered me a share, same as he offered you. I had the pen out.” She turns her cup. “I did not sign. I could not tell you why. It was something about the way he said “continuity.”” She looks at you. “Tell me I was right.”',
    choices: [
      { label: 'Tell her she was right', run: g => { HM(g).mara = (HM(g).mara || 0) + 2; g.meter({ trust: 1 }); g.note('home_mara', 'Told Mara she was right not to sign. She did not say anything for a long time.'); return '“Good,” she says. “I need someone to say it.”'; } },
      { label: 'Say you cannot judge', run: g => { HM(g).mara = (HM(g).mara || 0) + 1; g.note('home_mara', 'Told Mara I could not judge. She said that was the most honest thing anyone had said all week.'); return 'She laughs, which is not what you expected.'; } },
      { label: 'Say nothing and pour the tea', run: g => { HM(g).mara = (HM(g).mara || 0) + 1; return 'The kettle does the talking.'; } }
    ] },
  8: { who: 'Noa', icon: 'papers', title: 'Winter at the kiosk',
    text: 'The ferry is late in the cold and Noa’s queue has doubled. “A woman could not tell which button was “Pay” and which was “Cancel”. They were both grey, both the same size.” She holds up a ticket. “She cancelled her own trip. She stood there laughing and then not laughing.”',
    choices: [
      { label: 'Promise to push for clearer buttons', run: g => { HM(g).noa = (HM(g).noa || 0) + 2; g.note('home_noa2', 'Promised Noa to push for clearer buttons. I put “Pay” and “Cancel” in my notes in two different colours.'); return 'She pins the ticket to the kiosk wall.'; } },
      { label: 'Tell her cancelling is recoverable', run: g => { HM(g).noa = (HM(g).noa || 0) + 1; g.note('home_noa2', 'Told Noa that a cancelled ticket can be undone. She had not known.'); return '“Then why did nobody tell her?”'; } },
      { label: 'Give her the day’s stamp pad', run: g => { HM(g).noa = (HM(g).noa || 0) + 1; g.note('home_noa2', 'Lent Noa my stamp pad for the kiosk. She stamped “CHECK TWICE” on every ticket.'); return 'It leaves a perfect purple rectangle.'; } }
    ] },
  9: { who: 'Antonio', icon: 'envelope', title: 'A second postcard',
    text: 'A postcard arrives with no stamp, delivered by hand. “Dear Inspector. I paid the electricity bill without help today. The screen told me what it would do before it did it. I cried a little, which is silly. Antonio.” On the back is a drawing of a very large button.',
    choices: [
      { label: 'Keep it on the wall', run: g => { HM(g).antonio = (HM(g).antonio || 0) + 1; g.meter({ trust: 1 }); g.note('home_antonio2', 'Pinned Antonio’s second postcard to the booth wall. The drawing of the big button is better than the rulebook’s.'); return 'It looks good next to the card.'; } },
      { label: 'Write back', run: g => { HM(g).antonio = (HM(g).antonio || 0) + 2; g.note('home_antonio2', 'Wrote back to Antonio. “Dear Antonio, it is not silly.”'); return 'You walk it to his door yourself.'; } },
      { label: 'Frame the drawing', run: g => { HM(g).antonio = (HM(g).antonio || 0) + 1; g.meter({ funds: -8 }); g.note('home_antonio2', 'Framed Antonio’s drawing of a very large button. 8 cr well spent.'); return 'The frame is slightly too big.'; } }
    ] },
  10: { who: 'Tamsin', icon: 'lamp', title: 'A spare wick on Lantern Night',
    text: 'Pier 9 glows below you. Tamsin leans on the railing, trimming a wick. “This is the first night in years I have not had to light every lamp myself.” She pushes the spare across the rail. “Keep one for the lighthouse. You will want it. I do not like the look of the tide.”',
    choices: [
      { label: 'Take the wick', run: g => { HM(g).wick = true; HM(g).tamsin = (HM(g).tamsin || 0) + 1; g.note('home_wick', 'Took Tamsin’s spare wick. It is the length of my hand.'); return 'It smells like clean smoke.'; } },
      { label: 'Ask what she fears about the tide', run: g => { HM(g).tamsin = (HM(g).tamsin || 0) + 1; g.note('home_wick', 'Asked Tamsin what she feared about the tide. “Nobody on the quay is watching the water, they are watching the Registry.”'); return 'She points at the dark water between the piers.'; } },
      { label: 'Tell her to keep it', run: g => { HM(g).tamsin = (HM(g).tamsin || 0); g.note('home_wick', 'Told Tamsin to keep the wick. She said, “You will need it more than I will.” I did not take it.'); return 'She tucks it back into her sleeve, frowning.'; } }
    ] },
  11: { who: 'Noa', icon: 'papers', title: 'A sign for the glass',
    text: 'Noa has painted a sign for the kiosk window in her own hand: “IF YOU CANNOT FIND IT, IT IS NOT YOUR FAULT.” She holds it up. “Do you think it is too much?” Behind her, the queue is reading it, one by one, and nodding.',
    choices: [
      { label: 'Say it is exactly right', run: g => { HM(g).noa = (HM(g).noa || 0) + 2; g.meter({ trust: 1 }); g.note('home_noa3', 'Told Noa her sign was exactly right. A man in the queue took a photograph of it.'); return 'She props it against the glass and steps back.'; } },
      { label: 'Suggest softer words', run: g => { HM(g).noa = (HM(g).noa || 0) + 1; g.note('home_noa3', 'Suggested softer words for Noa’s sign. She kept her own.'); return '“I prefer the true one,” she says.'; } },
      { label: 'Ask whether the Registry will object', run: g => { HM(g).noa = (HM(g).noa || 0) - 1; g.shiftBrig(1); g.note('home_noa3', 'Asked whether the Registry would object to Noa’s sign. She said, “Let them read it.”'); return 'It stays up. Nobody takes it down.'; } }
    ] },
  12: { who: 'Ilse', icon: 'papers', title: 'Ilse after the hearing',
    text: 'Ilse finds you after the inquiry. She does not sit. “You said something in there that nobody else would say.” She sets the ledger on the table. “Or you did not, and I am wrong about you.” She is tired, and for the first time she looks younger than she is.',
    choices: [
      { label: 'Ask her to burn the ledger', run: g => { HM(g).ilse = 'burn'; g.shiftBrig(-1); g.note('home_ilse', 'Asked Ilse to burn the ledger. She looked at it for a long time, then at the stove.'); return 'She does not answer. The stove is cold.'; } },
      { label: 'Ask her to keep it', run: g => { HM(g).ilse = 'keep'; g.shiftBrig(1); g.note('home_ilse', 'Asked Ilse to keep the ledger. “For when someone asks,” I said.'); return '“Someone always does,” she says.'; } },
      { label: 'Offer to copy a page with her', run: g => { HM(g).ilse = 'copy'; g.shiftBrig(1); g.meter({ trust: 1 }); g.note('home_ilse', 'Copied one page of the ledger with Ilse, by hand. It took forty minutes. It was a cat shelter’s rainbow banner.'); return 'Two pens, one lamp, one page.'; } }
    ] },
  13: { who: 'Tamsin', icon: 'lamp', title: 'The night before',
    text: 'Tamsin is at the foot of your stairs. “Tomorrow I light the last one, if my knee lets me.” She is not looking at you. “I have lit a lamp every night for forty years and I have never once asked what it was for.” She looks up. “You have seen every ship this year. What was it for?”',
    choices: [
      { label: 'So no one arrives at the wrong place', run: g => { HM(g).lampwhy = 'wrong'; HM(g).tamsin = (HM(g).tamsin || 0) + 1; g.note('home_lamp', 'Told Tamsin the lamp is so no one arrives at the wrong place.'); return '“Yes,” she says. “That is a good answer.”'; } },
      { label: 'So someone knows you are coming', run: g => { HM(g).lampwhy = 'known'; HM(g).tamsin = (HM(g).tamsin || 0) + 1; g.note('home_lamp', 'Told Tamsin the lamp is so someone knows you are coming. She did not answer for a while.'); return 'She nods, slowly. “Better.”'; } },
      { label: 'I do not know yet', run: g => { HM(g).lampwhy = 'unknown'; g.note('home_lamp', 'Told Tamsin I did not know what the lamp was for. She said, “Then you are ready to light it.”'); return 'She laughs, a short surprised sound.'; } }
    ] }
};
const _eveH = Game.prototype.showEvening;
Game.prototype.showEvening = function () {
  const sc = HOME_SCENES[this.day];
  this._homeSeen = this._homeSeen || new Set();
  if (!sc || this.endless || this.training || this._homeSeen.has(this.day)) return _eveH.call(this);
  this._homeSeen.add(this.day); this.mode = 'evening';
  this.showModal(`<div class="head">${Art.icon(sc.icon)}<div><p class="eyebrow">Evening · Day ${this.day} · ${esc(sc.who)}</p><h2 id="modal-title">${esc(sc.title)}</h2></div></div><p>${esc(sc.text)}</p>`,
    sc.choices.map(c => ({ label: c.label, onClick: () => { const m = c.run(this); this.closeModal(); if (m) this.toast(m); this.renderBoard(); _eveH.call(this); } })), { sheet: 'telegram', stacked: true });
};
const _resetH = Game.prototype.resetRun;
Game.prototype.resetRun = function () { _resetH.call(this); this._homeSeen = new Set(); };
NB_THREADS.Home = /^home/i;
/* act cards */
const ACT_CARDS = {
  1: ['Act I', 'The Berth Office', 'Port Halcyon opens its screens to the world on Monday. You hold the stamp, the booth and a lamp that sometimes goes out. Nobody has told you what the screens are for. Learn the rules, one morning at a time.'],
  8: ['Act II', 'The Long Winter', 'The rulebook is nearly complete, the Registry has moved in down the stairs, and the harbor has stopped pretending to be simple. Ships come heavier. People come with ledgers. It is no longer about whether a screen is correct.'],
  12: ['Act III', 'The Last Tide', 'An inquiry. A lantern. A page left blank on purpose. From here every choice you made on the quay comes back to the window, one by one, and asks for a signature.']
};
const _briefH = Game.prototype.showBriefing;
Game.prototype.showBriefing = function (cfg) {
  const c = ACT_CARDS[this.day]; this._actShown = this._actShown || new Set();
  if (!c || this.endless || this.training || this._actShown.has(this.day)) return _briefH.call(this, cfg);
  this._actShown.add(this.day);
  this.showModal(`<p class="eyebrow">${esc(c[0])}</p><h2 id="modal-title">${esc(c[1])}</h2><p class="quote">${esc(c[2])}</p>`,
    [{ label: 'Begin', primary: true, onClick: () => { this.closeModal(); _briefH.call(this, cfg); } }], { sheet: 'telegram order' });
};
const _resetH2 = Game.prototype.resetRun;
Game.prototype.resetRun = function () { _resetH2.call(this); this._actShown = new Set(); };
/* epilogue */
const _epiH = loreEpilogue;
loreEpilogue = function (g) {
  const L = _epiH(g), h = (S(g).home || {});
  if (h.tamsin != null) L.push(['Tamsin', h.tamsin >= 6 ? 'taught you to light a lamp low. She says the harbor has never been so well lit. She still walks the ladder herself.' : h.tamsin >= 3 ? 'lights the lamps. Her knee is worse. She chalks your name on the door frame, “for the record.”' : 'still lights every lamp herself. She says the harbor has always been dark in places.']);
  if (h.noa != null) L.push(['Noa', h.noa >= 5 ? 'painted the sign on every ticket window on the quay: IF YOU CANNOT FIND IT, IT IS NOT YOUR FAULT.' : h.noa >= 2 ? 'keeps the sign on her kiosk glass. A man took a photograph of it. It is in a magazine.' : 'runs the kiosk, reads small print aloud, and counts the ones who could not hit the button.']);
  if (h.antonio != null) L.push(['Antonio', h.antonio >= 4 ? 'pays all his bills himself now. He has a drawing of a very large button over the stove.' : h.antonio >= 2 ? 'sends a postcard now and then. “Dear Inspector, today the screen told me first.”' : 'still prefers postcards, but pays on the screen when someone sits with him.']);
  if (h.pete) L.push(['Pete', h.pete === 'fine' ? 'has forty-one cats now. The page is still up, with a rainbow banner and a new button.' : h.pete === 'carry' ? 'kept the page as it was. It is four years old and has never gone down.' : 'moved his cat page to a smaller server. It still has the banner.']);
  if (h.mara) L.push(['Mara', h.mara >= 4 ? 'tells everyone in the Office she nearly signed once. She says it is the best story she has.' : 'still pours the tea. She has not told you what she thinks of you, which is how you know.']);
  if (h.ilse) L.push(['Ilse’s ledger', h.ilse === 'burn' ? 'was never burned. It sits in the Registry’s lowest cabinet, unlabelled.' : h.ilse === 'keep' ? 'is open on a reading-room table. Someone asks for it every Thursday.' : 'has one page in two hands. The pages are the same.']);
  if (h.card) L.push(['The card above the stamp', 'still reads COUNT FIRST. JUDGE SECOND. Someone has added, in pencil: “and be kind about it.”']);
  if (h.lampwhy) L.push(['Tamsin’s question', h.lampwhy === 'wrong' ? 'was answered by the lamp: a ship came in on it with no one hurt.' : h.lampwhy === 'known' ? 'is written on the lighthouse wall in chalk: “So someone knows you are coming.”' : 'is still open. She says that is the good kind.']);
  return L;
};
/* ───────────────────── Who's who: introductions and a Day 1 prologue ───────────────────── */
LOOKS.Tamsin = { skin: '#d9a47a', hair: '#d9d9d4', style: 'bun', shirt: '#6a4a3a', bg: '#e0c890' };
LOOKS.Antonio = { skin: '#c68a5b', hair: '#8a8f95', style: 'short', shirt: '#3a5a7a', bg: '#d7e0d0' };
const CAST = {
  mara: { name: 'Mara', role: 'Berth Office colleague', blurb: 'She has the next booth and a year more on the quay. She makes the tea, notices everything and answers most questions with a better question.' },
  pip: { name: 'Pip', role: 'Dockhand and runner', blurb: 'Everyone’s friend and nobody’s employee. He knows the harbor’s gossip and the Authority’s forms.' },
  barnaby: { name: 'Barnaby Gull', role: 'Gull & Gull Studios', blurb: 'A loud, quick designer who calls every screen perfect and has never read an order. He brags, bargains and quotes pages of the rulebook that do not exist.' },
  ilse: { name: 'Ilse Brandt', role: 'Clerk of the Registry', blurb: 'Polite, exact, always writing. The Registry is the Authority’s records office, and she keeps its ledger.' },
  vael: { name: 'Chancellor Vael', role: 'Head of the Registry', blurb: 'Soft voice, white hair, a long memory. He believes a harbor runs on files, and that people who fix screens should be filed too.' },
  scarf: { name: 'The woman in the scarf', role: 'A reader', blurb: 'She misses the old web: marquees, guestbooks, blinking stars. The Blink Brigade of Pier 9 is hers, or she is theirs. She has never hurt anyone.' },
  noa: { name: 'Noa', role: 'Ferry kiosk clerk', blurb: 'She sells tickets and reads small print aloud for people who cannot. She counts everything: queues, tries, people who gave up.' },
  tamsin: { name: 'Tamsin', role: 'The harbor’s lamp-lighter', blurb: 'Forty years on the ladder, a bad knee and a good memory. She lights every lamp herself.' },
  antonio: { name: 'Antonio', role: 'Retired, learning online banking', blurb: 'He would rather send a postcard. He does not trust the screens, and he has good reasons.' },
  pete: { name: 'Pete', role: 'Cat shelter volunteer', blurb: 'Pixel Pete runs a shelter with forty cats and a homepage with a rainbow banner and thirty links.' },
  lantern: { name: 'The man with the lantern', role: 'A member of the public', blurb: 'He turns up wherever decisions are made. He never speaks first.' }
};
const CAST_KEY = { 'Mara': 'mara', 'Pip': 'pip', 'Barnaby Gull': 'barnaby', 'Ilse Brandt': 'ilse', 'Ilse': 'ilse', 'Chancellor Vael': 'vael', 'The woman in the scarf': 'scarf', 'Noa': 'noa', 'Tamsin': 'tamsin', 'Antonio': 'antonio', 'Pete': 'pete', 'The man with the lantern': 'lantern' };
const WORLD = {
  authority: 'The Authority runs Port Halcyon. Its Harbor Master watches your calls: three warnings and your seal is taken back. Its Inspector General audits the ledgers. Its Registry keeps the records.',
  numbers: 'Four numbers rule the booth: your purse (credits), public trust (do users believe you?), harbor flow (is the quay moving?) and your warnings.',
  brigade: 'The Blink Brigade, from Pier 9, make beautiful, hard-to-use screens on purpose. The Authority calls them terrorists. They have not hurt anyone.'
};
function introAfterHead(g, name) {
  const key = CAST_KEY[name] || CAST_KEY[String(name).split(',')[0]]; const c = CAST[key]; if (!c) return;
  const m = (S(g).met = S(g).met || {}); if (m[key]) return; m[key] = 1;
  g.note('cast_' + key, `${c.name}: ${c.role}. ${c.blurb}`);
  const html = `<p class="intro"><b>New face</b> · ${esc(c.name)}, ${esc(c.role)}. ${esc(c.blurb)}</p>`;
  const body = document.getElementById('modal-body'); if (!body) return;
  const head = body.querySelector('.head, .bubble');
  if (head) head.insertAdjacentHTML('afterend', html); else body.insertAdjacentHTML('afterbegin', html);
}
const _seCast = Game.prototype.showEvent;
Game.prototype.showEvent = function (ev) { _seCast.call(this, ev); const w = ev.who || (typeof EVENT_WHO !== 'undefined' && EVENT_WHO[ev.id]); if (w) introAfterHead(this, w[0]); };
const _trCast = Game.prototype.trollIntro;
Game.prototype.trollIntro = function (sub) { _trCast.call(this, sub); introAfterHead(this, 'Barnaby Gull'); };
/* the evening scenes show a portrait and the introduction */
const _evCast = Game.prototype.showEvening;
Game.prototype.showEvening = function () {
  const had = this._homeSeen && this._homeSeen.has(this.day);
  _evCast.call(this);
  const sc = typeof HOME_SCENES !== 'undefined' && HOME_SCENES[this.day];
  if (sc && !had && this._homeSeen.has(this.day)) {
    const h = document.querySelector('#modal-body .head');
    if (h && LOOKS[sc.who]) { const old = h.firstElementChild; if (old) old.outerHTML = `<figure class="pic face">${Art.portrait(sc.who)}</figure>`; }
    introAfterHead(this, sc.who);
  }
};
NB_THREADS.Cast = /^(cast|world)/i;
/* Day 1 prologue */
delete ACT_CARDS[1];
const PROLOGUE = [
  ['Port Halcyon', 'Port Halcyon is a harbor town that ships things nobody can touch: screens. Every login, checkout and booking form built for the public sails in here before anyone uses it. The Authority has hung a lamp, a rulebook and a stamp on the quay, and told one person to stand under them. That person is you.'],
  ['The Authority', WORLD.authority + ' ' + WORLD.numbers],
  ['Your booth', 'A room above the chandlery, a booth on the quay, and a stamp with two faces: CLEARED and TURNED BACK. The next booth along is Mara’s. On your sill is a card in careful capitals, left by the inspector before you: COUNT FIRST. JUDGE SECOND. Down on the pier, a dockhand called Pip is already waving.']
];
const _brCast = Game.prototype.showBriefing;
Game.prototype.showBriefing = function (cfg) {
  if (this.day !== 1 || this.endless || this._prolog) return _brCast.call(this, cfg);
  this._prolog = true;
  const page = i => {
    const p = PROLOGUE[i], last = i === PROLOGUE.length - 1;
    this.showModal(`<p class="eyebrow">Prologue · ${i + 1} of ${PROLOGUE.length}</p><h2 id="modal-title">${esc(p[0])}</h2><p class="quote">${esc(p[1])}</p>`,
      [{ label: last ? 'Take the booth' : 'Next', primary: true, onClick: () => { if (last) { this.note('world_authority', WORLD.authority); this.note('world_numbers', WORLD.numbers); ['mara', 'pip'].forEach(k => { S(this).met = S(this).met || {}; S(this).met[k] = 1; this.note('cast_' + k, `${CAST[k].name}: ${CAST[k].role}. ${CAST[k].blurb}`); }); this.closeModal(); _brCast.call(this, cfg); } else page(i + 1); } },
       { label: 'Skip the prologue', onClick: () => { this.closeModal(); _brCast.call(this, cfg); } }], { sheet: 'telegram order' });
  };
  page(0);
};
const _rsCast = Game.prototype.resetRun;
Game.prototype.resetRun = function () { _rsCast.call(this); this._prolog = false; };
/* the Brigade's first ship explains who they are */
const _bnCast = Game.prototype.nextSubmission;
Game.prototype.nextSubmission = function () { const r = _bnCast.apply(this, arguments); if (this.brigSeen === 1 && this.current && this.current.brig && !(S(this).world_brig)) { S(this).world_brig = 1; this.note('world_brigade', WORLD.brigade); } return r; };
/* ───────────────────── The Halcyon Gazette, front page ───────────────────── */
const PAPER_KICK = { berthoffice: 'Port & Office', clinic: 'Health', council: 'Council', guild: 'Trade', marrow: 'Ferries', nox: 'Business', pension: 'Welfare', quiet: 'Harbor', speech: 'Politics', tide: 'Tide & Weather' };
const PAPER_CAPS = ['The quay at first light, with the lamp still lit.', 'Ferries wait in the roads for their berths.', 'A view of the harbor from the Berth Office stairs.', 'Dock workers on the morning shift.', 'The old lighthouse, as seen from Pier 4.', 'Gulls, as always, were first to the news.'];
function paperWx(w) {
  const t = String(w).toLowerCase(), c = '#102f3a';
  const sun = `<circle cx="24" cy="24" r="8" fill="${c}"/>` + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M24 ${24 - 13}v-5" transform="rotate(${a} 24 24)" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`).join('');
  const cloud = `<path d="M14 32a7 7 0 0 1 1-13.9A10 10 0 0 1 34 17a8 8 0 0 1 1 16Z" fill="${c}"/>`;
  const rain = cloud + [16, 24, 32].map(x => `<path d="M${x} 36l-2 6" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`).join('');
  const fog = cloud + [38, 43].map(y => `<path d="M10 ${y}h28" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`).join('');
  const body = /rain|storm|thunder|squall|gale|shower/.test(t) ? rain : /fog|mist|haze/.test(t) ? fog : /clear|sun|fair|bright/.test(t) ? sun : cloud;
  return `<svg viewBox="0 0 48 48" width="46" height="46" aria-hidden="true">${body}</svg>`;
}
function paperTide(day) {
  const f = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const h = 340 + day * 50; return `High ${f(h)} · Low ${f(h + 372)} · High ${f(h + 744)}`;
}
Game.prototype.showNewspaper = function (next) {
  this.mode = 'briefing'; Sfx.paper();
  const n = NEWS[this.day](this), bx = BRIG_NEWS[this.day] && BRIG_NEWS[this.day](this);
  if (LORE_NEWS_NOTES[this.day]) LORE_NEWS_NOTES[this.day](this);
  if (bx) n.side = [bx, ...n.side].slice(0, 2);
  let whisper = '';
  if (this.bribes > 0 && !this.rumored && this.day > 2) { this.rumored = true; this.meter({ trust: -2 }); whisper = 'Whispers on the quay say someone at the Berth Office is taking envelopes. (Trust −2)'; }
  const y = this.yesterday && this.yesterday[0];
  const kick = s => esc(PAPER_KICK[s.img] || 'Local');
  const cap = PAPER_CAPS[(n.lead.h.length + this.day) % PAPER_CAPS.length];
  const act = this.day >= 12 ? 'Act III' : this.day >= 8 ? 'Act II' : 'Act I';
  const item = s => `<article class="nitem"><p class="kick">${kick(s)}</p><h4>${esc(s.h)}</h4><figure class="pic">${Art.news(s.img)}</figure><p>${esc(s.p)}</p></article>`;
  const lp = esc(n.lead.p);
  this.showModal(`
    <header class="gz-mast">
      <div class="gz-ear" aria-label="${esc(n.weather[0])}, ${esc(n.weather[1])}">${paperWx(n.weather.join(" "))}<span>${esc(n.weather[0])}<br>${esc(n.weather[1])}</span></div>
      <div class="gz-title"><b>The Halcyon Gazette</b><i>All the harbor’s news that fits, and some that does not</i></div>
      <div class="gz-ear r"><span>No. ${1200 + this.day}<br>${act}</span></div>
    </header>
    <div class="gz-dateline"><span>Morning edition</span><span>Day ${this.day} of ${this.maxDays}</span><span>${esc(paperTide(this.day))}</span><span>One credit</span></div>
    <div class="news-grid">
      <article class="lead"><p class="kick">${kick(n.lead)} · Front page</p><h3>${esc(n.lead.h)}</h3><p class="by">By the Gazette’s quay reporter</p>
        <figure class="pic">${Art.news(n.lead.img)}<figcaption>${esc(cap)}</figcaption></figure>
        <p class="body dropcap">${lp}</p></article>
      <div class="side">${n.side.map(item).join('')}
        ${y ? `<aside class="box stop"><span class="tag">Stop press</span><h4>Yesterday at your quay</h4><p><b>${esc(y.h)}.</b> ${esc(y.p)}</p></aside>` : ''}
        ${whisper ? `<aside class="box warn"><span class="tag">Rumour</span><p>${esc(whisper)}</p></aside>` : ''}
        <aside class="ad"><span class="tag">Notices</span>${esc(n.ad)}</aside>
      </div>
    </div>
    <footer class="gz-foot"><span>Printed at the Berth Office press</span><span>★ ★ ★</span><span>Lamp oil, 14 cr the flask</span></footer>`,
    [{ label: 'Read the order of the day', primary: true, onClick: next }], { dialog: 'wide', sheet: 'paperfront news' });
};
/* ───────────────────── Pip, the dockhand who coaches Day 1 ───────────────────── */
LOOKS.Pip = { skin: '#d9a47a', hair: '#b5651d', style: 'short', shirt: '#c0392b', bg: '#cfe6ef', eye: '#2d4a2a' };
const PIPLS = { get() { try { return localStorage.getItem('uxg.pip'); } catch (e) { return null; } }, set(v) { try { localStorage.setItem('uxg.pip', v); } catch (e) { /* ok */ } } };
const PIP = {
  step: -1, el: null, ring: [],
  active(g) { return g && g.day === 1 && !g.endless && PIP.step >= 0 && PIPLS.get() !== 'off'; },
  steps: [
    { say: 'Oi! Pip’s the name, docks are my game. I carry the tea and the gossip, and today I carry you through your first shift. <b>That’s the ship’s screen</b> in the middle: it’s what you inspect. Every ship is a screen that wants to go public.', ring: ['#mock-wrap'], next: true },
    { say: 'Now, the trick: <b>look for trouble</b>. Tiny writing, pale writing, buttons you could lose in a sock. Spotted something? <b>Click it.</b>', ring: ['#mock'], wait: 'pop' },
    { say: 'Good eye! Now name the crime. <b>Pick the rule it breaks</b> from the list, and be fair: a wrong rule is a wrong call.', ring: ['#pop-cats'], wait: 'flag' },
    { say: 'Cited! Cite every fault you can find, then stamp. <b>Turn back</b> if it is faulty, <b>clear</b> if it is sound. A faulty ship let through bites; so does a sound one turned away. (Keys: <b>X</b> turn back, <b>A</b> clear.)', ring: ['#btn-reject', '#btn-approve'], wait: 'decide' },
    { say: '', ring: [], slip: 'That slip is your report card: <b>green</b> lines you caught, <b>red</b> ones you missed, and your purse, trust and flow moved too. Do not fret. Everyone’s first slip has a wobble in it.' },
    { say: 'Second ship, easier already. See the book on the desk? <b>Orders</b> lists the rules in force, the dossier has the <b>house style guide</b>, and your <b>notebook</b> keeps the odd things people tell you. Read them when you are unsure.', ring: ['#rb-tab-heur'], next: true },
    { say: 'Up top: <b>purse</b> (credits), <b>trust</b> (do users believe you?) and <b>flow</b> (is the harbor moving?). Clear your <b>quota</b> before the bell, and once you have, you can <b>clock out early</b>. No pay for slacking, mind.', ring: ['#dial-quota', '#dial-trust', '#dial-flow', '#dial-funds'], next: true },
    { say: 'That is all from me. The old inspector pinned a card above his stamp: <b>COUNT FIRST. JUDGE SECOND.</b> Good luck, Inspector. I’ll be about, with tea.', ring: [], next: true, last: true }
  ],
  build() {
    if (PIP.el) return;
    const d = document.createElement('div'); d.id = 'pip'; d.hidden = true; d.setAttribute('role', 'status');
    d.innerHTML = `<figure class="pic face">${Art.portrait('Pip')}</figure><div class="pip-b"><p class="pip-n">Pip</p><p class="pip-t"></p><div class="pip-a"><button type="button" class="btn primary pip-next">Next</button><button type="button" class="btn pip-skip">Skip the tour</button></div></div>`;
    document.body.appendChild(d); PIP.el = d;
    d.querySelector('.pip-next').addEventListener('click', () => PIP.advance());
    d.querySelector('.pip-skip').addEventListener('click', () => PIP.end(true));
  },
  clear() { PIP.ring.forEach(e => e.classList.remove('pip-ring')); PIP.ring = []; },
  show() {
    const s = PIP.steps[PIP.step]; PIP.clear(); PIP.build();
    if (!s || s.slip) { PIP.el.hidden = true; return; }
    PIP.el.querySelector('.pip-t').innerHTML = s.say;
    const nb = PIP.el.querySelector('.pip-next'); nb.hidden = !s.next; nb.textContent = s.last ? 'Thanks, Pip' : 'Next';
    s.ring.forEach(sel => document.querySelectorAll(sel).forEach(e => { e.classList.add('pip-ring'); PIP.ring.push(e); }));
    const t = PIP.ring[0]; let side = 'left';
    if (t) { const r = t.getBoundingClientRect(); if (r.left + r.width / 2 < innerWidth / 2) side = 'right'; }
    PIP.el.className = 'pip-' + side; PIP.el.hidden = false;
  },
  go(n) { PIP.step = n; PIP.show(); },
  advance() { if (PIP.step >= PIP.steps.length - 1) return PIP.end(false); PIP.go(PIP.step + 1); },
  end(skipped) { PIP.step = -1; PIP.clear(); if (PIP.el) PIP.el.hidden = true; PIPLS.set('off'); },
  on(ev) {
    if (PIP.step < 0) return;
    if (ev === 'decide') { if (PIP.step <= 3) { PIP.clear(); if (PIP.el) PIP.el.hidden = true; PIP.step = 4; } return; }
    const s = PIP.steps[PIP.step]; if (!s) return;
    if (s.wait === ev) PIP.go(PIP.step + 1); else if (ev === 'pop' && PIP.step === 1) PIP.go(2);
  }
};
const _nsP = Game.prototype.nextSubmission;
Game.prototype.nextSubmission = function () {
  const r = _nsP.apply(this, arguments);
  if (PIP.active(this) && this.mode === 'inspecting') {
    if (PIP.step === 0 && this.processed === 0) PIP.show();
    else if (PIP.step === 4 && this.processed === 1) PIP.go(5);
    else if (PIP.step === 5 || PIP.step === 6) PIP.show();
    else if (PIP.step === 7) PIP.show();
    else if (PIP.step > 0 && PIP.step <= 3) PIP.show();
  } else if (PIP.step >= 0 && this.day !== 1) PIP.end(false);
  return r;
};
Game.prototype.showReceipt = (function (o) { return function (sub, kind, res, eff) {
  const r = o.apply(this, arguments);
  if (PIP.active(this) && PIP.step === 4) { const b = document.getElementById('modal-body'); b && b.insertAdjacentHTML('beforeend', `<div class="bubble small"><figure class="pic face">${Art.portrait('Pip')}</figure><div><p class="say"><b>Pip:</b> ${PIP.steps[4].slip}</p></div></div>`); PIP.step = 4.5; }
  return r;
}; })(Game.prototype.showReceipt);
/* step numbering: after the slip the next ship is step 5 */
const _afterP = Game.prototype.afterReceipt;
Game.prototype.afterReceipt = function () { if (PIP.step === 4.5) PIP.step = 4; return _afterP.apply(this, arguments); };
const _opP = Auditor.prototype.openPop;
Auditor.prototype.openPop = function () { const r = _opP.apply(this, arguments); if (!this.pop.hidden) PIP.on('pop'); return r; };
const _sfP = Auditor.prototype.setFlag;
Auditor.prototype.setFlag = function () { const r = _sfP.apply(this, arguments); PIP.on('flag'); return r; };
const _dcP = Game.prototype.decide;
Game.prototype.decide = function (kind) { const was = this.mode; const r = _dcP.apply(this, arguments); if (was === 'inspecting' && this.mode === 'stamping') PIP.on('decide'); return r; };
const _rsP = Game.prototype.resetRun;
Game.prototype.resetRun = function () { _rsP.call(this); PIP.step = PIPLS.get() === 'off' ? -1 : 0; if (PIP.el) PIP.el.hidden = true; PIP.clear(); };
/* ring the first step only when the board is visible; the last step ends the tour */
const _advP = PIP.advance;
PIP.advance = function () { if (PIP.steps[PIP.step] && PIP.steps[PIP.step].last) return PIP.end(false); return _advP.call(PIP); };
/* new instruments get a word from Pip on the morning they arrive */
const PIP_TOOLS = { 2: 'The <b>contrast lens</b> (key 2): point it at text and it reads the ratio for you. Pale grey on white fails below 4.5 : 1.', 3: 'The <b>hand</b> (key 6): lets you test how a pointer copes with a target. If it is hard for me, it is hard for a nervous grandmother.', 4: 'The <b>calipers</b> (key 3) measure targets, and the <b>prism glass</b> (key 5) shows the screen as a colour-blind person sees it. Two tools, two kinds of trouble.', 5: 'The <b>route chart</b> (key 4): press Tab through the form and it draws the path. If it zigzags, the tab order is wrong.' };
const _brP = Game.prototype.showBriefing;
Game.prototype.showBriefing = function (cfg) {
  _brP.call(this, cfg);
  const t = PIP_TOOLS[this.day]; const q = document.querySelector('#modal-body .quote');
  if (t && q && !this.endless && !this.training) q.insertAdjacentHTML('afterend', `<div class="bubble small"><figure class="pic face">${Art.portrait('Pip')}</figure><div><p class="say"><b>Pip:</b> ${t}</p></div></div>`);
};
/* title screen switch */
const _titleP = Game.prototype.showTitle;
Game.prototype.showTitle = function () {
  _titleP.call(this);
  const tr = document.getElementById('opt-training');
  if (tr && !document.getElementById('opt-pip')) {
    const l = document.createElement('label'); l.className = 'opt';
    l.innerHTML = '<input type="checkbox" id="opt-pip"> Pip’s tour on Day 1 (a dockhand who explains the controls)';
    const inp = l.querySelector('input'); inp.checked = PIPLS.get() !== 'off';
    inp.addEventListener('change', () => { PIPLS.set(inp.checked ? 'on' : 'off'); });
    tr.closest('label').after(l);
  }
};
/* ───────────────────── Call the next ship: you choose when each one ties up ───────────────────── */
const _nsCall = Game.prototype.nextSubmission, _meCall = Game.prototype.maybeEvent, _tkCall = Game.prototype.tick;
Game.prototype.maybeEvent = function () { const r = _meCall.apply(this, arguments); if (r) this._callNow = true; return r; };
Game.prototype.nextSubmission = function () {
  if (window.__AUTOCALL) this._callNow = true;
  if (this._callNow) { this._callNow = false; return _nsCall.apply(this, arguments); }
  if (this.mode === 'waiting') return;
  this.closeModal();
  if (!this.training && this.queue.length < 3) this.refill();
  if (!this.queue.length || (!this.training && this.shiftLeft <= 0) || (this.training && this.processed >= this.quota)) return _nsCall.apply(this, arguments);
  this.mode = 'waiting'; this.current = null; this._prep = this.processed === 0;
  this.setStamps(false); this.auditor.clear(); this.clearPopups(); $('#stamp-mark').classList.remove('show');
  const nx = this.queue[0], n = this.queue.length;
  $('#mock-wrap').classList.add('idle'); $('#mock-url').textContent = 'no ship at the quay';
  const hint = this.training ? 'Take your time.' : this._prep ? 'The clock has not started. Read your orders first.' : 'The clock keeps running while the berth is empty.';
  $('#screen-idle').innerHTML = `<div><b>${this._prep ? 'The booth is ready' : 'The berth is empty'}</b><span style="display:block;margin:2px 0">${n} waiting · next: <i>MV ${esc(nx.tpl.name)}</i></span><span style="display:block;margin:2px 0 8px;font-size:.85rem;opacity:.85">${hint}</span><button type="button" id="btn-call" class="btn primary" style="font-size:1.05rem;padding:8px 18px">Call the ${this._prep ? 'first' : 'next'} ship <small style="opacity:.7">(Space)</small></button></div>`;
  $('#btn-call').addEventListener('click', () => this.callShip());
  $('#btn-call').focus({ preventScroll: true });
  this.renderTimer(); this.renderBoard(); this.updatePlate();
  this.auditor.say(this._prep ? 'The booth is ready. Read the orders on the left, then call the first ship.' : 'Berth clear. Check your notes, then call the next ship.');
  if (typeof PIP !== 'undefined' && PIP.active(this) && PIP.step === 0 && this.processed === 0) { PIP.build(); PIP.clear(); PIP.el.querySelector('.pip-t').innerHTML = 'There’s your booth, Inspector. The screen is dark and the ship is waiting. <b>The clock has not started</b>, so look over the orders on the left if you fancy. Then press <b>Call the first ship</b>.'; PIP.el.querySelector('.pip-next').hidden = true; document.querySelectorAll('#btn-call').forEach(e => { e.classList.add('pip-ring'); PIP.ring.push(e); }); PIP.el.className = 'pip-left'; PIP.el.hidden = false; }
};
Game.prototype.callShip = function () {
  if (this.mode !== 'waiting') return;
  $('#screen-idle').innerHTML = '<div><b>Berth empty</b>Waiting for the next ship to tie up.</div>';
  this._prep = false; this._callNow = true; this.lastTick = performance.now(); this.nextSubmission();
};
Game.prototype.tick = function () {
  if (this.mode === 'waiting' && !this.training && !this._prep) {
    const now = performance.now(), dt = (now - this.lastTick) / 1000; this.lastTick = now;
    this.shiftLeft -= Math.min(dt, .5) * (this.clockScale || 1); this.renderTimer();
    if (this.shiftLeft <= 0) { this.shiftLeft = 0; this.toast('The closing bell rings while the berth stands empty.'); Sfx.horn(); this.mode = 'stamping'; setTimeout(() => this.endDay(), 900); }
    return;
  }
  return _tkCall.apply(this, arguments);
};
document.addEventListener('keydown', e => {
  const g = window.portHalcyon;
  if (!g || g.mode !== 'waiting' || g.modal.open || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.matches && e.target.matches('input,select,textarea,button:not(#btn-call)')) return;
  if (e.key === ' ' || e.key.toLowerCase() === 'n' || e.key === 'Enter') { e.preventDefault(); g.callShip(); }
});
/* ───────────────────── Training Yard: practise any rule with no pressure ───────────────────── */
const YLS = { get() { try { return JSON.parse(localStorage.getItem('uxg.yard') || '{}'); } catch (e) { return {}; } }, set(v) { try { localStorage.setItem('uxg.yard', JSON.stringify(v)); } catch (e) { /* ok */ } } };
const YARD_OK = ['Spot on.', 'Clean as a whistle.', 'That is the eye of an inspector.', 'Textbook.', 'Not a thing missed.'];
const YARD_SLIP = ['No bother, that is what the yard is for.', 'Everyone misses one. Press “Show me” and I will point.', 'Close. Look at the notes on the slip, then try the next.', 'Nobody is watching. Take it slow.'];
/* a bubble from Pip that is not part of the tour */
const YPIP = {
  el: null,
  show(html, buttons, ring) {
    if (!YPIP.el) {
      const d = document.createElement('div'); d.id = 'ypip'; d.hidden = true; d.setAttribute('role', 'status');
      d.innerHTML = `<figure class="pic face">${Art.portrait('Pip')}</figure><div class="pip-b"><p class="pip-n">Pip</p><p class="pip-t"></p><div class="pip-a"></div></div>`;
      document.body.appendChild(d); YPIP.el = d;
    }
    YPIP.clear();
    const e = YPIP.el; e.querySelector('.pip-t').innerHTML = html;
    const a = e.querySelector('.pip-a'); a.innerHTML = '';
    buttons.forEach(b => { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn' + (b.primary ? ' primary' : ''); x.textContent = b.label; x.addEventListener('click', b.on); a.appendChild(x); });
    YPIP.ring = [];
    (ring || []).forEach(el => { el.classList.add('pip-ring'); YPIP.ring.push(el); });
    e.hidden = false;
  },
  clear() { (YPIP.ring || []).forEach(e => e.classList.remove('pip-ring')); YPIP.ring = []; if (YPIP.el) YPIP.el.hidden = true; }
};
Game.prototype.yardPicker = function () {
  const st = YLS.get();
  const row = (id, name) => { const s = st[id]; return { label: name + (s ? `  ·  ${s.right}/${s.n} clean` : ''), onClick: () => this.startYard(id) }; };
  this.showModal(`<p class="eyebrow">Pip’s Training Yard</p><h2 id="modal-title">What shall we practise?</h2>
    <p>No clock, no money, no warnings, and every instrument unlocked. Pick a rule and every ship will be about it, or mix them all. Ask for a hint any time, and after each ship I will point at what was there.</p>`,
    [{ label: 'Mixed: every rule', primary: true, onClick: () => this.startYard('all') }, ...CATEGORIES.map(c => row(c.id, c.name)), { label: 'Back', onClick: () => this.showTitle() }], { stacked: true });
};
Game.prototype.startYard = function (cat) {
  this.resetRun(); PIP.step = -1;
  this.yard = { cat, n: 0, right: 0, hints: 0, streak: 0, best: 0, miss: {}, hl: 0 };
  this.training = true; this.endless = false; this.day = 14;
  this.quota = 9999; this.processed = 0; this.evToday = 99; this.pending = []; this.upgrades = new Set();
  const f = new SubmissionFactory(14); f.cfg = Object.assign({}, DAYS[13], { clean: .2, maxDefects: cat === 'all' ? 3 : 2, focus: undefined });
  if (cat !== 'all') { f.active = new Set([cat]); f.pool = Object.values(TEMPLATES).filter(t => Object.values(t.defects).some(d => d.cat === cat)); }
  this.factory = f; this.queue = []; this.nextNo = 1; this.refill();
  this.dayRecords = []; this.current = null; this.maraLeft = 0; this.apprLeft = 0;
  this.auditor.clear(); this.buildRulebook(); this.applyTools();
  this.scene.setQueue(this.queue.map(s => this.queueData(s))); this.scene.setWeather(1); this.scene.skyTo(.3, 600);
  $('#stamp-mark').classList.remove('show');
  this.closeModal(); this.setStamps(false); this.updatePlate(); this.renderBoard(); this.renderTimer();
  let hb = $('#btn-hint');
  if (!hb) { hb = document.createElement('button'); hb.id = 'btn-hint'; hb.type = 'button'; hb.className = 'mini'; hb.textContent = 'Hint'; $('#btn-leave').after(hb); hb.addEventListener('click', () => this.yardHint()); }
  hb.hidden = false;
  this.mode = 'briefing';
  const first = !YLS.get()._seen; const st = YLS.get(); st._seen = 1; YLS.set(st);
  this.nextSubmission();
  if (first) setTimeout(() => YPIP.show('Welcome to the yard! Nothing here costs a credit or a warning. Press <b>Hint</b> if you are stuck: once to circle the spot, twice to name the rule. When you stamp, I will point at everything that was there.', [{ label: 'Got it', primary: true, on: () => YPIP.clear() }]), 400);
};
Game.prototype.yardHint = function () {
  const y = this.yard, sub = this.current; if (!y || this.mode !== 'inspecting' || !sub) return;
  const open = [...sub.defects.entries()].filter(([r]) => !this.auditor.flags.has(r));
  if (!sub.defects.size) { this.toast('I see nothing wrong here. It might be a sound one.'); y.hints++; return; }
  if (!open.length) { this.toast('You have flagged everything I can see. Time to stamp.'); return; }
  const [r, d] = open[0]; y.hints++;
  const el = document.querySelector(`#mock [data-region="${r}"]`);
  y.hl = (y.hl || 0) + 1;
  if (el) { el.classList.add('pip-ring'); setTimeout(() => el.classList.remove('pip-ring'), 4000); el.scrollIntoView({ block: 'nearest' }); }
  if (y.hl % 2 === 1) this.toast('Pip: look closely at “' + (sub.tpl.regions[r] || r) + '”.'); else this.toast('Pip: it breaks “' + CAT[d.cat].name + '”.');
};
const _csY = Game.prototype.consequences;
Game.prototype.consequences = function (sub, kind, res) {
  if (!this.yard) return _csY.apply(this, arguments);
  const y = this.yard; y.n++; y.hl = 0;
  const clean = res.hits.length === sub.defects.size && !res.partial.length && !res.falseFlags.length && ((kind === 'reject') === (sub.defects.size > 0));
  if (clean) { y.right++; y.streak++; y.best = Math.max(y.best, y.streak); } else y.streak = 0;
  res.missed.forEach(m => { y.miss[m.d.cat] = (y.miss[m.d.cat] || 0) + 1; });
  res.credits = 0; y._clean = clean;
  const st = YLS.get(), k = y.cat; st[k] = st[k] || { n: 0, right: 0 }; st[k].n++; if (clean) st[k].right++; YLS.set(st);
  return { d: { trust: 0, flow: 0, funds: 0 }, notes: [], warned: false };
};
const _rcY = Game.prototype.showReceipt;
Game.prototype.showReceipt = function (sub, kind, res, eff) {
  _rcY.apply(this, arguments);
  if (!this.yard) return;
  const y = this.yard, body = document.getElementById('modal-body');
  body.querySelectorAll('.chips, .note').forEach(e => e.remove());
  const eb = body.querySelector('.eyebrow'); if (eb) eb.textContent = `Training ship ${y.n} · MV ${sub.tpl.name} · ${y.right} clean so far`;
  const say = y._clean ? pick(YARD_OK) + (y.streak > 2 ? ` ${y.streak} clean in a row.` : '') : pick(YARD_SLIP);
  const h = body.querySelector('.rhead'); h && h.insertAdjacentHTML('afterend', `<div class="bubble small"><figure class="pic face">${Art.portrait('Pip')}</figure><div><p class="say"><b>Pip:</b> ${esc(say)}</p></div></div>`);
  const acts = document.getElementById('modal-actions'); acts.innerHTML = '';
  const mk = (label, cls, on) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls; b.textContent = label; b.addEventListener('click', on); acts.appendChild(b); };
  mk('Next ship', 'primary', () => { this.closeModal(); this.afterReceipt(); });
  if (sub.defects.size) mk('Show me on screen', '', () => this.yardShow(sub));
  mk('Leave the yard', '', () => { this.closeModal(); this.yardReport(); });
};
Game.prototype.yardShow = function (sub) {
  this.closeModal(); $('#stamp-mark').classList.remove('show');
  const R = sub.tpl.regions, items = [...sub.defects.values()];
  const els = items.map(d => document.querySelector(`#mock [data-region="${d.region}"]`)).filter(Boolean);
  const txt = items.map((d, i) => `<b>${i + 1}.</b> ${esc(R[d.region] || d.region)}: ${esc(d.label)} <i>(${esc(CAT[d.cat].name)})</i>`).join('<br>');
  els.forEach(e => e.scrollIntoView({ block: 'nearest' }));
  YPIP.show(`Here is what was on this one:<br>${txt}`, [{ label: 'Next ship', primary: true, on: () => { YPIP.clear(); this.afterReceipt(); } }, { label: 'Leave the yard', on: () => { YPIP.clear(); this.yardReport(); } }], els);
};
Game.prototype.yardReport = function () {
  const y = this.yard; if (!y) return this.showTitle();
  YPIP.clear(); const hb = $('#btn-hint'); if (hb) hb.hidden = true;
  const weak = Object.entries(y.miss).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const acc = y.n ? Math.round(100 * y.right / y.n) : 0;
  const html = `<p class="eyebrow">Yard report</p><h2 id="modal-title">${y.n ? `${y.right} of ${y.n} ships judged cleanly` : 'No ships yet'}</h2>
    ${y.n ? `<p>${acc}% clean · best streak ${y.best} · hints used ${y.hints}</p>` : ''}
    ${weak.length ? `<p><b>Worth another look:</b></p><ul class="lines">${weak.map(([c, n]) => `<li class="bad"><span class="ic">${Art.ruleIcon(c)}</span><span><b>${esc(CAT[c].name)}</b> · missed ${n}×<small>${esc(CAT[c].rule)}</small></span></li>`).join('')}</ul>` : y.n ? '<p>Nothing missed. The booth is waiting for you, Inspector.</p>' : ''}`;
  const done = () => { this.yard = null; this.training = false; this.mode = 'title'; };
  this.showModal(html, [{ label: 'Keep training', primary: true, onClick: () => { done(); this.yardPicker(); } }, { label: 'Back to the title', onClick: () => { done(); this.showTitle(); } }]);
};
const _ckY = Game.prototype.checkFail;
Game.prototype.checkFail = function () { return this.yard ? false : _ckY.apply(this, arguments); };
const _nsY = Game.prototype.nextSubmission;
Game.prototype.nextSubmission = function () { if (this.yard && this.queue.length < 3) this.refill(); return _nsY.apply(this, arguments); };
const _rbY = Game.prototype.renderBoard;
Game.prototype.renderBoard = function () {
  _rbY.apply(this, arguments);
  if (!this.yard) { document.body.classList.remove('yard'); const qh = $('#dial-quota h2'); if (qh && qh.textContent === 'Clean calls') qh.textContent = 'Quota'; const hb = $('#btn-hint'); if (hb) hb.hidden = true; return; }
  document.body.classList.add('yard'); $('#hud-day').textContent = 'Training Yard';
  const q = $('#hud-quota'); if (q) q.textContent = `${this.yard.right} / ${this.yard.n}`; const qh = $('#dial-quota h2'); if (qh) qh.textContent = 'Clean calls'; $('#quota-bar').value = this.yard.n ? this.yard.right / this.yard.n : 0;
  const lb = $('#btn-leave'); lb.hidden = false; lb.disabled = false; lb.textContent = 'Leave the yard';
  const hb = $('#btn-hint'); if (hb) hb.hidden = false;
};
const _clY = Game.prototype.leaveEarly;
Game.prototype.leaveEarly = function () { if (this.yard) { this.yardReport(); return; } return _clY.apply(this, arguments); };
const _tkY = Game.prototype.tick;
Game.prototype.tick = function () { if (this.yard) return; return _tkY.apply(this, arguments); };
const _rsY = Game.prototype.resetRun;
Game.prototype.resetRun = function () { _rsY.call(this); this.yard = null; YPIP.clear(); const hb = $('#btn-hint'); if (hb) hb.hidden = true; };
const _tiY = Game.prototype.showTitle;
Game.prototype.showTitle = function () {
  _tiY.call(this);
  const acts = document.getElementById('modal-actions'), tr = document.getElementById('opt-training');
  if (tr) { const l = tr.closest('label'); if (l) l.style.display = 'none'; tr.checked = false; }
  if (acts && !acts.querySelector('.b-yard')) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn primary b-yard'; b.textContent = 'Training Yard: practise, no pressure';
    b.addEventListener('click', () => this.yardPicker());
    const career = [...acts.children].find(x => /^Take the booth/.test(x.textContent.trim()));
    career ? career.before(b) : acts.prepend(b);
  }
};
/* ───────────────────── Settings, music, keyboard and touch ───────────────────── */
/* ── sound: volume and a quiet generative music layer ── */
Sfx.vol = 1;
Sfx.setOn = function (v) { this.on = v; if (this.master) this.master.gain.setTargetAtTime(v ? .55 * this.vol : 0, this.ctx.currentTime, .05); };
Sfx.setVol = function (v) { this.vol = v; if (this.master && this.on) this.master.gain.setTargetAtTime(.55 * v, this.ctx.currentTime, .05); };
const MUS = { on: true, g: null, t: null, i: 0 };
const MCH = {
  calm: [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 196, 246.9]],
  dark: [[220, 261.6, 329.6], [207.7, 261.6, 311.1], [174.6, 207.7, 261.6], [164.8, 207.7, 246.9]]
};
MUS.start = () => {
  const c = Sfx.ctx; if (!c || MUS.g || !MUS.on) return;
  MUS.g = c.createGain(); MUS.g.gain.value = 0; MUS.g.connect(Sfx.master); MUS.g.gain.setTargetAtTime(1, c.currentTime, 2.5);
  MUS.step();
};
MUS.stop = () => {
  clearTimeout(MUS.t); MUS.t = null;
  if (MUS.g && Sfx.ctx) { const g = MUS.g; g.gain.setTargetAtTime(0, Sfx.ctx.currentTime, .5); setTimeout(() => { try { g.disconnect(); } catch (e) { /* gone */ } }, 2500); }
  MUS.g = null;
};
MUS.step = () => {
  const c = Sfx.ctx; if (!c || !MUS.g) return;
  const g = window.portHalcyon, set = g && g.trust < 40 ? MCH.dark : MCH.calm, ch = set[MUS.i++ % 4], t = c.currentTime, dur = 7.5;
  ch.forEach((f, k) => {
    const o = c.createOscillator(), e = c.createGain();
    o.type = k === 0 ? 'triangle' : 'sine'; o.frequency.value = k === 0 ? f / 2 : f; o.detune.value = (k - 1) * 5;
    e.gain.setValueAtTime(.0001, t); e.gain.linearRampToValueAtTime(.035, t + 2.4); e.gain.linearRampToValueAtTime(.0001, t + dur + 1);
    o.connect(e); e.connect(MUS.g); o.start(t); o.stop(t + dur + 1.2);
  });
  if (Math.random() < .6) {
    const o = c.createOscillator(), e = c.createGain(), bt = t + 1 + Math.random() * 4;
    o.type = 'sine'; o.frequency.value = ch[Math.floor(Math.random() * 3)] * 2;
    e.gain.setValueAtTime(.0001, bt); e.gain.exponentialRampToValueAtTime(.03, bt + .03); e.gain.exponentialRampToValueAtTime(.0001, bt + 2.8);
    o.connect(e); e.connect(MUS.g); o.start(bt); o.stop(bt + 3);
  }
  MUS.t = setTimeout(MUS.step, dur * 1000);
};
const _sfxInit = Sfx.init;
Sfx.init = function () {
  const had = !!this.ctx; _sfxInit.call(this);
  if (!had && this.ctx) { this.master.gain.value = this.on ? .55 * this.vol : 0; MUS.start(); }
};
document.addEventListener('visibilitychange', () => { if (document.hidden) MUS.stop(); else if (Sfx.ctx) MUS.start(); });

/* ── applying saved settings ── */
function applyMore() {
  const s = SET.get(), b = document.body;
  b.classList.toggle('large', s.fs === 'l'); b.classList.toggle('xlarge', s.fs === 'x');
  b.classList.toggle('roomy', !!s.roomy);
  Sfx.vol = s.vol === undefined ? 1 : s.vol;
  Sfx.on = s.snd === undefined ? Sfx.on : !!s.snd;
  MUS.on = s.mus === undefined ? true : !!s.mus;
  const t = document.getElementById('btn-textsize'); if (t) t.setAttribute('aria-pressed', String(s.fs === 'l' || s.fs === 'x'));
  const sb = document.getElementById('btn-sound'); if (sb) { sb.setAttribute('aria-pressed', String(Sfx.on)); sb.textContent = Sfx.on ? 'Sound on' : 'Sound off'; }
  if (Sfx.ctx) { Sfx.setOn(Sfx.on); Sfx.setVol(Sfx.vol); MUS.on ? MUS.start() : MUS.stop(); }
}
const _applyS = applySettings;
applySettings = function () { _applyS(); applyMore(); };
applyMore();

/* ── the Settings dialog ── */
const SETD = document.createElement('dialog');
SETD.id = 'settings'; SETD.setAttribute('aria-labelledby', 'set-title');
SETD.innerHTML = `<div class="setsheet">
  <p class="eyebrow">Port Halcyon</p><h2 id="set-title">Settings</h2>
  <div class="setgrid">
    <fieldset><legend>Sound</legend>
      <label class="opt"><input type="checkbox" id="set-snd"> Sound effects</label>
      <label class="opt"><input type="checkbox" id="set-mus"> Quiet harbor music</label>
      <label class="setrow">Volume <input type="range" id="set-vol" min="0" max="100" step="5" aria-label="Volume"><output id="set-volv">100</output></label>
    </fieldset>
    <fieldset><legend>Reading</legend>
      <label class="setrow">Text size <select id="set-fs"><option value="n">Normal</option><option value="l">Large</option><option value="x">Extra large</option></select></label>
      <label class="opt"><input type="checkbox" id="set-roomy"> Roomier, easier-to-read type</label>
      <label class="opt"><input type="checkbox" id="set-safe"> Safe colours (adds shapes to colour codes)</label>
      <label class="opt"><input type="checkbox" id="set-calm"> Calm motion (less animation)</label>
    </fieldset>
    <fieldset><legend>Keys</legend>
      <ul class="keys">
        <li><kbd>1</kbd>–<kbd>6</kbd> instruments</li><li><kbd>A</kbd> clear the berth</li><li><kbd>X</kbd> turn back</li>
        <li><kbd>[</kbd> <kbd>]</kbd> choose the previous or next part of the screen</li><li><kbd>C</kbd> cite the chosen part</li>
        <li><kbd>N</kbd> call the next ship</li><li><kbd>?</kbd> this panel</li><li><kbd>Esc</kbd> close a pop-up</li>
      </ul>
    </fieldset>
    <fieldset><legend>Guide</legend>
      <label class="opt"><input type="checkbox" id="set-pip"> Pip’s tutorial tips on Day 1</label>
    </fieldset>
  </div>
  <div class="actions"><button type="button" class="btn primary" id="set-close">Done</button></div></div>`;
document.body.appendChild(SETD);
const $s = id => document.getElementById(id);
function syncSet() {
  const s = SET.get();
  $s('set-snd').checked = Sfx.on; $s('set-mus').checked = MUS.on;
  $s('set-vol').value = Math.round(Sfx.vol * 100); $s('set-volv').textContent = Math.round(Sfx.vol * 100);
  $s('set-fs').value = s.fs || 'n'; $s('set-roomy').checked = !!s.roomy;
  $s('set-safe').checked = document.body.classList.contains('safe'); $s('set-calm').checked = document.body.classList.contains('calm');
  $s('set-pip').checked = PIPLS.get() !== 'off';
}
function openSettings() { const g = window.portHalcyon; if (g) g.lastTick = performance.now(); syncSet(); if (!SETD.open) SETD.showModal(); }
$s('set-snd').addEventListener('change', e => { SET.put('snd', e.target.checked); Sfx.init(); applyMore(); });
$s('set-mus').addEventListener('change', e => { SET.put('mus', e.target.checked); Sfx.init(); applyMore(); });
$s('set-vol').addEventListener('input', e => { const v = +e.target.value / 100; SET.put('vol', v); $s('set-volv').textContent = e.target.value; Sfx.init(); applyMore(); });
$s('set-fs').addEventListener('change', e => { SET.put('fs', e.target.value); applyMore(); });
$s('set-roomy').addEventListener('change', e => { SET.put('roomy', e.target.checked); applyMore(); });
$s('set-safe').addEventListener('change', e => { SET.put('safe', e.target.checked); applySettings(); });
$s('set-calm').addEventListener('change', e => { SET.put('calm', e.target.checked); applySettings(); });
$s('set-pip').addEventListener('change', e => { if (e.target.checked) { PIPLS.set('on'); const g = window.portHalcyon; if (g && g.day === 1 && typeof PIP !== 'undefined' && PIP.step < 0) PIP.step = 0; } else PIPLS.set('off'); });
$s('set-close').addEventListener('click', () => { SETD.close(); const g = window.portHalcyon; if (g) g.lastTick = performance.now(); });
SETD.addEventListener('close', () => { const g = window.portHalcyon; if (g) g.lastTick = performance.now(); });
const _topbtns = document.querySelector('.topbtns');
{
  const b = document.createElement('button'); b.type = 'button'; b.className = 'mini'; b.id = 'btn-settings'; b.textContent = 'Settings'; b.setAttribute('aria-haspopup', 'dialog');
  b.addEventListener('click', openSettings); _topbtns.appendChild(b);
}
/* the shift clock waits while Settings is open */
const _tickQ = Game.prototype.tick;
Game.prototype.tick = function () { if (SETD.open) { this.lastTick = performance.now(); return; } return _tickQ.call(this); };

/* ── keyboard: choose and cite a part without the pointer; ? opens Settings ── */
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.matches && e.target.matches('input,select,textarea')) return;
  const g = window.portHalcyon; if (!g) return;
  if (e.key === '?' && !SETD.open && !g.modal.open) { e.preventDefault(); openSettings(); return; }
  if (g.mode !== 'inspecting' || g.modal.open || SETD.open || !g.auditor.pop.hidden) return;
  const sel = document.getElementById('region-select'); if (!sel || !sel.options.length) return;
  if (e.key === '[' || e.key === ']') {
    const n = sel.options.length; sel.selectedIndex = (sel.selectedIndex + (e.key === ']' ? 1 : n - 1)) % n;
    const el = g.auditor.mock.querySelector(`[data-region="${sel.value}"]`);
    if (el) { el.scrollIntoView({ block: 'nearest' }); el.classList.add('kbd-pick'); setTimeout(() => el.classList.remove('kbd-pick'), 1600); }
    const r = document.getElementById('readout'); if (r) r.textContent = `Part ${sel.selectedIndex + 1} of ${n}: ${sel.options[sel.selectedIndex].text}. Press C to cite it.`;
    e.preventDefault();
  } else if (e.key.toLowerCase() === 'c') { document.getElementById('region-cite').click(); e.preventDefault(); }
});
/* interactive art sites: every touchable thing can take focus and Enter */
const _loadK = Auditor.prototype.load;
Auditor.prototype.load = function (sub) {
  _loadK.call(this, sub);
  if (!this.mock.querySelector('.ax')) return;
  this.mock.querySelectorAll('.ax [data-act]').forEach(el => { if (!el.matches('button,a,input')) { el.tabIndex = 0; el.setAttribute('role', 'button'); } });
};
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('#mock .ax') && e.target.matches('[data-act][role="button"]')) { e.preventDefault(); e.target.click(); }
});
/* ── screen reader: announce each ship as it docks ── */
const _nsK = Game.prototype.renderDossier;
Game.prototype.renderDossier = function (sub) {
  const r = _nsK.call(this, sub);
  try { let sr = document.getElementById('dock-sr'); if (!sr) { sr = document.createElement('p'); sr.id = 'dock-sr'; sr.className = 'vh'; sr.setAttribute('role', 'status'); sr.setAttribute('aria-live', 'polite'); document.body.appendChild(sr); } if (sr && sub && sub.tpl) sr.textContent = `Ship ${this.processed + 1} of ${this.quota}: ${sub.tpl.name}. ${this.queue.length} more waiting.`; } catch (err) { /* announcement only */ }
  return r;
};
document.getElementById('btn-textsize').addEventListener('click', () => { SET.put('fs', document.body.classList.contains('large') ? 'l' : 'n'); document.body.classList.remove('xlarge'); });
document.getElementById('btn-sound').addEventListener('click', () => { SET.put('snd', Sfx.on); });
/* ───────────────────── 13. Boot ───────────────────── */
if (typeof document !== 'undefined') {
  const start = () => { document.body.classList.add('tool-flag'); window.portHalcyon = new Game(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}

