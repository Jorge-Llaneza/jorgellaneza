/* --- hot-cold.js --- */
(() => {
  /* Hot and Cold: find a secret number 1 to 100. Each guess gets a word: burning (gap 0), hot (1-5), warm (6-15), cold. After the 2nd guess you also hear warmer, colder or same. 10 tries. */
  const HC_MAX = 100, HC_TRIES = 10;
  const hcTemp = (g) => (g === 0 ? 'burning' : g <= 5 ? 'hot' : g <= 15 ? 'warm' : 'cold');
  FULL['Hot and Cold'] = {
    title: 'Hot and Cold: the full game',
    intro: 'I am thinking of a secret number from 1 to 100. You have 10 tries. After each guess I say a word: burning means you are right, hot means you are 1 to 5 away, warm means 6 to 15 away, and cold means more than 15 away. From your second guess I also say warmer (closer than your last guess), colder (farther) or same. Hint: use warmer and colder to work out which side of the middle the secret is on.',
    make: (A) => {
      let secret, rows, msg, done;
      const hist = () => rows.length ? `<ul class="arc-log" aria-label="Guess history">${rows.slice().reverse().map((r) => `<li>${r.n}: <b>${r.t}</b>${r.tr ? ', ' + r.tr : ''}</li>`).join('')}</ul>` : '';
      const draw = () => A.draw(`<div class="arc-scene"><div class="arc-top"><span class="chip">Tries left <b>${Math.max(0, HC_TRIES - rows.length)}</b> / ${HC_TRIES}</span></div>
        <form class="arc-form" data-form="guess"><label>Your guess (1 to ${HC_MAX})<input name="n" type="number" inputmode="numeric" min="1" max="${HC_MAX}" required autocomplete="off" ${done ? 'disabled' : ''}></label><button type="submit" class="btn primary" ${done ? 'disabled' : ''}>Guess</button></form>
        <p class="arc-fb">${msg}</p>${hist()}</div>`);
      return {
        start() { secret = 1 + rnd(HC_MAX); rows = []; done = false; msg = 'I have picked a secret number. Take a guess.'; draw(); },
        act(a, v) {
          if (a !== 'submit:guess' || done) return;
          const n = parseInt(v.n, 10);
          if (!(n >= 1 && n <= HC_MAX)) { msg = 'Enter a whole number from 1 to 100.'; draw(); return; }
          const gap = Math.abs(secret - n), prev = rows.length ? rows[rows.length - 1].gap : null;
          const tr = prev === null ? '' : gap < prev ? 'warmer' : gap > prev ? 'colder' : 'same';
          rows.push({ n, gap, t: hcTemp(gap), tr });
          if (gap === 0) { done = true; msg = ''; draw(); A.end(true, `Burning! The secret was ${secret}. You found it in ${rows.length} ${rows.length === 1 ? 'try' : 'tries'}.`); return; }
          if (rows.length >= HC_TRIES) { done = true; msg = ''; draw(); A.end(false, `Out of tries. The secret was ${secret}.`); return; }
          msg = `${n} is ${hcTemp(gap)}${tr ? ' and ' + tr : ''}.`; A.sfx('tick'); draw();
        },
      };
    },
  };
})();

