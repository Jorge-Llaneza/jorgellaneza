/* --- space-invaders.js --- */
(() => {
  /* Space Invaders: a marching formation, enemy shots, bunkers, 3 lives and 3 waves. Clear all 3 waves to win. */
  FULL['Space Invaders'] = {
    title: 'Space Invaders: the full game',
    intro: 'Shoot the invaders before they reach the ground. They march sideways, drop down at the edges and speed up as their numbers fall. You have 3 lives. Clear 3 waves to win. Move with the arrow keys or A and D, fire with Space, or drag on the screen. Buttons work too. P pauses.',
    make: (A) => {
      const W = 320, H = 420, SHIPY = 388, SW = 26, SHH = 12, IW = 20, WAVES = 3, COLS = 8, GX = 30, GY = 26;
      const DBG = window.__fullDebug || {};
      let S, cv, cx, last, stopUp;
      const $ = (id) => document.getElementById(id);
      const say = (t) => { const e = $('si-live'); if (e) e.textContent = t; };
      const SPR = [
        [['00011000', '00111100', '01111110', '11011011', '11111111', '00100100', '01011010', '10100101'], ['00011000', '00111100', '01111110', '11011011', '11111111', '01011010', '10000001', '01000010']],
        [['00100100', '00100100', '01111110', '11011011', '11111111', '11111111', '10100101', '00100100'], ['00100100', '10100101', '11111111', '11011011', '11111111', '01111110', '00100100', '01000010']],
        [['00111100', '01111110', '11111111', '11011011', '11111111', '00100100', '01011010', '10100101'], ['00111100', '01111110', '11111111', '11011011', '11111111', '01011010', '10100101', '01000010']],
      ];
      const ROWCOL = ['#ff6b5e', '#f6dc8f', '#7fc8e8', '#6fd08c', '#b58cf0'];
      const rowsFor = (w) => (w === 1 ? 4 : 5);
      const newWave = () => {
        const rows = rowsFor(S.wave); S.inv = [];
        for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) S.inv.push({ r, c, alive: true });
        S.total = S.inv.length; S.ox = 22; S.oy = 46 + (S.wave - 1) * 12; S.dir = 1; S.stepT = 0; S.frame = 0;
        S.pb = []; S.eb = []; S.fireT = 1; S.waveT = 1.4;
        say(`Wave ${S.wave} of ${WAVES}.`);
      };
      const mkBunkers = () => {
        S.bunk = [0, 1, 2, 3].map((i) => {
          const cols = 9, rows = 6, cs = 4, cells = [];
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push((r === rows - 1 && c >= 3 && c <= 5) || (r === 0 && (c === 0 || c === cols - 1)) ? 0 : 1);
          return { x: 28 + i * 74, y: 330, cols, rows, cs, cells };
        });
      };
      const ix = (v) => S.ox + v.c * GX, iy = (v) => S.oy + v.r * GY;
      const alive = () => S.inv.filter((v) => v.alive);
      const hitBunker = (b, x, y) => {
        for (const bk of S.bunk) {
          if (x < bk.x || x >= bk.x + bk.cols * bk.cs || y < bk.y || y >= bk.y + bk.rows * bk.cs) continue;
          const c = Math.floor((x - bk.x) / bk.cs), r = Math.floor((y - bk.y) / bk.cs), k = r * bk.cols + c;
          if (bk.cells[k]) {
            bk.cells[k] = 0;
            const n = [k - 1, k + 1, k - bk.cols, k + bk.cols][Math.floor(Math.random() * 4)];
            if (n >= 0 && n < bk.cells.length && Math.random() < 0.5) bk.cells[n] = 0;
            return true;
          }
        }
        return false;
      };
      const begin = () => { if (S.state !== 'ready') return; S.state = 'play'; const g = $('si-go'); if (g) g.hidden = true; };
      const togglePause = () => { if (S.state === 'ready' || S.over) return; S.paused = !S.paused; const p = $('si-pause'); if (p) p.textContent = S.paused ? 'Resume' : 'Pause'; };
      const lose = (why) => { S.over = true; render(); A.end(false, `${why} You scored ${S.score} and reached wave ${S.wave}. Try again.`); };
      const hitShip = () => {
        S.lives--; S.inv2 = 1.6; S.eb = []; A.sfx('bad'); say(S.lives > 0 ? `You were hit. ${S.lives} ${S.lives === 1 ? 'life' : 'lives'} left.` : 'You were hit.');
        if (S.lives <= 0) lose('Your ship was destroyed.');
      };
      const update = (dt) => {
        // ship
        const mv = (S.held.left ? -1 : 0) + (S.held.right ? 1 : 0);
        if (mv) { S.sx += mv * 190 * dt; S.tgt = null; } else if (S.tgt != null) { const d = S.tgt - S.sx; S.sx += Math.max(-300 * dt, Math.min(300 * dt, d)); }
        S.sx = Math.max(SW / 2 + 2, Math.min(W - SW / 2 - 2, S.sx));
        S.cool -= dt; S.inv2 = Math.max(0, S.inv2 - dt);
        if (S.waveT > 0) { S.waveT -= dt; return; }
        if (S.held.fire && S.cool <= 0 && S.pb.length < 2) { S.pb.push({ x: S.sx, y: SHIPY - 8 }); S.cool = 0.38; A.sfx('tick'); }
        // player bullets
        for (const b of S.pb) {
          b.y -= 430 * dt;
          if (b.y < 0) { b.dead = true; continue; }
          if (hitBunker(b, b.x, b.y)) { b.dead = true; continue; }
          for (const v of S.inv) {
            if (!v.alive) continue;
            const x = ix(v), y = iy(v);
            if (b.x >= x - 1 && b.x <= x + IW + 1 && b.y >= y && b.y <= y + IW) {
              v.alive = false; b.dead = true; S.score += [30, 20, 20, 10, 10][v.r]; A.sfx('good'); break;
            }
          }
        }
        S.pb = S.pb.filter((b) => !b.dead);
        const al = alive();
        if (!al.length) {
          if (S.wave >= WAVES) { S.over = true; render(); A.end(true, `All ${WAVES} waves cleared with a score of ${S.score}. You win!`); return; }
          S.wave++; A.sfx('clear'); newWave(); return;
        }
        // formation step
        S.stepT += dt;
        const iv = Math.max(0.03, (0.05 + 0.7 * al.length / S.total) * (1 - 0.13 * (S.wave - 1)));
        if (S.stepT >= iv) {
          S.stepT = 0; S.frame ^= 1;
          const minX = Math.min(...al.map(ix)), maxX = Math.max(...al.map(ix)) + IW, dx = S.dir * 7;
          if (minX + dx < 6 || maxX + dx > W - 6) { S.oy += 14; S.dir = -S.dir; } else S.ox += dx;
          for (const v of al) { const x = ix(v), y = iy(v); S.bunk.forEach((bk) => { for (let r = 0; r < bk.rows; r++) for (let c = 0; c < bk.cols; c++) { const cxp = bk.x + c * bk.cs, cyp = bk.y + r * bk.cs; if (cxp + bk.cs > x && cxp < x + IW && cyp + bk.cs > y && cyp < y + IW) bk.cells[r * bk.cols + c] = 0; } }); }
          if (Math.max(...al.map(iy)) + IW >= SHIPY - 6) { lose('The invaders landed.'); return; }
        }
        // enemy fire
        S.fireT -= dt;
        if (S.fireT <= 0 && S.eb.length < 2 + S.wave) {
          S.fireT = Math.max(0.35, 1.05 - 0.2 * S.wave) * (0.6 + Math.random() * 0.8);
          const cols = {}; al.forEach((v) => { if (!cols[v.c] || v.r > cols[v.c].r) cols[v.c] = v; });
          const list = Object.values(cols);
          // sometimes aim near the player
          let pick = list[Math.floor(Math.random() * list.length)];
          if (Math.random() < 0.4) pick = list.slice().sort((a, b) => Math.abs(ix(a) + IW / 2 - S.sx) - Math.abs(ix(b) + IW / 2 - S.sx))[0];
          S.eb.push({ x: ix(pick) + IW / 2, y: iy(pick) + IW });
        }
        for (const b of S.eb) {
          b.y += (135 + 22 * S.wave) * dt;
          if (b.y > H) { b.dead = true; continue; }
          if (hitBunker(b, b.x, b.y + 4)) { b.dead = true; continue; }
          if (S.inv2 <= 0 && b.y + 6 >= SHIPY && b.y <= SHIPY + SHH && Math.abs(b.x - S.sx) <= SW / 2) { b.dead = true; hitShip(); if (S.over) return; }
          for (const p of S.pb) if (!p.dead && Math.abs(p.x - b.x) < 4 && Math.abs(p.y - b.y) < 9) { p.dead = true; b.dead = true; }
        }
        S.eb = S.eb.filter((b) => !b.dead); S.pb = S.pb.filter((b) => !b.dead);
      };
      const sprite = (rows, x, y, color, px) => { cx.fillStyle = color; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (rows[r][c] === '1') cx.fillRect(x + c * px, y + r * px, px + 0.4, px + 0.4); };
      const render = () => {
        cx.fillStyle = '#06100f'; cx.fillRect(0, 0, W, H);
        cx.fillStyle = 'rgba(244,242,234,0.35)'; S.stars.forEach(([x, y]) => cx.fillRect(x, y, 1.5, 1.5));
        S.inv.forEach((v) => { if (v.alive) sprite(SPR[v.r === 0 ? 0 : v.r < 3 ? 1 : 2][S.frame], ix(v), iy(v), ROWCOL[v.r], IW / 8); });
        S.bunk.forEach((bk) => { cx.fillStyle = '#4cc17a'; bk.cells.forEach((a, k) => { if (a) cx.fillRect(bk.x + (k % bk.cols) * bk.cs, bk.y + Math.floor(k / bk.cols) * bk.cs, bk.cs, bk.cs); }); });
        cx.fillStyle = '#f6dc8f'; S.pb.forEach((b) => cx.fillRect(b.x - 1.5, b.y - 6, 3, 10));
        cx.fillStyle = '#ff9a8f'; S.eb.forEach((b) => { cx.fillRect(b.x - 1.5, b.y - 5, 3, 4); cx.fillRect(b.x - 0.5 + Math.sin(b.y / 4) * 2, b.y - 1, 3, 4); });
        if (!(S.inv2 > 0 && Math.floor(S.inv2 * 10) % 2)) {
          cx.fillStyle = S.over && S.lives <= 0 ? '#ff6b5e' : '#7fc8e8'; cx.fillRect(S.sx - SW / 2, SHIPY + 4, SW, SHH - 4); cx.fillRect(S.sx - SW / 2 + 5, SHIPY, SW - 10, 5); cx.fillRect(S.sx - 2, SHIPY - 6, 4, 7);
        }
        cx.fillStyle = '#2f5a49'; cx.fillRect(0, SHIPY + SHH + 6, W, 2);
        cx.font = '700 13px ui-monospace, monospace'; cx.textAlign = 'left'; cx.fillStyle = '#f6dc8f'; cx.fillText(`SCORE ${S.score}`, 8, 18);
        cx.textAlign = 'center'; cx.fillStyle = '#f4f2ea'; cx.fillText(`WAVE ${S.wave}/${WAVES}`, W / 2, 18);
        cx.textAlign = 'right'; cx.fillStyle = '#7fc8e8'; for (let i = 0; i < S.lives; i++) cx.fillRect(W - 10 - i * 18, 8, 13, 8);
        const msg = S.state === 'ready' ? 'Tap Start or press a key' : S.paused ? 'Paused' : (S.state === 'play' && S.waveT > 0 && !S.over) ? `Wave ${S.wave}` : '';
        if (msg) { cx.fillStyle = 'rgba(0,0,0,0.6)'; cx.fillRect(0, H / 2 - 24, W, 44); cx.fillStyle = '#f6dc8f'; cx.font = '700 17px ui-monospace, monospace'; cx.textAlign = 'center'; cx.fillText(msg, W / 2, H / 2 + 5); }
      };
      const keyUp = (fn) => { if (stopUp) stopUp(); const h = (e) => fn(e); window.addEventListener('keyup', h); stopUp = () => { window.removeEventListener('keyup', h); stopUp = null; }; (A.cl || []).push(stopUp); };
      const KM = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ' ': 'fire', ArrowUp: 'fire', w: 'fire', W: 'fire' };
      return {
        start() {
          S = { state: 'ready', paused: false, over: false, wave: 1, lives: 3, score: 0, sx: W / 2, tgt: null, cool: 0, inv2: 0, held: {}, inv: [], pb: [], eb: [], bunk: [], total: 1, ox: 0, oy: 0, dir: 1, stepT: 0, frame: 0, fireT: 1, waveT: 0, stars: Array.from({ length: 40 }, () => [Math.random() * W, Math.random() * H]) };
          if (DBG) DBG.state = S;
          mkBunkers(); newWave(); S.waveT = 0;
          const hb = (d, t) => `<button type="button" class="btn big" data-hold="${d}" aria-label="${t}" style="touch-action:none;user-select:none;-webkit-user-select:none;min-width:5rem">${t}</button>`;
          A.draw(`<div class="arc-scene" style="width:100%"><canvas id="si-cv" width="${W}" height="${H}" role="img" aria-label="Space Invaders field" style="width:min(100%,${W}px);height:auto;border-radius:10px;border:2px solid var(--line);display:block;touch-action:none"></canvas>
            <div class="arc-opts">${hb('left', 'Left')}${hb('fire', 'Fire')}${hb('right', 'Right')}</div>
            <div class="arc-opts">${abtn('go', '', 'Start', 'primary')}${abtn('pause', '', 'Pause')}</div>
            <p class="arc-fb" id="si-live" aria-live="polite">Clear ${WAVES} waves to win.</p></div>`);
          cv = $('si-cv'); cx = cv.getContext('2d');
          const ptr = (e) => { const r = cv.getBoundingClientRect(); S.tgt = (e.clientX - r.left) * (W / r.width); };
          cv.addEventListener('pointerdown', (e) => { ptr(e); begin(); S.held.fire = true; });
          cv.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) ptr(e); });
          ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => cv.addEventListener(n, () => { S.held.fire = false; }));
          document.querySelectorAll('[data-hold]').forEach((b) => {
            const off = () => { S.held[b.dataset.hold] = 0; };
            b.addEventListener('pointerdown', (e) => { e.preventDefault(); S.held[b.dataset.hold] = 1; begin(); });
            ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => b.addEventListener(n, off));
            b.addEventListener('contextmenu', (e) => e.preventDefault());
          });
          A.key((e) => {
            const d = KM[e.key];
            if (d) { e.preventDefault(); S.held[d] = 1; begin(); return; }
            if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
            if (e.key.startsWith('Arrow')) e.preventDefault();
            begin();
          });
          keyUp((e) => { const d = KM[e.key]; if (d) S.held[d] = 0; });
          last = performance.now();
          A.timer(() => {
            const n = performance.now(); const dt = Math.min(0.05, (n - last) / 1000); last = n;
            if (S.state === 'play' && !S.paused && !S.over) update(dt);
            render();
          }, 16);
          render();
        },
        act(a) {
          try { document.activeElement.blur(); } catch (_) { /* ignore */ }
          if (a === 'go') begin(); else if (a === 'pause') togglePause();
        },
      };
    },
  };
})();

