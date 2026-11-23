/* --- memory.js --- */
(() => {
  /* Memory: flip two cards at a time and find every matching pair before you run out of moves. */
  const ME_SIZES = { Small: [4, 3, 15], Medium: [4, 4, 20], Large: [6, 5, 38] };
  const ME_GLY = ['●', '■', '▲', '◆', '★', '✚', '✖', '♪'];
  const ME_COL = ['#e0453a', '#3b8fb5', '#3fae6a', '#e0b04f', '#9b6fd1', '#f08a3c', '#2fc8b8'];
  const ME_CSS = '<style>.me-board{display:grid;gap:.4rem;width:min(100%,26rem);perspective:700px}.me-c{aspect-ratio:3/4;padding:0;border:0;background:none;cursor:pointer;min-width:0;position:relative;transform-style:preserve-3d;transition:transform .4s}.me-c.up,.me-c.done{transform:rotateY(180deg)}.me-f{position:absolute;inset:0;border-radius:8px;display:grid;place-items:center;backface-visibility:hidden;-webkit-backface-visibility:hidden}.me-back{background:repeating-linear-gradient(45deg,#2f5d49,#2f5d49 6px,#264d3c 6px,#264d3c 12px);border:2px solid var(--brass-hi)}.me-front{background:var(--ivory);transform:rotateY(180deg);font:700 clamp(1.2rem,7vw,2rem) var(--mono);border:2px solid transparent}.me-c.done .me-front{border-color:var(--mint);opacity:.85}.me-c:disabled{cursor:default}</style>';
  FULL['Memory'] = {
    title: 'Memory: the full game',
    intro: 'Flip two cards. If they match, they stay face up. If not, they flip back, so remember where they were. Find all pairs before you run out of moves. Each pair of cards shares both a shape and a colour.',
    make: (A) => {
      let size = 'Small', cols, rows, limit, deck, flipped, moves, matched, lock, done;
      const board = () => document.getElementById('me-board');
      const newGame = () => {
        [cols, rows, limit] = ME_SIZES[size]; const n = cols * rows / 2, d = [];
        for (let i = 0; i < n; i++) d.push(i, i);
        for (let k = d.length - 1; k > 0; k--) { const j = rnd(k + 1); [d[k], d[j]] = [d[j], d[k]]; }
        deck = d; flipped = []; moves = 0; matched = 0; lock = false; done = false;
      };
      const face = (id) => `<span class="me-f me-front" style="color:${ME_COL[id % 7]}">${ME_GLY[id % 8]}</span>`;
      const hud = () => { const m = document.getElementById('me-moves'), p = document.getElementById('me-pairs'); if (m) m.textContent = moves; if (p) p.textContent = matched; };
      const draw = () => {
        const sz = Object.keys(ME_SIZES).map((s) => abtn('size', s, s, 'small' + (s === size ? ' primary' : ''))).join('');
        const cards = deck.map((id, i) => `<button type="button" class="me-c" id="me-c${i}" data-act="card" data-v="${i}" aria-label="Card ${i + 1}, face down"><span class="me-f me-back"></span>${face(id)}</button>`).join('');
        A.draw(`${ME_CSS}<div class="arc-scene" style="width:100%"><div class="arc-opts">${sz}</div><div class="arc-top"><span class="chip">Moves <b id="me-moves">0</b> / ${limit}</span><span class="chip">Pairs <b id="me-pairs">0</b> / ${deck.length / 2}</span></div>
          <div class="me-board" id="me-board" style="grid-template-columns:repeat(${cols},1fr)">${cards}</div><p class="arc-fb" id="me-msg">Pick a card.</p></div>`);
      };
      const el = (i) => document.getElementById('me-c' + i) || document.createElement('button');
      const msg = (t) => { const m = document.getElementById('me-msg'); if (m) m.textContent = t; };
      const flip = (i) => {
        if (lock || done || flipped.includes(i) || el(i).classList.contains('done')) return;
        flipped.push(i); el(i).classList.add('up'); el(i).setAttribute('aria-label', 'Card ' + (i + 1) + ', face up'); A.sfx('tick');
        if (flipped.length < 2) return;
        moves++; hud(); lock = true;
        const [a, b] = flipped;
        if (deck[a] === deck[b]) {
          matched++; flipped = []; lock = false; [a, b].forEach((k) => { el(k).classList.add('done'); el(k).disabled = true; });
          hud(); A.sfx('good');
          if (matched === deck.length / 2) { done = true; msg(''); A.end(true, `All pairs found in ${moves} moves. You win!`); return; }
          msg('A match!');
        } else {
          msg('No match.');
        }
        if (moves >= limit && matched < deck.length / 2 && deck[a] !== deck[b]) {
          A.after(() => { done = true; el(a).classList.remove('up'); el(b).classList.remove('up'); A.end(false, `Out of moves with ${matched} of ${deck.length / 2} pairs found.`); }, 900);
          return;
        }
        if (deck[a] !== deck[b]) A.after(() => { el(a).classList.remove('up'); el(b).classList.remove('up'); el(a).setAttribute('aria-label', 'Card ' + (a + 1) + ', face down'); el(b).setAttribute('aria-label', 'Card ' + (b + 1) + ', face down'); flipped = []; lock = false; }, 900);
      };
      return {
        start() { newGame(); draw(); },
        act(a, v) {
          if (a === 'card') flip(+v);
          else if (a === 'size') { size = v; newGame(); draw(); }
        },
      };
    },
  };
})();

