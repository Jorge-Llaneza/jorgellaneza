/* --- fizz-buzz.js --- */
(() => {
  /* Fizz Buzz: take turns counting to 60 with a bot. Say Fizz for multiples of 3, Buzz for multiples of 5, FizzBuzz for both. */
  const FB_TOP = 60, FB_TIME = 6;
  const fbWord = (n) => (n % 15 === 0 ? 'FizzBuzz' : n % 3 === 0 ? 'Fizz' : n % 5 === 0 ? 'Buzz' : String(n));
  FULL['Fizz Buzz'] = {
    title: 'Fizz Buzz: the full game',
    intro: 'Take turns counting from 1 to 60 with the bot. You say the odd numbers, the bot says the even ones. Say "Fizz" for a multiple of 3, "Buzz" for a multiple of 5, and "FizzBuzz" for both. Say the number otherwise. A wrong word loses, and so does waiting more than 6 seconds. The bot can slip too.',
    make: (A) => {
      let n, log, turn, left, done, msg, botBusy;
      const timeEl = () => document.getElementById('fb-time');
      const draw = () => {
        const b = ['num', 'Fizz', 'Buzz', 'FizzBuzz'].map((w) => abtn('say', w, w === 'num' ? String(n) : w, w === 'num' ? 'big' : 'big primary', done || turn !== 'you')).join('');
        A.draw(`<div class="arc-scene"><div class="arc-top"><span class="chip">Next number <b>${n}</b></span><span class="chip">Goal <b>${FB_TOP}</b></span><span class="chip">${turn === 'you' ? 'Your turn <b id="fb-time">' + Math.ceil(left) + '</b>s' : 'Bot turn'}</span></div>
          <p class="arc-big-text" aria-live="polite">${turn === 'you' && !done ? 'Your turn. What do you say for ' + n + '?' : done ? '' : 'The bot is speaking...'}</p>
          <div class="arc-opts">${b}</div><p class="arc-fb">${msg}</p><ul class="arc-log" aria-label="Count so far">${log.slice(-6).reverse().map((l) => `<li>${l}</li>`).join('')}</ul></div>`);
      };
      const say = (who, w) => { log.push(`<b>${who}</b>: ${w}`); };
      const advance = () => {
        if (n >= FB_TOP) { done = true; msg = ''; draw(); A.end(true, `You reached ${FB_TOP} without a slip. You win!`); return; }
        n++; if (turn === 'you') botTurn(); else { turn = 'you'; left = FB_TIME; draw(); }
      };
      const botTurn = () => {
        turn = 'bot'; botBusy = true; draw();
        A.after(() => {
          botBusy = false;
          const right = fbWord(n);
          let w = right;
          if (Math.random() < 0.07 + n / 700) { const wrongs = ['Fizz', 'Buzz', 'FizzBuzz', String(n)].filter((x) => x !== right); w = pickOne(wrongs); }
          say('Bot', w);
          if (w !== right) { done = true; msg = `The bot said "${w}" but it should be "${right}".`; draw(); A.end(true, `The bot slipped on ${n}. You win!`); return; }
          msg = `Bot said ${w}.`;
          if (n >= FB_TOP) { done = true; draw(); A.end(true, `The count reached ${FB_TOP}. You win!`); return; }
          n++; turn = 'you'; left = FB_TIME; draw();
        }, 800 + rnd(500));
      };
      const lose = (why) => { done = true; draw(); A.end(false, why); };
      return {
        start() {
          n = 1; log = []; turn = 'you'; left = FB_TIME; done = false; msg = 'You start with 1.'; botBusy = false; draw();
          A.timer(() => {
            if (done || turn !== 'you') return;
            left -= 0.25; const t = timeEl(); if (t) t.textContent = Math.max(0, Math.ceil(left));
            if (left <= 0) { msg = 'Time ran out.'; lose(`Too slow on ${n}. It should have been "${fbWord(n)}".`); }
          }, 250);
          A.key((e) => { if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toLowerCase(); if (k === 'n') this_say('num'); else if (k === 'f') this_say('Fizz'); else if (k === 'b') this_say('Buzz'); else if (k === 'z') this_say('FizzBuzz'); });
        },
        act(a, v) { if (a === 'say') this_say(v); },
      };
      function this_say(v) {
        if (done || turn !== 'you') return;
        const right = fbWord(n), w = v === 'num' ? String(n) : v;
        say('You', w);
        if (w !== right) { msg = `You said "${w}". It should be "${right}".`; lose(`Wrong word on ${n}: you said "${w}" but it is "${right}".`); return; }
        msg = `Correct: ${w}.`; A.sfx('good'); advance();
      }
    },
  };
})();

