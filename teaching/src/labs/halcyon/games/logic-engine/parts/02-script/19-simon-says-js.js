/* --- simon-says.js --- */
(() => {
  /* Simon Says: watch the pattern, repeat it. One more button every round. Win at length 12, lose on a wrong press. */
  const SS_PADS = [['Red', '#e0453a', '#ff9a90'], ['Green', '#3fae6a', '#9bf0b8'], ['Blue', '#3b8fb5', '#9fdcff'], ['Yellow', '#d9b53a', '#fff0a0']];
  const SS_WIN = 12;
  const SS_CSS = '<style>.ss-pads{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;width:min(100%,19rem);margin:.3rem auto}.ss-p{aspect-ratio:1.2;border-radius:18px;border:3px solid rgba(255,255,255,.2);color:#14211c;font:800 1rem var(--mono);cursor:pointer;opacity:.55;transition:opacity .08s,transform .08s,box-shadow .08s}.ss-p.lit{opacity:1;transform:scale(1.04);box-shadow:0 0 24px 6px rgba(255,255,255,.55);border-color:#fff}.ss-dots{display:flex;flex-wrap:wrap;gap:.25rem;justify-content:center;min-height:1.1rem}.ss-d{width:.9rem;height:.9rem;border-radius:50%;border:1px solid var(--line);background:rgba(0,0,0,.25)}.ss-d.ok{background:var(--mint);border-color:var(--mint)}.ss-d.bad{background:var(--ruby);border-color:var(--ruby)}</style>';
  FULL['Simon Says'] = {
    title: 'Simon Says: the full game',
    intro: 'Simon lights up coloured buttons. Watch the pattern, then press the same buttons in the same order. Each round Simon adds one more button. One wrong press, or the wrong button at any place in the pattern, ends the game. Press the whole pattern with no mistakes to pass a round. Pass a pattern of length 12 to win. A pass earns 10 points for each button in the pattern. Keys 1 to 4 (or R, G, B, Y) press the buttons.',
    make: (A) => {
      let seq, got, phase, score, ver, msg;
      const pads = () => SS_PADS.map((p, i) => `<button type="button" class="ss-p" id="ss-p${i}" style="background:${p[1]}" data-act="pad" data-v="${i}" aria-label="${p[0]} button, key ${i + 1}">${i + 1}</button>`).join('');
      const dots = () => Array.from({ length: seq.length }, (_, i) => `<span class="ss-d${i < got.length ? ' ok' : ''}"></span>`).join('');
      const draw = () => A.draw(`${SS_CSS}<div class="arc-scene"><div class="arc-top"><span class="chip">Pattern length <b id="ss-len">${seq.length}</b> / ${SS_WIN}</span><span class="chip">Score <b id="ss-sc">${score}</b></span></div><p class="arc-fb" id="ss-msg" aria-live="polite">${msg}</p><div class="ss-pads">${pads()}</div><div class="ss-dots" id="ss-dots" aria-label="Progress">${dots()}</div></div>`);
      const setMsg = (t) => { const m = document.getElementById('ss-msg'); if (m) m.textContent = t; };
      const flash = (i, ms) => { const el = document.getElementById('ss-p' + i); if (!el) return; el.classList.add('lit'); A.after(() => el.classList.remove('lit'), ms); };
      const refresh = () => { const d = document.getElementById('ss-dots'); if (d) d.innerHTML = dots(); const l = document.getElementById('ss-len'); if (l) l.textContent = seq.length; const s = document.getElementById('ss-sc'); if (s) s.textContent = score; };
      const play = () => {
        phase = 'show'; got = []; refresh(); setMsg('Watch the pattern...');
        const on = Math.max(260, 520 - seq.length * 20), gap = Math.max(120, 220 - seq.length * 8);
        seq.forEach((b, k) => { A.after(() => { flash(b, on); A.sfx('tick'); }, 700 + k * (on + gap)); });
        A.after(() => { phase = 'input'; setMsg('Your turn. Press the pattern.'); }, 700 + seq.length * (on + gap));
      };
      const press = (i) => {
        if (phase !== 'input') return;
        flash(i, 160);
        if (i !== seq[got.length]) {
          phase = 'over';
          const d = document.getElementById('ss-dots'); if (d) d.insertAdjacentHTML('beforeend', '<span class="ss-d bad"></span>');
          setMsg('Wrong button. The pattern was ' + seq.map((b) => SS_PADS[b][0]).join(', ') + '.');
          A.end(false, `Wrong button at place ${got.length + 1}. You got ${got.length} right in a row and scored ${score} points.`); return;
        }
        got.push(i); A.sfx('tick'); refresh();
        if (got.length === seq.length) {
          score += 10 * seq.length; refresh();
          if (seq.length >= SS_WIN) { phase = 'over'; setMsg('Perfect!'); A.end(true, `You repeated all ${SS_WIN} buttons! Final score ${score}.`); return; }
          phase = 'wait'; A.sfx('good'); setMsg('Round passed! Simon adds one more...');
          A.after(() => { seq.push(rnd(4)); refresh(); play(); }, 900);
        }
      };
      return {
        start() {
          seq = [rnd(4)]; got = []; score = 0; msg = 'Get ready...'; phase = 'show'; draw(); play();
          A.key((e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key.toLowerCase(), i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'rgby'.indexOf(k);
            if (i >= 0 && k.length === 1) { e.preventDefault(); press(i); }
          });
        },
        act(a, v) { if (a === 'pad') press(+v); },
      };
    },
  };
})();

