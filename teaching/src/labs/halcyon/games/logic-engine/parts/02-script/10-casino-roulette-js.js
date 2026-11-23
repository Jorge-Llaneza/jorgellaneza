/* --- casino-roulette.js --- */
(() => {
  /* European roulette: 0-36, one zero. Straight 35:1, dozens 2:1, even-money bets 1:1. Reach the target bankroll to win, hit zero chips to lose. */
  const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const colourOf = (n) => (n === 0 ? 'green' : RED.has(n) ? 'red' : 'black');
  const BETS = {
    red: { label: 'Red', pay: 1, win: (n) => n > 0 && RED.has(n) },
    black: { label: 'Black', pay: 1, win: (n) => n > 0 && !RED.has(n) },
    odd: { label: 'Odd', pay: 1, win: (n) => n > 0 && n % 2 === 1 },
    even: { label: 'Even', pay: 1, win: (n) => n > 0 && n % 2 === 0 },
    low: { label: '1-18', pay: 1, win: (n) => n >= 1 && n <= 18 },
    high: { label: '19-36', pay: 1, win: (n) => n >= 19 },
    d1: { label: '1st 12', pay: 2, win: (n) => n >= 1 && n <= 12 },
    d2: { label: '2nd 12', pay: 2, win: (n) => n >= 13 && n <= 24 },
    d3: { label: '3rd 12', pay: 2, win: (n) => n >= 25 },
  };
  const info = (k) => (k[0] === 'n' ? { label: 'Number ' + k.slice(1), pay: 35, win: (n) => n === Number(k.slice(1)) } : BETS[k]);
  const START = 100, TARGET = 250, CHIPS = [1, 5, 10, 25];
  const STYLE = `<style>
.rl-top{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;font:600 .8rem var(--mono)}
.rl-top span{padding:.25rem .6rem;border:1px solid var(--line);border-radius:999px;background:rgba(0,0,0,.25)}
.rl-ball{display:grid;place-items:center;width:4.2rem;height:4.2rem;border-radius:50%;border:4px solid var(--brass-hi);font:700 1.8rem var(--mono);color:#fff}
.rl-red{background:#b3262f}.rl-black{background:#1a1a1a}.rl-green{background:#1f7a4d}
.rl-hist{display:flex;gap:.25rem;flex-wrap:wrap;justify-content:center}
.rl-hist b{display:grid;place-items:center;width:1.7rem;height:1.7rem;border-radius:50%;font:700 .72rem var(--mono);color:#fff}
.rl-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:3px;width:min(100%,21rem)}
.rl-grid .zero{grid-column:1/-1}
.rl-out{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;width:min(100%,21rem)}
.rl-s{position:relative;min-height:2.3rem;border:1px solid rgba(255,255,255,.35);border-radius:6px;color:#fff;font:700 .8rem var(--mono);cursor:pointer;padding:0 .2rem}
.rl-s:hover:not(:disabled){outline:2px solid var(--brass-hi)}
.rl-s:disabled{opacity:.6;cursor:default}
.rl-s.rl-plain{background:rgba(0,0,0,.3)}
.rl-s em{position:absolute;right:-3px;top:-6px;min-width:1.3rem;padding:0 .2rem;border-radius:999px;background:var(--brass-hi);color:#2a1c04;font:700 .68rem/1.3rem var(--mono);font-style:normal}
.rl-chip.sel{outline:3px solid var(--brass-hi)}
</style>`;
  FULL['Casino Roulette'] = {
    title: 'Casino Roulette: the full game',
    intro: 'European wheel, numbers 0 to 36. Pick a chip, tap the table to bet, then spin. A number pays 35 to 1, a dozen pays 2 to 1, red, black, odd, even, low and high pay 1 to 1. Zero beats every bet except a bet on 0. Grow your bankroll to ' + TARGET + ' to win.',
    make: (A) => {
      let bank, bets, stack, chip, spinning, last, hist, fb, lastBets, shown;
      const staked = () => Object.values(bets).reduce((a, b) => a + b, 0);
      const spot = (key, label, cls) => `<button type="button" class="rl-s ${cls}" data-act="bet" data-v="${key}" ${spinning ? 'disabled' : ''} aria-label="Bet on ${esc(info(key).label)}${bets[key] ? ', ' + bets[key] + ' chips placed' : ''}">${label}${bets[key] ? `<em>${bets[key]}</em>` : ''}</button>`;
      const draw = () => {
        let nums = '';
        for (let i = 1; i <= 36; i++) nums += spot('n' + i, i, 'rl-' + colourOf(i));
        const free = bank - staked();
        A.draw(`${STYLE}<div class="arc-scene">
          <div class="rl-top"><span>Bankroll ${bank}</span><span>On table ${staked()}</span><span>Goal ${TARGET}</span></div>
          <div class="rl-ball rl-${shown === null ? 'green' : colourOf(shown)}" aria-live="polite" aria-label="${shown === null ? 'Wheel ready' : 'Ball on ' + shown}">${shown === null ? '?' : shown}</div>
          <div class="rl-hist" aria-label="Recent numbers">${hist.map((n) => `<b class="rl-${colourOf(n)}">${n}</b>`).join('')}</div>
          <p class="arc-fb">${fb}</p>
          <div class="arc-row" role="group" aria-label="Chip size">${CHIPS.map((c) => `<button type="button" class="btn small rl-chip ${chip === c ? 'sel primary' : ''}" data-act="chip" data-v="${c}" ${spinning ? 'disabled' : ''}>${c}</button>`).join('')}</div>
          <div class="rl-grid">${spot('n0', '0', 'rl-green zero')}${nums}</div>
          <div class="rl-out">${['d1', 'd2', 'd3'].map((k) => spot(k, BETS[k].label + ' (2:1)', 'rl-plain')).join('')}${['low', 'even', 'red', 'black', 'odd', 'high'].map((k) => spot(k, BETS[k].label, k === 'red' ? 'rl-red' : k === 'black' ? 'rl-black' : 'rl-plain')).join('')}</div>
          <div class="arc-opts">${abtn('spin', '', 'Spin', 'primary', spinning || staked() === 0)}${abtn('undo', '', 'Undo chip', '', spinning || !stack.length)}${abtn('clear', '', 'Clear bets', '', spinning || staked() === 0)}${abtn('again', '', 'Same bets', '', spinning || staked() > 0 || !lastBets || Object.values(lastBets).reduce((a, b) => a + b, 0) > bank)}</div>
          <p class="muted">${free} chips free. Keys: S spin, C clear.</p></div>`);
      };
      const place = (key) => {
        const free = bank - staked();
        if (free <= 0) { fb = 'You have no free chips left.'; return; }
        const amt = Math.min(chip, free);
        bets[key] = (bets[key] || 0) + amt; stack.push([key, amt]); fb = `${amt} on ${info(key).label}.`; A.sfx('tick');
      };
      const spin = () => {
        if (spinning || staked() === 0) return;
        spinning = true; lastBets = { ...bets }; fb = 'The wheel is spinning...';
        const result = rnd(37); let n = 0;
        const step = () => {
          n++; shown = rnd(37); draw();
          if (n < 10) { A.after(step, 80 + n * 22); return; }
          shown = result; settle(result);
        };
        draw(); A.after(step, 100);
      };
      const settle = (r) => {
        let net = 0; const won = [], lost = [];
        Object.entries(bets).forEach(([k, amt]) => { const b = info(k); if (b.win(r)) { net += amt * b.pay; won.push(`${b.label} +${amt * b.pay}`); } else { net -= amt; lost.push(`${b.label} -${amt}`); } });
        bank += net; hist = [r, ...hist].slice(0, 12); bets = {}; stack = []; spinning = false;
        fb = `The ball lands on ${r}, ${colourOf(r)}. ` + (won.length ? 'Won: ' + won.join(', ') + '. ' : '') + (lost.length ? 'Lost: ' + lost.join(', ') + '.' : '') + ` Net ${net >= 0 ? '+' : ''}${net}.`;
        A.sfx(net > 0 ? 'good' : net < 0 ? 'bad' : 'tick');
        draw();
        if (bank >= TARGET) A.end(true, `You reached ${bank} chips. The house is beaten. You win!`);
        else if (bank <= 0) A.end(false, 'You are out of chips. The wheel wins this time.');
      };
      const act = (a, v) => {
        if (spinning) return;
        if (a === 'chip') { chip = Number(v); }
        else if (a === 'bet') place(v);
        else if (a === 'undo' && stack.length) { const [k, amt] = stack.pop(); bets[k] -= amt; if (bets[k] <= 0) delete bets[k]; fb = 'Chip removed.'; }
        else if (a === 'clear') { bets = {}; stack = []; fb = 'Table cleared.'; }
        else if (a === 'again' && lastBets) { bets = { ...lastBets }; stack = Object.entries(bets).map(([k, amt]) => [k, amt]); fb = 'Same bets as last spin.'; }
        else if (a === 'spin') return spin();
        draw();
      };
      return {
        start() {
          bank = START; bets = {}; stack = []; chip = 5; spinning = false; hist = []; shown = null; lastBets = null;
          fb = 'Place your bets.'; draw();
          A.key((e) => { const k = e.key.toLowerCase(); if (k === 's') act('spin'); else if (k === 'c') act('clear'); });
        },
        act,
      };
    },
  };
})();

