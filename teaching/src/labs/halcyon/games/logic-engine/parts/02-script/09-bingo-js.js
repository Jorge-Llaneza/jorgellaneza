/* --- bingo.js --- */
(() => {
  /* Bingo: 5x5 card, columns B 1-15, I 16-30, N 31-45, G 46-60, O 61-75, free centre. Balls are called on a timer, you mark your own card, first to call BINGO on a real line wins. */
  const LETTERS = 'BINGO';
  const LINES = (() => {
    const L = [];
    for (let r = 0; r < 5; r++) L.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
    for (let c = 0; c < 5; c++) L.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
    L.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
    return L;
  })();
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const makeCard = () => {
    const cols = [0, 1, 2, 3, 4].map((c) => shuffle(Array.from({ length: 15 }, (_, i) => c * 15 + i + 1)).slice(0, 5));
    const card = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) card.push(cols[c][r]);
    card[12] = 0;   // free space
    return card;
  };
  const letterOf = (n) => LETTERS[Math.floor((n - 1) / 15)];
  const hasLine = (marks) => LINES.some((l) => l.every((i) => marks[i]));
  const needed = (marks) => Math.min(...LINES.map((l) => l.filter((i) => !marks[i]).length));
  const STYLE = `<style>
.bn-card{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;width:min(100%,19rem)}
.bn-h{display:grid;place-items:center;font:700 1.1rem var(--mono);color:var(--brass-hi)}
.bn-c{min-height:3rem;border-radius:8px;border:1px solid rgba(0,0,0,.25);background:var(--ivory);color:var(--ink);font:700 1.05rem var(--mono);cursor:pointer;padding:0}
.bn-c:hover:not(:disabled){outline:2px solid var(--brass-hi)}
.bn-c.on{background:var(--ruby);color:#fff;box-shadow:inset 0 0 0 3px var(--brass-hi)}
.bn-c.free{background:var(--brass);color:#2a1c04}
.bn-c:disabled{cursor:default}
.bn-ball{display:grid;place-items:center;width:4.6rem;height:4.6rem;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,var(--ivory) 60%,#c9c4aa);color:var(--ink);font:700 1.5rem var(--mono);border:4px solid var(--brass-hi)}
.bn-board{display:grid;gap:2px;width:100%;font:600 .68rem var(--mono)}
.bn-board div{display:flex;flex-wrap:wrap;gap:2px;align-items:center;min-height:1.1rem}
.bn-board b{color:var(--brass-hi);width:1rem}
.bn-board span{padding:0 .25rem;border-radius:4px;background:rgba(255,255,255,.14)}
.bn-board span.new{background:var(--brass-hi);color:#2a1c04}
</style>`;
  FULL['Bingo'] = {
    title: 'Bingo: the full game',
    intro: 'Balls are called one at a time. When a number on your card is called, tap it to mark it. Complete a row, a column or a diagonal (the centre is free), then press BINGO before the bot does. A false BINGO call is a warning. Two warnings and you are out.',
    make: (A) => {
      let card, marks, bot, botMarks, bag, called, paused, warns, fb, botClaim, over;
      const draw = () => {
        const last = called[called.length - 1];
        const board = LETTERS.split('').map((L, i) => `<div><b>${L}</b>${called.filter((n) => letterOf(n) === L).sort((a, b) => a - b).map((n) => `<span class="${n === last ? 'new' : ''}">${n}</span>`).join('')}</div>`).join('');
        const botLeft = needed(botMarks);
        A.draw(`${STYLE}<div class="arc-scene">
          <div class="arc-top"><span class="arc-vote">Ball ${called.length} of 75</span><span class="arc-vote">Warnings ${warns} of 2</span><span class="arc-vote">Bot needs ${botLeft} more</span></div>
          <div class="arc-row"><div class="bn-ball" aria-live="polite" aria-label="${last ? 'Latest ball ' + letterOf(last) + ' ' + last : 'No ball yet'}">${last ? letterOf(last) + last : '--'}</div></div>
          <div class="bn-card" role="group" aria-label="Your bingo card">${LETTERS.split('').map((L) => `<div class="bn-h">${L}</div>`).join('')}${card.map((n, i) => n === 0
            ? '<button type="button" class="bn-c free on" disabled aria-label="Free space">FREE</button>'
            : `<button type="button" class="bn-c ${marks[i] ? 'on' : ''}" data-act="mark" data-v="${i}" aria-label="${letterOf(n)} ${n}${marks[i] ? ', marked' : ''}">${n}</button>`).join('')}</div>
          <div class="arc-opts">${abtn('bingo', '', 'BINGO!', 'primary big')}${abtn('pause', '', paused ? 'Resume balls' : 'Pause balls', 'ghost')}</div>
          <p class="arc-fb" aria-live="polite">${fb}</p>
          <div class="bn-board" aria-label="Numbers called so far">${board}</div></div>`);
      };
      const callBall = () => {
        if (paused || over) return;
        if (!bag.length) { over = true; draw(); return A.end(false, 'All 75 balls were called and nobody called BINGO. No winner this time.'); }
        const n = bag.pop(); called.push(n); A.sfx('tick');
        fb = `Ball called: ${letterOf(n)} ${n}.`;
        const bi = bot.indexOf(n);
        if (bi >= 0 && Math.random() < 0.88) botMarks[bi] = true;
        if (!botClaim && hasLine(botMarks)) {
          botClaim = true;
          A.after(() => { over = true; draw(); A.end(false, 'The bot called BINGO first. Better luck next game.'); }, 1800 + rnd(1800));
        }
        draw();
      };
      return {
        start() {
          card = makeCard(); marks = card.map((n) => n === 0); bot = makeCard(); botMarks = bot.map((n) => n === 0);
          bag = shuffle(Array.from({ length: 75 }, (_, i) => i + 1)); called = []; paused = false; warns = 0; botClaim = false; over = false;
          fb = 'Get ready. The first ball is coming.'; draw();
          A.after(callBall, 1200);
          A.timer(callBall, 3800);
          A.key((e) => { const k = e.key.toLowerCase(); if (k === 'b') this.act('bingo'); else if (k === 'p') this.act('pause'); });
        },
        act(a, v) {
          if (over) return;
          if (a === 'pause') { paused = !paused; fb = paused ? 'Paused. The bot is paused too.' : 'Balls are running again.'; draw(); }
          else if (a === 'mark') {
            const i = Number(v), n = card[i];
            if (marks[i]) { marks[i] = false; fb = `Unmarked ${n}.`; }
            else if (!called.includes(n)) { fb = `${letterOf(n)} ${n} has not been called yet.`; A.sfx('bad'); }
            else { marks[i] = true; fb = `Marked ${letterOf(n)} ${n}.`; A.sfx('good'); }
            draw();
          } else if (a === 'bingo') {
            const real = LINES.some((l) => l.every((i) => marks[i] && (card[i] === 0 || called.includes(card[i]))));
            if (real) { over = true; draw(); A.end(true, 'BINGO! You called it first. You win!'); }
            else {
              warns++; A.sfx('bad');
              if (warns >= 2) { over = true; draw(); A.end(false, 'Two false calls. You are out of the game.'); }
              else { fb = 'False call! You need five marked called numbers in a line. One warning left.'; draw(); }
            }
          }
        },
      };
    },
  };
})();

