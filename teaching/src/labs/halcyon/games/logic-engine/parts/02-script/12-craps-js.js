/* --- craps.js --- */
(() => {
  /* Craps: pass line bet with optional free odds behind it. Bankroll goal. */
  const ODDS = { 4: [2, 1], 10: [2, 1], 5: [3, 2], 9: [3, 2], 6: [6, 5], 8: [6, 5] };
  FULL['Craps'] = {
    title: 'Craps: the full game',
    intro: 'You bet on the Pass Line. Come-out roll: 7 or 11 wins, 2, 3 or 12 loses. Any other number becomes the point. Then keep rolling: hit the point again to win, roll a 7 first and you lose. After a point you may add an odds bet (same size as your bet) that pays true odds. Turn 100 chips into 250.',
    make: (A) => {
      let bank, bet, point, odds, d, fb, log, busy, rolling;
      const GOAL = 250, MIN = 5;
      const draw = () => A.draw(`<div class="arc-scene">
        <div class="arc-top"><span class="chip">Bankroll ${bank}</span><span class="chip">Goal ${GOAL}</span><span class="chip">${point ? 'Point is ' + point : 'Come-out roll'}</span></div>
        <div class="arc-row">${d ? d.map((x) => `<span class="arc-num" aria-label="Die ${x}">${x}</span>`).join('') + `<b class="arc-big-text">= ${d[0] + d[1]}</b>` : '<span class="muted">Dice not rolled yet</span>'}</div>
        <p class="arc-ask">${point ? `Pass bet ${bet}${odds ? ', odds ' + odds : ''}. Roll ${point} to win, 7 to lose.` : `Choose your Pass Line bet: ${bet}.`}</p>
        ${point ? `<div class="arc-opts">${abtn('odds', '', odds ? 'Odds added' : `Add odds ${bet} (pays ${ODDS[point][0]} to ${ODDS[point][1]})`, '', busy || odds > 0 || bet * 2 > bank)}</div>` : `<div class="arc-opts">${[5, 10, 25, 50].map((b) => abtn('bet', b, String(b), bet === b ? 'primary small' : 'small', busy || b > bank)).join('')}</div>`}
        <div class="arc-opts">${abtn('roll', '', point ? 'Roll for the point (space)' : 'Come-out roll (space)', 'primary big', busy)}</div>
        <p class="arc-fb">${fb}</p>
        <ul class="arc-log">${log.slice(0, 5).map((l) => `<li>${l}</li>`).join('')}</ul></div>`);
      const settle = (delta, msg, cls) => {
        bank += delta; fb = `<span class="${cls}">${msg}</span>`; log.unshift(msg); point = 0; odds = 0;
        if (bank >= GOAL) { busy = true; draw(); A.end(true, `You reached ${bank} chips. You win the table!`); return; }
        if (bank < MIN) { busy = true; draw(); A.end(false, `You are down to ${bank} chips, not enough for the minimum bet.`); return; }
        if (bet > bank) bet = MIN * Math.floor(bank / MIN);
        draw();
      };
      const roll = () => {
        if (busy) return;
        d = [1 + rnd(6), 1 + rnd(6)]; const s = d[0] + d[1];
        if (!point) {
          if (s === 7 || s === 11) { A.sfx('good'); return settle(bet, `Rolled ${s}: natural. Pass line wins ${bet}.`, 'good'); }
          if (s === 2 || s === 3 || s === 12) { A.sfx('bad'); return settle(-bet, `Rolled ${s}: craps. Pass line loses ${bet}.`, 'bad'); }
          point = s; fb = `Rolled ${s}. The point is ${s}. Add odds if you like, then roll again.`; log.unshift(`Rolled ${s}: point set.`); A.sfx('tick'); draw();
        } else if (s === point) {
          const win = bet + (odds ? Math.floor(odds * ODDS[point][0] / ODDS[point][1]) : 0); A.sfx('good');
          settle(win, `Rolled ${s}: you hit the point! You win ${win}.`, 'good');
        } else if (s === 7) {
          A.sfx('bad'); settle(-(bet + odds), `Rolled 7: seven out. You lose ${bet + odds}.`, 'bad');
        } else { fb = `Rolled ${s}. No decision, roll again.`; log.unshift(`Rolled ${s}: roll again.`); A.sfx('tick'); draw(); }
      };
      return {
        start() {
          bank = 100; bet = 10; point = 0; odds = 0; d = null; fb = 'Place a bet and roll the dice.'; log = []; busy = false; draw();
          A.key((e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); roll(); } });
        },
        act(a, v) {
          if (busy) return;
          if (a === 'bet' && !point) { bet = Number(v); draw(); }
          else if (a === 'odds' && point && !odds && bet * 2 <= bank) { odds = bet; fb = `Odds bet of ${odds} added. Odds pay true odds with no house edge.`; draw(); }
          else if (a === 'roll') roll();
        },
      };
    },
  };
})();