/* --- checkers.js --- */
(() => {
  /* Checkers (American draughts): 8x8, forced captures, multi-jumps, kings. You are red and move first. Bot searches 6 plies. */
  // board: array of 64, index = r * 8 + c, r = 0 is the top (bot side). 'r' red man, 'R' red king, 'b' black man, 'B' black king, '' empty.
  const startBoard = () => { const b = Array(64).fill(''); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) { if (r < 3) b[r * 8 + c] = 'b'; else if (r > 4) b[r * 8 + c] = 'r'; } return b; };
  const owner = (p) => (p ? p.toLowerCase() : '');
  const dirsFor = (p) => (p === 'R' || p === 'B' ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : p === 'r' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);
  const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  // a move: { path: [from, step1, ...], caps: [captured squares] }
  const jumpsFrom = (b, from, piece, caps, path, out) => {
    const r = Math.floor(from / 8), c = from % 8; let any = false;
    for (const [dr, dc] of dirsFor(piece)) {
      const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
      if (!inb(lr, lc)) continue;
      const mid = mr * 8 + mc, land = lr * 8 + lc;
      if (caps.includes(mid)) continue;
      if (owner(b[mid]) && owner(b[mid]) !== owner(piece) && (!b[land] || land === path[0])) {
        any = true;
        const np = path.concat(land), nc = caps.concat(mid);
        const crowned = (piece === 'r' && lr === 0) || (piece === 'b' && lr === 7);
        if (crowned) out.push({ path: np, caps: nc });   // becoming a king ends the turn
        else jumpsFrom(b, land, piece, nc, np, out);
      }
    }
    if (!any && caps.length) out.push({ path, caps });
  };
  const movesFor = (b, side) => {
    const jumps = [], steps = [];
    for (let i = 0; i < 64; i++) {
      const p = b[i]; if (owner(p) !== side) continue;
      jumpsFrom(b, i, p, [], [i], jumps);
      const r = Math.floor(i / 8), c = i % 8;
      for (const [dr, dc] of dirsFor(p)) { const nr = r + dr, nc = c + dc; if (inb(nr, nc) && !b[nr * 8 + nc]) steps.push({ path: [i, nr * 8 + nc], caps: [] }); }
    }
    return jumps.length ? jumps : steps;
  };
  const apply = (b, m) => {
    const nb = b.slice(), from = m.path[0], to = m.path[m.path.length - 1]; let p = nb[from];
    nb[from] = ''; m.caps.forEach((s) => { nb[s] = ''; });
    const tr = Math.floor(to / 8);
    if (p === 'r' && tr === 0) p = 'R'; else if (p === 'b' && tr === 7) p = 'B';
    nb[to] = p; return nb;
  };
  const evaluate = (b) => {
    let s = 0;
    for (let i = 0; i < 64; i++) {
      const p = b[i]; if (!p) continue; const r = Math.floor(i / 8), c = i % 8;
      const centre = 0.3 * (3.5 - Math.abs(c - 3.5)) + 0.2 * (3.5 - Math.abs(r - 3.5));
      let v;
      if (p === 'b') v = 100 + r * 4 + (r === 0 ? 6 : 0) + centre;
      else if (p === 'B') v = 160 + centre;
      else if (p === 'r') v = -(100 + (7 - r) * 4 + (r === 7 ? 6 : 0) + centre);
      else v = -(160 + centre);
      s += v;
    }
    return s;   // positive is good for black (the bot)
  };
  const search = (b, depth, alpha, beta, side) => {
    const ms = movesFor(b, side);
    if (!ms.length) return side === 'b' ? -1e5 - depth : 1e5 + depth;
    if (depth === 0) return evaluate(b);
    let best = side === 'b' ? -1e9 : 1e9;
    for (const m of ms) {
      const s = search(apply(b, m), depth - 1, alpha, beta, side === 'b' ? 'r' : 'b');
      if (side === 'b') { if (s > best) best = s; if (best > alpha) alpha = best; } else { if (s < best) best = s; if (best < beta) beta = best; }
      if (alpha >= beta) break;
    }
    return best;
  };
  const botPick = (b, depth) => {
    const ms = movesFor(b, 'b'); if (!ms.length) return null;
    let best = -1e10, picks = [];
    for (const m of ms) {
      const s = search(apply(b, m), depth - 1, -1e9, 1e9, 'r') + Math.random() * 0.5;
      if (s > best + 0.6) { best = s; picks = [m]; } else if (s > best - 0.6) { picks.push(m); if (s > best) best = s; }
    }
    return picks[Math.floor(Math.random() * picks.length)];
  };
  const sq = (i) => 'abcdefgh'[i % 8] + (8 - Math.floor(i / 8));

  FULL['Checkers'] = {
    title: 'Checkers: the full game',
    intro: 'Real American checkers on an 8 by 8 board. You are red and move first, up the board. Move diagonally. If you can jump, you must. Keep jumping if you can. Reach the far row to become a king, which moves both ways. Capture or block every black piece to win.',
    make: (A) => {
      let b, turn, sel, opts, fb, last, quiet, bn;
      const counts = () => { let r = 0, k = 0, bl = 0, bk = 0; b.forEach((p) => { if (p === 'r') r++; else if (p === 'R') { r++; k++; } else if (p === 'b') bl++; else if (p === 'B') { bl++; bk++; } }); return { r, k, bl, bk }; };
      const draw = () => {
        const mine = turn === 'you' && !A.over;
        const legal = mine ? movesFor(b, 'r') : [];
        const movable = new Set(legal.map((m) => m.path[0]));
        const targets = new Set(sel === null ? [] : opts.map((m) => m.path[m.pre.length]));
        let cells = '';
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
          const i = r * 8 + c, dark = (r + c) % 2 === 1, p = b[i];
          const isT = targets.has(i), isSel = sel === i, isLast = last && last.includes(i);
          const piece = p ? `<i class="ck-p ck-${p.toLowerCase()}${p === 'R' || p === 'B' ? ' ck-k' : ''}"></i>` : '';
          const can = dark && mine && (isT || movable.has(i) || isSel);
          const lab = `${sq(i)}${p ? ', ' + (owner(p) === 'r' ? 'red' : 'black') + (p === p.toUpperCase() ? ' king' : ' man') : ', empty'}${isT ? ', move here' : ''}`;
          cells += `<button type="button" class="ck-c ${dark ? 'dk' : 'lt'}${isSel ? ' sel' : ''}${isT ? ' tg' : ''}${isLast ? ' lm' : ''}${mine && movable.has(i) && sel === null ? ' mv' : ''}" ${dark ? `data-act="sq" data-v="${i}"` : 'tabindex="-1" aria-hidden="true"'} aria-label="${lab}"${can ? '' : ' disabled'}>${piece}</button>`;
        }
        const n = counts();
        const forced = mine && legal.length && legal[0].caps.length ? ' You must jump.' : '';
        A.draw(`<style>
          .ck-board{display:grid;grid-template-columns:repeat(8,1fr);width:min(100%,25rem);aspect-ratio:1;border:4px solid var(--leather);border-radius:6px;overflow:hidden}
          .ck-c{border:0;padding:0;margin:0;position:relative;display:grid;place-items:center;font:inherit;min-width:0}
          .ck-c.lt{background:#e8d9b0}.ck-c.dk{background:#6b3f26}.ck-c:disabled{cursor:default}.ck-c.dk:not(:disabled){cursor:pointer}
          .ck-c.lm{box-shadow:inset 0 0 0 3px rgba(246,220,143,.5)}.ck-c.sel{box-shadow:inset 0 0 0 3px var(--brass-hi)}
          .ck-c.mv::before{content:"";position:absolute;inset:3px;border-radius:50%;box-shadow:0 0 0 2px var(--mint)}
          .ck-c.tg{background:#3d6b4a}.ck-c.tg::after{content:"";width:34%;height:34%;border-radius:50%;background:var(--mint);opacity:.85}
          .ck-p{width:78%;height:78%;border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 3px rgba(0,0,0,.25),0 2px 3px rgba(0,0,0,.5);position:relative;z-index:1}
          .ck-p.ck-r{background:radial-gradient(circle at 35% 30%,#ff8a7a,#c92a2a)}.ck-p.ck-b{background:radial-gradient(circle at 35% 30%,#6a6a72,#17171c)}
          .ck-p.ck-k::after{content:"K";font:700 clamp(.7rem,3.4vw,1.1rem) var(--mono);color:var(--brass-hi)}
          </style>
          <div class="arc-top"><span class="chip">You <b style="color:#ff8a8a">red ${n.r}</b>${n.k ? ' (' + n.k + ' kings)' : ''}</span><span class="chip">Bot <b>black ${n.bl}</b>${n.bk ? ' (' + n.bk + ' kings)' : ''}</span></div>
          <div class="arc-scene"><div class="ck-board" role="group" aria-label="Checkers board">${cells}</div>
          <p class="arc-ask">${turn === 'you' ? (sel === null ? 'Your turn. Pick a red piece.' : 'Pick a green square to move to.') + forced : turn === 'bot' ? 'Bot is thinking...' : ''}</p>
          <p class="arc-fb">${fb}</p>
          <div class="arc-row">${sel !== null && turn === 'you' ? abtn('cancel', '', 'Choose another piece', '', opts.some((m) => m.pre.length > 1)) : ''}</div></div>`);
      };
      const finish = (won, text) => { turn = 'done'; sel = null; opts = []; draw(); A.end(won, text); };
      const checkEnd = (side) => {
        if (!movesFor(b, side).length) { finish(side === 'b', side === 'b' ? 'Black has no moves left. You win!' : 'You have no moves left. The bot wins.'); return true; }
        if (quiet >= 80) { finish(false, 'Draw. Forty moves each with no capture or man move.'); return true; }
        return false;
      };
      const exec = (m) => {
        const mover = owner(b[m.path[0]]), wasMan = b[m.path[0]] === b[m.path[0]].toLowerCase();
        b = apply(b, m); last = [m.path[0], m.path[m.path.length - 1]];
        if (m.caps.length || wasMan) quiet = 0; else quiet++;
        return mover;
      };
      const botTurn = () => {
        turn = 'bot'; sel = null; opts = []; draw();
        A.after(() => {
          const m = botPick(b, 6);
          if (!m) return finish(true, 'Black has no moves left. You win!');
          exec(m); fb = `Bot moved ${sq(m.path[0])} to ${sq(m.path[m.path.length - 1])}${m.caps.length ? ', capturing ' + m.caps.length : ''}.`; A.sfx(m.caps.length ? 'bad' : 'tick');
          if (checkEnd('r')) return;
          turn = 'you'; draw();
        }, 650);
      };
      const click = (i) => {
        if (turn !== 'you') return;
        const legal = movesFor(b, 'r');
        if (sel === null) {
          const mine = legal.filter((m) => m.path[0] === i);
          if (!mine.length) { fb = legal.length && legal[0].caps.length ? 'You must make a jump. Pick a glowing piece.' : 'That piece cannot move.'; draw(); return; }
          sel = i; opts = mine.map((m) => Object.assign({}, m, { pre: [i] })); draw(); return;
        }
        if (i === sel && opts.every((m) => m.pre.length === 1)) { sel = null; opts = []; draw(); return; }
        const next = opts.filter((m) => m.path[m.pre.length] === i);
        if (!next.length) {
          if (opts.every((m) => m.pre.length === 1)) { const mine = legal.filter((m) => m.path[0] === i); if (mine.length) { sel = i; opts = mine.map((m) => Object.assign({}, m, { pre: [i] })); draw(); } }
          return;
        }
        next.forEach((m) => m.pre.push(i));
        const done = next.find((m) => m.pre.length === m.path.length);
        if (done) {
          const m = { path: done.path, caps: done.caps }; sel = null; opts = [];
          exec(m); fb = `You moved ${sq(m.path[0])} to ${sq(m.path[m.path.length - 1])}${m.caps.length ? ', capturing ' + m.caps.length : ''}.`; A.sfx(m.caps.length ? 'good' : 'tick');
          if (checkEnd('b')) return;
          botTurn(); return;
        }
        opts = next; draw();
      };
      return {
        start() { b = startBoard(); turn = 'you'; sel = null; opts = []; fb = 'Tip: keep your back row at home as long as you can.'; last = null; quiet = 0; draw(); },
        act(a, v) { if (a === 'sq') click(Number(v)); else if (a === 'cancel') { if (opts.every((m) => m.pre.length === 1)) { sel = null; opts = []; draw(); } } },
        _lib: { movesFor, apply, startBoard, get b() { return b; }, set b(x) { b = x; } },
      };
    },
  };
})();

