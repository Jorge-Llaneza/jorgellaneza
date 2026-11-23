/* --- chess.js --- */
(() => {
  /* Chess: full legal rules (check, checkmate, stalemate, castling, en passant, promotion). Bot searches 2 plies. Click a piece, then a square. */
  // board: 64 chars, index = r * 8 + c, r = 0 is rank 8 (black's back rank). Uppercase = white, lowercase = black, '' empty.
  const GLYPH = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  const isW = (p) => p !== '' && p === p.toUpperCase();
  const sideOf = (p) => (p === '' ? '' : isW(p) ? 'w' : 'b');
  const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const initial = () => {
    const b = Array(64).fill(''); const back = 'rnbqkbnr';
    for (let c = 0; c < 8; c++) { b[c] = back[c]; b[8 + c] = 'p'; b[48 + c] = 'P'; b[56 + c] = back[c].toUpperCase(); }
    return { b, turn: 'w', cast: { K: true, Q: true, k: true, q: true }, ep: -1, half: 0 };
  };
  const attacked = (b, sq, by) => {   // is square sq attacked by side `by`
    const r = Math.floor(sq / 8), c = sq % 8, own = (ch) => (by === 'w' ? ch.toUpperCase() : ch.toLowerCase());
    const pr = by === 'w' ? r + 1 : r - 1;
    for (const dc of [-1, 1]) if (inb(pr, c + dc) && b[pr * 8 + c + dc] === own('p')) return true;
    for (const [dr, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) if (inb(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === own('n')) return true;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && inb(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === own('k')) return true;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const diag = dr !== 0 && dc !== 0; let y = r + dr, x = c + dc;
      while (inb(y, x)) { const ch = b[y * 8 + x]; if (ch) { if (ch === own('q') || ch === own(diag ? 'b' : 'r')) return true; break; } y += dr; x += dc; }
    }
    return false;
  };
  const kingSq = (b, side) => b.indexOf(side === 'w' ? 'K' : 'k');
  const inCheck = (s, side) => attacked(s.b, kingSq(s.b, side), side === 'w' ? 'b' : 'w');
  // move: { from, to, promo?, ep?, cast? } ; pseudo-legal first, then filter by king safety
  const pseudo = (s) => {
    const { b, turn, cast, ep } = s, out = [], me = turn;
    for (let i = 0; i < 64; i++) {
      const p = b[i]; if (!p || sideOf(p) !== me) continue;
      const r = Math.floor(i / 8), c = i % 8, t = p.toLowerCase();
      if (t === 'p') {
        const dir = me === 'w' ? -1 : 1, start = me === 'w' ? 6 : 1, last = me === 'w' ? 0 : 7;
        const add = (to, extra) => { if (Math.floor(to / 8) === last) for (const pr of ['q', 'r', 'b', 'n']) out.push(Object.assign({ from: i, to, promo: pr }, extra)); else out.push(Object.assign({ from: i, to }, extra)); };
        if (inb(r + dir, c) && !b[(r + dir) * 8 + c]) { add((r + dir) * 8 + c); if (r === start && !b[(r + 2 * dir) * 8 + c]) out.push({ from: i, to: (r + 2 * dir) * 8 + c, dbl: true }); }
        for (const dc of [-1, 1]) { if (!inb(r + dir, c + dc)) continue; const to = (r + dir) * 8 + c + dc; if (b[to] && sideOf(b[to]) !== me) add(to); else if (to === ep) out.push({ from: i, to, ep: true }); }
      } else if (t === 'n' || t === 'k') {
        const ds = t === 'n' ? [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dr, dc] of ds) if (inb(r + dr, c + dc)) { const to = (r + dr) * 8 + c + dc; if (!b[to] || sideOf(b[to]) !== me) out.push({ from: i, to }); }
        if (t === 'k') {
          const row = me === 'w' ? 7 : 0, opp = me === 'w' ? 'b' : 'w';
          if (i === row * 8 + 4 && !attacked(b, i, opp)) {
            const ks = me === 'w' ? 'K' : 'k', qs = me === 'w' ? 'Q' : 'q';
            if (cast[ks] && !b[row * 8 + 5] && !b[row * 8 + 6] && b[row * 8 + 7] === (me === 'w' ? 'R' : 'r') && !attacked(b, row * 8 + 5, opp) && !attacked(b, row * 8 + 6, opp)) out.push({ from: i, to: row * 8 + 6, cast: 'k' });
            if (cast[qs] && !b[row * 8 + 3] && !b[row * 8 + 2] && !b[row * 8 + 1] && b[row * 8] === (me === 'w' ? 'R' : 'r') && !attacked(b, row * 8 + 3, opp) && !attacked(b, row * 8 + 2, opp)) out.push({ from: i, to: row * 8 + 2, cast: 'q' });
          }
        }
      } else {
        const ds = t === 'b' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : t === 'r' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dr, dc] of ds) { let y = r + dr, x = c + dc; while (inb(y, x)) { const to = y * 8 + x; if (!b[to]) out.push({ from: i, to }); else { if (sideOf(b[to]) !== me) out.push({ from: i, to }); break; } y += dr; x += dc; } }
      }
    }
    return out;
  };
  const make = (s, m) => {
    const b = s.b.slice(), p = b[m.from], me = s.turn, cast = Object.assign({}, s.cast);
    const cap = b[m.to] || (m.ep ? 'x' : '');
    b[m.to] = m.promo ? (me === 'w' ? m.promo.toUpperCase() : m.promo) : p; b[m.from] = '';
    if (m.ep) b[m.to + (me === 'w' ? 8 : -8)] = '';
    if (m.cast) { const row = me === 'w' ? 7 : 0; if (m.cast === 'k') { b[row * 8 + 5] = b[row * 8 + 7]; b[row * 8 + 7] = ''; } else { b[row * 8 + 3] = b[row * 8]; b[row * 8] = ''; } }
    if (p === 'K') { cast.K = false; cast.Q = false; } if (p === 'k') { cast.k = false; cast.q = false; }
    if (m.from === 63 || m.to === 63) cast.K = false; if (m.from === 56 || m.to === 56) cast.Q = false;
    if (m.from === 7 || m.to === 7) cast.k = false; if (m.from === 0 || m.to === 0) cast.q = false;
    const ep = m.dbl ? (m.from + m.to) / 2 : -1;
    return { b, turn: me === 'w' ? 'b' : 'w', cast, ep, half: (p.toLowerCase() === 'p' || cap) ? 0 : s.half + 1, cap };
  };
  const legal = (s) => pseudo(s).filter((m) => !inCheck(make(s, m), s.turn));
  const keyOf = (s) => s.b.join('') + s.turn + (s.cast.K ? 'K' : '') + (s.cast.Q ? 'Q' : '') + (s.cast.k ? 'k' : '') + (s.cast.q ? 'q' : '') + (s.ep >= 0 ? s.ep : '');
  const insufficient = (b) => { const ps = b.filter((x) => x && x.toLowerCase() !== 'k'); if (!ps.length) return true; if (ps.length === 1 && /[nb]/i.test(ps[0])) return true; return false; };
  // simple piece-square tweaks: centre and advancement
  const evaluate = (s) => {   // from white's point of view
    let v = 0;
    for (let i = 0; i < 64; i++) {
      const p = s.b[i]; if (!p) continue; const t = p.toLowerCase(), r = Math.floor(i / 8), c = i % 8, w = isW(p);
      let x = VAL[t]; const cen = 3.5 - Math.abs(c - 3.5) + 3.5 - Math.abs(r - 3.5);
      if (t === 'n' || t === 'b') x += cen * 5; else if (t === 'p') x += (w ? 6 - r : r - 1) * 6 + (c > 1 && c < 6 ? cen * 2 : 0); else if (t === 'q') x += cen * 1; else if (t === 'k') x += ((w ? r === 7 : r === 0) ? 10 : 0) - cen * 2;
      v += w ? x : -x;
    }
    return v;
  };
  const order = (s, ms) => ms.map((m) => ({ m, k: (s.b[m.to] ? VAL[s.b[m.to].toLowerCase()] * 10 - VAL[s.b[m.from].toLowerCase()] : 0) + (m.promo === 'q' ? 800 : 0) + Math.random() })).sort((a, z) => z.k - a.k).map((x) => x.m);
  const search = (s, depth, alpha, beta) => {   // negamax-free: white maximises
    const ms = legal(s);
    if (!ms.length) return inCheck(s, s.turn) ? (s.turn === 'w' ? -1e5 - depth : 1e5 + depth) : 0;
    if (depth === 0) return evaluate(s);
    let best = s.turn === 'w' ? -1e9 : 1e9;
    for (const m of order(s, ms)) {
      const v = search(make(s, m), depth - 1, alpha, beta);
      if (s.turn === 'w') { if (v > best) best = v; if (best > alpha) alpha = best; } else { if (v < best) best = v; if (best < beta) beta = best; }
      if (alpha >= beta) break;
    }
    return best;
  };
  const botPick = (s, depth) => {
    const ms = order(s, legal(s)); if (!ms.length) return null;
    const sign = s.turn === 'w' ? 1 : -1; let best = -1e12, picks = [];
    for (const m of ms) {
      const v = sign * search(make(s, m), depth - 1, -1e9, 1e9) + Math.random() * 3;
      if (v > best) { best = v; picks = [m]; }
    }
    return picks[0];
  };
  const name = (i) => 'abcdefgh'[i % 8] + (8 - Math.floor(i / 8));
  const PN = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

  FULL['Chess'] = {
    title: 'Chess: the full game',
    intro: 'Real chess with every rule: check, checkmate, stalemate, castling, en passant and promotion. Pick your colour. Tap one of your pieces, then tap a highlighted square. The bot looks two moves ahead, so plan carefully.',
    make: (A) => {
      let S, me, sel, fb, last, hist, pend, stage, over;
      const botSide = () => (me === 'w' ? 'b' : 'w');
      const draw = () => {
        if (stage === 'pick') {
          A.draw(`<div class="arc-scene"><p class="arc-ask">Choose your colour. White moves first.</p><div class="arc-opts">${abtn('colour', 'w', '♔ Play white')}${abtn('colour', 'b', '♚ Play black')}</div></div>`); return;
        }
        const mine = S.turn === me && !over && !A.over;
        const lm = mine ? legal(S) : [];
        const tg = new Map(); if (sel !== null) lm.filter((m) => m.from === sel).forEach((m) => tg.set(m.to, m));
        const chk = inCheck(S, S.turn) ? kingSq(S.b, S.turn) : -1;
        const flip = me === 'b'; let cells = '';
        for (let k = 0; k < 64; k++) {
          const i = flip ? 63 - k : k, r = Math.floor(i / 8), c = i % 8, p = S.b[i], light = (r + c) % 2 === 0;
          const isTg = tg.has(i), can = mine && !pend && (isTg || (p && sideOf(p) === me && lm.some((m) => m.from === i)));
          const cls = `ch2-c ${light ? 'lt' : 'dk'}${sel === i ? ' sel' : ''}${isTg ? (p || tg.get(i).ep ? ' cap' : ' tg') : ''}${last && (last[0] === i || last[1] === i) ? ' lm' : ''}${chk === i ? ' chk' : ''}`;
          const lab = `${name(i)}${p ? ', ' + (isW(p) ? 'white ' : 'black ') + PN[p.toLowerCase()] : ', empty'}${isTg ? ', move here' : ''}`;
          cells += `<button type="button" class="${cls}" data-act="sq" data-v="${i}" aria-label="${lab}"${can ? '' : ' disabled'}><span class="${p ? (isW(p) ? 'wp' : 'bp') : ''}">${p ? GLYPH[p] : ''}</span></button>`;
        }
        const capsW = [], capsB = [];
        const cnt = {}; S.b.forEach((p) => { if (p) cnt[p] = (cnt[p] || 0) + 1; });
        const full = { p: 8, n: 2, b: 2, r: 2, q: 1 };
        for (const t of ['q', 'r', 'b', 'n', 'p']) { for (let k = (cnt[t] || 0); k < full[t]; k++) capsB.push(GLYPH[t]); for (let k = (cnt[t.toUpperCase()] || 0); k < full[t]; k++) capsW.push(GLYPH[t.toUpperCase()]); }
        const mineCaps = me === 'w' ? capsB : capsW, theirCaps = me === 'w' ? capsW : capsB;
        const promo = pend ? `<div class="arc-opts"><span>Promote to:</span>${['q', 'r', 'b', 'n'].map((t) => abtn('promo', t, GLYPH[me === 'w' ? t.toUpperCase() : t] + ' ' + PN[t])).join('')}</div>` : '';
        const status = over ? '' : S.turn === me ? (chk >= 0 ? 'Check! Your turn.' : 'Your turn.') : 'Bot is thinking...';
        A.draw(`<style>
          .ch2-board{display:grid;grid-template-columns:repeat(8,1fr);width:min(100%,25rem);aspect-ratio:1;border:4px solid var(--leather);border-radius:6px;overflow:hidden}
          .ch2-c{border:0;padding:0;margin:0;position:relative;display:grid;place-items:center;font:inherit;min-width:0;cursor:pointer;line-height:1}
          .ch2-c:disabled{cursor:default}.ch2-c.lt{background:#ecdcb4}.ch2-c.dk{background:#a97c50}
          .ch2-c span{font-size:clamp(1.4rem,8.2vw,2.4rem);position:relative;z-index:1}
          .ch2-c span.wp{color:#fff;text-shadow:0 0 2px #000,0 0 2px #000,0 0 3px #000}.ch2-c span.bp{color:#15151a;text-shadow:0 0 1px rgba(255,255,255,.4)}
          .ch2-c.lm{box-shadow:inset 0 0 0 100px rgba(246,220,100,.35)}.ch2-c.sel{box-shadow:inset 0 0 0 100px rgba(246,220,100,.6)}
          .ch2-c.chk{box-shadow:inset 0 0 0 100px rgba(255,70,60,.55)}
          .ch2-c.tg::after{content:"";position:absolute;width:30%;height:30%;border-radius:50%;background:rgba(30,120,70,.75)}
          .ch2-c.cap::after{content:"";position:absolute;inset:4%;border-radius:50%;box-shadow:inset 0 0 0 4px rgba(30,120,70,.85)}
          .ch2-cap{font-size:1.05rem;min-height:1.4rem;letter-spacing:.05em}
          </style>
          <div class="arc-top"><span class="chip">You <b>${me === 'w' ? 'white' : 'black'}</b></span><span class="chip">Moves <b>${hist}</b></span><span class="chip">${status}</span></div>
          <div class="arc-scene"><div class="ch2-cap" aria-label="Pieces the bot lost">${theirCaps.length ? mineCaps.join('') : mineCaps.join('')}</div>
          <div class="ch2-board" role="group" aria-label="Chess board">${cells}</div>
          <div class="ch2-cap" aria-label="Pieces you lost">${theirCaps.join('')}</div>
          ${promo}<p class="arc-fb">${fb}</p></div>`);
      };
      const finish = (won, text) => { over = true; sel = null; draw(); A.end(won, text); };
      const afterMove = (m, byMe) => {
        const mover = S.turn; const prev = S; S = make(S, m); last = [m.from, m.to]; hist++;
        const piece = prev.b[m.from].toLowerCase();
        fb = `${byMe ? 'You' : 'Bot'}: ${PN[piece]} ${name(m.from)} to ${name(m.to)}${prev.b[m.to] || m.ep ? ' and captured' : ''}${m.promo ? ', promoted to ' + PN[m.promo] : ''}${m.cast ? ', castled' : ''}.`;
        A.sfx(prev.b[m.to] || m.ep ? (byMe ? 'good' : 'bad') : 'tick');
        const k = keyOf(S); seen[k] = (seen[k] || 0) + 1;
        const ms = legal(S), chk = inCheck(S, S.turn);
        if (!ms.length) { if (chk) return finish(byMe, byMe ? 'Checkmate! You win!' : 'Checkmate. The bot wins.'); return finish(false, 'Stalemate. The game is a draw.'); }
        if (insufficient(S.b)) return finish(false, 'Draw. Neither side has enough pieces to checkmate.');
        if (S.half >= 100) return finish(false, 'Draw by the fifty move rule.');
        if (seen[k] >= 3) return finish(false, 'Draw by repetition.');
        if (S.turn === botSide()) botTurn(); else draw();
        void mover;
      };
      let seen = {};
      const botTurn = () => { draw(); A.after(() => { const m = botPick(S, 2); if (!m) return; afterMove(m, false); }, 500); };
      const click = (i) => {
        if (S.turn !== me || pend || over) return;
        const lm = legal(S), p = S.b[i];
        if (sel !== null) {
          const ms = lm.filter((m) => m.from === sel && m.to === i);
          if (ms.length) { if (ms[0].promo) { pend = ms; draw(); return; } sel = null; afterMove(ms[0], true); return; }
        }
        if (p && sideOf(p) === me && lm.some((m) => m.from === i)) { sel = sel === i ? null : i; draw(); } else if (sel !== null) { sel = null; draw(); }
      };
      return {
        start() { stage = 'pick'; S = initial(); sel = null; fb = 'Tip: control the centre and keep your king safe.'; last = null; hist = 0; pend = null; over = false; seen = {}; draw(); },
        act(a, v) {
          if (a === 'colour' && stage === 'pick') { me = v; stage = 'play'; seen = {}; seen[keyOf(S)] = 1; if (me === 'b') botTurn(); else draw(); }
          else if (a === 'sq' && stage === 'play') click(Number(v));
          else if (a === 'promo' && pend) { const m = pend.find((x) => x.promo === v); pend = null; sel = null; afterMove(m, true); }
        },
        _lib: { initial, legal, make, inCheck, keyOf, get S() { return S; }, set S(x) { S = x; }, set me(x) { me = x; }, set stage(x) { stage = x; } },
      };
    },
  };
})();