/* --- flappy-bird.js --- */
(() => {
  /* Flappy Bird: tap to flap, squeeze through the gaps between pipes. Pass 20 pipes to win. */
  FULL['Flappy Bird'] = {
    title: 'Flappy Bird: the full game',
    intro: 'Tap the screen, press Space or Up, or use the Flap button to make the bird jump. Gravity pulls it down. Fly through the gaps between the pipes. Touching a pipe or the ground ends the game. Pass 20 pipes to win. P pauses.',
    make: (A) => {
      const W = 320, H = 480, GROUND = 64, BX = 84, R = 12, GAP = 150, SPEED = 128, GRAV = 1450, FLAP = -400, SPACING = 190, PW = 52, WIN = 20;
      const DBG = window.__fullDebug || {};
      let S, cv, cx, last;
      const $ = (id) => document.getElementById(id);
      const rnd = (a, b) => a + Math.random() * (b - a);
      const say = (t) => { const e = $('fb-live'); if (e) e.textContent = t; };
      const addPipe = (x) => {
        const prev = S.pipes.length ? S.pipes[S.pipes.length - 1].gy : H / 2 - 40;
        const lo = 70 + GAP / 2, hi = H - GROUND - 70 - GAP / 2;
        const gy = Math.max(lo, Math.min(hi, prev + rnd(-130, 130)));
        S.pipes.push({ x, gy, passed: false });
      };
      const begin = () => {
        if (S.state !== 'ready') return; S.state = 'play'; const g = $('fb-go'); if (g) g.hidden = true;
        S.vy = FLAP; A.sfx('tick');
      };
      const flap = () => {
        if (S.over || S.paused) return;
        if (S.state === 'ready') { begin(); return; }
        S.vy = FLAP; A.sfx('tick');
      };
      const togglePause = () => { if (S.state === 'ready' || S.over) return; S.paused = !S.paused; const p = $('fb-pause'); if (p) p.textContent = S.paused ? 'Resume' : 'Pause'; };
      const die = (why) => { S.over = true; S.dead = true; A.sfx('bad'); render(); A.end(false, `${why} You passed ${S.score} of ${WIN} pipes. Try again.`); };
      const update = (dt) => {
        S.vy += GRAV * dt; S.by += S.vy * dt; S.dist += SPEED * dt;
        if (S.by < R) { S.by = R; if (S.vy < 0) S.vy = 0; }
        if (S.by + R >= H - GROUND) { S.by = H - GROUND - R; return die('You hit the ground.'); }
        S.pipes.forEach((p) => { p.x -= SPEED * dt; });
        while (S.pipes.length && S.pipes[0].x + PW < -4) S.pipes.shift();
        const lastP = S.pipes[S.pipes.length - 1];
        if (S.spawned < WIN + 1 && lastP.x < W - SPACING + 0) { addPipe(lastP.x + SPACING); S.spawned++; }
        for (const p of S.pipes) {
          if (BX + R > p.x && BX - R < p.x + PW) {
            if (S.by - R < p.gy - GAP / 2 || S.by + R > p.gy + GAP / 2) return die('You hit a pipe.');
          }
          if (!p.passed && p.x + PW < BX - R) {
            p.passed = true; S.score++; A.sfx('good'); say(`${S.score} of ${WIN} pipes.`);
            if (S.score >= WIN) { S.over = true; render(); A.end(true, `You passed ${WIN} pipes. You win!`); return; }
          }
        }
      };
      const render = () => {
        const sky = cx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1b3a52'); sky.addColorStop(1, '#4d86a0');
        cx.fillStyle = sky; cx.fillRect(0, 0, W, H);
        cx.fillStyle = 'rgba(255,255,255,0.12)';
        [[40, 90, 34], [190, 150, 26], [270, 60, 30]].forEach(([x, y, r]) => { const xx = ((x - S.dist * 0.15) % (W + 80) + W + 80) % (W + 80) - 40; cx.beginPath(); cx.arc(xx, y, r, 0, 7); cx.arc(xx + r, y + 6, r * 0.8, 0, 7); cx.arc(xx - r, y + 8, r * 0.7, 0, 7); cx.fill(); });
        S.pipes.forEach((p) => {
          const top = p.gy - GAP / 2, bot = p.gy + GAP / 2;
          cx.fillStyle = '#3fae6a'; cx.fillRect(p.x, 0, PW, top); cx.fillRect(p.x, bot, PW, H - GROUND - bot);
          cx.fillStyle = '#6fd08c'; cx.fillRect(p.x - 4, top - 18, PW + 8, 18); cx.fillRect(p.x - 4, bot, PW + 8, 18);
          cx.fillStyle = 'rgba(0,0,0,0.18)'; cx.fillRect(p.x + PW - 10, 0, 10, top - 18); cx.fillRect(p.x + PW - 10, bot + 18, 10, H - GROUND - bot - 18);
        });
        cx.fillStyle = '#c9a96a'; cx.fillRect(0, H - GROUND, W, GROUND);
        cx.fillStyle = '#7a8f3f'; cx.fillRect(0, H - GROUND, W, 10);
        cx.fillStyle = 'rgba(0,0,0,0.15)'; for (let x = -((S.dist) % 24); x < W; x += 24) cx.fillRect(x, H - GROUND + 10, 12, 6);
        const bob = S.state === 'ready' ? Math.sin(S.t * 5) * 6 : 0, by = S.by + bob;
        cx.save(); cx.translate(BX, by); cx.rotate(Math.max(-0.5, Math.min(1.1, S.vy / 600)));
        cx.fillStyle = S.dead ? '#ff6b5e' : '#f6dc8f'; cx.beginPath(); cx.arc(0, 0, R, 0, 7); cx.fill();
        cx.fillStyle = '#e9b84a'; cx.beginPath(); cx.ellipse(-3, 3 + Math.sin(S.t * 18) * 2, 6, 4, 0, 0, 7); cx.fill();
        cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(5, -4, 4, 0, 7); cx.fill(); cx.fillStyle = '#14211c'; cx.beginPath(); cx.arc(6, -4, 2, 0, 7); cx.fill();
        cx.fillStyle = '#f0883a'; cx.beginPath(); cx.moveTo(9, 0); cx.lineTo(18, 3); cx.lineTo(9, 6); cx.fill();
        cx.restore();
        cx.textAlign = 'center'; cx.font = '700 40px ui-monospace, monospace'; cx.fillStyle = 'rgba(255,255,255,0.9)'; cx.strokeStyle = 'rgba(0,0,0,0.4)'; cx.lineWidth = 4;
        cx.strokeText(String(S.score), W / 2, 56); cx.fillText(String(S.score), W / 2, 56);
        cx.font = '600 12px ui-monospace, monospace'; cx.fillStyle = 'rgba(255,255,255,0.8)'; cx.fillText(`goal ${WIN}`, W / 2, 74);
        const msg = S.state === 'ready' ? 'Tap or press Space to flap' : S.paused ? 'Paused' : '';
        if (msg) { cx.fillStyle = 'rgba(0,0,0,0.55)'; cx.fillRect(0, H / 2 + 40, W, 46); cx.fillStyle = '#f6dc8f'; cx.font = '700 16px ui-monospace, monospace'; cx.fillText(msg, W / 2, H / 2 + 69); }
      };
      return {
        start() {
          S = { state: 'ready', paused: false, over: false, dead: false, by: H / 2 - 30, vy: 0, pipes: [], score: 0, spawned: 0, dist: 0, t: 0 };
          if (DBG) DBG.state = S;
          addPipe(W + 60); S.spawned = 1;
          A.draw(`<div class="arc-scene" style="width:100%"><canvas id="fb-cv" width="${W}" height="${H}" role="img" aria-label="Flappy Bird sky. Tap to flap." style="width:min(100%,${W}px);height:auto;border-radius:10px;border:2px solid var(--line);display:block;touch-action:none;cursor:pointer"></canvas>
            <div class="arc-opts">${abtn('flap', '', 'Flap', 'primary big')}${abtn('pause', '', 'Pause')}</div>
            <p class="arc-fb" id="fb-live" aria-live="polite">Pass ${WIN} pipes to win.</p></div>`);
          cv = $('fb-cv'); cx = cv.getContext('2d');
          cv.addEventListener('pointerdown', (e) => { e.preventDefault(); flap(); });
          A.key((e) => {
            const k = e.key;
            if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); if (!e.repeat) flap(); return; }
            if (k === 'p' || k === 'P') { togglePause(); return; }
            if (k.startsWith('Arrow')) e.preventDefault();
          });
          last = performance.now();
          A.timer(() => {
            const n = performance.now(); const dt = Math.min(0.033, (n - last) / 1000); last = n;
            S.t += dt;
            if (S.state === 'play' && !S.paused && !S.over) update(dt);
            render();
          }, 16);
          render();
        },
        act(a) {
          try { document.activeElement.blur(); } catch (_) { /* ignore */ }
          if (a === 'flap') flap(); else if (a === 'pause') togglePause();
        },
      };
    },
  };
})();

