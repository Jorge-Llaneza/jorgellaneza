/* --- golf.js --- */
(() => {
  /* Golf: nine holes. Pick a club and an aim each shot. Hazards add a stroke. Finish at most 6 over par to win. */
  const CLUBS = [['driver', 'Driver', 230, 22], ['iron', 'Iron', 150, 12], ['wedge', 'Wedge', 70, 6], ['putter', 'Putter', 12, 1.2]];
  const NAMEOF = (s, p) => s === 1 ? 'hole in one' : s - p <= -2 ? 'eagle' : s - p === -1 ? 'birdie' : s === p ? 'par' : s - p === 1 ? 'bogey' : 'double bogey or worse';
  FULL['Golf'] = {
    title: 'Golf: nine holes',
    intro: 'Pick a club and an aim for every shot. Long clubs go far but spray more. Water or rough costs a stroke. Finish nine holes within 6 over par to win.',
    make: (A) => {
      let hole, len, par, x, y, strokes, card, fb;
      const newHole = () => { len = 120 + rnd(340); par = len < 200 ? 3 : len < 360 ? 4 : 5; x = len; y = 0; strokes = 0; };
      const dist = () => Math.hypot(x, y);
      const draw = () => {
        const over = card.reduce((s, c) => s + c[0] - c[1], 0);
        A.draw(`<div class="arc-scene"><div class="arc-top"><span>Hole <b>${hole + 1}</b> of 9</span><span>Par <b>${par}</b></span><span>Strokes <b>${strokes}</b></span><span>Round: <b>${over > 0 ? '+' : ''}${over}</b></span></div>
        <div class="arc-big-text">${Math.round(dist())} yards to the hole</div>
        <svg viewBox="0 0 300 70" width="100%" role="img" aria-label="Fairway view"><rect width="300" height="70" fill="#2f6b3a"/><circle cx="${Math.max(8, Math.min(292, 150 + y * 2))}" cy="${60 - Math.min(52, dist() / 9)}" r="4" fill="#fff"/><circle cx="150" cy="8" r="5" fill="#111"/></svg>
        <p class="arc-ask">Choose a club.</p><div class="arc-opts">${CLUBS.map(([k, n]) => abtn('club', k, n, '', dist() > 40 && k === 'putter' && false)).join('')}</div>
        <p class="arc-ask">Aim</p><div class="arc-opts">${['-1:Left', '0:Straight', '1:Right'].map((s) => { const [v, n] = s.split(':'); return abtn('aim', v, n, aim === +v ? 'primary' : ''); }).join('')}</div>
        <p class="arc-fb">${fb}</p><p class="muted">${card.map((c, i) => `H${i + 1}: ${c[0]}/${c[1]}`).join(' · ')}</p></div>`);
      };
      let aim = 0;
      const finishHole = () => {
        card.push([strokes, par]); fb = `Holed in ${strokes} (${NAMEOF(strokes, par)}).`; A.sfx(strokes <= par ? 'good' : 'bad'); hole++;
        const over = card.reduce((s, c) => s + c[0] - c[1], 0);
        if (hole >= 9) { draw(); return A.end(over <= 6, over <= 6 ? `Round done at ${over > 0 ? '+' : ''}${over} to par. You win!` : `Round done at +${over}. Too many strokes, try again.`); }
        newHole(); draw();
      };
      return {
        start() { hole = 0; card = []; fb = 'Tee off!'; aim = 0; newHole(); draw(); },
        act(a, v) {
          if (a === 'aim') { aim = +v; draw(); return; }
          if (a !== 'club') return;
          const c = CLUBS.find((k) => k[0] === v); strokes++;
          const carry = c[2] * (0.88 + Math.random() * 0.24), side = (Math.random() - 0.5) * 2 * c[3] + aim * (c[0] === 'putter' ? 0.5 : 6);
          const d = dist(), ang = Math.atan2(y, x), tx = x - carry * Math.cos(ang), ty = y - carry * Math.sin(ang) + side;
          x = tx; y = ty; fb = `${c[1]} went ${Math.round(carry)} yards.`;
          if (Math.abs(y) > 30 && c[0] !== 'putter') { strokes++; fb += ' Hazard! +1 stroke, you drop back.'; y = 0; x = Math.max(8, Math.abs(x) * 0.8); A.sfx('bad'); }
          else if (x < -40) { x = Math.abs(x) * 0.5; y *= 0.5; fb += ' Long, back toward the hole.'; }
          if (dist() < 2.5) return finishHole();
          if (strokes >= 10) { fb += ' Pick up at 10.'; return finishHole(); }
          x = Math.abs(x) < 1 && Math.abs(y) < 1 ? 1 : x; draw();
        },
      };
    },
  };
})();