/* --- darts.js --- */
(() => {
  /* Darts: 501, three darts a turn, finish exactly on a double (bullseye counts). Going below 0, to 1, or to 0 without a double is a bust. */
  FULL['Darts'] = {
    title: 'Darts: 501 against the bot',
    intro: 'Race the bot from 501 down to exactly 0. You throw three darts a turn. Pick a number and a ring (single, double or treble), then throw. Your aim is not perfect, so darts can land next door. You must finish on a double (the bullseye counts as a double). If a turn would take you below 0, leave you on 1, or reach 0 without a double, it is a bust and the turn score is cancelled.',
    make: (A) => {
      const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
      const SK = { you: { seg: 0.55, T: 0.30, D: 0.40, Dm: 0.15, bull: 0.16 }, bot: { seg: 0.47, T: 0.25, D: 0.32, Dm: 0.22, bull: 0.11 } };
      const rf = () => Math.random();
      const pol = (r, a) => { const t = (a * Math.PI) / 180; return [r * Math.sin(t), -r * Math.cos(t)]; };
      const pt = (r, a) => pol(r, a).map((v) => v.toFixed(2)).join(' ');
      const sector = (r0, r1, a0, a1) => `M${pt(r1, a0)}A${r1} ${r1} 0 0 1 ${pt(r1, a1)}L${pt(r0, a1)}A${r0} ${r0} 0 0 0 ${pt(r0, a0)}Z`;
      let S;

      /* ---------- rules ---------- */
      const ringName = { T: 'Treble', D: 'Double', S: 'Single' };
      const short = (r) => (r.ring === 'M' ? 'Miss' : r.ring === 'B' ? 'Bull' : r.ring === 'O' ? '25' : (r.ring === 'T' ? 'T' : r.ring === 'D' ? 'D' : '') + r.seg);
      const long = (r) => (r.ring === 'M' ? 'missed the board' : r.ring === 'B' ? 'hit the bullseye (50)' : r.ring === 'O' ? 'hit the outer bull (25)' : `hit ${r.ring === 'S' ? 'single' : ringName[r.ring].toLowerCase()} ${r.seg} (${r.val})`);
      const miss = () => ({ val: 0, mult: 1, seg: 0, ring: 'M' });
      const throwDart = (n, ring, sk) => {
        if (n === 25) {
          const u = rf(), p50 = ring === 'D' ? sk.bull : sk.bull * 0.4, p25 = ring === 'D' ? 0.30 : 0.45;
          if (u < p50) return { val: 50, mult: 2, seg: 25, ring: 'B' };
          if (u < p50 + p25) return { val: 25, mult: 1, seg: 25, ring: 'O' };
          if (rf() < 0.1) return miss();
          const s = ORDER[Math.floor(rf() * 20)]; return { val: s, mult: 1, seg: s, ring: 'S' };
        }
        const idx = ORDER.indexOf(n); let off = 0;
        if (rf() >= sk.seg) { const v = rf(); off = v < 0.4 ? -1 : v < 0.8 ? 1 : (rf() < 0.5 ? -2 : 2); }
        const s = ORDER[(idx + off + 20) % 20], u = rf(); let r;
        if (ring === 'T') r = u < sk.T ? 'T' : u < 0.97 ? 'S' : 'M';
        else if (ring === 'D') r = u < sk.D ? 'D' : u < sk.D + sk.Dm ? 'M' : 'S';
        else r = u < 0.06 ? 'T' : u < 0.94 ? 'S' : u < 0.98 ? 'D' : 'M';
        if (r === 'M') return miss();
        const mult = r === 'T' ? 3 : r === 'D' ? 2 : 1;
        return { val: s * mult, mult, seg: s, ring: r };
      };
      const posFor = (r) => {
        if (r.ring === 'M') return pol(108, rf() * 360);
        if (r.ring === 'B') return pol(1.5, rf() * 360);
        if (r.ring === 'O') return pol(6.5, rf() * 360);
        const a = ORDER.indexOf(r.seg) * 18 + (rf() - 0.5) * 9;
        const rad = r.ring === 'T' ? 60.5 : r.ring === 'D' ? 97.5 : (rf() < 0.5 ? 34 : 79);
        return pol(rad, a);
      };
      /** What a sensible player aims at with this score left. Used for the bot and for the hint. */
      const aimFor = (rem) => {
        if (rem === 50) return { n: 25, ring: 'D' };
        if (rem <= 40 && rem % 2 === 0) return { n: rem / 2, ring: 'D' };
        if (rem <= 40) { for (const L of [32, 16, 8, 4, 2]) if (rem - L >= 1 && rem - L <= 20) return { n: rem - L, ring: 'S' }; return { n: 1, ring: 'S' }; }
        if (rem <= 60) return { n: rem - 40, ring: 'S' };
        if (rem - 60 === 1) return { n: 19, ring: 'T' };
        return { n: 20, ring: 'T' };
      };
      const aimText = (a) => (a.n === 25 ? (a.ring === 'D' ? 'the bullseye' : 'the outer bull') : `${a.ring === 'T' ? 'treble' : a.ring === 'D' ? 'double' : 'single'} ${a.n}`);

      /* ---------- drawing ---------- */
      const board = () => {
        let p = '';
        for (let i = 0; i < 20; i++) {
          const a0 = i * 18 - 9, a1 = i * 18 + 9, even = i % 2 === 0;
          const sing = even ? '#1c1c1c' : '#f1e6c8', col = even ? '#c0392b' : '#2e8b57';
          p += `<path d="${sector(9.4, 58.2, a0, a1)}" fill="${sing}"/><path d="${sector(58.2, 62.9, a0, a1)}" fill="${col}"/><path d="${sector(62.9, 95.3, a0, a1)}" fill="${sing}"/><path d="${sector(95.3, 100, a0, a1)}" fill="${col}"/>`;
          const [x, y] = pol(113, i * 18);
          p += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#f6dc8f" font-family="monospace">${ORDER[i]}</text>`;
        }
        return `<circle r="119" fill="#0c0c0c"/>${p}<circle r="9.4" fill="#2e8b57"/><circle r="3.7" fill="#c0392b"/>`;
      };
      const flights = () => S.marks.map((m, i) => `<g><circle cx="${m[0].toFixed(1)}" cy="${m[1].toFixed(1)}" r="3.4" fill="${S.markBy === 'you' ? '#7fc8e8' : '#ffb3ab'}" stroke="#fff" stroke-width="1"/><text x="${m[0].toFixed(1)}" y="${(m[1] - 5).toFixed(1)}" text-anchor="middle" font-size="9" fill="#fff" font-family="monospace" font-weight="700">${i + 1}</text></g>`).join('');
      const draw = () => {
        const mine = S.turn === 'you' && !S.busy && !S.over;
        const nums = Array.from({ length: 20 }, (_, i) => abtn('num', i + 1, String(i + 1), 'dt-n' + (S.n === i + 1 ? ' primary' : ''), !mine)).join('') + abtn('num', 25, 'Bull', 'dt-n' + (S.n === 25 ? ' primary' : ''), !mine);
        const bull = S.n === 25;
        const rings = [['S', bull ? 'Outer 25' : 'Single'], ['D', bull ? 'Bullseye 50' : 'Double'], ['T', 'Treble']].map(([k, t]) => abtn('ring', k, t, S.ring === k ? 'primary' : '', !mine || (bull && k === 'T'))).join('');
        const hint = aimFor(S.rem.you);
        const left = 3 - S.darts.length;
        const tl = S.darts.length ? S.darts.map(short).join(' + ') : 'no darts yet';
        A.draw(`<div class="arc-scene"><style>.dt-n{min-width:2.3rem;padding:.35rem .4rem}.dt-grid{display:flex;flex-wrap:wrap;gap:.3rem;justify-content:center;max-width:24rem}.dt-board{width:min(80vw,19rem);height:auto}.dt-big{font:700 2rem var(--mono);color:var(--ivory);margin:0;line-height:1}.dt-score{display:flex;gap:1.6rem;justify-content:center}.dt-score div{text-align:center}.dt-score small{display:block;font:600 .7rem var(--mono);color:var(--brass-hi)}</style>
          <div class="dt-score"><div><small>YOU</small><p class="dt-big" aria-label="Your score left">${S.rem.you}</p></div><div><small>BOT</small><p class="dt-big" aria-label="Bot score left">${S.rem.bot}</p></div></div>
          <div class="arc-top"><span class="chip">Double out</span><span class="chip">${S.turn === 'you' ? 'Your turn' : 'Bot turn'}</span><span class="chip">Turn ${S.turnNo}</span></div>
          <svg class="dt-board" viewBox="-125 -125 250 250" role="img" aria-label="Dartboard">${board()}${flights()}</svg>
          <p class="arc-ask" aria-live="polite">${S.turn === 'you' ? `Darts left this turn: ${left}. This turn: ${tl}.` : `Bot this turn: ${tl}.`}</p>
          <p class="arc-fb">${S.fb}</p>
          <div class="dt-grid">${nums}</div>
          <div class="arc-opts">${rings}</div>
          <div class="arc-opts">${abtn('throw', '', 'Throw (t)', 'primary big', !mine)}${abtn('hint', '', 'Use hint', '', !mine)}</div>
          <p class="muted">Aim: ${bull ? (S.ring === 'D' ? 'bullseye (50)' : 'outer bull (25)') : ringName[S.ring].toLowerCase() + ' ' + S.n}. Hint: try ${aimText(hint)}.</p></div>`);
      };

      /* ---------- turn flow ---------- */
      const beginTurn = (who) => {
        S.turn = who; S.darts = []; S.marks = []; S.markBy = who; S.turnStart = S.rem[who]; S.busy = false;
        if (who === 'you') { S.turnNo++; }
        draw();
        if (who === 'bot') { S.busy = true; A.after(botDart, 800); }
      };
      const endTurn = (who, note) => {
        S.busy = true; S.fb = note; draw();
        A.after(() => beginTurn(who === 'you' ? 'bot' : 'you'), 1400);
      };
      const land = (who, r) => {
        const name = who === 'you' ? 'You' : 'The bot';
        const rem = S.rem[who], nw = rem - r.val;
        S.darts.push(r); S.marks.push(posFor(r));
        if (nw === 0 && r.mult === 2) {
          S.rem[who] = 0; S.over = true; draw(); A.sfx('clear');
          return A.end(who === 'you', who === 'you' ? `Double out! You checked out on ${short(r)}. You win!` : `The bot checked out on ${short(r)}. Try again.`);
        }
        if (nw < 0 || nw === 1 || nw === 0) {
          S.rem[who] = S.turnStart; A.sfx('bad');
          const why = nw === 0 ? 'Reaching 0 needs a double' : nw === 1 ? 'Leaving 1 is impossible to finish' : 'That is below zero';
          return endTurn(who, `${name} ${long(r)}. Bust! ${why}, so the turn score is cancelled. Back to ${S.turnStart}.`);
        }
        S.rem[who] = nw; A.sfx(r.val >= 40 ? 'good' : 'tick');
        if (S.darts.length >= 3) return endTurn(who, `${name} ${long(r)}. Turn total ${S.turnStart - nw}. ${name === 'You' ? 'You have' : 'The bot has'} ${nw} left.`);
        S.fb = `${name} ${long(r)}. ${nw} left.`; draw();
        if (who === 'bot') A.after(botDart, 800);
      };
      const botDart = () => {
        if (S.over || S.turn !== 'bot') return;
        const a = aimFor(S.rem.bot);
        land('bot', throwDart(a.n, a.ring, SK.bot));
      };
      const doThrow = () => {
        if (S.turn !== 'you' || S.busy || S.over) return;
        const r = throwDart(S.n, S.n === 25 && S.ring === 'T' ? 'D' : S.ring, SK.you);
        land('you', r);
      };
      return {
        start() {
          S = { rem: { you: 501, bot: 501 }, turn: 'you', darts: [], marks: [], markBy: 'you', turnStart: 501, turnNo: 0, n: 20, ring: 'T', fb: 'You throw first. Aim at treble 20 to score big.', busy: false, over: false };
          beginTurn('you');
          A.key((e) => { if (e.key === 't' || e.key === 'T') doThrow(); });
        },
        act(a, v) {
          if (S.turn !== 'you' || S.busy || S.over) return;
          if (a === 'num') { S.n = Number(v); if (S.n === 25 && S.ring === 'T') S.ring = 'D'; draw(); }
          else if (a === 'ring') { S.ring = v; draw(); }
          else if (a === 'hint') { const h = aimFor(S.rem.you); S.n = h.n; S.ring = h.ring; draw(); }
          else if (a === 'throw') doThrow();
        },
      };
    },
  };
})();

