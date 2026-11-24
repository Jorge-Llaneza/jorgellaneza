/* --- pong.js --- */
(() => {
  /* Pong: you (left) against a CPU paddle (right). First to 7. The ball speeds up with every hit. */
  FULL['Pong'] = {
    title: 'Pong: the full game',
    intro: 'You are the left paddle. First to 7 points wins. The ball gets faster with every hit. Move with the mouse or a finger on the court, W and S, the arrow keys, or the buttons. P pauses.',
    make: (A) => {
      const W = 480, H = 320, PW = 8, PH = 58, R = 6, WIN = 7, PX = 16;
      const DBG = window.__fullDebug || {};
      let cv, cx, S, held, last, stopUp;
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const $ = (id) => document.getElementById(id);
      const say = (t) => { const e = $('pg-live'); if (e) e.textContent = t; };
      const serve = (dir) => {
        S.ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, sp: 270 };
        S.serveDir = dir; S.serveT = 0.9; S.rally = 0; S.err = (Math.random() - 0.5) * PH * 0.8;
      };
      const launch = () => {
        const a = (Math.random() - 0.5) * 0.9; const b = S.ball;
        b.vx = S.serveDir * b.sp * Math.cos(a); b.vy = b.sp * Math.sin(a);
      };
      const predict = () => {
        const b = S.ball; if (b.vx <= 0) return H / 2 + S.err * 0.5;
        const t = (W - PX - PW - b.x) / b.vx; let y = b.y + b.vy * t;
        const m = ((y % (2 * H)) + 2 * H) % (2 * H); y = m > H ? 2 * H - m : m;
        return y + S.err;
      };
      const update = (dt) => {
        const dir = (held.up ? -1 : 0) + (held.down ? 1 : 0);
        if (dir) { S.py += dir * 400 * dt; S.tgt = null; } else if (S.tgt != null) { S.py += clamp(S.tgt - S.py, -900 * dt, 900 * dt); }
        S.py = clamp(S.py, PH / 2, H - PH / 2);
        const cs = Math.min(340, 215 + 14 * S.you + (S.ball.sp - 270) * 0.25);
        S.cy += clamp(predict() - S.cy, -cs * dt, cs * dt); S.cy = clamp(S.cy, PH / 2, H - PH / 2);
        const b = S.ball;
        if (S.serveT > 0) { S.serveT -= dt; if (S.serveT <= 0) launch(); return; }
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy); } else if (b.y > H - R) { b.y = H - R; b.vy = -Math.abs(b.vy); }
        const hit = (py, left) => {
          const rel = clamp((b.y - py) / (PH / 2 + R), -1, 1);
          b.sp = Math.min(620, b.sp * 1.06); const ang = rel * 1.0;
          b.vx = (left ? 1 : -1) * b.sp * Math.cos(ang); b.vy = b.sp * Math.sin(ang);
          S.rally++; A.sfx('tick'); if (!left) S.err = (Math.random() - 0.5) * PH * Math.max(0.3, 1 - b.sp / 700) * 1.3;
        };
        if (b.vx < 0 && b.x - R <= PX + PW && b.x + R >= PX && Math.abs(b.y - S.py) <= PH / 2 + R) { b.x = PX + PW + R; hit(S.py, true); }
        else if (b.vx > 0 && b.x + R >= W - PX - PW && b.x - R <= W - PX && Math.abs(b.y - S.cy) <= PH / 2 + R) { b.x = W - PX - PW - R; hit(S.cy, false); }
        if (b.x < -R) point(false); else if (b.x > W + R) point(true);
      };
      const point = (you) => {
        if (you) S.you++; else S.cpu++;
        say(`${you ? 'You score' : 'CPU scores'}. You ${S.you}, CPU ${S.cpu}.`);
        A.sfx(you ? 'good' : 'bad');
        if (S.you >= WIN || S.cpu >= WIN) { S.over = true; render(); if (S.you >= WIN) A.end(true, `You win ${S.you} to ${S.cpu}!`); else A.end(false, `CPU wins ${S.cpu} to ${S.you}. Try again.`); return; }
        serve(you ? 1 : -1);
      };
      const render = () => {
        cx.fillStyle = '#06160f'; cx.fillRect(0, 0, W, H);
        cx.fillStyle = 'rgba(244,242,234,0.25)'; for (let y = 6; y < H; y += 20) cx.fillRect(W / 2 - 2, y, 4, 10);
        cx.font = '700 44px ui-monospace, monospace'; cx.textAlign = 'center'; cx.fillStyle = 'rgba(244,242,234,0.5)';
        cx.fillText(S.you, W / 2 - 70, 54); cx.fillText(S.cpu, W / 2 + 70, 54);
        cx.fillStyle = '#f6dc8f'; cx.fillRect(PX, S.py - PH / 2, PW, PH);
        cx.fillStyle = '#7fc8e8'; cx.fillRect(W - PX - PW, S.cy - PH / 2, PW, PH);
        cx.fillStyle = '#f4f2ea'; cx.beginPath(); cx.arc(S.ball.x, S.ball.y, R, 0, 7); cx.fill();
        cx.font = '700 20px ui-monospace, monospace'; cx.fillStyle = '#f4f2ea';
        const msg = S.state === 'ready' ? 'Press any key or tap Start' : S.paused ? 'Paused' : S.over ? (S.you >= WIN ? 'You win!' : 'CPU wins') : '';
        if (msg) { cx.fillStyle = 'rgba(0,0,0,0.55)'; cx.fillRect(0, H / 2 - 28, W, 50); cx.fillStyle = '#f6dc8f'; cx.fillText(msg, W / 2, H / 2 + 6); }
      };
      const begin = () => { if (S.state !== 'ready') return; S.state = 'play'; const g = $('pg-go'); if (g) g.hidden = true; serve(Math.random() < 0.5 ? 1 : -1); };
      const togglePause = () => { if (S.state === 'ready' || S.over) return; S.paused = !S.paused; const p = $('pg-pause'); if (p) p.textContent = S.paused ? 'Resume' : 'Pause'; };
      const keyUp = (fn) => { if (stopUp) stopUp(); const h = (e) => fn(e); window.addEventListener('keyup', h); stopUp = () => { window.removeEventListener('keyup', h); stopUp = null; }; (A.cl || []).push(stopUp); };
      const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
      return {
        start() {
          S = { state: 'ready', paused: false, over: false, you: 0, cpu: 0, py: H / 2, cy: H / 2, tgt: null, ball: null, serveT: 0, serveDir: 1, rally: 0, err: 0 };
          if (DBG) DBG.state = S;
          serve(1); S.serveT = 0; held = {};
          A.draw(`<div class="arc-scene" style="width:100%"><canvas id="pg-cv" width="${W}" height="${H}" role="img" aria-label="Pong court" style="width:min(100%,${W}px);height:auto;border-radius:10px;border:2px solid var(--line);display:block;touch-action:none"></canvas>
            <div class="arc-opts">${abtn('go', '', 'Start', 'primary')}${abtn('pause', '', 'Pause')}</div>
            <div class="arc-opts"><button type="button" class="btn big" data-hold="up" style="touch-action:none;user-select:none;-webkit-user-select:none;min-width:7rem">Up</button><button type="button" class="btn big" data-hold="down" style="touch-action:none;user-select:none;-webkit-user-select:none;min-width:7rem">Down</button></div>
            <p class="arc-fb" id="pg-live" aria-live="polite">First to ${WIN} wins.</p></div>`);
          cv = $('pg-cv'); cx = cv.getContext('2d');
          const ptr = (e) => { const r = cv.getBoundingClientRect(); S.tgt = (e.clientY - r.top) * (H / r.height); };
          cv.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) ptr(e); });
          cv.addEventListener('pointerdown', (e) => { ptr(e); begin(); });
          document.querySelectorAll('[data-hold]').forEach((b) => {
            const off = () => { held[b.dataset.hold] = 0; };
            b.addEventListener('pointerdown', (e) => { e.preventDefault(); held[b.dataset.hold] = 1; begin(); });
            ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => b.addEventListener(n, off));
            b.addEventListener('contextmenu', (e) => e.preventDefault());
          });
          A.key((e) => {
            const d = keyMap[e.key];
            if (d) { e.preventDefault(); held[d] = 1; begin(); return; }
            if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
            if (e.key === ' ') { e.preventDefault(); if (S.state === 'ready') begin(); else togglePause(); return; }
            begin();
          });
          keyUp((e) => { const d = keyMap[e.key]; if (d) held[d] = 0; });
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