/* --- game-2048.js --- */
(() => {
  /* 2048: slide tiles, equal tiles merge. Make a 2048 tile to win. No moves left means game over. */
  const G_CSS = '<style>.g48-b{display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem;width:min(100%,22rem);aspect-ratio:1;padding:.4rem;border-radius:12px;background:#0c241a;touch-action:none;user-select:none}.g48-t{border-radius:8px;display:grid;place-items:center;font:800 clamp(1.1rem,6.5vw,1.7rem) var(--mono);background:rgba(255,255,255,.06);color:#14211c;min-width:0}.g48-t.n4,.g48-t.n8,.g48-t.n16,.g48-t.n32,.g48-t.n64,.g48-t.n128,.g48-t.n256,.g48-t.n512,.g48-t.n1024,.g48-t.n2048{color:#14211c}.g48-t.n2{background:#e9efe9}.g48-t.n4{background:#d7e6c9}.g48-t.n8{background:#f4b66b}.g48-t.n16{background:#f08a3c}.g48-t.n32{background:#ef6a4f}.g48-t.n64{background:#e0453a;color:#fff}.g48-t.n128{background:#f6dc8f;font-size:clamp(1rem,5.5vw,1.45rem)}.g48-t.n256{background:#f2cf5f;font-size:clamp(1rem,5.5vw,1.45rem)}.g48-t.n512{background:#e8bd3a;font-size:clamp(1rem,5.5vw,1.45rem)}.g48-t.n1024{background:#6fd08c;font-size:clamp(.85rem,4.6vw,1.2rem)}.g48-t.n2048{background:#3fae6a;color:#fff;font-size:clamp(.85rem,4.6vw,1.2rem)}.g48-t.big{background:#2f5d49;color:#fff;font-size:clamp(.8rem,4vw,1.1rem)}@keyframes g48pop{from{transform:scale(.4)}to{transform:none}}@keyframes g48mg{50%{transform:scale(1.18)}}.g48-t.nw{animation:g48pop .18s}.g48-t.mg{animation:g48mg .18s}.g48-pad{display:grid;grid-template-columns:repeat(3,4.2rem);gap:.3rem}.g48-pad .btn{padding:.7rem 0;min-width:0}</style>';
  FULL['2048'] = {
    title: '2048: the full game',
    intro: 'Slide all tiles in one direction. When two tiles with the same number collide, they merge into one with double the value. A new tile appears after every move. Make a 2048 tile to win. If the board is full and nothing can merge, you lose. Use arrow keys or WASD, swipe on the board, or the buttons.',
    make: (A) => {
      let g, score, best = 0, fresh, merged, over, won;
      const empty = () => g.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      const spawn = () => { const e = empty(); if (!e.length) return; const i = pickOne(e); g[i] = Math.random() < 0.9 ? 2 : 4; fresh.add(i); };
      const canMove = () => { if (empty().length) return true; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const v = g[r * 4 + c]; if ((c < 3 && g[r * 4 + c + 1] === v) || (r < 3 && g[(r + 1) * 4 + c] === v)) return true; } return false; };
      const idx = (d, l, k) => (d === 'left' ? l * 4 + k : d === 'right' ? l * 4 + 3 - k : d === 'up' ? k * 4 + l : (3 - k) * 4 + l);
      const slide = (d) => {
        const ng = Array(16).fill(0); let moved = false, gain = 0; merged = new Set(); fresh = new Set();
        for (let l = 0; l < 4; l++) {
          const line = []; for (let k = 0; k < 4; k++) { const v = g[idx(d, l, k)]; if (v) line.push(v); }
          const out = []; const mg = [];
          for (let k = 0; k < line.length; k++) { if (line[k] === line[k + 1]) { out.push(line[k] * 2); mg.push(out.length - 1); gain += line[k] * 2; k++; } else out.push(line[k]); }
          for (let k = 0; k < 4; k++) { ng[idx(d, l, k)] = out[k] || 0; if (mg.includes(k)) merged.add(idx(d, l, k)); }
        }
        for (let i = 0; i < 16; i++) if (ng[i] !== g[i]) moved = true;
        return { ng, moved, gain };
      };
      const draw = () => {
        const tiles = g.map((v, i) => `<div class="g48-t ${v ? (v > 2048 ? 'big' : 'n' + v) : ''}${fresh.has(i) ? ' nw' : merged.has(i) ? ' mg' : ''}" ${v ? '' : 'aria-hidden="true"'}>${v || ''}</div>`).join('');
        const b = (d, t) => `<button type="button" class="btn big" data-act="move" data-v="${d}" aria-label="Slide ${d}" ${over ? 'disabled' : ''}>${t}</button>`;
        A.draw(`${G_CSS}<div class="arc-scene" style="width:100%"><div class="arc-top"><span class="chip">Score <b>${score}</b></span><span class="chip">Best <b>${best}</b></span><span class="chip">Top tile <b>${Math.max(...g)}</b></span></div>
          <div class="g48-b" id="g48-b" role="img" aria-label="Board: ${g.map((v) => v || 'empty').join(', ')}">${tiles}</div>
          <div class="g48-pad"><span></span>${b('up', '&uarr;')}<span></span>${b('left', '&larr;')}${b('down', '&darr;')}${b('right', '&rarr;')}</div></div>`);
        const el = document.getElementById('g48-b');
        if (el) {
          let sx = 0, sy = 0;
          el.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
          el.addEventListener('pointerup', (e) => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); });
        }
      };
      const move = (d) => {
        if (over) return;
        const r = slide(d); if (!r.moved) { merged = new Set(); fresh = new Set(); return; }
        g = r.ng; score += r.gain; if (score > best) best = score; spawn();
        if (r.gain) A.sfx('tick');
        if (!won && g.includes(2048)) { won = true; over = true; draw(); A.end(true, `You made 2048! Final score ${score}.`); return; }
        if (!canMove()) { over = true; draw(); A.end(false, `No moves left. Final score ${score}. Highest tile ${Math.max(...g)}.`); return; }
        draw();
      };
      const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
      return {
        start() {
          g = Array(16).fill(0); score = 0; over = false; won = false; merged = new Set(); fresh = new Set(); spawn(); spawn(); draw();
          A.key((e) => { if (e.ctrlKey || e.metaKey || e.altKey) return; const d = KEYS[e.key]; if (d) { e.preventDefault(); move(d); } });
        },
        act(a, v) { if (a === 'move') move(v); },
      };
    },
  };
})();