/* --- blackjack.js --- */
(() => {
  /* Blackjack: bet, hit, stand, double down. A natural pays 3 to 2. Dealer draws to 16 and stands on every 17. Reach the goal to win, drop below the minimum bet to lose. */
  const START = 100, GOAL = 250, BETS = [10, 20, 50], MIN = 10;
  const val = (r) => (r === 1 ? 11 : r >= 10 ? 10 : r);
  const total = (h) => { let t = h.reduce((a, c) => a + val(c.r), 0), aces = h.filter((c) => c.r === 1).length; while (t > 21 && aces) { t -= 10; aces--; } return t; };
  const soft = (h) => { const hard = h.reduce((a, c) => a + (c.r === 1 ? 1 : val(c.r)), 0); return h.some((c) => c.r === 1) && hard + 10 <= 21; };
  const isNat = (h) => h.length === 2 && total(h) === 21;
  const lab = (h) => (isNat(h) ? 'Blackjack' : total(h) > 21 ? `Bust (${total(h)})` : (soft(h) ? 'Soft ' : '') + total(h));
  const STYLE = `<style>
.bj-top{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;font:600 .8rem var(--mono)}
.bj-top span{padding:.25rem .6rem;border:1px solid var(--line);border-radius:999px;background:rgba(0,0,0,.25)}
.bj-hand{display:flex;gap:.35rem;justify-content:center;flex-wrap:wrap}
.bj-lab{font:700 .85rem var(--mono);color:var(--brass-hi);margin:0}
.bj-bet.sel{outline:3px solid var(--brass-hi)}
</style>`;
  FULL['Blackjack'] = {
    title: 'Blackjack: the full game',
    intro: 'Get closer to 21 than the dealer without going over. Aces count 1 or 11, face cards 10. Hit to take a card, stand to stop, double to double your bet and take exactly one more card. A natural (Ace plus a ten-card) pays 3 to 2. The dealer draws to 16 and stands on every 17. Reach ' + GOAL + ' chips to win.',
    make: (A) => {
      let bank, bet, shoe, pl, dl, phase, stake, fb, rounds;
      const draw1 = () => { if (shoe.length < 20) shoe = mkShoe(); return shoe.pop(); };
      const mkShoe = () => { const s = []; for (let d = 0; d < 4; d++) for (let r = 1; r <= 13; r++) for (let k = 0; k < 4; k++) s.push({ r, s: k }); for (let i = s.length - 1; i > 0; i--) { const j = rnd(i + 1); [s[i], s[j]] = [s[j], s[i]]; } return s; };
      const cardH = (c) => pokerCardHtml(c.r === 1 ? 14 : c.r, c.s, '', '', undefined);
      const hid = '<div class="pslot"><i></i><div class="pcard back"></div></div>';
      const draw = () => {
        const hole = phase === 'play';
        const dShow = hole ? dl.slice(0, 1) : dl;
        let ctl;
        if (phase === 'bet') {
          ctl = `<p class="arc-ask">Choose your bet, then deal.</p><div class="arc-row" role="group" aria-label="Bet size">${BETS.map((b) => `<button type="button" class="btn small bj-bet${b === bet ? ' sel primary' : ''}" data-act="bet" data-v="${b}" ${b > bank ? 'disabled' : ''}>Bet ${b}</button>`).join('')}</div><div class="arc-opts">${abtn('deal', '', 'Deal (D)', 'primary', bet > bank)}</div>`;
        } else if (phase === 'play') {
          ctl = `<div class="arc-opts">${abtn('hit', '', 'Hit (H)', 'primary')}${abtn('stand', '', 'Stand (S)')}${abtn('double', '', 'Double (X)', '', !(pl.length === 2 && bank >= stake))}</div>`;
        } else if (phase === 'over') ctl = `<div class="arc-opts">${abtn('again', '', 'Next round (D)', 'primary')}</div>`;
        else ctl = '<p class="arc-ask">Dealer plays...</p>';
        A.draw(`${STYLE}<div class="arc-scene">
          <div class="bj-top"><span>Chips ${bank}</span><span>Goal ${GOAL}</span>${phase !== 'bet' ? `<span>Bet ${stake}</span>` : ''}<span>Round ${rounds}</span></div>
          ${phase === 'bet' ? '' : `<p class="bj-lab">Dealer: ${hole ? val(dl[0].r) === 11 ? 'Ace showing' : val(dl[0].r) + ' showing' : lab(dl)}</p>
          <div class="bj-hand" aria-label="Dealer hand">${dShow.map(cardH).join('')}${hole ? hid : ''}</div>
          <p class="arc-fb">${fb}</p>
          <p class="bj-lab">You: ${lab(pl)}</p>
          <div class="bj-hand" aria-label="Your hand">${pl.map(cardH).join('')}</div>`}
          ${phase === 'bet' ? `<p class="arc-fb">${fb}</p>` : ''}
          ${ctl}</div>`);
      };
      const finishRound = (net, msg) => {
        /* net is chips won (positive) or lost (negative) relative to stake already taken from bank */
        phase = 'over';
        fb = msg; A.sfx(net > 0 ? 'good' : net < 0 ? 'bad' : 'tick');
        draw();
        if (bank >= GOAL) A.end(true, `You reached ${bank} chips. You beat the house!`);
        else if (bank < MIN) A.end(false, 'You cannot cover the minimum bet. The house wins.');
      };
      const settle = () => {
        const p = total(pl), d = total(dl);
        let ret, msg;
        if (p > 21) { ret = 0; msg = `You bust with ${p}. -${stake}.`; }
        else if (d > 21) { ret = stake * 2; msg = `Dealer busts with ${d}. You win ${stake}.`; }
        else if (p > d) { ret = stake * 2; msg = `${p} beats ${d}. You win ${stake}.`; }
        else if (p < d) { ret = 0; msg = `Dealer's ${d} beats your ${p}. -${stake}.`; }
        else { ret = stake; msg = `Push at ${p}. Your bet comes back.`; }
        bank += ret; finishRound(ret - stake, msg);
      };
      const dealerPlay = () => {
        phase = 'dealer'; draw();
        const step = () => {
          if (total(dl) < 17) { dl.push(draw1()); A.sfx('tick'); draw(); A.after(step, 650); } else settle();
        };
        A.after(step, 600);
      };
      const deal = () => {
        if (bet > bank) return;
        rounds++; stake = bet; bank -= stake; pl = [draw1(), draw1()]; dl = [draw1(), draw1()]; fb = ''; phase = 'play';
        const pn = isNat(pl), dn = isNat(dl);
        if (pn || dn) {
          phase = 'peek';
          if (pn && dn) { bank += stake; return finishRound(0, 'Both have blackjack. Push.'); }
          if (pn) { const w = Math.floor(stake * 1.5); bank += stake + w; return finishRound(w, `Blackjack! Pays 3 to 2. You win ${w}.`); }
          return finishRound(-stake, `Dealer has blackjack. -${stake}.`);
        }
        A.sfx('tick'); draw();
      };
      const act = (a, v) => {
        if (phase === 'bet' && a === 'bet') { bet = Number(v); draw(); }
        else if ((phase === 'bet' || phase === 'over') && (a === 'deal' || a === 'again')) { if (phase === 'over') { phase = 'bet'; fb = 'Place your bet.'; if (bet > bank) bet = BETS.filter((b) => b <= bank).pop() || MIN; draw(); } else deal(); }
        else if (phase === 'play') {
          if (a === 'hit') { pl.push(draw1()); A.sfx('tick'); const t = total(pl); if (t > 21) { phase = 'peek'; settle(); } else if (t === 21) dealerPlay(); else { fb = `You hit. Total ${lab(pl)}.`; draw(); } }
          else if (a === 'stand') dealerPlay();
          else if (a === 'double' && pl.length === 2 && bank >= stake) { bank -= stake; stake *= 2; pl.push(draw1()); A.sfx('tick'); if (total(pl) > 21) { phase = 'peek'; settle(); } else dealerPlay(); }
        }
      };
      return {
        start() {
          bank = START; bet = 10; shoe = mkShoe(); pl = []; dl = []; phase = 'bet'; stake = 0; rounds = 0; fb = 'Place your bet.'; draw();
          A.key((e) => { const k = e.key.toLowerCase(); if (k === 'h') act('hit'); else if (k === 's') act('stand'); else if (k === 'x') act('double'); else if (k === 'd' || k === 'enter') act(phase === 'over' ? 'again' : 'deal'); });
        },
        act,
      };
    },
  };
})();

