/* --- pig.js --- */
(() => {
  /* Pig: roll as often as you like and bank the turn total. Roll a 1 and the turn total is lost. First to 100 wins. */
  FULL['Pig'] = {
    title: 'Pig: the full game',
    intro: 'Take turns with the bot. On your turn, roll the die again and again and add each roll to your turn total. Roll a 1 and you lose the whole turn total and the turn ends. Press Hold to bank the turn total into your score. First to 100 wins.',
    make: (A) => {
      const GOAL = 100;
      let me, bot, tp, turn, die, fb, busy;
      const bar = (n, c) => `<div class="pgf-bar" aria-hidden="true"><i style="width:${Math.min(100, n)}%;background:${c}"></i></div>`;
      const draw = () => {
        const mine = turn === 'you' && !busy;
        A.draw(`<div class="arc-scene"><style>.pgf-bar{width:min(86vw,24rem);height:.7rem;border:1px solid var(--line);border-radius:6px;overflow:hidden;background:rgba(0,0,0,.3)}.pgf-bar i{display:block;height:100%}.pgf-turn{font:700 1.4rem var(--mono);color:var(--brass-hi);margin:0}</style>
          <div class="arc-top"><span class="chip">You ${me}</span><span class="chip">Bot ${bot}</span><span class="chip">First to ${GOAL}</span></div>
          ${bar(me, 'var(--mint)')}${bar(bot, 'var(--ruby)')}
          <div class="arc-row">${die ? `<span class="arc-num" aria-label="Die shows ${die}">${die}</span>` : '<span class="muted">No roll yet</span>'}</div>
          <p class="pgf-turn" aria-live="polite">Turn total: ${tp}</p>
          <p class="arc-ask">${turn === 'you' ? 'Your turn. Roll again, or hold to bank ' + tp + '.' : 'The bot is playing...'}</p>
          <div class="arc-opts">${abtn('roll', '', 'Roll (r)', 'primary big', !mine)}${abtn('hold', '', 'Hold (h)', 'big', !mine || tp === 0)}</div>
          <p class="arc-fb">${fb}</p><p class="muted">Each roll has a 1 in 6 chance of a 1.</p></div>`);
      };
      const next = (who) => { turn = who; busy = false; draw(); if (who === 'bot') { busy = true; A.after(botStep, 900); } };
      const hold = (who) => {
        const name = who === 'you' ? 'You' : 'The bot';
        if (who === 'you') me += tp; else bot += tp;
        fb = `${name} banked ${tp}.`; tp = 0; A.sfx('good');
        const s = who === 'you' ? me : bot;
        if (s >= GOAL) { busy = true; draw(); return A.end(who === 'you', who === 'you' ? `You banked your way to ${me}. You win!` : `The bot reached ${bot} first. Try again.`); }
        next(who === 'you' ? 'bot' : 'you');
      };
      const roll = (who) => {
        die = 1 + rnd(6);
        if (die === 1) { fb = `${who === 'you' ? 'You' : 'The bot'} rolled a 1 and lost ${tp} points.`; tp = 0; A.sfx('bad'); return next(who === 'you' ? 'bot' : 'you'); }
        tp += die; fb = `${who === 'you' ? 'You' : 'The bot'} rolled ${die}.`; A.sfx('tick'); busy = who === 'bot'; draw();
        if (who === 'bot') A.after(botStep, 800);
      };
      const botStep = () => {
        const target = Math.max(14, Math.min(34, Math.round(20 + (me - bot) / 6)));
        if (bot + tp >= GOAL || (tp >= target && tp > 0)) hold('bot'); else roll('bot');
      };
      return {
        start() {
          me = 0; bot = 0; tp = 0; die = 0; fb = 'You go first.'; turn = 'you'; busy = false; draw();
          A.key((e) => { if (turn !== 'you' || busy) return; if (e.key === 'r' || e.key === ' ') { e.preventDefault(); roll('you'); } else if (e.key === 'h' && tp > 0) hold('you'); });
        },
        act(a) {
          if (turn !== 'you' || busy) return;
          if (a === 'roll') roll('you'); else if (a === 'hold' && tp > 0) hold('you');
        },
      };
    },
  };
})();