/* --- lottery.js --- */
(() => {
  /* Lottery: pick 5 different numbers, buy tickets at 2 coins, draw each week. Prizes: 3 matches 10, 4 matches 100, 5 matches 1000 (shared with other winners). */
  const LT_COST = 2, LT_START = 100, LT_TARGET = 250, LT_WEEKS = 15, LT_MAXT = 10, LT_PICK = 5;
  const LT_PRIZE = [0, 0, 0, 10, 100, 1000];
  const LT_CSS = '<style>.lt-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:.25rem;width:min(100%,22rem)}.lt-n{padding:.45rem 0;border-radius:8px;border:1px solid var(--line);background:rgba(0,0,0,.25);color:var(--ivory);font:600 .85rem var(--mono);cursor:pointer}.lt-n.on{background:var(--brass-hi);color:#14211c;border-color:var(--brass-hi)}.lt-n.hit{background:var(--mint);color:#14211c}.lt-t{display:flex;flex-wrap:wrap;align-items:center;gap:.3rem;padding:.3rem .4rem;border-radius:10px;background:rgba(0,0,0,.2);margin:.2rem 0}.lt-b{min-width:1.7rem;text-align:center;padding:.15rem .25rem;border-radius:50%;border:1px solid var(--line);font:600 .8rem var(--mono)}.lt-b.hit{background:var(--mint);color:#14211c;border-color:var(--mint)}.lt-b.draw{background:var(--brass-hi);color:#14211c}.lt-odds{font-size:.8rem;line-height:1.4;width:min(100%,22rem)}.lt-odds table{border-collapse:collapse;width:100%}.lt-odds td,.lt-odds th{padding:.1rem .3rem;text-align:left;font-weight:400}.lt-pr{margin-left:auto;font:600 .8rem var(--mono)}</style>';
  const ltComb = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const ltOdds = (N) => { const tot = ltComb(N, LT_PICK); return [3, 4, 5].map((k) => ({ k, p: ltComb(LT_PICK, k) * ltComb(N - LT_PICK, LT_PICK - k) / tot, prize: LT_PRIZE[k] })); };
  const ltOneIn = (p) => '1 in ' + Math.round(1 / p).toLocaleString('en-US');
  FULL['Lottery'] = {
    title: 'Lottery: the full game',
    intro: 'Each week you pick 5 different numbers per ticket. A ticket costs 2 coins. The machine draws 5 numbers. Match 3 to win 10 coins, 4 to win 100, and 5 to win the jackpot of 1000, which you may have to share with other winners. Start with 100 coins. Reach 250 coins to win. You lose if you run out of coins to buy a ticket, or after 15 weeks. The odds are shown honestly: in a real lottery, the house wins in the long run.',
    make: (A) => {
      let N, bank, week, tickets, sel, phase, draw, results, msg;
      const sortN = (a) => a.slice().sort((x, y) => x - y);
      const oddsHtml = () => {
        const o = ltOdds(N); const ev = o.reduce((s, r) => s + r.p * r.prize, 0);
        return `<div class="lt-odds"><b>Honest odds, per ticket (numbers 1 to ${N})</b><table>${o.map((r) => `<tr><td>${r.k} matches</td><td>${ltOneIn(r.p)}</td><td>wins ${r.prize}</td></tr>`).join('')}</table>On average a 2 coin ticket pays back about ${ev.toFixed(2)} coins (${(ev / LT_COST * 100).toFixed(0)}% of its price).</div>`;
      };
      const top = () => `<div class="arc-top"><span class="chip">Coins <b>${bank}</b> / goal ${LT_TARGET}</span><span class="chip">Week <b>${week}</b> / ${LT_WEEKS}</span><span class="chip">Tickets <b>${tickets.length}</b></span></div>`;
      const menu = () => { phase = 'menu'; N = 0; A.draw(`${LT_CSS}<div class="arc-scene"><p class="arc-ask">Choose a lottery</p><div class="arc-opts">${abtn('mode', 20, 'Small: numbers 1 to 20', 'primary big')}${abtn('mode', 49, 'Classic: numbers 1 to 49', 'big')}</div><p class="arc-fb">Small is easier to win. Classic has long odds, so reaching the goal is very unlikely. Both start with ${LT_START} coins.</p></div>`); };
      const ticketHtml = (t, hits) => `<div class="lt-t">${t.map((n) => `<span class="lt-b${hits && draw.includes(n) ? ' hit' : ''}">${n}</span>`).join('')}</div>`;
      const drawPick = () => {
        const cells = []; for (let n = 1; n <= N; n++) cells.push(`<button type="button" class="lt-n${sel.includes(n) ? ' on' : ''}" data-act="num" data-v="${n}" aria-label="Number ${n}${sel.includes(n) ? ', picked' : ''}">${n}</button>`);
        const canBuy = sel.length === LT_PICK && bank >= LT_COST && tickets.length < LT_MAXT;
        A.draw(`${LT_CSS}<div class="arc-scene">${top()}<p class="arc-ask">Pick ${LT_PICK} numbers (${sel.length} picked)</p><div class="lt-grid">${cells.join('')}</div>
          <div class="arc-opts">${abtn('quick', '', 'Quick pick', 'small')}${abtn('clear', '', 'Clear', 'small', !sel.length)}${abtn('buy', '', `Buy ticket (${LT_COST} coins)`, 'primary', !canBuy)}</div>
          ${tickets.length ? `<div>${tickets.map((t) => ticketHtml(t, false)).join('')}</div>` : ''}
          <div class="arc-opts">${abtn('draw', '', 'Draw the numbers', 'primary big', !tickets.length)}</div><p class="arc-fb">${msg}</p>${oddsHtml()}</div>`);
      };
      const drawResult = () => {
        const tot = results.reduce((s, r) => s + r.prize, 0);
        A.draw(`${LT_CSS}<div class="arc-scene">${top()}<p class="arc-ask">This week's draw</p><div class="lt-t">${draw.map((n) => `<span class="lt-b draw">${n}</span>`).join('')}</div>
          ${results.map((r) => `<div class="lt-t">${r.t.map((n) => `<span class="lt-b${draw.includes(n) ? ' hit' : ''}">${n}</span>`).join('')}<span class="lt-pr">${r.m} matched, ${r.prize ? 'won ' + r.prize : 'no prize'}</span></div>`).join('')}
          <p class="arc-fb">${msg}</p><div class="arc-opts">${abtn('next', '', 'Next week', 'primary', phase !== 'result')}</div>${oddsHtml()}</div>`);
      };
      const startWeek = () => { tickets = []; sel = []; phase = 'pick'; msg = `You have ${bank} coins. Pick numbers and buy up to ${LT_MAXT} tickets.`; drawPick(); };
      const doDraw = () => {
        if (!tickets.length) return;
        const pool = Array.from({ length: N }, (_, i) => i + 1); draw = [];
        for (let i = 0; i < LT_PICK; i++) draw.push(pool.splice(rnd(pool.length), 1)[0]);
        draw = sortN(draw);
        results = tickets.map((t) => { const m = t.filter((n) => draw.includes(n)).length; return { t, m, prize: 0 }; });
        const jackpot = results.filter((r) => r.m === 5).length;
        let note = '';
        results.forEach((r) => {
          if (r.m === 5) { const others = pickOne([0, 0, 1, 2]); r.prize = Math.floor(LT_PRIZE[5] / (1 + others)); note = others ? ` Jackpot shared with ${others} other ${others === 1 ? 'winner' : 'winners'}.` : ' Nobody else won the jackpot.'; }
          else r.prize = LT_PRIZE[r.m];
        });
        const cost = tickets.length * LT_COST, tot = results.reduce((s, r) => s + r.prize, 0);
        bank += tot; phase = 'result';
        msg = `You spent ${cost} and won ${tot}. Net ${tot - cost >= 0 ? '+' : ''}${tot - cost} coins.${jackpot ? note : ''}`;
        drawResult();
        if (bank >= LT_TARGET) { A.end(true, `You reached ${bank} coins in ${week} ${week === 1 ? 'week' : 'weeks'}. You beat the odds!`); return; }
        if (bank < LT_COST) { A.end(false, `You are broke with ${bank} coins. The house wins.`); return; }
        if (week >= LT_WEEKS) { A.end(false, `${LT_WEEKS} weeks are over and you have ${bank} coins, short of ${LT_TARGET}.`); return; }
        A.sfx(tot > cost ? 'good' : 'tick');
      };
      return {
        start() { bank = LT_START; week = 1; tickets = []; sel = []; draw = []; results = []; msg = ''; menu(); },
        act(a, v) {
          if (a === 'mode') { N = +v; bank = LT_START; week = 1; startWeek(); return; }
          if (phase === 'pick') {
            if (a === 'num') { const n = +v, i = sel.indexOf(n); if (i >= 0) sel.splice(i, 1); else if (sel.length < LT_PICK) sel.push(n); else msg = 'A ticket has only 5 numbers. Tap one to remove it.'; if (sel.length < LT_PICK && i < 0) msg = ''; A.sfx('tick'); drawPick(); }
            else if (a === 'quick') { const pool = Array.from({ length: N }, (_, i) => i + 1); sel = []; for (let i = 0; i < LT_PICK; i++) sel.push(pool.splice(rnd(pool.length), 1)[0]); sel = sortN(sel); msg = ''; drawPick(); }
            else if (a === 'clear') { sel = []; msg = ''; drawPick(); }
            else if (a === 'buy') { if (sel.length === LT_PICK && bank >= LT_COST && tickets.length < LT_MAXT) { tickets.push(sortN(sel)); bank -= LT_COST; sel = []; msg = `Ticket bought. ${bank} coins left.`; A.sfx('good'); drawPick(); } }
            else if (a === 'draw') doDraw();
          } else if (phase === 'result' && a === 'next') { week++; startWeek(); }
        },
      };
    },
  };
})();