/* --- property-board.js --- */
(() => {
  /* Property Board: a Monopoly-style loop. Roll, move, buy properties, pay rent (double with a full colour set), pass Go for 200, avoid jail and tax. Bankrupt both bots or be richest after 25 rounds. */
  const T = [
    { n: 'Go', t: 'go' }, { n: 'Mill Lane', t: 'p', g: 0, p: 60, r: 6 }, { n: 'Chance', t: 'ch' }, { n: 'Dock Road', t: 'p', g: 0, p: 80, r: 8 }, { n: 'Income Tax', t: 'tax', a: 100 },
    { n: 'Park Row', t: 'p', g: 1, p: 120, r: 12 }, { n: 'Jail (visiting)', t: 'visit' }, { n: 'Rose Street', t: 'p', g: 1, p: 140, r: 14 }, { n: 'Chance', t: 'ch' }, { n: 'Hill Avenue', t: 'p', g: 1, p: 160, r: 16 },
    { n: 'Free Parking', t: 'free' }, { n: 'Station Way', t: 'p', g: 2, p: 180, r: 18 }, { n: 'Market Square', t: 'p', g: 2, p: 200, r: 20 }, { n: 'Chance', t: 'ch' }, { n: 'Bay View', t: 'p', g: 2, p: 220, r: 22 },
    { n: 'Go To Jail', t: 'gj' }, { n: 'King Street', t: 'p', g: 3, p: 260, r: 26 }, { n: 'Luxury Tax', t: 'tax', a: 75 }, { n: 'Queen Street', t: 'p', g: 3, p: 280, r: 28 }, { n: 'Chance', t: 'ch' }, { n: 'Crown Plaza', t: 'p', g: 3, p: 320, r: 32 },
  ];
  const GROUPS = [0, 1, 2, 3].map((g) => T.map((x, i) => (x.g === g ? i : -1)).filter((i) => i >= 0));
  const GN = ['brown', 'green', 'orange', 'blue'], GC = ['#8b5a2b', '#2e8b57', '#d9822b', '#2a6fb0'], PC = ['#d4a017', '#c0392b', '#2a6fb0', '#7d3c98'];
  const CHANCE = [['Bank pays you 100.', 100], ['Pay a 50 repair bill.', -50], ['Advance to Go and collect 200.', 'go'], ['Birthday! Collect 30.', 30], ['Doctor fee, pay 60.', -60], ['Go to jail.', 'jail']];
  FULL['Property Board'] = {
    title: 'Property Board: the full game',
    intro: 'Roll and move around the loop. Buy properties you land on. Others pay you rent, and owning a whole colour doubles it. Pass Go for 200. Bankrupt both bots, or be the richest after 25 rounds.',
    make: (A) => {
      let pl, cur, round, owner, fb, phase, dice;
      const names = ['You', 'Ava', 'Ben'];
      const worth = (i) => pl[i].cash + owner.reduce((s, o, k) => s + (o === i ? T[k].p : 0), 0);
      const full = (k) => GROUPS[T[k].g].every((x) => owner[x] === owner[k]);
      const draw = () => A.draw(`<div class="arc-scene"><div class="arc-top"><span>Round <b>${Math.min(round, 25)}</b>/25</span>${pl.map((p, i) => `<span style="color:${PC[i]}">${names[i]} <b>${p.out ? 'out' : '$' + p.cash}</b></span>`).join('')}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">${T.map((t, i) => `<div title="${t.n}" aria-label="${t.n}${owner[i] != null && owner[i] >= 0 ? ', owned by ' + names[owner[i]] : ''}" style="border:2px solid ${owner[i] >= 0 ? PC[owner[i]] : 'var(--line)'};border-top:5px solid ${t.t === 'p' ? GC[t.g] : 'var(--line)'};min-height:46px;padding:1px;font:10px var(--mono);text-align:center;position:relative">${t.n.split(' ')[0]}<br>${t.p ? '$' + t.p : ''}<div>${pl.map((p, k) => (!p.out && p.pos === i ? `<i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${PC[k]}"></i>` : '')).join('')}</div></div>`).join('')}</div>
        <p class="arc-ask">${phase === 'roll' ? (cur === 0 ? 'Your turn. Roll the dice.' : names[cur] + ' is playing...') : phase === 'buy' ? `Buy ${T[pl[0].pos].n} for $${T[pl[0].pos].p}? Rent would be $${T[pl[0].pos].r}.` : ''}</p>
        <div class="arc-opts">${phase === 'roll' ? abtn('roll', '', 'Roll dice', 'primary', cur !== 0) : phase === 'buy' ? abtn('buy', '', 'Buy', 'primary') + abtn('skip', '', 'Skip') : ''}</div><p class="arc-fb">${fb}</p></div>`);
      const alive = () => pl.map((p, i) => i).filter((i) => !pl[i].out);
      const broke = (i, creditor) => { if (pl[i].cash >= 0) return; const p = pl[i]; p.out = true; fb += ` ${names[i]} is bankrupt!`; owner.forEach((o, k) => { if (o === i) owner[k] = creditor != null && creditor !== i ? creditor : -1; }); if (creditor != null && creditor !== i && creditor >= 0) pl[creditor].cash += Math.max(0, p.cash + 0); p.cash = 0; };
      const over = () => {
        if (pl[0].out) { draw(); A.end(false, 'You went bankrupt.'); return true; }
        if (alive().length === 1) { draw(); A.end(true, 'Both bots are bankrupt. You win!'); return true; }
        if (round > 25) { const best = alive().sort((a, b) => worth(b) - worth(a))[0]; draw(); A.end(best === 0, best === 0 ? `Round limit. You are richest with $${worth(0)}. You win!` : `Round limit. ${names[best]} is richest with $${worth(best)}.`); return true; }
        return false;
      };
      const land = (i) => {
        const p = pl[i], t = T[p.pos];
        if (t.t === 'p') {
          if (owner[p.pos] === -1) { if (i === 0) { phase = 'buy'; draw(); return 'wait'; } if (p.cash >= t.p + 150) { p.cash -= t.p; owner[p.pos] = i; fb += ` ${names[i]} buys ${t.n}.`; } }
          else if (owner[p.pos] !== i) { const rent = t.r * (full(p.pos) ? 2 : 1); p.cash -= rent; pl[owner[p.pos]].cash += rent; fb += ` ${names[i]} pays $${rent} rent to ${names[owner[p.pos]]}.`; broke(i, owner[p.pos]); }
        } else if (t.t === 'tax') { p.cash -= t.a; fb += ` ${names[i]} pays $${t.a} tax.`; broke(i, -1); }
        else if (t.t === 'gj') { p.pos = 6; p.jail = 1; fb += ` ${names[i]} goes to jail and misses a turn.`; }
        else if (t.t === 'ch') { const [txt, e] = pick(CHANCE); fb += ` Chance: ${txt}`; if (e === 'go') { p.pos = 0; p.cash += 200; } else if (e === 'jail') { p.pos = 6; p.jail = 1; } else { p.cash += e; broke(i, -1); } }
        return 'ok';
      };
      const pick = (a) => a[rnd(a.length)];
      const endTurn = () => {
        if (over()) return;
        do { cur = (cur + 1) % 3; if (cur === 0) round++; } while (pl[cur].out);
        if (over()) return;
        phase = 'roll'; if (cur === 0) draw(); else A.after(turn, 900);
        if (cur === 0) draw();
      };
      const turn = () => {
        const i = cur, p = pl[i]; fb = '';
        if (p.jail) { p.jail = 0; fb = `${names[i]} sits out a turn in jail.`; draw(); return A.after(endTurn, 700); }
        const d1 = 1 + rnd(6), d2 = 1 + rnd(6), np = p.pos + d1 + d2; fb = `${names[i]} rolls ${d1} + ${d2}.`;
        if (np >= T.length) { p.cash += 200; fb += ` ${names[i]} passes Go, +$200.`; }
        p.pos = np % T.length; const r = land(i); if (r === 'wait') return; draw(); A.after(endTurn, 900);
      };
      return {
        start() { pl = [0, 1, 2].map(() => ({ cash: 1000, pos: 0, jail: 0, out: false })); owner = T.map(() => -1); cur = 0; round = 1; phase = 'roll'; fb = 'Everyone starts with $1000.'; draw(); },
        act(a) {
          if (a === 'roll' && cur === 0 && phase === 'roll') turn();
          else if (a === 'buy' && phase === 'buy') { const t = T[pl[0].pos]; if (pl[0].cash >= t.p) { pl[0].cash -= t.p; owner[pl[0].pos] = 0; fb += ` You bought ${t.n}.`; } else fb += ' Not enough cash.'; phase = 'roll'; draw(); A.after(endTurn, 700); }
          else if (a === 'skip' && phase === 'buy') { fb += ' You skip buying.'; phase = 'roll'; draw(); A.after(endTurn, 700); }
        },
      };
    },
  };
})();