/* --- go-fish.js --- */
(() => {
  /* Go Fish against the computer. Seven cards each. Ask for a rank you hold. If they have it they hand over every copy and you ask again. If not, go fish. Collect four of a rank to make a book. Most books wins. */
  const SUITN = ['spades', 'hearts', 'diamonds', 'clubs'];
  const RN = { 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' };
  const nm = (r) => RN[r] || String(r);
  const pl = (r) => (r === 6 ? 'Sixes' : r === 1 ? 'Aces' : nm(r) + 's');
  const STYLE = `<style>
.gf-top{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;font:600 .8rem var(--mono)}
.gf-top span{padding:.25rem .6rem;border:1px solid var(--line);border-radius:999px;background:rgba(0,0,0,.25)}
.gf-hand{display:flex;gap:.2rem;justify-content:center;flex-wrap:wrap;max-width:100%}
.gf-hand .pcard{width:2.4rem;height:3.4rem;font-size:.9rem}
.gf-hand .pcard span{font-size:.8rem}
.gf-hand .pslot i,.gf-hand .pslot small{display:none}
.gf-lab{font:700 .85rem var(--mono);color:var(--brass-hi);margin:0}
.gf-books{font:.8rem var(--mono);margin:0;text-align:center}
.gf-log{margin:0;padding:0;list-style:none;font:.78rem var(--mono);color:#cfe6d8;text-align:center;min-height:3.4rem}
.gf-ask.sel{outline:3px solid var(--brass-hi)}
</style>`;
  FULL['Go Fish'] = {
    title: 'Go Fish: the full game',
    intro: 'Seven cards each. On your turn, pick a rank you already hold and ask the bot for it. If the bot has any, it gives you all of them and you ask again. If not, you go fish from the pile. If you fish the rank you asked for, you go again. Four of a rank make a book. The player with the most books when all 13 are made wins.',
    make: (A) => {
      let pile, mine, theirs, myBooks, botBooks, turn, log, busy, asked, over;
      const mk = () => { const d = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ r, s }); for (let i = 51; i > 0; i--) { const j = rnd(i + 1); [d[i], d[j]] = [d[j], d[i]]; } return d; };
      const sortH = () => { const f = (a, b) => a.r - b.r || a.s - b.s; mine.sort(f); theirs.sort(f); };
      const say = (t) => { log = [...log, t].slice(-4); };
      const ch = (c) => pokerCardHtml(c.r === 1 ? 14 : c.r, c.s, '', '', undefined);
      const count = (h, r) => h.filter((c) => c.r === r).length;
      const bookCheck = (h, books, who) => {
        for (let r = 1; r <= 13; r++) if (count(h, r) === 4) { for (let i = h.length - 1; i >= 0; i--) if (h[i].r === r) h.splice(i, 1); books.push(r); say(`${who} made a book of ${pl(r)}.`); A.sfx('good'); }
      };
      const draw = () => {
        const ranks = [...new Set(mine.map((c) => c.r))];
        const can = turn === 'you' && !busy && !over;
        A.draw(`${STYLE}<div class="arc-scene">
          <div class="gf-top"><span>Your books ${myBooks.length}</span><span>Bot books ${botBooks.length}</span><span>Pile ${pile.length}</span><span>Bot cards ${theirs.length}</span></div>
          <p class="gf-books">Bot books: ${botBooks.map(pl).join(', ') || 'none'}</p>
          <ul class="gf-log" aria-live="polite">${log.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
          <p class="gf-lab">Your hand${can ? ': tap a rank to ask for it' : ''}</p>
          <div class="gf-hand" aria-label="Your hand">${mine.map(ch).join('') || '<span class="muted">No cards</span>'}</div>
          <div class="arc-opts" role="group" aria-label="Ask for a rank">${ranks.map((r) => `<button type="button" class="btn small gf-ask" data-act="ask" data-v="${r}" ${can ? '' : 'disabled'} aria-label="Ask for ${pl(r)}, you hold ${count(mine, r)}">${nm(r)} x${count(mine, r)}</button>`).join('')}</div>
          <p class="gf-books">Your books: ${myBooks.map(pl).join(', ') || 'none'}</p>
          <p class="arc-ask">${over ? '' : turn === 'you' ? (busy ? '...' : mine.length ? 'Your turn. Ask the bot for a rank.' : 'You have no cards.') : 'Bot is taking its turn...'}</p></div>`);
      };
      const finish = () => {
        over = true; draw();
        const a = myBooks.length, b = botBooks.length;
        if (a > b) A.end(true, `All books are made. You win ${a} to ${b}!`); else A.end(false, `All books are made. The bot wins ${b} to ${a}.`);
      };
      const allDone = () => myBooks.length + botBooks.length >= 13;
      const refill = (h) => { if (!h.length) for (let i = 0; i < 5 && pile.length; i++) h.push(pile.pop()); };
      /* start of a turn: handle empty hands and end of game */
      const begin = (who) => {
        turn = who; busy = false;
        if (allDone()) return finish();
        const h = who === 'you' ? mine : theirs;
        if (!h.length) {
          if (!pile.length) { say(`${who === 'you' ? 'You have' : 'The bot has'} no cards and the pile is empty. Turn passes.`); return begin(who === 'you' ? 'bot' : 'you'); }
          refill(h); say(`${who === 'you' ? 'You draw' : 'The bot draws'} new cards from the pile.`); const b = who === 'you' ? myBooks : botBooks; bookCheck(h, b, who === 'you' ? 'You' : 'The bot'); sortH();
          if (allDone()) return finish();
        }
        draw();
        if (who === 'bot') A.after(botTurn, 1000);
      };
      const botPick = () => {
        const ranks = [...new Set(theirs.map((c) => c.r))];
        const hinted = ranks.filter((r) => asked.has(r));
        if (hinted.length && Math.random() < 0.85) return pickOne(hinted);
        const multi = ranks.filter((r) => count(theirs, r) >= 2);
        if (multi.length && Math.random() < 0.6) return pickOne(multi);
        return pickOne(ranks);
      };
      const botTurn = () => {
        if (over) return;
        if (!theirs.length) return begin('bot');
        const r = botPick();
        say(`Bot: do you have any ${pl(r)}?`);
        const got = mine.filter((c) => c.r === r);
        if (got.length) {
          mine = mine.filter((c) => c.r !== r); theirs.push(...got); say(`You give the bot ${got.length} ${got.length > 1 ? pl(r) : nm(r)}.`); A.sfx('bad');
          bookCheck(theirs, botBooks, 'The bot'); sortH(); asked.delete(r);
          draw(); A.after(() => begin('bot'), 1000);
        } else {
          say('You say: Go fish!');
          if (pile.length) {
            const c = pile.pop(); theirs.push(c); bookCheck(theirs, botBooks, 'The bot'); sortH();
            if (c.r === r) { say('The bot fished its wish and goes again.'); draw(); A.after(() => begin('bot'), 1000); return; }
          }
          draw(); A.after(() => begin('you'), 900);
        }
      };
      const ask = (r) => {
        busy = true; asked.add(r); say(`You: do you have any ${pl(r)}?`);
        const got = theirs.filter((c) => c.r === r);
        if (got.length) {
          theirs = theirs.filter((c) => c.r !== r); mine.push(...got); say(`The bot gives you ${got.length} ${got.length > 1 ? pl(r) : nm(r)}.`); A.sfx('good');
          bookCheck(mine, myBooks, 'You'); sortH(); draw(); A.after(() => begin('you'), 800);
        } else {
          say('The bot says: Go fish!');
          if (pile.length) {
            const c = pile.pop(); mine.push(c); say(`You fish a ${nm(c.r)} of ${SUITN[c.s]}.`); bookCheck(mine, myBooks, 'You'); sortH();
            if (c.r === r) { say('That is the rank you asked for. Go again!'); draw(); A.after(() => begin('you'), 900); return; }
          } else say('The pile is empty.');
          draw(); A.after(() => begin('bot'), 900);
        }
      };
      return {
        start() {
          pile = mk(); mine = pile.splice(0, 7); theirs = pile.splice(0, 7); myBooks = []; botBooks = []; log = ['Cards are dealt.']; asked = new Set(); over = false; busy = false;
          bookCheck(mine, myBooks, 'You'); bookCheck(theirs, botBooks, 'The bot'); sortH();
          begin('you');
        },
        act(a, v) {
          if (a === 'ask' && turn === 'you' && !busy && !over) { const r = Number(v); if (mine.some((c) => c.r === r)) ask(r); }
        },
      };
    },
  };
})();