/* --- dominoes.js --- */
(() => {
  /* Dominoes: double-six, you against a bot. 7 tiles each, a boneyard of 14. Match a tile to either end of the chain. If you cannot play, draw from the boneyard until you can. Empty hand wins the round and scores the pips left in the other hand. If both players are stuck, the lower pip total wins the difference. First to 50 wins. */
  const TARGET = 50;
  const POS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
  const pips = (h) => h.reduce((s, t) => s + t[0] + t[1], 0);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const deck = () => { const d = []; for (let i = 0; i <= 6; i++) for (let j = i; j <= 6; j++) d.push([i, j]); return shuffle(d); };
  const ends = (chain) => (chain.length ? [chain[0][0], chain[chain.length - 1][1]] : null);
  const fits = (chain, t) => { const e = ends(chain); return !e || t[0] === e[0] || t[1] === e[0] || t[0] === e[1] || t[1] === e[1]; };
  const sidesFor = (chain, t) => { const e = ends(chain); if (!e) return ['R']; const s = []; if (t[0] === e[0] || t[1] === e[0]) s.push('L'); if (t[0] === e[1] || t[1] === e[1]) s.push('R'); return s; };
  // returns a new chain with tile t added at side
  const addTile = (chain, t, side) => {
    if (!chain.length) return [t.slice()];
    const e = ends(chain);
    if (side === 'L') return [(t[1] === e[0] ? [t[0], t[1]] : [t[1], t[0]])].concat(chain);
    return chain.concat([(t[0] === e[1] ? [t[0], t[1]] : [t[1], t[0]])]);
  };
  // starting tile: highest double, else highest tile
  const starter = (hands) => {
    let best = null, who = null;
    for (const w of ['you', 'bot']) for (const t of hands[w]) {
      const k = (t[0] === t[1] ? 100 : 0) + t[0] + t[1] + Math.max(t[0], t[1]) / 10;
      if (best === null || k > best) { best = k; who = w; }
    }
    const t = hands[who].find((x) => (x[0] === x[1] ? 100 : 0) + x[0] + x[1] + Math.max(x[0], x[1]) / 10 === best);
    return { who, t };
  };
  const botChoose = (hand, chain, missing) => {
    let best = -1e9, pick = null;
    hand.forEach((t, i) => {
      for (const side of sidesFor(chain, t)) {
        const nc = addTile(chain, t, side), e = ends(nc), rest = hand.filter((_, k) => k !== i);
        let s = t[0] + t[1] + (t[0] === t[1] ? 2 : 0);
        for (const v of new Set(e)) { s += rest.filter((r) => r[0] === v || r[1] === v).length * 1.5; if (missing.has(v)) s += 4; }
        s += Math.random() * 0.5;
        if (s > best) { best = s; pick = { i, side }; }
      }
    });
    return pick;
  };

  FULL['Dominoes'] = {
    title: 'Dominoes: the full game',
    intro: 'Double-six dominoes against a bot. Each of you gets 7 tiles. Play a tile that matches either end of the chain. Stuck? Draw from the boneyard until you can play. Empty your hand to win the round and score the pips left in the bot\'s hand. If both of you are stuck, the lower total wins the difference. First to 50 points wins the match.',
    make: (A) => {
      let hands, yard, chain, turn, passes, score, round, fb, pending, missing, phase, first, roundMsg;
      const pipHalf = (v) => `<span class="dm-h">${Array.from({ length: 9 }, (_, i) => `<i class="${POS[v].includes(i) ? 'on' : ''}"></i>`).join('')}</span>`;
      const tile = (t, extra = '') => `<span class="dm-t${t[0] === t[1] ? ' dbl' : ''} ${extra}">${pipHalf(t[0])}<span class="dm-sep"></span>${pipHalf(t[1])}</span>`;
      const css = `<style>.dm-t{display:inline-flex;background:var(--ivory);border:2px solid #333;border-radius:6px;padding:2px;gap:0;align-items:center;flex:none}.dm-t.dbl{flex-direction:column}.dm-h{display:grid;grid-template-columns:repeat(3,.28rem);grid-template-rows:repeat(3,.28rem);gap:1px;padding:2px}.dm-h i{border-radius:50%}.dm-h i.on{background:#1a1a1a}.dm-sep{width:2px;align-self:stretch;background:#333}.dm-t.dbl .dm-sep{width:auto;height:2px;align-self:stretch}.dm-chain{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;align-items:center;padding:.5rem;border-radius:12px;background:rgba(0,0,0,.25);min-height:4rem;width:min(98vw,36rem)}.dm-hand{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center}.dm-hb{background:none;border:2px solid transparent;border-radius:8px;padding:2px;cursor:pointer;line-height:0}.dm-hb:disabled{opacity:.4;cursor:default}.dm-hb:hover:not(:disabled){border-color:var(--brass-hi)}.dm-hb.sel{border-color:var(--brass-hi)}.dm-back{display:inline-block;width:1.2rem;height:2.3rem;border-radius:4px;background:#2d5d8a;border:2px solid #1a3a5a}</style>`;
      const playable = () => hands.you.filter((t) => fits(chain, t) && (chain.length || (first && first.t === t)));
      const draw = () => {
        const e = ends(chain);
        const botBacks = hands.bot.map(() => '<i class="dm-back"></i>').join('');
        const mine = hands.you.map((t, i) => { const ok = turn === 'you' && phase === 'play' && fits(chain, t) && (chain.length || t === first.t); return `<button type="button" class="dm-hb${pending === i ? ' sel' : ''}" data-act="tile" data-v="${i}" aria-label="Tile ${t[0]} and ${t[1]}${ok ? ', can play' : ', cannot play'}"${ok && !A.over ? '' : ' disabled'}>${tile(t)}</button>`; }).join('');
        const can = turn === 'you' && phase === 'play' && chain.length > 0 && !playable().length;
        let ask = '';
        if (phase === 'between') ask = roundMsg;
        else if (turn === 'bot') ask = 'Bot is playing...';
        else if (pending !== null) ask = 'This tile fits both ends. Which end?';
        else if (!chain.length) ask = 'You start. Play your highest tile.';
        else if (can) ask = yard.length ? 'You cannot play. Draw from the boneyard.' : 'The boneyard is empty and you cannot play. Pass.';
        else if (turn === 'you') ask = 'Your turn. Tap a tile that matches an end.';
        A.draw(`${css}<div class="arc-top"><span class="chip">You <b>${score.you}</b></span><span class="chip">Bot <b>${score.bot}</b></span><span class="chip">Round <b>${round}</b></span><span class="chip">Boneyard <b>${yard.length}</b></span><span class="chip">To ${TARGET}</span></div>
          <div class="arc-scene"><div aria-label="Bot has ${hands.bot.length} tiles" style="display:flex;gap:3px;flex-wrap:wrap;justify-content:center;min-height:2.4rem">${botBacks}</div>
          <div class="dm-chain" role="group" aria-label="Chain of tiles${e ? `, left end ${e[0]}, right end ${e[1]}` : ', empty'}">${chain.length ? chain.map((t) => tile(t)).join('') : '<span class="muted">No tiles yet</span>'}</div>
          ${e ? `<p class="arc-fb" style="min-height:0">Left end <b>${e[0]}</b> | Right end <b>${e[1]}</b></p>` : ''}
          <div class="dm-hand" role="group" aria-label="Your tiles">${mine}</div>
          <p class="arc-ask">${ask}</p>
          <div class="arc-opts">${pending !== null ? abtn('side', 'L', `Left end (${e[0]})`, 'primary') + abtn('side', 'R', `Right end (${e[1]})`, 'primary') + abtn('cancel', '', 'Cancel') : ''}${can && yard.length ? abtn('drawtile', '', 'Draw a tile', 'primary') : ''}${can && !yard.length ? abtn('pass', '', 'Pass', 'primary') : ''}${phase === 'between' ? abtn('next', '', 'Next round', 'primary') : ''}</div>
          <p class="arc-fb">${fb}</p></div>`);
      };
      const endRound = (winner, blocked) => {
        phase = 'between'; turn = 'none';
        let pts = 0, text;
        const py = pips(hands.you), pb = pips(hands.bot);
        if (!blocked) { pts = winner === 'you' ? pb : py; text = `${winner === 'you' ? 'You' : 'The bot'} played the last tile and scored ${pts} pips.`; }
        else if (py === pb) { winner = null; text = `Blocked. Both hands have ${py} pips. No points.`; }
        else { winner = py < pb ? 'you' : 'bot'; pts = Math.abs(py - pb); text = `Blocked. You have ${py} pips, the bot has ${pb}. ${winner === 'you' ? 'You' : 'The bot'} scores ${pts}.`; }
        if (winner) score[winner] += pts;
        roundMsg = text; fb = '';
        if (score.you >= TARGET || score.bot >= TARGET) {
          draw();
          if (score.you >= score.bot) A.end(true, `${text} You win the match ${score.you} to ${score.bot}!`); else A.end(false, `${text} The bot wins the match ${score.bot} to ${score.you}. Try again.`);
          return;
        }
        A.sfx(winner === 'you' ? 'good' : 'tick'); draw();
      };
      const afterPlay = (who) => {
        passes = 0;
        if (!hands[who].length) return endRound(who, false);
        if (who === 'you') botTurn(); else { turn = 'you'; draw(); }
      };
      const passTurn = (who) => {
        passes++;
        if (passes >= 2) return endRound(null, true);
        if (who === 'you') { fb = 'You passed.'; botTurn(); } else { fb = (fb ? fb + ' ' : '') + 'Bot passed.'; turn = 'you'; draw(); }
      };
      const playIdx = (who, i, side) => {
        const t = hands[who].splice(i, 1)[0]; chain = addTile(chain, t, side); pending = null;
        fb = `${who === 'you' ? 'You' : 'Bot'} played ${t[0]}-${t[1]}.`; A.sfx('tick'); afterPlay(who);
      };
      const botTurn = () => {
        turn = 'bot'; pending = null; draw();
        const step = () => {
          const opts = hands.bot.filter((t) => fits(chain, t) && (chain.length || t === first.t));
          if (opts.length) {
            const pk = chain.length ? botChoose(hands.bot, chain, missing) : { i: hands.bot.indexOf(first.t), side: 'R' };
            return playIdx('bot', pk.i, pk.side);
          }
          if (yard.length) { hands.bot.push(yard.pop()); fb = 'Bot drew a tile.'; draw(); return A.after(step, 600); }
          return passTurn('bot');
        };
        A.after(step, 800);
      };
      const newRound = () => {
        const d = deck(); hands = { you: d.splice(0, 7), bot: d.splice(0, 7) }; yard = d; chain = []; passes = 0; pending = null; missing = new Set(); phase = 'play'; roundMsg = ''; fb = '';
        first = starter(hands);
        if (first.who === 'you') { turn = 'you'; fb = `You hold the highest tile (${first.t[0]}-${first.t[1]}). Play it.`; draw(); }
        else { fb = 'Bot starts with the highest tile.'; botTurn(); }
      };
      return {
        start() { score = { you: 0, bot: 0 }; round = 1; newRound(); },
        act(a, v) {
          if (phase === 'between') { if (a === 'next') { round++; newRound(); } return; }
          if (turn !== 'you') return;
          if (a === 'tile') {
            const i = Number(v), t = hands.you[i]; if (!t || !fits(chain, t)) return;
            if (!chain.length && t !== first.t) return;
            const e = ends(chain), s = sidesFor(chain, t);
            if (s.length === 1 || (e && e[0] === e[1])) return playIdx('you', i, s[s.length - 1]);
            pending = i; draw();
          } else if (a === 'side' && pending !== null) playIdx('you', pending, v);
          else if (a === 'cancel') { pending = null; draw(); }
          else if (a === 'drawtile' && chain.length && !playable().length && yard.length) {
            const e = ends(chain); missing.add(e[0]); missing.add(e[1]);
            hands.you.push(yard.pop()); fb = 'You drew a tile.'; A.sfx('tick'); draw();
          } else if (a === 'pass' && chain.length && !playable().length && !yard.length) { const e = ends(chain); missing.add(e[0]); missing.add(e[1]); passTurn('you'); }
        },
        _lib: { fits, addTile, sidesFor, ends, pips, deck, get s() { return { hands, yard, chain, score, turn }; } },
      };
    },
  };
})();