/* --- coin-flips.js --- */
(() => {
  /* Call the flip with a bankroll. Win streaks add a bonus. Goal 300 chips within 30 flips; lose if you go broke or run out of flips. */
  FULL['Coin Flips'] = {
    title: 'Coin Flips: the full game',
    intro: 'Start with 100 chips. Pick a bet, then call Heads or Tails on a fair coin. A right call pays 1 to 1. From your 3rd win in a row you also earn a streak bonus. Reach 300 chips within 30 flips. The coin has no memory, so streaks are luck!',
    make: (A) => {
      let bank, bet, flips, streak, run, best, last, fb, hist, busy;
      const GOAL = 300, MAX = 30, BETS = [5, 10, 25, 50];
      const curBet = () => Math.min(bet, bank);
      const draw = () => A.draw(`<div class="arc-scene">
        <div class="arc-top"><span class="chip">Chips ${bank}</span><span class="chip">Goal ${GOAL}</span><span class="chip">Flip ${Math.min(flips + 1, MAX)} of ${MAX}</span><span class="chip">Win streak ${streak}</span></div>
        <div class="arc-top"><span class="chip">Current run: ${run} ${last || ''}</span><span class="chip">Longest run: ${best}</span></div>
        <div class="arc-row">${hist.slice(-20).map((h) => `<span class="arc-chamber${h === 'H' ? ' loaded' : ''}">${h}</span>`).join('') || '<span class="muted">No flips yet</span>'}</div>
        <p class="arc-ask">Bet: ${curBet()} chips. Streak bonus on the next win: ${streak >= 2 ? '+' + Math.min(curBet(), Math.floor(curBet() * 0.25 * (streak - 1))) : 'none yet'}.</p>
        <div class="arc-opts">${BETS.map((b) => abtn('bet', b, String(b), bet === b ? 'primary small' : 'small', busy || b > bank)).join('')}${abtn('bet', bank, 'All in', bet === bank ? 'primary small' : 'small', busy)}</div>
        <div class="arc-opts">${abtn('call', 'H', 'Call Heads (h)', 'primary', busy)}${abtn('call', 'T', 'Call Tails (t)', 'primary', busy)}</div>
        <p class="arc-fb">${fb}</p></div>`);
      const flip = (call) => {
        if (busy) return;
        const b = curBet(); const res = Math.random() < 0.5 ? 'H' : 'T';
        flips++; hist.push(res); if (res === last) run++; else { run = 1; last = res; } best = Math.max(best, run);
        if (res === call) {
          streak++; const bonus = streak >= 3 ? Math.min(b, Math.floor(b * 0.25 * (streak - 2))) : 0;
          bank += b + bonus; fb = `<span class="good">${res === 'H' ? 'Heads' : 'Tails'}! You win ${b}${bonus ? ' plus ' + bonus + ' streak bonus' : ''}.</span>`; A.sfx('good');
        } else { streak = 0; bank -= b; fb = `<span class="bad">${res === 'H' ? 'Heads' : 'Tails'}. You lose ${b}.</span>`; A.sfx('bad'); }
        if (bank >= GOAL) { busy = true; draw(); A.end(true, `You reached ${bank} chips in ${flips} flips. Longest run was ${best}. You win!`); return; }
        if (bank <= 0) { bank = 0; busy = true; draw(); A.end(false, `You went broke after ${flips} flips. Longest run was ${best}.`); return; }
        if (flips >= MAX) { busy = true; draw(); A.end(false, `Out of flips with ${bank} chips. You needed ${GOAL}.`); return; }
        draw();
      };
      return {
        start() {
          bank = 100; bet = 10; flips = 0; streak = 0; run = 0; best = 0; last = ''; hist = []; busy = false; fb = 'Place your bet and call it.'; draw();
          A.key((e) => { const k = e.key.toLowerCase(); if (k === 'h') flip('H'); else if (k === 't') flip('T'); });
        },
        act(a, v) { if (busy) return; if (a === 'bet') { bet = Number(v); draw(); } else if (a === 'call') flip(v); },
      };
    },
  };
})();