/* --- mancala.js --- */
(() => {
  /* Mancala (Kalah): 6 pits and a store each, 4 stones per pit. Sow counter-clockwise, skip the opponent's store. Last stone in your store = extra turn. Last stone in an empty pit of yours with stones opposite = capture both. Game ends when one side is empty; the other side keeps its stones. Bot searches 4 moves ahead. */
  // board: 0-5 your pits (left to right), 6 your store, 7-12 bot pits (7 is on your right), 13 bot store
  const YS = 6, BS = 13;
  const fresh = () => [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
  const pitsOf = (side) => (side === 0 ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12]);
  const storeOf = (side) => (side === 0 ? YS : BS);
  const sideEmpty = (b, side) => pitsOf(side).every((i) => b[i] === 0);
  const legal = (b, side) => pitsOf(side).filter((i) => b[i] > 0);
  // returns { b, extra, captured, last }
  const sow = (b0, side, pit) => {
    const b = b0.slice(); let n = b[pit]; b[pit] = 0; let i = pit; const skip = storeOf(1 - side);
    while (n > 0) { i = (i + 1) % 14; if (i === skip) continue; b[i]++; n--; }
    let extra = false, captured = 0;
    if (i === storeOf(side)) extra = true;
    else if (pitsOf(side).includes(i) && b[i] === 1 && b[12 - i] > 0) { captured = b[12 - i] + 1; b[storeOf(side)] += captured; b[i] = 0; b[12 - i] = 0; }
    return { b, extra, captured, last: i };
  };
  // end-of-game sweep: leftover stones go to their owner's store
  const finish = (b0) => {
    const b = b0.slice();
    for (const side of [0, 1]) for (const i of pitsOf(side)) { b[storeOf(side)] += b[i]; b[i] = 0; }
    return b;
  };
  const over = (b) => sideEmpty(b, 0) || sideEmpty(b, 1);
  const search = (b, side, depth, alpha, beta) => {
    // maximise for the bot (side 1); value = bot store - your store
    if (over(b)) { const f = finish(b); return (f[BS] - f[YS]) * 10; }
    if (depth === 0) return b[BS] - b[YS];
    const ms = legal(b, side).sort((x, y) => y - x);
    if (side === 1) {
      let best = -1e9;
      for (const m of legal(b, 1).sort((x, y) => y - x)) { const r = sow(b, 1, m); const v = search(r.b, r.extra ? 1 : 0, depth - 1, alpha, beta); if (v > best) best = v; if (best > alpha) alpha = best; if (alpha >= beta) break; }
      return best;
    }
    let best = 1e9;
    for (const m of ms) { const r = sow(b, 0, m); const v = search(r.b, r.extra ? 0 : 1, depth - 1, alpha, beta); if (v < best) best = v; if (best < beta) beta = best; if (alpha >= beta) break; }
    return best;
  };
  const botPick = (b, depth = 4) => {
    let best = -1e9, picks = [];
    for (const m of legal(b, 1)) { const r = sow(b, 1, m); const v = search(r.b, r.extra ? 1 : 0, depth - 1, -1e9, 1e9) + (r.extra ? 0.5 : 0); if (v > best) { best = v; picks = [m]; } else if (v === best) picks.push(m); }
    return picks[Math.floor(Math.random() * picks.length)];
  };

  FULL['Mancala'] = {
    title: 'Mancala: the full game (Kalah)',
    intro: 'Pick one of your pits (bottom row) and sow its stones one by one, to the right, round into your store and on along the bot\'s pits. You skip the bot\'s store. Land your last stone in your store to go again. Land it in an empty pit of yours and you capture the stones opposite. When one side is empty, the other side keeps what is left. Most stones in the store wins.',
    make: (A) => {
      let b, turn, fb, last;
      const pit = (i, mine) => `<button type="button" class="mc-pit${last === i ? ' last' : ''}" data-act="pit" data-v="${i}" aria-label="${mine ? 'Your' : 'Bot'} pit ${mine ? i + 1 : 13 - i}, ${b[i]} stones"${mine && turn === 'you' && b[i] > 0 && !A.over ? '' : ' disabled'}><b>${b[i]}</b></button>`;
      const draw = () => {
        const top = [12, 11, 10, 9, 8, 7].map((i) => pit(i, false)).join('');
        const bot = [0, 1, 2, 3, 4, 5].map((i) => pit(i, true)).join('');
        A.draw(`<style>.mc-board{display:grid;grid-template-columns:3.2rem 1fr 3.2rem;gap:.4rem;padding:.6rem;border-radius:14px;background:#6b4423;border:3px solid #3e2812;width:min(96vw,34rem)}.mc-store{border-radius:999px;background:#3e2812;display:grid;place-items:center;align-content:center;color:var(--ivory);font:700 1.3rem var(--mono);min-height:7rem;grid-row:1}.mc-store small{font:600 .6rem var(--mono);color:#e8c98a}.mc-rows{display:grid;gap:.4rem;min-width:0}.mc-row{display:grid;grid-template-columns:repeat(6,1fr);gap:.3rem}.mc-pit{aspect-ratio:1;border-radius:50%;border:2px solid #3e2812;background:radial-gradient(circle at 40% 35%,#8a5a30,#4a2c12);color:var(--ivory);font:700 1.1rem var(--mono);cursor:pointer;display:grid;place-items:center;padding:0;min-width:0}.mc-pit:hover:not(:disabled){outline:2px solid var(--brass-hi)}.mc-pit:disabled{cursor:default}.mc-pit.last{box-shadow:0 0 0 3px var(--brass-hi)}.mc-nums{display:grid;grid-template-columns:repeat(6,1fr);gap:.3rem;font:600 .6rem var(--mono);color:#e8c98a;text-align:center}</style>
          <div class="arc-top"><span class="chip">Your store <b>${b[YS]}</b></span><span class="chip">Bot store <b>${b[BS]}</b></span></div>
          <div class="arc-scene"><div class="mc-board" role="group" aria-label="Mancala board">
            <div class="mc-store" style="grid-column:1" aria-label="Bot store, ${b[BS]} stones"><span>${b[BS]}</span><small>BOT</small></div>
            <div class="mc-rows"><div class="mc-row">${top}</div><div class="mc-row">${bot}</div><div class="mc-nums">${[1, 2, 3, 4, 5, 6].map((k) => `<span>${k}</span>`).join('')}</div></div>
            <div class="mc-store" style="grid-column:3" aria-label="Your store, ${b[YS]} stones"><span>${b[YS]}</span><small>YOU</small></div></div>
          <p class="arc-ask">${turn === 'you' ? 'Your turn. Tap one of your pits (bottom row), or press 1 to 6.' : turn === 'bot' ? 'Bot is thinking...' : ''}</p><p class="arc-fb">${fb}</p></div>`);
      };
      const endCheck = () => {
        if (!over(b)) return false;
        b = finish(b); turn = 'done'; draw();
        const y = b[YS], z = b[BS];
        if (y > z) A.end(true, `You win ${y} to ${z}!`); else if (y < z) A.end(false, `The bot wins ${z} to ${y}. Try again.`); else A.end(false, `Draw, ${y} each.`);
        return true;
      };
      const describe = (who, r) => `${who} ${r.extra ? 'ended in the store and goes again.' : r.captured ? `captured ${r.captured} stones.` : 'moved.'}`;
      const botTurn = () => {
        if (endCheck()) return;
        turn = 'bot'; draw();
        A.after(() => {
          const m = botPick(b); const r = sow(b, 1, m); b = r.b; last = r.last; fb = describe(`Bot played pit ${13 - m}:`, r); A.sfx(r.captured ? 'bad' : 'tick');
          if (endCheck()) return;
          if (r.extra) return botTurn();
          turn = 'you'; draw();
        }, 800);
      };
      const play = (i) => {
        if (turn !== 'you' || i < 0 || i > 5 || b[i] === 0) return;
        const r = sow(b, 0, i); b = r.b; last = r.last; fb = describe(`You played pit ${i + 1}:`, r); A.sfx(r.extra || r.captured ? 'good' : 'tick');
        if (endCheck()) return;
        if (r.extra) { draw(); return; }
        botTurn();
      };
      return {
        start() { b = fresh(); turn = 'you'; fb = 'You go first.'; last = -1; draw(); A.key((e) => { if (/^[1-6]$/.test(e.key)) play(Number(e.key) - 1); }); },
        act(a, v) { if (a === 'pit') play(Number(v)); },
        _lib: { sow, finish, legal, botPick, over, get b() { return b; }, set b(x) { b = x; } },
      };
    },
  };
})();