/* --- minesweeper.js --- */
(() => {
  /* Minesweeper: reveal every safe square. Numbers count neighbouring mines. First click is always safe. */
  const MS_LEVELS = { Easy: [9, 9, 10], Medium: [12, 12, 24], Hard: [16, 16, 40] };
  const MS_CSS = '<style>.ms-board{display:grid;gap:2px;width:min(100%,26rem);touch-action:manipulation;user-select:none}.ms-c{aspect-ratio:1;padding:0;border:0;border-radius:4px;background:#2f5d49;color:var(--ivory);font:700 clamp(.7rem,3.6vw,1.05rem) var(--mono);display:grid;place-items:center;cursor:pointer;min-width:0}.ms-c:hover:not(.o){filter:brightness(1.2)}.ms-c.o{background:#0f2a1f;cursor:default}.ms-c.m{background:#7a2a24}.ms-c.boom{background:#e0453a}.ms-c.wrong{background:#7a5a24}.ms-c.f{color:#ffd166}.ms-c:disabled{cursor:default}.ms-n1{color:#7ec8ff}.ms-n2{color:#6fd08c}.ms-n3{color:#ff9a92}.ms-n4{color:#c9a7ff}.ms-n5{color:#ffb86b}.ms-n6{color:#5fe0d0}.ms-n7{color:#fff}.ms-n8{color:#aaa}</style>';
  FULL['Minesweeper'] = {
    title: 'Minesweeper: the full game',
    intro: 'Reveal every square that is not a mine. A number tells you how many mines touch that square. Flag squares you think are mines. Your first click is always safe. On a phone, turn on Flag mode to place flags with a tap. Tapping a number whose flags are all placed opens its other neighbours.',
    make: (A) => {
      let level = 'Easy', R, C, M, cells, started, flagMode, flags, seconds, done, msg;
      const nb = (i) => { const r = Math.floor(i / C), c = i % C, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const y = r + dr, x = c + dc; if (y >= 0 && y < R && x >= 0 && x < C) o.push(y * C + x); } return o; };
      const init = () => {
        [R, C, M] = MS_LEVELS[level]; cells = Array.from({ length: R * C }, () => ({ mine: false, open: false, flag: false, n: 0 }));
        started = false; flagMode = false; flags = 0; seconds = 0; done = false; msg = 'Tap a square to begin.';
      };
      const place = (safe) => {
        const ban = new Set([safe, ...nb(safe)]), pool = [];
        cells.forEach((_, i) => { if (!ban.has(i)) pool.push(i); });
        for (let k = 0; k < M; k++) { const j = k + rnd(pool.length - k); [pool[k], pool[j]] = [pool[j], pool[k]]; cells[pool[k]].mine = true; }
        cells.forEach((c, i) => { c.n = nb(i).filter((j) => cells[j].mine).length; });
      };
      const flood = (i) => {
        const st = [i];
        while (st.length) { const k = st.pop(), c = cells[k]; if (c.open || c.flag) continue; c.open = true; if (c.n === 0) nb(k).forEach((j) => { if (!cells[j].open) st.push(j); }); }
      };
      const cellHtml = (c, i) => {
        let cls = 'ms-c', t = '', lab = 'Hidden square';
        if (c.open) { cls += ' o'; if (c.mine) { cls += ' boom'; t = '*'; lab = 'Mine'; } else if (c.n) { cls += ' ms-n' + c.n; t = c.n; lab = c.n + ' nearby'; } else lab = 'Empty'; }
        else if (done && c.mine && !c.flag) { cls += ' m o'; t = '*'; lab = 'Mine'; }
        else if (done && c.flag && !c.mine) { cls += ' wrong'; t = 'X'; lab = 'Wrong flag'; }
        else if (c.flag) { cls += ' f'; t = 'F'; lab = 'Flag'; }
        return `<button type="button" class="${cls}" data-act="cell" data-v="${i}" aria-label="${lab}, row ${Math.floor(i / C) + 1} column ${i % C + 1}" ${done ? 'disabled' : ''}>${t}</button>`;
      };
      const draw = () => {
        const lv = Object.keys(MS_LEVELS).map((l) => abtn('level', l, l, 'small' + (l === level ? ' primary' : ''))).join('');
        A.draw(`${MS_CSS}<div class="arc-scene" style="width:100%"><div class="arc-opts">${lv}</div><div class="arc-top"><span class="chip">Mines left <b id="ms-left">${M - flags}</b></span><span class="chip">Time <b id="ms-time">${seconds}</b>s</span></div>
          <div class="ms-board" style="grid-template-columns:repeat(${C},1fr)" id="ms-board" oncontextmenu="return false">${cells.map(cellHtml).join('')}</div>
          <div class="arc-opts">${abtn('mode', '', flagMode ? 'Flag mode: ON' : 'Flag mode: off', flagMode ? 'primary' : '')}${abtn('restart', '', 'New board')}</div><p class="arc-fb" id="ms-msg">${msg}</p></div>`);
        const b = document.getElementById('ms-board');
        if (b) b.addEventListener('contextmenu', (e) => { e.preventDefault(); const t = e.target.closest('[data-v]'); if (t) toggleFlag(+t.dataset.v); });
      };
      const win = () => { done = true; cells.forEach((c) => { if (c.mine) c.flag = true; }); flags = M; msg = ''; draw(); A.end(true, `Board cleared in ${seconds} seconds. You win!`); };
      const lose = (i) => { done = true; cells[i].open = true; draw(); A.end(false, 'Boom. You hit a mine. Try a new board.'); };
      const checkWin = () => { if (cells.every((c) => c.mine || c.open)) { win(); return true; } return false; };
      const toggleFlag = (i) => { const c = cells[i]; if (done || c.open) return; c.flag = !c.flag; flags += c.flag ? 1 : -1; A.sfx('tick'); draw(); };
      const reveal = (i) => {
        const c = cells[i]; if (c.flag) return;
        if (!started) { started = true; place(i); msg = ''; }
        if (c.open) {
          if (!c.n || nb(i).filter((j) => cells[j].flag).length !== c.n) return;
          for (const j of nb(i)) { const d = cells[j]; if (!d.flag && !d.open) { if (d.mine) return lose(j); flood(j); } }
          if (!checkWin()) draw(); return;
        }
        if (c.mine) return lose(i);
        flood(i); A.sfx('tick'); if (!checkWin()) draw();
      };
      return {
        start() { init(); draw(); A.timer(() => { if (!started || done) return; seconds++; const t = document.getElementById('ms-time'); if (t) t.textContent = seconds; }, 1000); },
        act(a, v) {
          if (a === 'level') { level = v; init(); draw(); }
          else if (a === 'restart') { init(); draw(); }
          else if (a === 'mode') { flagMode = !flagMode; draw(); }
          else if (a === 'cell') { const i = +v; if (flagMode) toggleFlag(i); else reveal(i); }
        },
      };
    },
  };
})();