/* --- slots.js --- */
(() => {
  /* Three-reel slot machine. Weighted reel strips, a paytable, bet size, bankroll. Reach the goal to win, run out of chips to lose. Return to player is about 97 percent. */
  const SYM = { seven: { t: '7', c: '#ff5a4d' }, bar: { t: 'BAR', c: '#f4f2ea' }, bell: { t: 'BELL', c: '#f6dc8f' }, plum: { t: 'PLUM', c: '#c58bff' }, lemon: { t: 'LEMON', c: '#f2e46b' }, cherry: { t: 'CHERRY', c: '#ff8f8a' } };
  const WEIGHT = { seven: 2, bar: 3, bell: 4, plum: 5, lemon: 7, cherry: 5 };
  const STRIP = Object.keys(WEIGHT).flatMap((k) => Array(WEIGHT[k]).fill(k));
  const TRIPLE = { seven: 50, bar: 25, bell: 12, plum: 8, lemon: 5, cherry: 10 };
  const START = 100, GOAL = 250, BETS = [1, 5, 10, 25];
  const mult = (r) => {
    if (r[0] === r[1] && r[1] === r[2]) return TRIPLE[r[0]];
    const ch = r.filter((x) => x === 'cherry').length;
    return ch === 2 ? 3 : ch === 1 ? 1 : 0;
  };
  const STYLE = `<style>
.sm-top{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;font:600 .8rem var(--mono)}
.sm-top span{padding:.25rem .6rem;border:1px solid var(--line);border-radius:999px;background:rgba(0,0,0,.25)}
.sm-box{display:flex;gap:.4rem;padding:.6rem;border-radius:14px;border:3px solid var(--brass-hi);background:#120a06;max-width:100%}
.sm-reel{display:grid;place-items:center;width:5.2rem;max-width:28vw;height:5.2rem;border-radius:8px;background:var(--ivory);font:800 1.05rem var(--mono);overflow:hidden}
.sm-reel.spin{filter:blur(.6px);opacity:.8}
.sm-reel.win{outline:3px solid var(--mint)}
.sm-pay{display:grid;grid-template-columns:repeat(2,auto);gap:.1rem .9rem;font:.74rem var(--mono);color:#cfe6d8;justify-content:center}
.sm-bet.sel{outline:3px solid var(--brass-hi)}
</style>`;
  FULL['Slot Machine'] = {
    title: 'Slot Machine: the full game',
    intro: 'Pick a bet size and pull the lever. Three of a kind pays big, and cherries pay on their own. Reach ' + GOAL + ' chips to win. Run out of chips and you lose. The machine pays back about 97 percent over time, so a little luck is needed.',
    make: (A) => {
      let bank, bet, reels, spinning, fb, win, spins;
      const reelHtml = () => reels.map((v, i) => {
        const s = v ? SYM[v] : null;
        return `<div class="sm-reel${spinning && !(v && spinning[i] === 0) ? ' spin' : ''}${win ? ' win' : ''}" style="color:${s ? (v === 'bar' ? '#111' : s.c) : '#999'};${v === 'bar' ? '' : 'background:#1d1410'}" aria-label="Reel ${i + 1}: ${s ? s.t : 'blank'}">${s ? s.t : '?'}</div>`;
      }).join('');
      const draw = () => {
        const canSpin = !spinning && bank >= bet;
        A.draw(`${STYLE}<div class="arc-scene">
          <div class="sm-top"><span>Chips ${bank}</span><span>Goal ${GOAL}</span><span>Bet ${bet}</span><span>Spins ${spins}</span></div>
          <div class="sm-box" aria-live="polite">${reelHtml()}</div>
          <p class="arc-fb">${fb}</p>
          <div class="arc-row" role="group" aria-label="Bet size">${BETS.map((b) => `<button type="button" class="btn small sm-bet${b === bet ? ' sel primary' : ''}" data-act="bet" data-v="${b}" ${spinning || b > bank ? 'disabled' : ''}>Bet ${b}</button>`).join('')}</div>
          <div class="arc-opts">${abtn('spin', '', 'Pull the lever (space)', 'primary', !canSpin)}</div>
          <div class="sm-pay" aria-label="Paytable">${Object.keys(TRIPLE).map((k) => `<span>3 x ${SYM[k].t}</span><span>pays ${TRIPLE[k]} x</span>`).join('')}<span>2 CHERRY</span><span>pays 3 x</span><span>1 CHERRY</span><span>pays 1 x</span></div>
        </div>`);
      };
      const spin = () => {
        if (spinning || bank < bet) return;
        const stake = bet; bank -= stake; spins++; win = false;
        const final = [pickOne(STRIP), pickOne(STRIP), pickOne(STRIP)];
        spinning = [1, 1, 1]; reels = [pickOne(STRIP), pickOne(STRIP), pickOne(STRIP)]; fb = 'Spinning...'; draw();
        let n = 0;
        const step = () => {
          n++;
          for (let i = 0; i < 3; i++) {
            if (n >= 5 + i * 4) { spinning[i] = 0; reels[i] = final[i]; } else reels[i] = pickOne(STRIP);
          }
          A.sfx('tick');
          if (n < 13) { draw(); A.after(step, 90); return; }
          spinning = null;
          const m = mult(final), got = m * stake;
          bank += got; win = m > 0;
          fb = m > 0 ? `Winner! ${m} x your bet of ${stake} pays ${got}. Net ${got - stake >= 0 ? '+' : ''}${got - stake}.` : `No win. -${stake} chips.`;
          A.sfx(m > 1 ? 'good' : m === 1 ? 'tick' : 'bad');
          if (bet > bank && bank > 0) bet = BETS.filter((b) => b <= bank).pop() || 1;
          draw();
          if (bank >= GOAL) A.end(true, `You cashed out with ${bank} chips. The machine is beaten. You win!`);
          else if (bank <= 0) A.end(false, 'You are out of chips. The machine keeps them.');
        };
        A.after(step, 90);
      };
      return {
        start() {
          bank = START; bet = 5; reels = [null, null, null]; spinning = null; win = false; spins = 0; fb = 'Pick a bet and pull the lever.';
          draw();
          A.key((e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); spin(); } });
        },
        act(a, v) {
          if (spinning) return;
          if (a === 'bet') { const b = Number(v); if (b <= bank) { bet = b; A.sfx('tick'); draw(); } }
          else if (a === 'spin') spin();
        },
      };
    },
  };
})();