/* --- guess-number.js --- */
(() => {
  /* Guess the Number: two modes. You guess the bot's number with higher/lower hints, or the bot guesses yours. */
  const GN_MAX = 100;
  FULL['Guess the Number'] = {
    title: 'Guess the Number: the full game',
    intro: 'Pick a mode. In "You guess", the bot thinks of a number from 1 to 100 and you have 7 tries, with higher or lower hints. In "Bot guesses", you secretly think of a number from 1 to 100 and answer honestly: higher, lower or correct. The bot has 6 tries. Hint: always guess the middle of what is left.',
    make: (A) => {
      let mode, secret, lo, hi, tries, max, log, msg, botGuess, done;
      const logHtml = () => log.length ? `<ul class="arc-log" aria-label="Guess history">${log.map((l) => `<li>${l}</li>`).join('')}</ul>` : '';
      const menu = () => { mode = null; A.draw(`<div class="arc-scene"><p class="arc-ask">Choose a mode</p><div class="arc-opts">${abtn('mode', 'you', 'You guess the number', 'primary big')}${abtn('mode', 'bot', 'Bot guesses your number', 'big')}</div></div>`); };
      const drawYou = () => A.draw(`<div class="arc-scene"><div class="arc-top"><span class="chip">Tries left <b>${max - tries}</b> / ${max}</span><span class="chip">Range <b>${lo} to ${hi}</b></span></div>
        <form class="arc-form" data-form="guess"><label>Your guess<input name="n" type="number" inputmode="numeric" min="1" max="${GN_MAX}" required autocomplete="off" ${done ? 'disabled' : ''}></label><button type="submit" class="btn primary" ${done ? 'disabled' : ''}>Guess</button></form>
        <p class="arc-fb">${msg}</p>${logHtml()}</div>`);
      const drawBot = () => A.draw(`<div class="arc-scene"><div class="arc-top"><span class="chip">Bot tries <b>${tries}</b> / ${max}</span></div>
        <p class="arc-ask">Think of a number from 1 to ${GN_MAX}. Keep it secret.</p>
        <p class="arc-big-text">Is it ${botGuess}?</p>
        <div class="arc-opts">${abtn('ans', 'high', 'Higher', '', done)}${abtn('ans', 'ok', 'Correct', 'primary', done)}${abtn('ans', 'low', 'Lower', '', done)}</div>
        <p class="arc-fb">${msg}</p>${logHtml()}</div>`);
      const startMode = (m) => {
        mode = m; lo = 1; hi = GN_MAX; tries = 0; log = []; msg = ''; done = false;
        if (m === 'you') { secret = 1 + rnd(GN_MAX); max = 7; msg = 'I am thinking of a number from 1 to 100.'; drawYou(); }
        else { max = 6; botGuess = Math.floor((lo + hi) / 2); tries = 1; drawBot(); }
      };
      return {
        start() { menu(); },
        act(a, v) {
          if (a === 'mode') return startMode(v);
          if (a === 'submit:guess' && mode === 'you' && !done) {
            const n = parseInt(v.n, 10);
            if (!(n >= 1 && n <= GN_MAX)) { msg = 'Enter a whole number from 1 to 100.'; drawYou(); return; }
            tries++;
            if (n === secret) { done = true; log.unshift(`${n}: correct`); msg = ''; drawYou(); A.end(true, `You found ${secret} in ${tries} ${tries === 1 ? 'try' : 'tries'}!`); return; }
            if (n < secret) { lo = Math.max(lo, n + 1); log.unshift(`${n}: higher`); msg = `<span class="bad">${n} is too low. Go higher.</span>`; }
            else { hi = Math.min(hi, n - 1); log.unshift(`${n}: lower`); msg = `<span class="bad">${n} is too high. Go lower.</span>`; }
            A.sfx('tick');
            if (tries >= max) { done = true; msg = ''; drawYou(); A.end(false, `Out of tries. The number was ${secret}.`); return; }
            drawYou();
          } else if (a === 'ans' && mode === 'bot' && !done) {
            if (v === 'ok') { done = true; log.unshift(`${botGuess}: correct`); msg = ''; drawBot(); A.end(false, `The bot found your number, ${botGuess}, in ${tries} ${tries === 1 ? 'try' : 'tries'}. The bot wins.`); return; }
            log.unshift(`${botGuess}: ${v === 'high' ? 'higher' : 'lower'}`);
            if (v === 'high') lo = botGuess + 1; else hi = botGuess - 1;
            if (lo > hi) { done = true; msg = ''; drawBot(); A.end(false, 'Those answers do not add up. Nothing fits all of them, so the bot wins on a technicality.'); return; }
            if (tries >= max) { done = true; msg = ''; drawBot(); A.end(true, `The bot ran out of tries. Your number was between ${lo} and ${hi}. You win!`); return; }
            botGuess = Math.floor((lo + hi) / 2); tries++; msg = `Range now ${lo} to ${hi}.`; A.sfx('tick'); drawBot();
          }
        },
      };
    },
  };
})();