/* --- nim.js --- */
(() => {
  /* Nim: three heaps, take any number from ONE heap, whoever takes the last stone wins. The bot plays perfectly (nim-sum), so you must find the winning move. */
  FULL['Nim'] = {
    title: 'Nim: the full game',
    intro: 'Three heaps. On your turn take as many stones as you like from ONE heap. Whoever takes the last stone wins. Hint: the bot plays well, so think in binary.',
    make: (A) => {
      let heaps, pick, turn, fb;
      const botMove = () => {
        const x = heaps[0] ^ heaps[1] ^ heaps[2];
        if (x) { for (let i = 0; i < 3; i++) { const t = heaps[i] ^ x; if (t < heaps[i]) return [i, heaps[i] - t]; } }
        const i = heaps.findIndex((h) => h > 0); return [i, 1 + rnd(heaps[i])];
      };
      const draw = () => A.draw(`<div class="arc-scene">${heaps.map((h, i) => `<div class="arc-row" aria-label="Heap ${i + 1}: ${h} stones"><b class="arc-big-text">Heap ${i + 1}</b>${Array.from({ length: h }, (_, k) => `<button type="button" class="btn small${pick && pick[0] === i && k >= h - pick[1] ? ' primary' : ''}" data-act="stone" data-v="${i}:${k}" ${turn !== 'you' ? 'disabled' : ''} aria-label="Heap ${i + 1}, stone ${k + 1}">●</button>`).join('')}${h === 0 ? '<span class="muted">empty</span>' : ''}</div>`).join('')}
        <p class="arc-ask">${turn === 'you' ? (pick ? `Take ${pick[1]} from heap ${pick[0] + 1}?` : 'Click a stone: it and every stone to its right in that heap will be taken.') : 'Bot is thinking...'}</p>
        <div class="arc-opts">${abtn('take', '', 'Take them', 'primary', !pick || turn !== 'you')}${abtn('clear', '', 'Cancel', '', !pick)}</div><p class="arc-fb">${fb}</p></div>`);
      const finish = (who) => { draw(); A.end(who === 'you', who === 'you' ? 'You took the last stone. You win!' : 'The bot took the last stone. Try again.'); };
      const bot = () => { turn = 'bot'; draw(); A.after(() => { const [i, n] = botMove(); heaps[i] -= n; fb = `Bot took ${n} from heap ${i + 1}.`; if (heaps.every((h) => h === 0)) return finish('bot'); turn = 'you'; draw(); }, 700); };
      return {
        start() { heaps = [3, 4, 5]; pick = null; turn = 'you'; fb = ''; draw(); },
        act(a, v) {
          if (turn !== 'you') return;
          if (a === 'stone') { const [i, k] = v.split(':').map(Number); pick = [i, heaps[i] - k]; A.sfx('tick'); draw(); }
          else if (a === 'clear') { pick = null; draw(); }
          else if (a === 'take' && pick) { heaps[pick[0]] -= pick[1]; fb = `You took ${pick[1]} from heap ${pick[0] + 1}.`; pick = null; A.sfx('good'); if (heaps.every((h) => h === 0)) return finish('you'); bot(); }
        },
      };
    },
  };
})();