/* --- snake.js --- */
(() => {
  /* Snake: eat apples, grow, do not hit a wall or yourself. Reach length 30 to win. */
  FULL['Snake'] = {
    title: 'Snake: the full game',
    intro: 'Eat apples to grow. Hitting a wall or your own body ends the game. The snake gets faster as it grows. Reach length 30 to win. Use the arrow keys, WASD, swipe on the board, or the buttons. P pauses.',
    make: (A) => {
      const N = 20, C = 20, DBG = window.__fullDebug || {};
      let S, cv, cx, last;
      const $ = (id) => document.getElementById(id);
      const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const KEYS = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
      const stepMs = () => Math.max(70, 150 - (S.body.length - 3) * 3);
      const food = () => {
        const free = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!S.body.some((s) => s.x === x && s.y === y)) free.push({ x, y });
        S.food = free[Math.floor(Math.random() * free.length)];
      };
      const hud = () => { $('sn-len').textContent = S.body.length; $('sn-spd').textContent = Math.round(1000 / stepMs()); const l = $('sn-live'); if (l && S.msg) { l.textContent = S.msg; S.msg = ''; } };
      const turn = (d) => {
        const lastDir = S.q.length ? S.q[S.q.length - 1] : S.dir;
        if (DIRS[d][0] === -DIRS[lastDir][0] && DIRS[d][1] === -DIRS[lastDir][1]) return;
        if (d === lastDir || S.q.length >= 2) return; S.q.push(d);
      };
      const begin = () => { if (S.state !== 'ready') return; S.state = 'play'; const g = $('sn-go'); if (g) g.hidden = true; };
      const togglePause = () => { if (S.state === 'ready' || S.over) return; S.paused = !S.paused; const p = $('sn-pause'); if (p) p.textContent = S.paused ? 'Resume' : 'Pause'; };
      const die = (why) => { S.over = true; S.dead = true; render(); A.end(false, `Game over: ${why}. You reached length ${S.body.length}.`); };
      const step = () => {
        if (S.q.length) S.dir = S.q.shift();
        const [dx, dy] = DIRS[S.dir], h = S.body[0], nx = h.x + dx, ny = h.y + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) return die('you hit the wall');
        const eat = nx === S.food.x && ny === S.food.y;
        const check = eat ? S.body : S.body.slice(0, -1);
        if (check.some((s) => s.x === nx && s.y === ny)) return die('you bit yourself');
        S.body.unshift({ x: nx, y: ny });
        if (eat) {
          S.msg = `Length ${S.body.length}`; A.sfx('good');
          if (S.body.length >= S.win) { S.over = true; S.won = true; render(); hud(); A.end(true, `Length ${S.body.length}. You win!`); return; }
          food();
        } else S.body.pop();
        hud();
      };
      const render = () => {
        cx.fillStyle = '#06160f'; cx.fillRect(0, 0, N * C, N * C);
        cx.fillStyle = 'rgba(244,242,234,0.05)'; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x + y) % 2) cx.fillRect(x * C, y * C, C, C);
        cx.fillStyle = '#ff6b5e'; cx.beginPath(); cx.arc(S.food.x * C + C / 2, S.food.y * C + C / 2 + 1, C / 2 - 3, 0, 7); cx.fill();
        cx.fillStyle = '#6fd08c'; cx.fillRect(S.food.x * C + C / 2 - 1, S.food.y * C + 1, 2, 5);
        S.body.forEach((s, i) => { cx.fillStyle = i === 0 ? (S.dead ? '#ff6b5e' : '#f6dc8f') : (i % 2 ? '#3fae6a' : '#4cc17a'); cx.beginPath(); cx.roundRect ? cx.roundRect(s.x * C + 1, s.y * C + 1, C - 2, C - 2, i === 0 ? 7 : 4) : cx.rect(s.x * C + 1, s.y * C + 1, C - 2, C - 2); cx.fill(); });
        const h = S.body[0], [dx, dy] = DIRS[S.dir]; cx.fillStyle = '#14211c';
        [[-1], [1]].forEach(([k]) => { cx.beginPath(); cx.arc(h.x * C + C / 2 + dx * 4 + (dy ? k * 4 : 0), h.y * C + C / 2 + dy * 4 + (dx ? k * 4 : 0), 2, 0, 7); cx.fill(); });
        const msg = S.state === 'ready' ? 'Press any key or tap Start' : S.paused ? 'Paused' : '';
        if (msg) { cx.fillStyle = 'rgba(0,0,0,0.6)'; cx.fillRect(0, N * C / 2 - 26, N * C, 46); cx.fillStyle = '#f6dc8f'; cx.font = '700 18px ui-monospace, monospace'; cx.textAlign = 'center'; cx.fillText(msg, N * C / 2, N * C / 2 + 6); }
      };
      return {
        start() {
          S = { state: 'ready', paused: false, over: false, dead: false, won: false, dir: 'right', q: [], acc: 0, msg: '', win: DBG.snakeWin || 30, body: [{ x: 6, y: 10 }, { x: 5, y: 10 }, { x: 4, y: 10 }] };
          if (DBG) DBG.state = S;
          food();
          const btn = (d, t) => `<button type="button" class="btn big" data-act="dir" data-v="${d}" aria-label="Turn ${d}" style="min-width:4.5rem;touch-action:manipulation">${t}</button>`;
          A.draw(`<div class="arc-scene" style="width:100%"><div class="arc-top"><span class="chip">Length <b id="sn-len">3</b> / ${S.win}</span><span class="chip">Speed <b id="sn-spd">7</b></span></div>
            <canvas id="sn-cv" width="${N * C}" height="${N * C}" role="img" aria-label="Snake board" style="width:min(100%,${N * C}px);height:auto;border-radius:10px;border:2px solid var(--line);display:block;touch-action:none"></canvas>
            <div class="arc-opts">${abtn('go', '', 'Start', 'primary')}${abtn('pause', '', 'Pause')}</div>
            <div class="arc-opts">${btn('up', 'Up')}</div><div class="arc-opts">${btn('left', 'Left')}${btn('down', 'Down')}${btn('right', 'Right')}</div>
            <p class="arc-fb" id="sn-live" aria-live="polite"></p></div>`);
          cv = $('sn-cv'); cx = cv.getContext('2d'); let sx = 0, sy = 0, sd = false;
          cv.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; sd = true; if (S.state === 'ready') begin(); });
          cv.addEventListener('pointermove', (e) => {
            if (!sd) return; const dx = e.clientX - sx, dy = e.clientY - sy;
            if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) { turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); sx = e.clientX; sy = e.clientY; }
          });
          ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => cv.addEventListener(n, () => { sd = false; }));
          A.key((e) => {
            const d = KEYS[e.key];
            if (d) { e.preventDefault(); if (S.paused) return; if (S.state === 'ready') { begin(); if (d !== 'left') turn(d); return; } turn(d); return; }
            if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
            if (e.key === ' ') { e.preventDefault(); if (S.state === 'ready') begin(); else togglePause(); return; }
            begin();
          });
          last = performance.now();
          A.timer(() => {
            const n = performance.now(); const dt = Math.min(100, n - last); last = n;
            if (S.state === 'play' && !S.paused && !S.over) { S.acc += dt; while (S.acc >= stepMs() && !S.over) { S.acc -= stepMs(); step(); } }
            render();
          }, 16);
          render(); hud();
        },
        act(a, v) {
          try { document.activeElement.blur(); } catch (_) { /* ignore */ }
          if (a === 'go') begin(); else if (a === 'pause') togglePause();
          else if (a === 'dir' && !S.paused) { if (S.state === 'ready') { begin(); if (v !== 'left') turn(v); } else turn(v); }
        },
      };
    },
  };
})();