/* --- pistolero.js --- */
(() => {
  /* Pistolero: simultaneous-move duel. Reload, shoot, shield or cannon. 3 lives each. */
  FULL['Pistolero'] = {
    title: 'Pistolero: the full game',
    intro: 'Each of you has 3 lives and starts with no bullets. Both pick a move at the same time. Reload gains a bullet. Shoot costs 1 bullet and only hurts someone who is reloading. Shield blocks a shot. Cannon costs 3 bullets and hits whatever the other does, unless both fire cannons. First to take the other down to 0 lives wins.',
    make: (A) => {
      const NAMES = ['Reload', 'Shoot', 'Shield', 'Cannon'];
      const KEYS = { r: 0, s: 1, b: 2, c: 3 };
      let hp, ammo, log, round, fb, locked;
      const canDo = (am, m) => (m === 1 ? am >= 1 : m === 3 ? am >= 3 : true);
      const duel = (a, b) => {
        if (a === 3 && b !== 3) return 1;
        if (b === 3 && a !== 3) return -1;
        if (a === 1 && b === 0) return 1;
        if (b === 1 && a === 0) return -1;
        return 0;
      };
      const useAmmo = (am, m) => (m === 0 ? am + 1 : m === 1 ? am - 1 : m === 3 ? am - 3 : am);
      const botMove = () => {
        const me = ammo[1], you = ammo[0], w = [0, 0, 0, 0];
        w[0] = me < 3 ? 3 : 1;
        w[2] = you >= 1 ? 3 : 0.5;
        if (me >= 1) w[1] = you === 0 ? 3.5 : 1;
        if (me >= 3) w[3] = 5;
        if (me >= 3 && you >= 3) w[3] = 6;
        if (hp[1] === 1 && you >= 3) w[3] += 2;
        let r = Math.random() * w.reduce((s, x) => s + x, 0);
        for (let m = 0; m < 4; m++) { if (r < w[m]) return m; r -= w[m]; }
        return 0;
      };
      const hearts = (n) => (n > 0 ? Array.from({ length: n }, () => '<span class="ps-h">&#9829;</span>').join('') : '<span class="muted">none</span>');
      const bullets = (n) => `<span class="ps-b" aria-label="${n} bullets">${n}</span>`;
      const draw = () => {
        A.draw(`<style>.ps-h{color:var(--ruby)}.ps-b{display:inline-grid;place-items:center;min-width:1.6rem;height:1.6rem;border-radius:50%;background:var(--brass-hi);color:#1b1408;font:700 0.85rem var(--mono)}
          .ps-log{list-style:none;margin:0;padding:0;display:grid;gap:0.2rem;font:0.8rem var(--mono);width:min(100%,28rem)}.ps-log li{padding:0.25rem 0.5rem;border-radius:6px;background:rgba(0,0,0,0.25)}</style>
          <div class="arc-scene" style="width:100%"><div class="arc-top"><span class="chip">You: ${hearts(hp[0])} bullets ${bullets(ammo[0])}</span><span class="chip">Bandit: ${hearts(hp[1])} bullets ${bullets(ammo[1])}</span></div>
          <p class="arc-ask">Round ${round}. Pick your move.</p>
          <div class="arc-opts">${NAMES.map((n, k) => abtn('mv', k, `${n}${' (' + 'RSBC'[k] + ')'}`, k === 3 ? 'primary' : '', A.over || locked || !canDo(ammo[0], k))).join('')}</div>
          <p class="muted" style="margin:0;font-size:0.8rem;text-align:center">Shoot needs 1 bullet. Cannon needs 3.</p>
          <p class="arc-fb" aria-live="polite">${fb}</p>
          <ul class="ps-log" aria-label="Round history">${log.map((l) => `<li>${l}</li>`).join('')}</ul></div>`);
      };
      return {
        start() { hp = [3, 3]; ammo = [0, 0]; log = []; round = 1; fb = 'Draw! Both pick at once.'; locked = false; draw(); A.key((e) => { const m = KEYS[e.key.toLowerCase()]; if (m !== undefined && !locked && canDo(ammo[0], m)) this.act('mv', String(m)); }); },
        act(a, v) {
          if (a !== 'mv' || locked) return;
          const me = Number(v); if (!(me >= 0 && me <= 3) || !canDo(ammo[0], me)) return;
          const bot = botMove(); locked = true;
          const res = duel(me, bot);
          ammo[0] = useAmmo(ammo[0], me); ammo[1] = useAmmo(ammo[1], bot);
          let out;
          if (res === 1) { hp[1]--; out = me === 3 ? 'Your cannon blasts the bandit. He loses a life.' : 'Your shot hits the bandit while he reloads. He loses a life.'; A.sfx('good'); }
          else if (res === -1) { hp[0]--; out = bot === 3 ? 'The bandit fires a cannon. You lose a life.' : 'The bandit shoots you while you reload. You lose a life.'; A.sfx('bad'); }
          else { out = me === 2 && bot === 1 ? 'The bandit shot and your shield held. Nobody is hit.' : me === 1 && bot === 2 ? 'You shot into his shield. Nobody is hit.' : me === 3 && bot === 3 ? 'Two cannons collide. Nobody is hit.' : me === 1 && bot === 1 ? 'Both of you shot. Nobody is hit.' : 'Nobody is hit.'; A.sfx('tick'); }
          fb = `You: ${NAMES[me]}. Bandit: ${NAMES[bot]}. ${out}`;
          log.unshift(`Round ${round}: ${NAMES[me]} vs ${NAMES[bot]} ${res === 1 ? '(bandit hit)' : res === -1 ? '(you are hit)' : '(no hit)'}`); log.length = Math.min(log.length, 5);
          round++;
          if (hp[0] <= 0 || hp[1] <= 0) { draw(); A.end(hp[1] <= 0, hp[1] <= 0 ? 'The bandit is down. You win the duel!' : 'You are down. The bandit wins. Try again.'); return; }
          locked = false; draw();
        },
      };
    },
  };
})();