/* --- pac-man.js --- */
(() => {
  /* Pac-Man: eat every dot, avoid four ghosts with different habits, power pellets let you eat ghosts. 3 lives. */
  FULL['Pac-Man'] = {
    title: 'Pac-Man: the full game',
    intro: 'Eat every dot to win. Four ghosts hunt you, each in its own way. Power pellets make them scared for a few seconds, so you can eat them. You have 3 lives. Use the arrow keys, WASD, swipe on the maze, or the buttons. P pauses.',
    make: (A) => {
      const MAP = [
        '###################', '#........#........#', '#o##.###.#.###.##o#', '#.................#', '#.##.#.#####.#.##.#',
        '#....#...#...#....#', '####.### # ###.####', '####.#       #.####', '####.# ## ## #.####', '#....#       #....#',
        '#.##.#.#####.#.##.#', '#o...#...#...#...o#', '#.#####.#.#.#####.#', '#.................#', '###################'];
      const W = 19, H = 15, T = 20;
      const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }, ORDER = ['up', 'left', 'down', 'right'];
      const KEYS = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
      const GH = [
        { name: 'Blinky', color: '#ff6b5e', sx: 8, sy: 5, wait: 0, corner: [17, 1], how: 'chases you head on' },
        { name: 'Pinky', color: '#ff9fd0', sx: 7, sy: 7, wait: 3000, corner: [1, 1], how: 'aims ahead of you' },
        { name: 'Inky', color: '#7fc8e8', sx: 9, sy: 7, wait: 7000, corner: [17, 13], how: 'wanders at random' },
        { name: 'Clyde', color: '#f6a94b', sx: 11, sy: 7, wait: 11000, corner: [1, 13], how: 'chases, then gets shy' },
      ];
      const PAC_MS = 150, G_MS = 175, FR_MS = 250, FRIGHT = 7000;
      let S, cv, cx;
      const $ = (id) => document.getElementById(id);
      const wall = (x, y) => y < 0 || y >= H || x < 0 || x >= W || S.grid[y][x] === '#';
      const hud = () => { $('pm-sc').textContent = S.score; $('pm-lv').textContent = S.lives; $('pm-dt').textContent = S.dots; const l = $('pm-live'); if (l && S.msg !== null) { l.textContent = S.msg; S.msg = null; } };
      const placePac = () => { S.pac = { x: 9, y: 13, px: 9, py: 13, dir: 'left', want: 'left', acc: 0, mouth: 0 }; };
      const placeGhosts = () => { S.gh = GH.map((g, i) => ({ i, x: g.sx, y: g.sy, px: g.sx, py: g.sy, dir: 'up', acc: 0, wait: g.wait, fright: 0 })); };
      const begin = () => { if (S.state !== 'ready') return; S.state = 'play'; const g = $('pm-go'); if (g) g.hidden = true; S.msg = ''; };
      const togglePause = () => { if (S.state !== 'play' && !S.paused) return; S.paused = !S.paused; const p = $('pm-pause'); if (p) p.textContent = S.paused ? 'Resume' : 'Pause'; draw(); };
      const turn = (d) => { S.pac.want = d; };
      const eatGhost = (g) => {
        S.combo = (S.combo || 0) + 1; const pts = 200 * Math.pow(2, Math.min(S.combo - 1, 3)); S.score += pts; S.msg = `You ate ${GH[g.i].name}. +${pts}`; A.sfx('good');
        g.x = g.px = GH[g.i].sx; g.y = g.py = GH[g.i].sy; g.fright = 0; g.wait = 2500; g.acc = 0;
      };
      const hurt = () => {
        S.lives--; A.sfx('bad'); hud();
        if (S.lives <= 0) { S.state = 'over'; draw(); A.end(false, `Game over. You scored ${S.score} and left ${S.dots} dots.`); return; }
        S.state = 'ready'; S.msg = `Caught! ${S.lives} ${S.lives === 1 ? 'life' : 'lives'} left. Move to carry on.`; placePac(); placeGhosts(); S.t0 = S.clock; const g = $('pm-go'); if (g) { g.hidden = false; g.textContent = 'Go'; }
      };
      const clash = () => {
        const p = S.pac;
        for (const g of S.gh) {
          if (g.wait > 0) continue;
          const same = g.x === p.x && g.y === p.y, swap = g.x === p.px && g.y === p.py && g.px === p.x && g.py === p.y;
          if (same || swap) { if (g.fright > 0) eatGhost(g); else { hurt(); return true; } }
        }
        return false;
      };
      const pacStep = () => {
        const p = S.pac; p.px = p.x; p.py = p.y;
        let d = p.want, v = DV[d];
        if (wall(p.x + v[0], p.y + v[1])) { d = p.dir; v = DV[d]; if (wall(p.x + v[0], p.y + v[1])) return; } else p.dir = d;
        p.x += v[0]; p.y += v[1]; p.mouth ^= 1;
        const c = S.grid[p.y][p.x];
        if (c === '.' || c === 'o') {
          S.grid[p.y][p.x] = ' '; S.dots--;
          if (c === '.') S.score += 10;
          else { S.score += 50; S.combo = 0; S.gh.forEach((g) => { if (g.wait <= 0 || true) g.fright = FRIGHT; }); A.sfx('tick'); S.msg = 'Power pellet! Chase the ghosts.'; }
          if (S.dots <= 0) { S.state = 'over'; hud(); draw(); A.end(true, `You ate every dot with ${S.lives} ${S.lives === 1 ? 'life' : 'lives'} left. Score ${S.score}. You win!`); }
        }
      };
      const target = (g) => {
        const p = S.pac, c = GH[g.i];
        if (g.i === 0 || g.i === 1 || g.i === 3) {
          if (S.scatter) return c.corner;
        }
        if (g.i === 0) return [p.x, p.y];
        if (g.i === 1) { const v = DV[p.dir]; return [p.x + v[0] * 4, p.y + v[1] * 4]; }
        if (g.i === 3) return Math.hypot(g.x - p.x, g.y - p.y) > 6 ? [p.x, p.y] : c.corner;
        return null;
      };
      const ghostStep = (g) => {
        let opts = ORDER.filter((d) => !wall(g.x + DV[d][0], g.y + DV[d][1]));
        const back = { up: 'down', down: 'up', left: 'right', right: 'left' }[g.dir];
        const fwd = opts.filter((d) => d !== back); if (fwd.length) opts = fwd;
        if (!opts.length) return;
        let d;
        const t = target(g);
        if (g.fright > 0 || !t) d = opts[rnd(opts.length)];
        else {
          let best = 1e9; d = opts[0];
          opts.forEach((o) => { const nx = g.x + DV[o][0], ny = g.y + DV[o][1], dist = (nx - t[0]) ** 2 + (ny - t[1]) ** 2; if (dist < best) { best = dist; d = o; } });
        }
        g.px = g.x; g.py = g.y; g.dir = d; g.x += DV[d][0]; g.y += DV[d][1];
      };
      const tick = (dt) => {
        S.clock += dt; const c = (S.clock - S.t0) % 20000; S.scatter = c < 5000;
        const p = S.pac; p.acc += dt;
        while (p.acc >= PAC_MS && S.state === 'play') { p.acc -= PAC_MS; pacStep(); if (S.state !== 'play') return; if (clash()) return; }
        for (const g of S.gh) {
          if (g.wait > 0) { g.wait -= dt; continue; }
          if (g.fright > 0) g.fright -= dt;
          const ms = g.fright > 0 ? FR_MS : G_MS; g.acc += dt;
          while (g.acc >= ms && S.state === 'play') { g.acc -= ms; ghostStep(g); if (clash()) return; }
        }
      };
      const draw = () => {
        cx.fillStyle = '#050b14'; cx.fillRect(0, 0, W * T, H * T);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const c = S.grid[y][x];
          if (c === '#') { cx.fillStyle = '#1f3f9a'; cx.beginPath(); cx.roundRect ? cx.roundRect(x * T + 1, y * T + 1, T - 2, T - 2, 4) : cx.rect(x * T + 1, y * T + 1, T - 2, T - 2); cx.fill(); cx.fillStyle = '#050b14'; cx.fillRect(x * T + 5, y * T + 5, T - 10, T - 10); }
          else if (c === '.') { cx.fillStyle = '#f4f2ea'; cx.fillRect(x * T + T / 2 - 1.5, y * T + T / 2 - 1.5, 3, 3); }
          else if (c === 'o') { cx.fillStyle = '#f6dc8f'; cx.beginPath(); cx.arc(x * T + T / 2, y * T + T / 2, S.clock % 500 < 250 ? 6 : 4.5, 0, 7); cx.fill(); }
        }
        const lerp = (e, ms) => { const t = Math.min(1, e.acc / ms); return [(e.px + (e.x - e.px) * t) * T + T / 2, (e.py + (e.y - e.py) * t) * T + T / 2]; };
        const p = S.pac, [pxx, pyy] = lerp(p, PAC_MS);
        const ang = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[p.dir], m = p.mouth ? 0.55 : 0.12;
        cx.fillStyle = '#f6dc8f'; cx.beginPath(); cx.moveTo(pxx, pyy); cx.arc(pxx, pyy, T / 2 - 2, ang + m, ang + Math.PI * 2 - m); cx.closePath(); cx.fill();
        S.gh.forEach((g) => {
          if (g.wait > 0 && S.state !== 'ready') { /* still drawn waiting */ }
          const [gx, gy] = g.wait > 0 ? [g.x * T + T / 2, g.y * T + T / 2] : lerp(g, g.fright > 0 ? FR_MS : G_MS), r = T / 2 - 2;
          const sc = g.fright > 0; cx.fillStyle = sc ? (g.fright < 2000 && S.clock % 400 < 200 ? '#f4f2ea' : '#3b5fd0') : GH[g.i].color;
          cx.beginPath(); cx.arc(gx, gy - 1, r, Math.PI, 0); cx.lineTo(gx + r, gy + r - 1);
          for (let k = 0; k < 3; k++) { cx.lineTo(gx + r - (k + 0.5) * (2 * r / 3), gy + r - 5); cx.lineTo(gx + r - (k + 1) * (2 * r / 3), gy + r - 1); }
          cx.closePath(); cx.fill();
          cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(gx - 3, gy - 3, 2.6, 0, 7); cx.arc(gx + 3, gy - 3, 2.6, 0, 7); cx.fill();
          cx.fillStyle = sc ? '#fff' : '#14211c'; const v = DV[g.dir]; cx.beginPath(); cx.arc(gx - 3 + v[0], gy - 3 + v[1], 1.3, 0, 7); cx.arc(gx + 3 + v[0], gy - 3 + v[1], 1.3, 0, 7); cx.fill();
        });
        const msg = S.state === 'ready' ? (S.lives === 3 && S.score === 0 ? 'Press a key or tap Start' : 'Get ready') : S.paused ? 'Paused' : '';
        if (msg) { cx.fillStyle = 'rgba(0,0,0,0.65)'; cx.fillRect(0, H * T / 2 - 22, W * T, 40); cx.fillStyle = '#f6dc8f'; cx.font = '700 16px ui-monospace, monospace'; cx.textAlign = 'center'; cx.fillText(msg, W * T / 2, H * T / 2 + 5); }
      };
      return {
        start() {
          S = { grid: MAP.map((r) => r.split('')), state: 'ready', paused: false, score: 0, lives: 3, clock: 0, t0: 0, scatter: true, combo: 0, msg: '', dots: 0 };
          S.grid.forEach((r) => r.forEach((c) => { if (c === '.' || c === 'o') S.dots++; }));
          if (window.__fullDebug) window.__fullDebug.pac = S;
          placePac(); placeGhosts();
          const btn = (d, t) => `<button type="button" class="btn big" data-act="dir" data-v="${d}" aria-label="Move ${d}" style="min-width:4.5rem;touch-action:manipulation">${t}</button>`;
          A.draw(`<div class="arc-scene" style="width:100%"><div class="arc-top"><span class="chip">Score <b id="pm-sc">0</b></span><span class="chip">Lives <b id="pm-lv">3</b></span><span class="chip">Dots left <b id="pm-dt">${S.dots}</b></span></div>
            <canvas id="pm-cv" width="${W * T}" height="${H * T}" role="img" aria-label="Pac-Man maze" style="width:min(100%,${W * T}px);height:auto;border-radius:10px;border:2px solid var(--line);display:block;touch-action:none"></canvas>
            <div class="arc-opts">${abtn('go', '', 'Start', 'primary').replace('<button', '<button id="pm-go"')}${abtn('pause', '', 'Pause').replace('<button', '<button id="pm-pause"')}</div>
            <div class="arc-opts">${btn('up', 'Up')}</div><div class="arc-opts">${btn('left', 'Left')}${btn('down', 'Down')}${btn('right', 'Right')}</div>
            <p class="arc-fb" id="pm-live" aria-live="polite"></p>
            <p class="muted" style="margin:0;font-size:0.8rem;text-align:center">${GH.map((g) => `<span style="color:${g.color}">${g.name}</span> ${g.how}`).join('. ')}.</p></div>`);
          cv = $('pm-cv'); cx = cv.getContext('2d'); let sx = 0, sy = 0, sd = false;
          cv.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; sd = true; });
          cv.addEventListener('pointermove', (e) => {
            if (!sd) return; const dx = e.clientX - sx, dy = e.clientY - sy;
            if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) { const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); go(d); sx = e.clientX; sy = e.clientY; }
          });
          ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => cv.addEventListener(n, () => { sd = false; }));
          const go = (d) => { if (S.paused || S.over) return; turn(d); if (S.state === 'ready') begin(); };
          A.key((e) => {
            const d = KEYS[e.key];
            if (d) { e.preventDefault(); go(d); return; }
            if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
            if (e.key === ' ') { e.preventDefault(); if (S.state === 'ready') begin(); else togglePause(); }
          });
          let last = performance.now();
          A.timer(() => {
            const n = performance.now(); const dt = Math.min(80, n - last); last = n;
            if (S.state === 'play' && !S.paused) tick(dt);
            if (S.state !== 'over') { draw(); hud(); }
          }, 16);
          draw(); hud();
        },
        act(a, v) {
          try { document.activeElement.blur(); } catch (_) { /* ignore */ }
          if (a === 'go') begin(); else if (a === 'pause') togglePause();
          else if (a === 'dir') { if (S.paused) return; turn(v); if (S.state === 'ready') begin(); }
        },
      };
    },
  };
})();