/* --- hangman.js --- */
(() => {
  /* Hangman: guess the hidden word one letter at a time. Six wrong guesses and the drawing is complete. */
  const HM_WORDS = {
    Animals: 'elephant giraffe penguin dolphin kangaroo crocodile butterfly squirrel octopus hedgehog leopard buffalo flamingo cheetah gorilla',
    Food: 'spaghetti pancake avocado broccoli sandwich chocolate pineapple omelette dumpling burrito cucumber pretzel noodles popcorn mushroom',
    Countries: 'australia brazil canada denmark ethiopia finland germany hungary iceland jamaica morocco norway portugal thailand vietnam',
    Science: 'gravity planet molecule electron volcano galaxy oxygen telescope fossil magnet climate neutron protein asteroid compass',
    Sports: 'football cricket tennis swimming archery cycling gymnastics badminton volleyball wrestling skiing hockey surfing rowing fencing',
    Jobs: 'teacher doctor farmer pilot plumber dentist engineer firefighter librarian chef electrician journalist baker carpenter mechanic',
  };
  const HM_CSS = '<style>.hm-top{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center}.hm-svg{width:min(60vw,11rem);height:auto}.hm-svg .g{stroke:var(--brass-hi);stroke-width:4;fill:none;stroke-linecap:round}.hm-svg .p{stroke:var(--ivory);stroke-width:4;fill:none;stroke-linecap:round}.hm-word{display:flex;flex-wrap:wrap;gap:.35rem;justify-content:center}.hm-l{width:1.9rem;height:2.4rem;border-bottom:3px solid var(--brass-hi);display:grid;place-items:center;font:700 1.4rem var(--mono);color:var(--ivory)}.hm-l.miss{color:#ff9a92}.hm-keys{display:flex;flex-wrap:wrap;gap:.3rem;justify-content:center;max-width:26rem}.hm-k{width:2.4rem;height:2.6rem;padding:0;border-radius:8px;border:1px solid var(--line);background:#2b3a34;color:#fff;font:700 1rem var(--mono);text-transform:uppercase;cursor:pointer}.hm-k.hit{background:#538d4e}.hm-k.no{background:#121a17;color:#ff9a92}.hm-k:disabled{opacity:.6;cursor:default}.hm-cats{display:flex;flex-wrap:wrap;gap:.3rem;justify-content:center}</style>';
  FULL['Hangman'] = {
    title: 'Hangman: the full game',
    intro: 'Guess the hidden word one letter at a time. Each wrong letter adds a piece to the drawing. After 6 wrong guesses you lose. Pick a category, tap letters or use your keyboard.',
    make: (A) => {
      let cat, word, used, wrong, msg, done, pickCat;
      const cats = Object.keys(HM_WORDS);
      const newWord = () => { cat = pickCat === 'Any' ? pickOne(cats) : pickCat; word = pickOne(HM_WORDS[cat].split(' ')); used = []; wrong = 0; msg = ''; done = false; };
      const parts = [
        '<circle class="p" cx="110" cy="52" r="14"/>', '<line class="p" x1="110" y1="66" x2="110" y2="108"/>',
        '<line class="p" x1="110" y1="76" x2="90" y2="96"/>', '<line class="p" x1="110" y1="76" x2="130" y2="96"/>',
        '<line class="p" x1="110" y1="108" x2="94" y2="136"/>', '<line class="p" x1="110" y1="108" x2="126" y2="136"/>',
      ];
      const draw = () => {
        const svg = `<svg class="hm-svg" viewBox="0 0 160 160" role="img" aria-label="Hangman drawing, ${wrong} of 6 parts"><line class="g" x1="20" y1="150" x2="100" y2="150"/><line class="g" x1="40" y1="150" x2="40" y2="20"/><line class="g" x1="40" y1="20" x2="110" y2="20"/><line class="g" x1="110" y1="20" x2="110" y2="38"/>${parts.slice(0, wrong).join('')}</svg>`;
        const w = [...word].map((c) => { const show = used.includes(c) || (done && wrong >= 6); return `<span class="hm-l${show && !used.includes(c) ? ' miss' : ''}">${show ? c : ''}</span>`; }).join('');
        const keys = 'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => `<button type="button" class="hm-k${used.includes(c) ? (word.includes(c) ? ' hit' : ' no') : ''}" data-act="key" data-v="${c}" aria-label="Letter ${c}" ${used.includes(c) || done ? 'disabled' : ''}>${c}</button>`).join('');
        const cb = ['Any', ...cats].map((c) => abtn('cat', c, c, 'small' + (c === pickCat ? ' primary' : ''))).join('');
        A.draw(`${HM_CSS}<div class="arc-scene"><div class="hm-cats" aria-label="Category">${cb}</div><div class="hm-top"><span class="chip">Category <b>${cat}</b></span><span class="chip">Wrong <b>${wrong}</b> / 6</span><span class="chip">${word.length} letters</span></div>${svg}<div class="hm-word" aria-label="Word, ${word.length} letters">${w}</div><p class="arc-fb">${msg}</p><div class="hm-keys">${keys}</div></div>`);
      };
      const guess = (c) => {
        if (done || used.includes(c)) return;
        used.push(c);
        if (word.includes(c)) { msg = `<span class="good">Yes, there ${word.split(c).length > 2 ? 'are' : 'is'} ${word.split(c).length - 1} "${c}".</span>`; A.sfx('good'); }
        else { wrong++; msg = `<span class="bad">No "${c}" in the word.</span>`; A.sfx('bad'); }
        if ([...word].every((x) => used.includes(x))) { done = true; draw(); A.end(true, `You found it: ${word.toUpperCase()}. You win!`); return; }
        if (wrong >= 6) { done = true; draw(); A.end(false, `Out of guesses. The word was ${word.toUpperCase()}.`); return; }
        draw();
      };
      return {
        start() {
          if (!pickCat) pickCat = 'Any';
          newWord(); draw();
          A.key((e) => { if (e.ctrlKey || e.metaKey || e.altKey) return; if (/^[a-zA-Z]$/.test(e.key)) guess(e.key.toLowerCase()); });
        },
        act(a, v) { if (a === 'key') guess(v); else if (a === 'cat') { pickCat = v; newWord(); draw(); } },
      };
    },
  };
})();