/* --- bowling.js --- */
(() => {
  /* Bowling: ten frames with correct strike and spare scoring, tenth frame bonus balls. Choose aim and power each ball. Score 120 or more to win. */
  FULL['Bowling'] = {
    title: 'Bowling: ten frames',
    intro: 'Pick an aim and a power for each ball. Centre aim with medium or hard power is best. Strikes and spares score bonuses. Reach 120 to win.',
    make: (A) => {
      let rolls, aim, pow, fb;
      const score = () => { /* returns per-frame cumulative scores (null until known) */
        const out = []; let i = 0, total = 0;
        for (let f = 0; f < 10; f++) {
          if (rolls[i] === undefined) { out.push(null); continue; }
          if (f < 9 && rolls[i] === 10) { if (rolls[i + 1] === undefined || rolls[i + 2] === undefined) { out.push(null); i += 1; continue; } total += 10 + rolls[i + 1] + rolls[i + 2]; i += 1; }
          else if (rolls[i + 1] === undefined) { out.push(null); i += 2; continue; }
          else if (rolls[i] + rolls[i + 1] === 10 && f < 9) { if (rolls[i + 2] === undefined) { out.push(null); i += 2; continue; } total += 10 + rolls[i + 2]; i += 2; }
          else if (f === 9) { const need = rolls[i] === 10 || rolls[i] + rolls[i + 1] === 10 ? 3 : 2; if (rolls.length - i < need) { out.push(null); continue; } total += rolls.slice(i, i + need).reduce((a, b) => a + b, 0); i += need; }
          else { total += rolls[i] + rolls[i + 1]; i += 2; }
          out.push(total);
        }
        return out;
      };
      const state = () => { /* frame number, pins standing, done? */
        let i = 0;
        for (let f = 0; f < 9; f++) { if (rolls[i] === undefined) return { f, up: 10, ball: 1 }; if (rolls[i] === 10) { i++; continue; } if (rolls[i + 1] === undefined) return { f, up: 10 - rolls[i], ball: 2 }; i += 2; }
        const t = rolls.slice(i);
        if (t.length === 0) return { f: 9, up: 10, ball: 1 };
        if (t.length === 1) return { f: 9, up: t[0] === 10 ? 10 : 10 - t[0], ball: 2 };
        if (t.length === 2) { if (t[0] === 10 || t[0] + t[1] === 10) return { f: 9, up: (t[1] === 10 || t[0] + t[1] === 10) ? 10 : 10 - t[1], ball: 3 }; return { f: 9, up: 0, ball: 4, done: true }; }
        return { f: 9, up: 0, ball: 4, done: true };
      };
      const sym = (v, prev) => (v === 10 && prev === undefined) ? 'X' : (prev !== undefined && prev + v === 10) ? '/' : v === 0 ? '-' : v;
      const draw = () => {
        const sc = score(), s = state();
        let i = 0, cells = '';
        for (let f = 0; f < 10; f++) {
          let r = '';
          if (f < 9) { if (rolls[i] === 10) { r = 'X'; i++; } else { const a = rolls[i], b = rolls[i + 1]; r = a === undefined ? '' : sym(a) + ' ' + (b === undefined ? '' : (a + b === 10 ? '/' : sym(b))); i += 2; } }
          else { r = rolls.slice(i).map((v, k, arr) => v === 10 ? 'X' : (k > 0 && arr[k - 1] !== 10 && arr[k - 1] + v === 10 ? '/' : v === 0 ? '-' : v)).join(' '); }
          cells += `<div style="border:1px solid var(--line);padding:2px;text-align:center;font:600 12px var(--mono)"><div>${f + 1}</div><div>${r || '&nbsp;'}</div><div><b>${sc[f] == null ? '' : sc[f]}</b></div></div>`;
        }
        const total = sc.filter((v) => v != null).pop() || 0;
        A.draw(`<div class="arc-scene"><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:3px" aria-label="Scorecard">${cells}</div>
        <div class="arc-top"><span>Frame <b>${Math.min(10, s.f + 1)}</b></span><span>Ball <b>${Math.min(3, s.ball)}</b></span><span>Pins up <b>${s.up}</b></span><span>Score <b>${total}</b></span></div>
        <p class="arc-ask">Aim</p><div class="arc-opts">${['-1:Left', '0:Centre', '1:Right'].map((x) => { const [v, n] = x.split(':'); return abtn('aim', v, n, aim === +v ? 'primary' : ''); }).join('')}</div>
        <p class="arc-ask">Power</p><div class="arc-opts">${['1:Soft', '2:Medium', '3:Hard'].map((x) => { const [v, n] = x.split(':'); return abtn('pow', v, n, pow === +v ? 'primary' : ''); }).join('')}</div>
        <div class="arc-opts">${abtn('roll', '', 'Roll the ball', 'primary')}</div><p class="arc-fb">${fb}</p></div>`);
      };
      return {
        start() { rolls = []; aim = 0; pow = 2; fb = 'Frame 1. Roll when you are ready.'; draw(); },
        act(a, v) {
          if (a === 'aim') { aim = +v; draw(); return; } if (a === 'pow') { pow = +v; draw(); return; }
          if (a !== 'roll') return;
          const s = state(); if (s.done) return;
          const err = Math.round((Math.random() + Math.random() - 1) * 2), q = 1 - Math.abs(aim + err) * 0.28 + (pow - 2) * 0.07 + (Math.random() - 0.5) * 0.15;
          const k = Math.max(0, Math.min(s.up, Math.round(s.up * Math.max(0, Math.min(1, q)) + (q > 0.95 ? 1 : 0))));
          rolls.push(k); fb = k === 10 && s.up === 10 ? 'Strike!' : k === s.up ? (s.ball > 1 && s.up < 10 ? 'Spare!' : 'All down!') : k === 0 ? 'Gutter or miss.' : `${k} pin${k > 1 ? 's' : ''} down.`; A.sfx(k === s.up ? 'good' : 'tick');
          const ns = state(); if (ns.done) { const sc = score(); const total = sc[9]; draw(); return A.end(total >= 120, total >= 120 ? `Final score ${total}. You win!` : `Final score ${total}. You needed 120.`); }
          draw();
        },
      };
    },
  };
})();