/* --- connect4.js --- */
(() => {
  /* Connect Four: 7 columns by 6 rows. Drop discs, get four in a row. Bot searches 4 moves ahead (minimax with alpha-beta). */
  const COLS = 7, ROWS = 6; // board[c][r], r = 0 is the bottom
  const ORDER = [3, 2, 4, 1, 5, 0, 6];
  const empty = () => Array.from({ length: COLS }, () => Array(ROWS).fill(0));
  const canDrop = (g, c) => g[c][ROWS - 1] === 0;
  const dropRow = (g, c) => g[c].indexOf(0);
  // returns the four cells of a winning line through (c, r) or null
  const lineAt = (g, c, r) => {
    const p = g[c][r]; if (!p) return null;
    for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const cells = [[c, r]];
      for (const s of [1, -1]) { let x = c + dc * s, y = r + dr * s; while (x >= 0 && x < COLS && y >= 0 && y < ROWS && g[x][y] === p) { cells.push([x, y]); x += dc * s; y += dr * s; } }
      if (cells.length >= 4) return cells;
    }
    return null;
  };
  const full = (g) => g.every((col) => col[ROWS - 1] !== 0);
  // heuristic: score every window of four for player p
  const evaluate = (g, p) => {
    let s = 0; const q = 3 - p;
    for (let r = 0; r < ROWS; r++) s += (g[3][r] === p ? 3 : g[3][r] === q ? -3 : 0);
    const win = (cells) => {
      let a = 0, b = 0;
      for (const [x, y] of cells) { if (g[x][y] === p) a++; else if (g[x][y] === q) b++; }
      if (a && b) return 0;
      if (a === 3) return 5; if (a === 2) return 2; if (b === 3) return -6; if (b === 2) return -2; return 0;
    };
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const ec = c + dc * 3, er = r + dr * 3; if (ec < 0 || ec >= COLS || er < 0 || er >= ROWS) continue;
      s += win([0, 1, 2, 3].map((i) => [c + dc * i, r + dr * i]));
    }
    return s;
  };
  const search = (g, depth, alpha, beta, turn, me) => {
    if (full(g)) return 0;
    if (depth === 0) return evaluate(g, me);
    let best = turn === me ? -1e9 : 1e9;
    for (const c of ORDER) {
      if (!canDrop(g, c)) continue;
      const r = dropRow(g, c); g[c][r] = turn;
      let s;
      if (lineAt(g, c, r)) s = turn === me ? 1e6 + depth : -1e6 - depth;
      else s = search(g, depth - 1, alpha, beta, 3 - turn, me);
      g[c][r] = 0;
      if (turn === me) { if (s > best) best = s; if (best > alpha) alpha = best; } else { if (s < best) best = s; if (best < beta) beta = best; }
      if (alpha >= beta) break;
    }
    return best;
  };
  const botPick = (g, depth) => {
    let best = -1e10, picks = [];
    for (const c of ORDER) {
      if (!canDrop(g, c)) continue;
      const r = dropRow(g, c); g[c][r] = 2;
      const s = lineAt(g, c, r) ? 1e7 : search(g, depth - 1, -1e9, 1e9, 1, 2);
      g[c][r] = 0;
      if (s > best) { best = s; picks = [c]; } else if (s === best) picks.push(c);
    }
    return picks[Math.floor(Math.random() * picks.length)];
  };

  FULL['Connect Four'] = {
    title: 'Connect Four: the full game',
    intro: 'Drop discs into the seven columns. First to line up four of their own colour wins, across, up and down, or diagonally. You are red and you go first. The bot looks four moves ahead.',
    make: (A) => {
      let g, turn, fb, win, last, moves;
      const slotLabel = (c) => `Drop in column ${c + 1}${canDrop(g, c) ? '' : ', full'}`;
      const draw = () => {
        const cols = Array.from({ length: COLS }, (_, c) => {
          const discs = Array.from({ length: ROWS }, (_, i) => { const r = ROWS - 1 - i; const v = g[c][r]; const w = win && win.some(([x, y]) => x === c && y === r); return `<i class="c4-disc d${v}" style="${w ? 'box-shadow:0 0 0 3px var(--brass-hi),0 0 10px var(--brass-hi);' : (last && last[0] === c && last[1] === r ? 'box-shadow:0 0 0 2px #fff;' : '')}"></i>`; }).join('');
          const ok = turn === 'you' && canDrop(g, c) && !A.over;
          return `<button type="button" class="c4-slot c4f-col${win && win.some(([x]) => x === c) ? ' win' : ''}" data-act="drop" data-v="${c}" aria-label="${slotLabel(c)}"${ok ? '' : ' disabled'}>${discs}<small>${c + 1}</small></button>`;
        }).join('');
        A.draw(`<style>.c4f-col{background:none;font:inherit;cursor:pointer;color:inherit}.c4f-col:disabled{cursor:default}.c4f-col:hover:not(:disabled){background:rgba(255,255,255,.15)}</style>
          <div class="arc-top"><span class="chip">You <b style="color:#ff8a8a">red</b></span><span class="chip">Bot <b style="color:#ffe27a">yellow</b></span><span class="chip">Moves <b>${moves}</b></span></div>
          <div class="arc-scene"><div class="c4-row" role="group" aria-label="Connect Four board, choose a column">${cols}</div>
          <p class="arc-ask">${turn === 'you' ? 'Your turn. Tap a column or press 1 to 7.' : turn === 'bot' ? 'Bot is thinking...' : ''}</p><p class="arc-fb">${fb}</p></div>`);
      };
      const finish = (res, text) => { turn = 'done'; draw(); A.end(res, text); };
      const place = (c, p) => {
        const r = dropRow(g, c); g[c][r] = p; last = [c, r]; moves++;
        const w = lineAt(g, c, r);
        if (w) { win = w; return 'win'; }
        if (full(g)) return 'draw';
        return null;
      };
      const botTurn = () => {
        turn = 'bot'; draw();
        A.after(() => {
          const c = botPick(g, 4);
          const res = place(c, 2); fb = `Bot dropped a disc in column ${c + 1}.`; A.sfx('tick');
          if (res === 'win') return finish(false, 'The bot connected four. Try again.');
          if (res === 'draw') return finish(false, 'Draw. The board is full.');
          turn = 'you'; draw();
        }, 600);
      };
      const play = (c) => {
        if (turn !== 'you' || c < 0 || c >= COLS || !canDrop(g, c)) return;
        const res = place(c, 1); fb = `You dropped a disc in column ${c + 1}.`; A.sfx('good');
        if (res === 'win') return finish(true, 'Four in a row. You win!');
        if (res === 'draw') return finish(false, 'Draw. The board is full.');
        botTurn();
      };
      return {
        start() {
          g = empty(); turn = 'you'; fb = 'Tip: the middle column is the strongest.'; win = null; last = null; moves = 0;
          draw();
          A.key((e) => { if (/^[1-7]$/.test(e.key)) play(Number(e.key) - 1); });
        },
        act(a, v) { if (a === 'drop') play(Number(v)); },
        _lib: { lineAt, empty, botPick, evaluate, get g() { return g; }, set g(x) { g = x; } },
      };
    },
  };
})();