/* --- hanoi.js --- */
(() => {
  /* Tower of Hanoi: pick 3 to 7 discs, move the whole tower from peg A to peg C (or B), never putting a big disc on a small one. Par is 2^n - 1 moves. */
  const NAMES = ['A', 'B', 'C'];
  const par = (n) => Math.pow(2, n) - 1;
  const canMove = (pegs, f, t) => f !== t && pegs[f].length > 0 && (pegs[t].length === 0 || pegs[t][pegs[t].length - 1] > pegs[f][pegs[f].length - 1]);
  const solved = (pegs, n) => pegs[0].length === 0 && (pegs[1].length === n || pegs[2].length === n);
  const rating = (moves, p) => (moves === p ? { s: 3, t: 'Perfect! You matched par exactly.' } : moves <= p * 1.5 ? { s: 2, t: 'Very good. A few extra moves.' } : moves <= p * 2.5 ? { s: 1, t: 'Solved. There is a shorter way: look for the pattern.' } : { s: 0, t: 'Solved, with a long route. Try again for par.' });

  FULL['Tower of Hanoi'] = {
    title: 'Tower of Hanoi: the full puzzle',
    intro: 'Move every disc from peg A to peg C. Move one disc at a time, and never put a bigger disc on a smaller one. With n discs the best possible score is 2^n - 1 moves. Pick how many discs you want.',
    make: (A) => {
      let n, pegs, sel, moves, hist, fb, phase;
      const css = `<style>.hz-pegs{display:flex;gap:.5rem;width:min(94vw,32rem);justify-content:center}.hz-peg{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px;padding:.4rem .2rem .3rem;border-radius:10px;border:2px solid var(--line);background:rgba(0,0,0,.22);color:inherit;font:inherit;cursor:pointer;position:relative}.hz-peg:hover:not(:disabled){border-color:var(--brass-hi)}.hz-peg.sel{border-color:var(--brass-hi);box-shadow:0 0 0 2px var(--brass-hi) inset}.hz-peg:disabled{cursor:default}.hz-rod{position:absolute;left:50%;bottom:1.6rem;top:.4rem;width:6px;margin-left:-3px;background:#8a6a2a;border-radius:3px}.hz-disc{height:1.25rem;border-radius:7px;border:1px solid rgba(0,0,0,.5);position:relative;z-index:1;display:grid;place-items:center;font:700 .7rem var(--mono);color:#1a1200}.hz-lab{font:700 .9rem var(--mono);color:var(--brass-hi);margin-top:.2rem;position:relative;z-index:1}</style>`;
      const hue = (s) => 20 + Math.round((s - 1) * (300 / Math.max(1, n - 1)));
      const draw = () => {
        if (phase === 'choose') {
          A.draw(`${css}<div class="arc-scene"><p class="arc-ask">How many discs?</p><div class="arc-opts">${[3, 4, 5, 6, 7].map((k) => abtn('n', k, `${k} discs`, k === 4 ? 'primary' : '')).join('')}</div><p class="arc-fb">Par for 3 discs is 7 moves. Each extra disc doubles it, plus one.</p></div>`);
          return;
        }
        const p = par(n);
        const pegHtml = pegs.map((st, i) => `<button type="button" class="hz-peg${sel === i ? ' sel' : ''}" data-act="peg" data-v="${i}" style="height:${n * 1.25 + 4}rem" aria-label="Peg ${NAMES[i]}, ${st.length ? 'discs from top: ' + st.slice().reverse().join(', ') : 'empty'}${sel === i ? ', selected' : ''}"${A.over ? ' disabled' : ''}><i class="hz-rod"></i>${st.slice().reverse().map((s) => `<i class="hz-disc" style="width:${26 + (s / n) * 70}%;background:hsl(${hue(s)} 70% 58%)">${s}</i>`).join('')}<span class="hz-lab">${NAMES[i]}</span></button>`).join('');
        A.draw(`${css}<div class="arc-top"><span class="chip">Discs <b>${n}</b></span><span class="chip">Moves <b>${moves}</b></span><span class="chip">Par <b>${p}</b></span></div>
          <div class="arc-scene"><div class="hz-pegs" role="group" aria-label="Three pegs">${pegHtml}</div>
          <p class="arc-ask">${sel === null ? 'Tap a peg to pick up its top disc.' : `Disc from peg ${NAMES[sel]} picked up. Tap where it should go.`}</p>
          <p class="arc-fb">${fb}</p>
          <div class="arc-opts">${abtn('undo', '', 'Undo', '', !hist.length)}${abtn('restart', '', 'Restart', '')}${abtn('change', '', 'Change discs', 'ghost')}</div></div>`);
      };
      const tryMove = (f, t) => {
        if (!canMove(pegs, f, t)) { fb = pegs[f].length === 0 ? 'That peg is empty.' : 'A bigger disc cannot go on a smaller one.'; A.sfx('bad'); sel = null; draw(); return; }
        pegs[t].push(pegs[f].pop()); hist.push([f, t]); moves++; sel = null; fb = `Moved a disc from ${NAMES[f]} to ${NAMES[t]}.`; A.sfx('tick');
        if (solved(pegs, n)) {
          draw(); const p = par(n), r = rating(moves, p);
          A.sfx('clear'); A.end(true, `Solved in ${moves} moves (par ${p}). ${'★'.repeat(r.s)}${'☆'.repeat(3 - r.s)} ${r.t}`); return;
        }
        draw();
      };
      const reset = () => { pegs = [Array.from({ length: n }, (_, i) => n - i), [], []]; sel = null; moves = 0; hist = []; fb = 'Move the whole tower to peg C.'; };
      return {
        start() { phase = 'choose'; n = n || 4; draw(); },
        act(a, v) {
          if (phase === 'choose') { if (a === 'n') { n = Number(v); phase = 'play'; reset(); draw(); } return; }
          if (a === 'peg') { const i = Number(v); if (sel === null) { if (pegs[i].length === 0) { fb = 'That peg is empty.'; draw(); return; } sel = i; draw(); } else if (sel === i) { sel = null; draw(); } else tryMove(sel, i); }
          else if (a === 'undo' && hist.length) { const [f, t] = hist.pop(); pegs[f].push(pegs[t].pop()); moves--; sel = null; fb = 'Undone.'; draw(); }
          else if (a === 'restart') { reset(); draw(); }
          else if (a === 'change') { phase = 'choose'; draw(); }
        },
        _lib: { par, canMove, solved, get pegs() { return pegs; }, get n() { return n; } },
      };
    },
  };
})();