/* --- rps.js --- */
(() => {
  /* Rock Paper Scissors: best of 5 against a bot that learns which move you tend to play after each move. Optional Lizard and Spock. */
  const BEATS3 = { Rock: ['Scissors'], Paper: ['Rock'], Scissors: ['Paper'] };
  const BEATS5 = { Rock: ['Scissors', 'Lizard'], Paper: ['Rock', 'Spock'], Scissors: ['Paper', 'Lizard'], Lizard: ['Paper', 'Spock'], Spock: ['Rock', 'Scissors'] };
  const KEYS = { r: 'Rock', p: 'Paper', s: 'Scissors', l: 'Lizard', k: 'Spock' };
  FULL['Rock Paper Scissors'] = {
    title: 'Rock Paper Scissors: the full match',
    intro: 'Best of 5: first to 3 round wins takes the match. Ties do not count. The bot studies your habits, so do not be predictable. You can switch on Lizard and Spock before the first round.',
    make: (A) => {
      let big = false, you, bot, rounds, hist, trans, last, fb, log, busy;
      const rules = () => (big ? BEATS5 : BEATS3);
      const moves = () => Object.keys(rules());
      const counters = (m) => moves().filter((x) => rules()[x].includes(m));
      const botPick = () => {
        let predicted = null;
        const row = last && trans[last];
        if (row && Object.keys(row).length) predicted = Object.keys(row).sort((a, b) => row[b] - row[a])[0];
        else if (hist.length) { const c = {}; hist.forEach((m) => { c[m] = (c[m] || 0) + 1; }); predicted = Object.keys(c).sort((a, b) => c[b] - c[a])[0]; }
        if (predicted && Math.random() < 0.5) return pickOne(counters(predicted));
        return pickOne(moves());
      };
      const draw = () => A.draw(`<div class="arc-scene">
        <div class="arc-top"><span class="chip">You ${you}</span><span class="chip">Bot ${bot}</span><span class="chip">Round ${Math.min(rounds + 1, 99)}</span><span class="chip">First to 3</span></div>
        <p class="arc-ask">${busy ? 'Match over.' : 'Choose your move.'}</p>
        <div class="arc-opts">${moves().map((m) => abtn('throw', m, `${m} <small>(${Object.keys(KEYS).find((k) => KEYS[k] === m)})</small>`, 'primary', busy)).join('')}</div>
        <div class="arc-opts">${abtn('mode', '', big ? 'Lizard and Spock: ON' : 'Lizard and Spock: OFF', 'ghost small', rounds > 0 || busy)}</div>
        <p class="arc-fb">${fb}</p>
        <ul class="arc-log">${log.slice(0, 5).map((l) => `<li>${l}</li>`).join('')}</ul>
        <p class="muted">${big ? 'Rock beats Scissors and Lizard. Paper beats Rock and Spock. Scissors beat Paper and Lizard. Lizard beats Paper and Spock. Spock beats Rock and Scissors.' : 'Rock beats Scissors. Scissors beat Paper. Paper beats Rock.'}</p></div>`);
      const play = (m) => {
        if (busy || !moves().includes(m)) return;
        const b = botPick();
        if (last) { trans[last] = trans[last] || {}; trans[last][m] = (trans[last][m] || 0) + 1; }
        hist.push(m); last = m; rounds++;
        let res;
        if (m === b) { res = 'tie'; fb = `<span>Both played ${m}. Tie, play again.</span>`; A.sfx('tick'); }
        else if (rules()[m].includes(b)) { res = 'win'; you++; fb = `<span class="good">${m} beats ${b}. You win the round.</span>`; A.sfx('good'); }
        else { res = 'lose'; bot++; fb = `<span class="bad">${b} beats ${m}. Bot wins the round.</span>`; A.sfx('bad'); }
        log.unshift(`<b>R${rounds}</b> you ${m}, bot ${b}: ${res}`);
        if (you >= 3 || bot >= 3) { busy = true; draw(); A.end(you >= 3, you >= 3 ? `You won the match ${you} to ${bot}!` : `The bot won the match ${bot} to ${you}. Try again.`); return; }
        draw();
      };
      return {
        start() {
          you = 0; bot = 0; rounds = 0; hist = []; trans = {}; last = null; log = []; busy = false; fb = 'Best of 5. Good luck.';
          draw();
          A.key((e) => { const m = KEYS[e.key.toLowerCase()]; if (m) play(m); });
        },
        act(a, v) {
          if (a === 'throw') play(v);
          else if (a === 'mode' && rounds === 0) { big = !big; draw(); }
        },
      };
    },
  };
})();