/* --- sudoku.js --- */
(() => {
  /* Sudoku: fill the 9x9 grid so every row, column and 3x3 box holds 1 to 9 once. Each puzzle has exactly one solution. */
  const SD_CLUES = { Easy: 40, Medium: 32, Hard: 27 };
  const SD_CSS = '<style>.sd-grid{display:grid;grid-template-columns:repeat(9,1fr);width:min(100%,25rem);border:3px solid var(--brass-hi);background:var(--brass-hi);gap:1px}.sd-c{aspect-ratio:1;padding:0;border:0;background:#123326;color:#8fd3ff;font:700 clamp(.95rem,5vw,1.5rem) var(--mono);display:grid;place-items:center;cursor:pointer;min-width:0;position:relative}.sd-c.g{color:var(--ivory);background:#0c241a}.sd-c.pk{background:#1d4a39}.sd-c.same{background:#2e6a52}.sd-c.sel{background:#b98a1e;color:#1d1304}.sd-c.bad{color:#ff6b5e}.sd-c.wr{background:#6b2620}.sd-c.rb{border-bottom:2px solid var(--brass-hi)}.sd-c.cr{border-right:2px solid var(--brass-hi)}.sd-nt{display:grid;grid-template-columns:repeat(3,1fr);width:100%;height:100%;font:600 clamp(.4rem,2.2vw,.62rem) var(--mono);color:#a9c9b8;line-height:1;place-items:center;padding:1px}.sd-c.sel .sd-nt{color:#1d1304}.sd-pad{display:grid;grid-template-columns:repeat(9,1fr);gap:.25rem;width:min(100%,25rem)}.sd-pad .btn{padding:.55rem 0;font-size:1.05rem;min-width:0}</style>';
  const popc = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
  const peers = (i) => { const r = Math.floor(i / 9), c = i % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3), o = []; for (let k = 0; k < 81; k++) { if (k === i) continue; const rr = Math.floor(k / 9), cc = k % 9; if (rr === r || cc === c || Math.floor(rr / 3) * 3 + Math.floor(cc / 3) === b) o.push(k); } return o; };
  const PEERS = Array.from({ length: 81 }, (_, i) => peers(i));
  const solve = (g, limit, shuffle) => {
    const row = Array(9).fill(0), col = Array(9).fill(0), box = Array(9).fill(0);
    const bx = (i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
    for (let i = 0; i < 81; i++) if (g[i]) { const b = 1 << g[i]; row[Math.floor(i / 9)] |= b; col[i % 9] |= b; box[bx(i)] |= b; }
    let count = 0, first = null;
    const go = () => {
      let best = -1, bm = 0, bn = 10;
      for (let i = 0; i < 81; i++) if (!g[i]) { const m = 0x3fe & ~(row[Math.floor(i / 9)] | col[i % 9] | box[bx(i)]), n = popc(m); if (n < bn) { bn = n; best = i; bm = m; if (n <= 1) break; } }
      if (best < 0) { count++; if (!first) first = g.slice(); return count >= limit; }
      if (!bn) return false;
      const ds = []; for (let d = 1; d <= 9; d++) if (bm & (1 << d)) ds.push(d);
      if (shuffle) for (let k = ds.length - 1; k > 0; k--) { const j = rnd(k + 1); [ds[k], ds[j]] = [ds[j], ds[k]]; }
      const r = Math.floor(best / 9), c = best % 9, b = bx(best);
      for (const d of ds) {
        g[best] = d; row[r] |= 1 << d; col[c] |= 1 << d; box[b] |= 1 << d;
        const stop = go();
        g[best] = 0; row[r] &= ~(1 << d); col[c] &= ~(1 << d); box[b] &= ~(1 << d);
        if (stop) return true;
      }
      return false;
    };
    go(); return { count, first };
  };
  const makePuzzle = (level) => {
    const sol = solve(Array(81).fill(0), 1, true).first, g = sol.slice(), order = Array.from({ length: 81 }, (_, i) => i);
    for (let k = 80; k > 0; k--) { const j = rnd(k + 1); [order[k], order[j]] = [order[j], order[k]]; }
    let clues = 81;
    for (const i of order) {
      if (clues <= SD_CLUES[level]) break;
      const keep = g[i]; g[i] = 0;
      if (solve(g.slice(), 2, false).count !== 1) g[i] = keep; else clues--;
    }
    return { sol, puz: g };
  };
  FULL['Sudoku'] = {
    title: 'Sudoku: the full game',
    intro: 'Fill the grid so every row, every column and every 3x3 box contains the digits 1 to 9 exactly once. Every puzzle here has exactly one solution, so logic is enough. Use Notes mode for pencil marks. Hint fills one square. Check shows wrong squares. Keys: 1-9, Backspace, arrows, N for notes, U for undo.',
    make: (A) => {
      let level = 'Easy', sol, given, grid, notes, sel, noteMode, hist, wrong, msg, hints, done;
      const snap = () => hist.push(JSON.stringify([grid, notes]));
      const newPuzzle = () => {
        const p = makePuzzle(level); sol = p.sol; grid = p.puz.slice(); given = grid.map((v) => v > 0); notes = Array(81).fill(0);
        sel = grid.findIndex((v) => !v); noteMode = false; hist = []; wrong = new Set(); msg = 'Pick a square, then a number.'; hints = 0; done = false;
      };
      const conflict = (i) => grid[i] && PEERS[i].some((j) => grid[j] === grid[i]);
      const draw = () => {
        const sv = sel >= 0 ? grid[sel] : 0, pe = sel >= 0 ? PEERS[sel] : [];
        const cells = grid.map((v, i) => {
          const r = Math.floor(i / 9), c = i % 9;
          let cls = 'sd-c' + (given[i] ? ' g' : '') + (r % 3 === 2 && r < 8 ? ' rb' : '') + (c % 3 === 2 && c < 8 ? ' cr' : '');
          if (i === sel) cls += ' sel'; else if (sv && v === sv) cls += ' same'; else if (pe.includes(i)) cls += ' pk';
          if (!given[i] && conflict(i)) cls += ' bad';
          if (wrong.has(i)) cls += ' wr';
          let inner = v ? v : '';
          if (!v && notes[i]) { let s = ''; for (let d = 1; d <= 9; d++) s += `<span>${notes[i] & (1 << d) ? d : ''}</span>`; inner = `<span class="sd-nt">${s}</span>`; }
          return `<button type="button" class="${cls}" data-act="cell" data-v="${i}" aria-label="Row ${r + 1} column ${c + 1}, ${v ? (given[i] ? 'given ' : '') + v : notes[i] ? 'notes' : 'empty'}" ${done ? 'disabled' : ''}>${inner}</button>`;
        }).join('');
        const lv = Object.keys(SD_CLUES).map((l) => abtn('level', l, l, 'small' + (l === level ? ' primary' : ''))).join('');
        const pad = Array.from({ length: 9 }, (_, k) => { const n = grid.filter((v) => v === k + 1).length; return abtn('num', k + 1, k + 1, '', done || n >= 9); }).join('');
        A.draw(`${SD_CSS}<div class="arc-scene" style="width:100%"><div class="arc-opts">${lv}</div><div class="arc-top"><span class="chip">Left <b>${grid.filter((v) => !v).length}</b></span><span class="chip">Hints <b>${hints}</b></span></div>
          <div class="sd-grid" role="grid" aria-label="Sudoku grid">${cells}</div>
          <div class="sd-pad">${pad}</div>
          <div class="arc-opts">${abtn('notes', '', noteMode ? 'Notes: ON' : 'Notes: off', 'small' + (noteMode ? ' primary' : ''), done)}${abtn('erase', '', 'Erase', 'small', done)}${abtn('undo', '', 'Undo', 'small', done || !hist.length)}${abtn('hint', '', 'Hint', 'small', done)}${abtn('check', '', 'Check', 'small', done)}${abtn('giveup', '', 'Give up', 'small ghost', done)}</div><p class="arc-fb">${msg}</p></div>`);
      };
      const finish = () => { done = true; sel = -1; msg = ''; draw(); A.end(true, hints ? `Solved with ${hints} hint${hints > 1 ? 's' : ''}. Well done!` : 'Solved with no hints. Excellent!'); };
      const isSolved = () => grid.every((v, i) => v === sol[i]);
      const place = (i, d) => {
        grid[i] = d; notes[i] = 0; wrong.delete(i);
        if (d) PEERS[i].forEach((j) => { if (!grid[j]) notes[j] &= ~(1 << d); });
      };
      const num = (d) => {
        if (done || sel < 0 || given[sel]) { if (!done && sel >= 0) { msg = 'That square is a given.'; draw(); } return; }
        snap();
        if (noteMode) { if (grid[sel]) { hist.pop(); msg = 'Erase the number first to add notes.'; } else notes[sel] ^= 1 << d; }
        else if (grid[sel] === d) { grid[sel] = 0; wrong.delete(sel); }
        else place(sel, d);
        A.sfx('tick'); if (!noteMode) msg = '';
        if (isSolved()) return finish();
        draw();
      };
      const erase = () => { if (done || sel < 0 || given[sel] || (!grid[sel] && !notes[sel])) return; snap(); grid[sel] = 0; notes[sel] = 0; wrong.delete(sel); draw(); };
      const undo = () => { if (done || !hist.length) return; [grid, notes] = JSON.parse(hist.pop()); wrong = new Set(); msg = 'Undone.'; draw(); };
      const hint = () => {
        if (done) return;
        let t = sel;
        if (t < 0 || given[t] || grid[t] === sol[t]) { const c = grid.map((v, i) => (v !== sol[i] ? i : -1)).filter((i) => i >= 0); if (!c.length) return; t = pickOne(c); }
        snap(); place(t, sol[t]); given[t] = false; sel = t; hints++; msg = `Hint: row ${Math.floor(t / 9) + 1}, column ${t % 9 + 1} is ${sol[t]}.`; A.sfx('good');
        if (isSolved()) return finish();
        draw();
      };
      const check = () => {
        wrong = new Set(); grid.forEach((v, i) => { if (v && v !== sol[i]) wrong.add(i); });
        msg = wrong.size ? `${wrong.size} square${wrong.size > 1 ? 's are' : ' is'} wrong (shown in red).` : 'No mistakes so far. Keep going!';
        A.sfx(wrong.size ? 'bad' : 'good'); draw();
      };
      return {
        start() {
          newPuzzle(); draw();
          A.key((e) => {
            if (e.ctrlKey || e.metaKey || e.altKey || done) return;
            const k = e.key;
            if (/^[1-9]$/.test(k)) num(+k);
            else if (k === 'Backspace' || k === 'Delete' || k === '0') { e.preventDefault(); erase(); }
            else if (k === 'n' || k === 'N') { noteMode = !noteMode; draw(); }
            else if (k === 'u' || k === 'U') undo();
            else if (k.startsWith('Arrow')) { e.preventDefault(); if (sel < 0) sel = 0; const r = Math.floor(sel / 9), c = sel % 9; sel = k === 'ArrowUp' ? ((r + 8) % 9) * 9 + c : k === 'ArrowDown' ? ((r + 1) % 9) * 9 + c : k === 'ArrowLeft' ? r * 9 + (c + 8) % 9 : r * 9 + (c + 1) % 9; draw(); }
          });
        },
        act(a, v) {
          if (a === 'cell') { sel = +v; draw(); }
          else if (a === 'num') num(+v);
          else if (a === 'erase') erase();
          else if (a === 'undo') undo();
          else if (a === 'hint') hint();
          else if (a === 'check') check();
          else if (a === 'notes') { noteMode = !noteMode; draw(); }
          else if (a === 'level') { level = v; newPuzzle(); draw(); }
          else if (a === 'giveup') { done = true; grid = sol.slice(); sel = -1; draw(); A.end(false, 'You gave up. The solved grid is shown. Try again!'); }
        },
      };
    },
  };
})();