/* --- higher-lower.js --- */
(() => {
  /* Higher or Lower with a real 52 card deck, aces low (1) to kings (13). Guess whether the next card is higher or lower. The same rank is always wrong. Each right guess adds 10 to your streak, a streak of 5 earns a 50 bonus. A wrong guess costs a life and loses the streak. Cash out to bank it. */
  const LIVES = 5, GOAL = 200, SKIPS = 3, BONUS_AT = 5;
  const SUITN = ['spades', 'hearts', 'diamonds', 'clubs'];
  const NAME = (r) => ({ 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' }[r] || String(r));
  const STYLE = `<style>
.hl-top{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;font:600 .8rem var(--mono)}
.hl-top span{padding:.25rem .6rem;border:1px solid var(--line);border-radius:999px;background:rgba(0,0,0,.25)}
.hl-main .pcard{width:5rem;height:7rem;font-size:2rem}
.hl-main .pcard span{font-size:1.7rem}
.hl-trail{display:flex;gap:.25rem;justify-content:center;flex-wrap:wrap;min-height:2.6rem}
.hl-trail .pcard{width:1.9rem;height:2.6rem;font-size:.8rem;border-radius:5px}
.hl-trail .pcard span{font-size:.7rem}
.hl-trail .pslot i,.hl-trail .pslot small{display:none}
.hl-main .pslot i{display:none}
.hl-trail .bad .pcard{outline:2px solid var(--ruby)}
.hl-trail .good .pcard{outline:2px solid var(--mint)}
.hl-mid{font:700 .85rem var(--mono);color:var(--brass-hi);margin:0}
</style>`;
  FULL['Higher or Lower'] = {
    title: 'Higher or Lower: the full game',
    intro: 'A real 52 card deck, Ace low (1) up to King (13). Guess if the next card is higher or lower. The same rank counts as wrong. Each right guess adds 10 to your streak, and reaching a streak of 5 adds a 50 point bonus. A wrong guess costs a life and loses your streak. Cash out to bank your streak safely. Bank ' + GOAL + ' points to win. You have ' + LIVES + ' lives and ' + SKIPS + ' skips, and the deck only has 52 cards.',
    make: (A) => {
      let deck, cur, trail, streak, pts, banked, lives, skips, fb, done;
      const mk = () => { const d = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ r, s }); for (let i = 51; i > 0; i--) { const j = rnd(i + 1); [d[i], d[j]] = [d[j], d[i]]; } return d; };
      const ch = (c) => pokerCardHtml(c.r === 1 ? 14 : c.r, c.s, '', '', undefined);
      const draw = () => {
        A.draw(`${STYLE}<div class="arc-scene">
          <div class="hl-top"><span>Banked ${banked} / ${GOAL}</span><span>Lives ${lives}</span><span>Streak ${streak} (${pts} pts)</span><span>Deck ${deck.length}</span></div>
          <div class="hl-trail" aria-label="Cards so far">${trail.map((t) => `<span class="${t.ok ? 'good' : 'bad'}">${ch(t.c)}</span>`).join('')}</div>
          <div class="hl-main" aria-label="Current card: ${NAME(cur.r)} of ${SUITN[cur.s]}">${ch(cur)}</div>
          <p class="hl-mid">${streak >= BONUS_AT ? 'Bonus earned.' : `${BONUS_AT - streak} more in a row for the 50 bonus.`}</p>
          <p class="arc-fb">${fb}</p>
          <div class="arc-opts">${abtn('higher', '', 'Higher (H)', 'primary', done)}${abtn('lower', '', 'Lower (L)', 'primary', done)}</div>
          <div class="arc-opts">${abtn('cash', '', `Cash out ${pts} (C)`, '', done || streak === 0)}${abtn('skip', '', `Skip card (${skips} left) (S)`, '', done || skips === 0 || deck.length < 2)}</div></div>`);
      };
      const check = () => {
        if (banked >= GOAL) { done = true; draw(); A.end(true, `You banked ${banked} points. You win!`); return true; }
        if (lives <= 0) { done = true; draw(); A.end(false, `No lives left. You banked ${banked} points, short of ${GOAL}.`); return true; }
        if (deck.length === 0) {
          if (pts) { banked += pts; fb += ` The deck is empty, so your ${pts} streak points are banked.`; pts = 0; streak = 0; }
          done = true; draw();
          if (banked >= GOAL) A.end(true, `You banked ${banked} points. You win!`); else A.end(false, `The deck ran out with ${banked} points banked. You needed ${GOAL}.`);
          return true;
        }
        return false;
      };
      const guess = (dir) => {
        if (done) return;
        const nx = deck.pop(), ok = dir === 'higher' ? nx.r > cur.r : nx.r < cur.r;
        trail = [...trail, { c: cur, ok }].slice(-12);
        if (ok) {
          streak++; pts += 10; let bonus = '';
          if (streak === BONUS_AT) { pts += 50; bonus = ' Streak bonus +50!'; }
          fb = `${NAME(nx.r)}: right! Streak ${streak}.` + bonus; A.sfx('good');
        } else {
          lives--; const lost = pts; streak = 0; pts = 0;
          fb = `${NAME(nx.r)}${nx.r === cur.r ? ' is the same rank, which counts as wrong' : ' was ' + (dir === 'higher' ? 'lower' : 'higher')}. Life lost${lost ? ', and ' + lost + ' streak points too' : ''}.`; A.sfx('bad');
        }
        cur = nx;
        if (!check()) draw();
      };
      return {
        start() {
          deck = mk(); cur = deck.pop(); trail = []; streak = 0; pts = 0; banked = 0; lives = LIVES; skips = SKIPS; done = false; fb = 'Will the next card be higher or lower?'; draw();
          A.key((e) => { const k = e.key.toLowerCase(); if (k === 'h' || e.key === 'ArrowUp') { e.preventDefault(); this.act('higher'); } else if (k === 'l' || e.key === 'ArrowDown') { e.preventDefault(); this.act('lower'); } else if (k === 'c') this.act('cash'); else if (k === 's') this.act('skip'); });
        },
        act(a) {
          if (done) return;
          if (a === 'higher' || a === 'lower') guess(a);
          else if (a === 'cash' && streak > 0) { banked += pts; fb = `Cashed out ${pts} points.`; pts = 0; streak = 0; A.sfx('clear'); if (!check()) draw(); }
          else if (a === 'skip' && skips > 0 && deck.length > 1) { skips--; cur = deck.pop(); fb = `Skipped. New card: ${NAME(cur.r)}.`; A.sfx('tick'); draw(); }
        },
      };
    },
  };
})();