/* --- snakes-ladders.js --- */
(() => {
  /* Snakes and Ladders: 10x10 board, 3 players, exact finish on 100 (an overshoot means you stay put). */
  const LAD = { 4: 14, 9: 31, 21: 42, 28: 84 };
  const SNK = { 17: 7, 54: 34, 62: 19, 98: 79 };
  const NAMES = ['You', 'Bot 1', 'Bot 2'];
  const COL = ['var(--brass-hi)', 'var(--sky)', 'var(--ruby)'];
  const rc = (n) => { const r = Math.floor((n - 1) / 10); let c = (n - 1) % 10; if (r % 2) c = 9 - c; return [r, c]; };
  FULL['Snakes and Ladders'] = {
    title: 'Snakes and Ladders: the full game',
    intro: 'Race two bots to square 100. Roll the die and move that many squares. Land on the bottom of a ladder to climb it. Land on a snake head and you slide down. You must land on 100 exactly: if your roll is too big, you stay where you are.',
    make: (A) => {
      let pos, turn, die, fb, busy;
      const draw = () => {
        let cells = '';
        for (let v = 0; v < 10; v++) for (let c = 0; c < 10; c++) {
          const r = 9 - v, n = r * 10 + (r % 2 === 0 ? c + 1 : 10 - c);
          const tok = pos.map((p, i) => p === n ? `<i class="slb-t" style="background:${COL[i]}" title="${NAMES[i]}"></i>` : '').join('');
          const tag = LAD[n] ? `<small class="slb-l">up ${LAD[n]}</small>` : SNK[n] ? `<small class="slb-s">down ${SNK[n]}</small>` : '';
          cells += `<div class="slb-c${(r + c) % 2 ? ' alt' : ''}" aria-label="Square ${n}">${n}${tag}<span class="slb-k">${tok}</span></div>`;
        }
        const line = (a, b, cls) => { const [r1, c1] = rc(a), [r2, c2] = rc(b); return `<line class="${cls}" x1="${(c1 + 0.5) * 10}" y1="${(9 - r1 + 0.5) * 10}" x2="${(c2 + 0.5) * 10}" y2="${(9 - r2 + 0.5) * 10}"/>`; };
        const lines = Object.keys(LAD).map((k) => line(+k, LAD[k], 'slb-lad')).join('') + Object.keys(SNK).map((k) => line(+k, SNK[k], 'slb-snk')).join('');
        const start = pos.map((p, i) => p === 0 ? `<i class="slb-t" style="background:${COL[i]}"></i> ${NAMES[i]}` : '').filter(Boolean).join(' &nbsp; ');
        const mine = turn === 0 && !busy;
        A.draw(`<div class="arc-scene"><style>
          .slb{position:relative;width:min(92vw,25rem);aspect-ratio:1;display:grid;grid-template-columns:repeat(10,1fr);border:2px solid var(--brass-lo);border-radius:6px;overflow:hidden}
          .slb-c{position:relative;background:rgba(244,242,234,.9);color:var(--ink);font:600 .55rem var(--mono);padding:1px 2px;min-width:0;overflow:hidden}.slb-c.alt{background:rgba(214,226,206,.92)}
          .slb-c small{display:block;font-size:.45rem;line-height:1}.slb-l{color:#1d7a3e}.slb-s{color:#b3261e}
          .slb-k{position:absolute;right:1px;bottom:1px;left:1px;display:flex;flex-wrap:wrap;gap:1px;justify-content:flex-end}.slb-t{display:inline-block;width:.7rem;height:.7rem;border-radius:50%;border:1px solid #000;vertical-align:middle}
          .slb-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.slb-lad{stroke:#1d7a3e;stroke-width:1.2;opacity:.75}.slb-snk{stroke:#b3261e;stroke-width:1.2;stroke-dasharray:2 1.5;opacity:.75}
        </style>
          <div class="arc-top">${pos.map((p, i) => `<span class="chip"><i class="slb-t" style="background:${COL[i]}"></i> ${NAMES[i]} ${p === 0 ? 'start' : p}</span>`).join('')}</div>
          <div class="slb" role="img" aria-label="Board. You are on ${pos[0]}, Bot 1 on ${pos[1]}, Bot 2 on ${pos[2]}">${cells}<svg class="slb-svg" viewBox="0 0 100 100">${lines}</svg></div>
          <p class="muted">${start ? 'Waiting on start: ' + start : 'Green lines are ladders, red dashed lines are snakes.'}</p>
          <div class="arc-row">${die ? `<span class="arc-num" aria-label="Die shows ${die}">${die}</span>` : ''}<b class="arc-big-text">${turn === 0 ? 'Your turn' : NAMES[turn] + ' is rolling'}</b></div>
          <div class="arc-opts">${abtn('roll', '', 'Roll the die (space)', 'primary big', !mine)}</div><p class="arc-fb">${fb}</p></div>`);
      };
      const nextTurn = () => { turn = (turn + 1) % 3; busy = turn !== 0; draw(); if (turn !== 0) A.after(() => play(), 750); };
      const play = () => {
        const who = turn; die = 1 + rnd(6); busy = true;
        const p = pos[who], nm = NAMES[who];
        if (p + die > 100) { fb = `${nm} rolled ${die}. That is past 100, so ${who ? 'it stays' : 'you stay'} on ${p}. An exact roll is needed.`; A.sfx('tick'); draw(); return A.after(nextTurn, 900); }
        fb = `${nm} rolled ${die}.`; A.sfx('tick'); draw();
        let left = die;
        const step = () => {
          pos[who]++; left--; draw();
          if (left > 0) return A.after(step, 130);
          const q = pos[who];
          if (q === 100) { fb = `${nm} reached 100!`; draw(); return A.end(who === 0, who === 0 ? 'You landed on 100 exactly. You win!' : `${nm} reached 100 first. Try again.`); }
          const j = LAD[q] || SNK[q];
          if (!j) return A.after(nextTurn, 600);
          A.after(() => { pos[who] = j; fb = `${nm} ${LAD[q] ? 'climbed a ladder from ' + q + ' up to ' + j : 'hit a snake on ' + q + ' and slid down to ' + j}.`; A.sfx(LAD[q] ? 'good' : 'bad'); draw(); A.after(nextTurn, 800); }, 350);
        };
        A.after(step, 250);
      };
      return {
        start() {
          pos = [0, 0, 0]; turn = 0; die = 0; fb = 'Roll to start. You need exactly 100 to win.'; busy = false; draw();
          A.key((e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (turn === 0 && !busy) play(); } });
        },
        act(a) { if (a === 'roll' && turn === 0 && !busy) play(); },
      };
    },
  };
})();