/* --- russian-roulette.js --- */
(() => {
  /* Toy water revolver. 6 chambers, one holds water. Each round it is loaded and spun. Players take turns to pull the trigger on themselves (a squirt = soaked = out) or pass (2 passes each). Last player dry wins. */
  FULL['Russian Roulette'] = {
    title: 'Water Revolver: the full game',
    intro: 'A toy revolver with 6 chambers and one squirt of water. Each round it is loaded and spun. On your turn pull the trigger or pass the toy (you have 2 passes). Whoever gets squirted is out. Be the last dry player. Watch the odds: every empty click makes the next one riskier.',
    make: (A) => {
      let players, turn, fired, hot, round, fb, busy;
      const NAMES = ['You', 'Ava', 'Ben', 'Cy'];
      const alive = () => players.filter((p) => p.in);
      const nextIdx = (i) => { let k = i; do { k = (k + 1) % players.length; } while (!players[k].in); return k; };
      const risk = () => 1 / (6 - fired);
      const load = () => { hot = 1 + rnd(6); fired = 0; round++; };
      const draw = () => A.draw(`<style>.rr-p{display:grid;gap:.1rem;padding:.4rem .6rem;border:1px solid var(--line);border-radius:10px;text-align:center;min-width:4.6rem;font:600 .8rem var(--mono)}.rr-p.on{border-color:var(--brass-hi);box-shadow:0 0 0 2px var(--brass-hi)}.rr-p.out{opacity:.4;text-decoration:line-through}</style>
        <div class="arc-scene">
        <div class="arc-row">${players.map((p, i) => `<div class="rr-p${i === turn && !busy ? ' on' : ''}${p.in ? '' : ' out'}"><b>${NAMES[i]}</b><span>${p.in ? 'dry' : 'soaked'}</span><span>passes ${p.passes}</span></div>`).join('')}</div>
        <div class="arc-row" aria-label="Chambers">${[1, 2, 3, 4, 5, 6].map((k) => `<span class="arc-chamber${k <= fired ? ' start' : ''}">${k <= fired ? '✓' : '?'}</span>`).join('')}</div>
        <p class="arc-ask">Round ${round}. Empty clicks so far: ${fired}. Chance the next pull squirts: 1 in ${6 - fired}.</p>
        <p class="arc-ask">${busy ? '' : turn === 0 ? 'Your turn.' : NAMES[turn] + ' is thinking...'}</p>
        <div class="arc-opts">${abtn('pull', '', 'Pull the trigger', 'primary', busy || turn !== 0)}${abtn('pass', '', 'Pass the toy', '', busy || turn !== 0 || players[0].passes < 1)}</div>
        <p class="arc-fb">${fb}</p></div>`);
      const finishCheck = () => {
        if (!players[0].in) { draw(); A.end(false, 'You got soaked. Better luck next time!'); return true; }
        if (alive().length === 1) { draw(); A.end(true, 'You are the last one dry. You win!'); return true; }
        return false;
      };
      const advance = () => { turn = nextIdx(turn); draw(); if (turn !== 0) A.after(botTurn, 900); };
      const doPull = () => {
        fired++;
        if (fired === hot) {
          players[turn].in = false; fb = `<span class="${turn === 0 ? 'bad' : 'good'}">Squirt! ${NAMES[turn]} is soaked and out.</span>`; A.sfx(turn === 0 ? 'bad' : 'good');
          if (finishCheck()) return;
          const who = turn; load(); turn = nextIdx(who); fb += ' New round: the toy is reloaded and spun.'; draw(); if (turn !== 0) A.after(botTurn, 900); return;
        }
        fb = `Click. ${NAMES[turn]} is safe.`; A.sfx('tick'); advance();
      };
      const doPass = () => { players[turn].passes--; fb = `${NAMES[turn]} passes the toy.`; advance(); };
      const botTurn = () => {
        if (busy || turn === 0) return;
        const p = players[turn];
        const passIt = p.passes > 0 && (risk() >= 1 / 3 ? Math.random() < 0.85 : risk() >= 1 / 5 && Math.random() < 0.25);
        if (passIt) doPass(); else doPull();
      };
      return {
        start() {
          players = [0, 1, 2, 3].map(() => ({ in: true, passes: 2 })); turn = rnd(4); fired = 0; round = 0; busy = false; fb = 'The toy is loaded and spun.'; load();
          draw(); if (turn !== 0) A.after(botTurn, 900);
          A.key((e) => { if (e.key === 'Enter' || e.key.toLowerCase() === 'p') this.act('pull'); });
        },
        act(a) {
          if (turn !== 0 || busy) return;
          if (a === 'pull') doPull();
          else if (a === 'pass' && players[0].passes > 0) doPass();
        },
      };
    },
  };
})();