/* --- poker.js --- */
(() => {
  /* Five card draw against one computer opponent. Ante, deal five, discard and draw, one betting round (check or bet, then call or fold), showdown. Whoever runs the other out of chips wins. */
  const START = 100, ANTE = 10;
  const RN = { 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' };
  const RNP = { 2: 'Twos', 3: 'Threes', 4: 'Fours', 5: 'Fives', 6: 'Sixes', 7: 'Sevens', 8: 'Eights', 9: 'Nines', 10: 'Tens', 11: 'Jacks', 12: 'Queens', 13: 'Kings', 14: 'Aces' };
  const SN = ['spades', 'hearts', 'diamonds', 'clubs'];
  const CATS = ['High card', 'One pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'];
  const rk = (c) => (c % 13) + 2, st = (c) => Math.floor(c / 13);
  const cname = (c) => RN[rk(c)] + ' of ' + SN[st(c)];
  /* score: [category, tiebreak ranks...] compared left to right */
  const evalHand = (h) => {
    const ranks = h.map(rk).sort((a, b) => b - a);
    const cnt = {}; ranks.forEach((r) => { cnt[r] = (cnt[r] || 0) + 1; });
    const groups = Object.keys(cnt).map(Number).sort((a, b) => cnt[b] - cnt[a] || b - a);
    const flush = h.every((c) => st(c) === st(h[0]));
    const uniq = groups.length === 5;
    let straight = uniq && ranks[0] - ranks[4] === 4, high = ranks[0];
    if (uniq && ranks.join() === '14,5,4,3,2') { straight = true; high = 5; }
    const shape = groups.map((g) => cnt[g]).join('');
    if (straight && flush) return [8, high];
    if (shape === '41') return [7, ...groups];
    if (shape === '32') return [6, ...groups];
    if (flush) return [5, ...ranks];
    if (straight) return [4, high];
    if (shape === '311') return [3, ...groups];
    if (shape === '221') return [2, ...groups];
    if (shape === '2111') return [1, ...groups];
    return [0, ...ranks];
  };
  const cmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; };
  const nameOf = (s) => {
    const [c, a, b] = s;
    if (c === 8) return a === 14 ? 'Royal flush' : 'Straight flush, ' + RN[a] + ' high';
    if (c === 7) return 'Four ' + RNP[a];
    if (c === 6) return 'Full house, ' + RNP[a] + ' over ' + RNP[b];
    if (c === 5) return 'Flush, ' + RN[a] + ' high';
    if (c === 4) return 'Straight, ' + RN[a] + ' high';
    if (c === 3) return 'Three ' + RNP[a];
    if (c === 2) return 'Two pair, ' + RNP[a] + ' and ' + RNP[b];
    if (c === 1) return 'Pair of ' + RNP[a];
    return RN[a] + ' high';
  };
  /* computer draw: returns indexes to discard */
  const botDiscard = (h) => {
    const s = evalHand(h), idx = h.map((_, i) => i);
    if (s[0] >= 4) return [];
    const byRank = (r) => idx.filter((i) => rk(h[i]) === r);
    if (s[0] === 3) return idx.filter((i) => rk(h[i]) !== s[1]);
    if (s[0] === 2) return idx.filter((i) => rk(h[i]) !== s[1] && rk(h[i]) !== s[2]);
    if (s[0] === 1) return idx.filter((i) => rk(h[i]) !== s[1]);
    for (let su = 0; su < 4; su++) { const m = idx.filter((i) => st(h[i]) === su); if (m.length === 4) return idx.filter((i) => st(h[i]) !== su); }
    const rs = [...new Set(h.map(rk))].sort((a, b) => a - b);
    for (let lo = 2; lo <= 10; lo++) { const m = idx.filter((i) => rk(h[i]) >= lo && rk(h[i]) <= lo + 4); const u = new Set(m.map((i) => rk(h[i]))); if (u.size === 4 && m.length === 4) return idx.filter((i) => !m.includes(i)); }
    void rs; void byRank;
    const sorted = idx.slice().sort((a, b) => rk(h[b]) - rk(h[a]));
    return sorted.slice(rk(h[sorted[0]]) === 14 ? 1 : 2);
  };
  const STYLE = `<style>
.pk-top{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;font:600 .8rem var(--mono)}
.pk-top span{padding:.25rem .6rem;border:1px solid var(--line);border-radius:999px;background:rgba(0,0,0,.25)}
.pk-hand{display:flex;gap:.35rem;justify-content:center;flex-wrap:nowrap}
.pk-c{background:none;border:0;padding:0;cursor:pointer;color:inherit}
.pk-c:disabled{cursor:default}
.pk-hand .pcard{width:min(3.2rem,15vw)}
.pk-c.swap .pcard{opacity:.45;outline:3px dashed var(--ruby);outline-offset:1px}
.pk-lab{font:700 .8rem var(--mono);color:var(--brass-hi);margin:0}
</style>`;
  FULL['Poker'] = {
    title: 'Poker: five card draw',
    intro: 'Five card draw against the computer. Each hand: both ante ' + ANTE + ', you get five cards, swap up to three of them, then one round of betting. Check or bet, and call or fold when the bot bets. Best hand wins the pot. Win by taking all the bot\'s chips. Ranks from best: straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, pair, high card.',
    make: (A) => {
      let deck, you, bot, pot, pb, bb, phase, sel, fb, owed, hand, reveal, botNote;
      const hid = () => '<div class="pslot"><i></i><div class="pcard back"></div></div>';
      const card = (c, i, interactive) => {
        const on = sel.has(i);
        const inner = pokerCardHtml(rk(c), st(c), '', '', interactive ? (on ? 'swap' : 'keep') : undefined);
        return interactive ? `<button type="button" class="pk-c${on ? ' swap' : ''}" data-act="tog" data-v="${i}" aria-pressed="${on}" aria-label="${esc(cname(c))}, ${on ? 'will be swapped' : 'kept'}">${inner}</button>` : `<span class="pk-c">${inner}</span>`;
      };
      const draw = () => {
        const youScore = evalHand(you);
        const showBot = reveal;
        let ctl = '';
        if (phase === 'draw') ctl = `<p class="arc-ask">Tap the cards you want to swap (up to 3), then draw.</p><div class="arc-opts">${abtn('draw', '', sel.size ? `Swap ${sel.size} and draw` : 'Stand pat (keep all)', 'primary')}</div>`;
        else if (phase === 'bet') {
          const cap = Math.min(pb, bb);
          const amts = [10, 25, cap].filter((x, i, a) => x > 0 && x <= cap && a.indexOf(x) === i);
          ctl = `<p class="arc-ask">Betting round. Pot ${pot}.</p><div class="arc-opts">${abtn('check', '', 'Check', 'primary')}${amts.map((x) => abtn('bet', x, x === cap && x !== 10 && x !== 25 ? `All in ${x}` : `Bet ${x}`)).join('')}${abtn('fold', '', 'Fold')}</div>`;
        } else if (phase === 'call') {
          ctl = `<p class="arc-ask">The bot bets ${owed}. Pot ${pot}.</p><div class="arc-opts">${abtn('call', '', `Call ${Math.min(owed, pb)}`, 'primary')}${abtn('fold', '', 'Fold')}</div>`;
        } else if (phase === 'next') ctl = `<div class="arc-opts">${abtn('next', '', 'Deal next hand', 'primary')}</div>`;
        else ctl = '<p class="arc-ask">Bot is thinking...</p>';
        A.draw(`${STYLE}<div class="arc-scene">
          <div class="pk-top"><span>You ${pb}</span><span>Bot ${bb}</span><span>Pot ${pot}</span><span>Hand ${hand}</span></div>
          <p class="pk-lab">Bot${showBot ? ': ' + nameOf(evalHand(bot)) : ''}</p>
          <div class="pk-hand" aria-label="Bot hand">${bot.map((c) => (showBot ? card(c, 0, false) : hid())).join('')}</div>
          <p class="arc-fb">${fb}</p>
          <p class="pk-lab">You: ${nameOf(youScore)}</p>
          <div class="pk-hand" aria-label="Your hand">${you.map((c, i) => card(c, i, phase === 'draw')).join('')}</div>
          ${ctl}</div>`);
      };
      const newDeck = () => { const d = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = rnd(i + 1); [d[i], d[j]] = [d[j], d[i]]; } return d; };
      const deal = () => {
        deck = newDeck(); hand++; sel = new Set(); reveal = false; owed = 0;
        const a = Math.min(ANTE, pb, bb); pb -= a; bb -= a; pot = 2 * a;
        you = deck.splice(0, 5); bot = deck.splice(0, 5);
        phase = 'draw'; fb = `Both ante ${a}. Your cards are dealt.`; A.sfx('tick'); draw();
      };
      const checkEnd = () => {
        if (pb <= 0) { A.end(false, 'You are out of chips. The bot wins the match.'); return true; }
        if (bb <= 0) { A.end(true, 'You took every chip. You win the match!'); return true; }
        return false;
      };
      const finishHand = (winner, why) => {
        if (winner === 'you') pb += pot; else if (winner === 'bot') bb += pot; else { const h = Math.floor(pot / 2); pb += h; bb += pot - h; }
        fb = why + (winner === 'you' ? ` You win ${pot}.` : winner === 'bot' ? ` The bot wins ${pot}.` : ' The pot is split.');
        A.sfx(winner === 'you' ? 'good' : winner === 'bot' ? 'bad' : 'tick');
        pot = 0; phase = 'next'; draw();
        checkEnd();
      };
      const showdown = () => {
        reveal = true;
        const a = evalHand(you), b = evalHand(bot), d = cmp(a, b);
        finishHand(d > 0 ? 'you' : d < 0 ? 'bot' : 'tie', `Showdown: you have ${nameOf(a)}, the bot has ${nameOf(b)}.`);
      };
      const strength = () => { const s = evalHand(bot); return s[0] >= 2 ? 2 : s[0] === 1 && s[1] >= 10 ? 1.5 : s[0] === 1 ? 1 : 0; };
      const botAfterDraw = () => {
        phase = 'wait'; draw();
        A.after(() => { phase = 'bet'; fb = botNote + ' Your move.'; draw(); }, 700);
      };
      const botReplyToBet = (x) => {
        phase = 'wait'; draw();
        A.after(() => {
          const s = strength(), s0 = evalHand(bot);
          const callP = s >= 2 ? 1 : s === 1.5 ? (x <= 10 ? 0.9 : 0.6) : s === 1 ? (x <= 10 ? 0.6 : 0.3) : (x <= 10 ? 0.3 : 0.12);
          void s0;
          if (Math.random() < callP) { bb -= x; pot += x; fb = `The bot calls ${x}.`; showdown(); } else { fb = `The bot folds.`; finishHand('you', 'The bot folds.'); }
        }, 800);
      };
      const botActsAfterCheck = () => {
        phase = 'wait'; draw();
        A.after(() => {
          const s = strength(), cap = Math.min(pb, bb);
          const betP = s >= 2 ? 0.75 : s === 1.5 ? 0.5 : s === 1 ? 0.2 : 0.12;
          if (cap > 0 && Math.random() < betP) {
            owed = Math.min(s >= 2 ? 25 : 10, cap); bb -= owed; pot += owed; phase = 'call'; fb = 'You checked. The bot bets.'; draw();
          } else { fb = 'You both check.'; showdown(); }
        }, 800);
      };
      return {
        start() {
          pb = START; bb = START; hand = 0; botNote = ''; A.key((e) => {
            const k = e.key.toLowerCase();
            if (phase === 'draw' && k >= '1' && k <= '5') this.act('tog', String(Number(k) - 1));
            else if (phase === 'draw' && (k === 'd' || k === 'enter')) this.act('draw');
            else if (phase === 'next' && (k === 'n' || k === 'enter')) this.act('next');
          });
          deal();
        },
        act(a, v) {
          if (phase === 'draw') {
            if (a === 'tog') { const i = Number(v); if (sel.has(i)) sel.delete(i); else if (sel.size < 3) sel.add(i); else fb = 'You can swap at most three cards.'; draw(); }
            else if (a === 'draw') {
              const idx = [...sel]; idx.forEach((i) => { you[i] = deck.shift(); });
              const bd = botDiscard(bot); bd.forEach((i) => { bot[i] = deck.shift(); });
              fb = `You swapped ${idx.length}. The bot swapped ${bd.length}.`; botNote = `The bot swapped ${bd.length}.`; sel = new Set(); A.sfx('tick');
              if (Math.min(pb, bb) <= 0) { showdown(); return; }
              phase = 'bet'; draw();
            }
          } else if (phase === 'bet') {
            if (a === 'check') botActsAfterCheck();
            else if (a === 'bet') { const x = Math.min(Number(v), pb, bb); pb -= x; pot += x; fb = `You bet ${x}.`; botReplyToBet(x); }
            else if (a === 'fold') finishHand('bot', 'You fold.');
          } else if (phase === 'call') {
            if (a === 'call') { const x = Math.min(owed, pb); pb -= x; pot += x; if (x < owed) { bb += owed - x; pot -= owed - x; } fb = `You call ${x}.`; showdown(); }
            else if (a === 'fold') finishHand('bot', 'You fold.');
          } else if (phase === 'next' && a === 'next') deal();
        },
      };
    },
  };
})();