/* --- mastermind.js --- */
(() => {
  /* Mastermind: crack the hidden 4-colour code in 10 guesses. Black peg = right colour, right place. White peg = right colour, wrong place. */
  const MM_COLS = [['Red', '#e0453a', 'R'], ['Blue', '#3b8fb5', 'B'], ['Green', '#3fae6a', 'G'], ['Yellow', '#f6dc8f', 'Y'], ['Purple', '#9b6fd1', 'P'], ['Orange', '#f08a3c', 'O'], ['Pink', '#f08ab5', 'K'], ['Teal', '#2fc8b8', 'T']];
  const MM_CSS = '<style>.mm-rows{display:grid;gap:.3rem;width:min(100%,22rem)}.mm-r{display:flex;align-items:center;gap:.4rem;padding:.2rem .4rem;border-radius:10px;background:rgba(0,0,0,.2)}.mm-r.now{outline:2px solid var(--brass-hi)}.mm-n{width:1.3rem;font:600 .7rem var(--mono);color:#a9c9b8}.mm-p{width:2.2rem;height:2.2rem;border-radius:50%;border:2px solid rgba(255,255,255,.25);display:grid;place-items:center;font:800 .75rem var(--mono);color:#14211c;padding:0;background:#0c241a}.mm-p.e{background:#0c241a;border-style:dashed}button.mm-p{cursor:pointer}.mm-fb{margin-left:auto;display:grid;grid-template-columns:repeat(2,.85rem);gap:3px}.mm-f{width:.85rem;height:.85rem;border-radius:50%;background:#0c241a;border:1px solid rgba(255,255,255,.2)}.mm-f.b{background:#111;border-color:#fff}.mm-f.w{background:#fff}.mm-pal{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center}.mm-pal .mm-p{width:2.6rem;height:2.6rem}</style>';
  const mmFeedback = (guess, code) => {
    let b = 0; const gl = {}, cl = {};
    guess.forEach((g, i) => { if (g === code[i]) b++; else { gl[g] = (gl[g] || 0) + 1; cl[code[i]] = (cl[code[i]] || 0) + 1; } });
    let w = 0; Object.keys(gl).forEach((k) => { w += Math.min(gl[k], cl[k] || 0); });
    return [b, w];
  };
  FULL['Mastermind'] = {
    title: 'Mastermind: the full game',
    intro: 'The bot hides a code of 4 colours (colours can repeat). You have 10 guesses. After each guess you get pegs: a black peg means one colour is right and in the right place. A white peg means a colour is in the code but in the wrong place. Pegs are not in order. Keys 1 to 8 pick colours, Backspace removes, Enter submits.',
    make: (A) => {
      let nCol = 6, code, rows, cur, done, msg;
      const newGame = () => { code = Array.from({ length: 4 }, () => rnd(nCol)); rows = []; cur = [null, null, null, null]; done = false; msg = 'Fill all 4 slots, then press Guess.'; };
      const peg = (c, extra = '') => `<span class="mm-p" style="background:${MM_COLS[c][1]}" ${extra}>${MM_COLS[c][2]}</span>`;
      const draw = () => {
        const list = [];
        for (let r = 0; r < 10; r++) {
          const g = rows[r], now = r === rows.length && !done;
          let pegs, fb = '';
          if (g) { pegs = g.g.map((c) => peg(c)).join(''); fb = '<span class="mm-fb" aria-label="' + g.b + ' black, ' + g.w + ' white">' + '<i class="mm-f b"></i>'.repeat(g.b) + '<i class="mm-f w"></i>'.repeat(g.w) + '<i class="mm-f"></i>'.repeat(4 - g.b - g.w) + '</span>'; }
          else if (now) pegs = cur.map((c, i) => c === null ? `<button type="button" class="mm-p e" data-act="slot" data-v="${i}" aria-label="Empty slot ${i + 1}"></button>` : `<button type="button" class="mm-p" style="background:${MM_COLS[c][1]}" data-act="slot" data-v="${i}" aria-label="Slot ${i + 1}: ${MM_COLS[c][0]}. Tap to clear">${MM_COLS[c][2]}</button>`).join('');
          else pegs = '<span class="mm-p e"></span>'.repeat(4);
          list.push(`<div class="mm-r${now ? ' now' : ''}" aria-label="Guess ${r + 1}${g ? ': ' + g.g.map((c) => MM_COLS[c][0]).join(', ') + ', ' + g.b + ' black ' + g.w + ' white' : ''}"><span class="mm-n">${r + 1}</span>${pegs}${fb}</div>`);
        }
        const secret = done ? `<div class="mm-r" aria-label="Secret code: ${code.map((c) => MM_COLS[c][0]).join(', ')}"><span class="mm-n">?</span>${code.map((c) => peg(c)).join('')}</div>` : '';
        const pal = MM_COLS.slice(0, nCol).map((c, i) => `<button type="button" class="mm-p" style="background:${c[1]}" data-act="col" data-v="${i}" aria-label="${c[0]}" ${done ? 'disabled' : ''}>${c[2]}</button>`).join('');
        const sz = [6, 8].map((n) => abtn('cols', n, n + ' colours', 'small' + (n === nCol ? ' primary' : ''))).join('');
        A.draw(`${MM_CSS}<div class="arc-scene"><div class="arc-opts">${sz}</div><div class="arc-top"><span class="chip">Guess <b>${Math.min(rows.length + 1, 10)}</b> / 10</span></div>${secret}<div class="mm-rows">${list.join('')}</div><div class="mm-pal" aria-label="Colour palette">${pal}</div>
          <div class="arc-opts">${abtn('guess', '', 'Guess', 'primary', done || cur.includes(null))}${abtn('back', '', 'Remove last', '', done)}${abtn('clear', '', 'Clear row', '', done)}</div><p class="arc-fb">${msg}</p></div>`);
      };
      const col = (c) => { if (done) return; const i = cur.indexOf(null); if (i < 0) { msg = 'All slots are full. Press Guess or clear a slot.'; draw(); return; } cur[i] = c; msg = ''; A.sfx('tick'); draw(); };
      const back = () => { if (done) return; for (let i = 3; i >= 0; i--) if (cur[i] !== null) { cur[i] = null; break; } draw(); };
      const guess = () => {
        if (done || cur.includes(null)) return;
        const [b, w] = mmFeedback(cur, code); rows.push({ g: cur.slice(), b, w }); cur = [null, null, null, null];
        if (b === 4) { done = true; msg = ''; draw(); A.end(true, `Code cracked in ${rows.length} ${rows.length === 1 ? 'guess' : 'guesses'}!`); return; }
        if (rows.length >= 10) { done = true; msg = ''; draw(); A.end(false, 'Out of guesses. The secret code is shown above.'); return; }
        msg = `${b} black, ${w} white.`; A.sfx('good'); draw();
      };
      return {
        start() {
          newGame(); draw();
          A.key((e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (/^[1-8]$/.test(e.key) && +e.key <= nCol) col(+e.key - 1);
            else if (e.key === 'Backspace') back();
            else if (e.key === 'Enter') { e.preventDefault(); guess(); }
          });
        },
        act(a, v) {
          if (a === 'col') col(+v);
          else if (a === 'slot') { if (!done) { cur[+v] = null; draw(); } }
          else if (a === 'back') back();
          else if (a === 'clear') { if (!done) { cur = [null, null, null, null]; draw(); } }
          else if (a === 'guess') guess();
          else if (a === 'cols') { nCol = +v; newGame(); draw(); }
        },
      };
    },
  };
})();

