/* --- whack-a-mole.js --- */
(() => {
  /* Whack-a-Mole: 9 holes, moles pop up faster and faster. Hit a mole +1, whack an empty hole -1. Reach 25 in 60 seconds. */
  FULL['Whack-a-Mole'] = {
    title: 'Whack-a-Mole: the full game',
    intro: 'Moles pop out of the holes, and they get quicker as time goes by. Tap a mole to score 1 point. Tapping an empty hole costs 1 point, so do not just mash. Reach 25 points in 60 seconds. Keys 1 to 9 hit the holes, P pauses.',
    make: (A) => {
      const TIME = 60, TARGET = 25, N = 9;
      let S;
      const $ = (id) => document.getElementById(id);
      const lifeMs = () => 1150 - 600 * (S.el / TIME);
      const gapMs = () => 900 - 500 * (S.el / TIME);
      const hud = () => {
        $('wm-sc').textContent = S.score; $('wm-tm').textContent = Math.max(0, Math.ceil(TIME - S.el)); $('wm-hit').textContent = S.hit; $('wm-miss').textContent = S.miss;
        const l = $('wm-live'); if (l && S.msg !== null) { l.textContent = S.msg; S.msg = null; }
      };
      const paint = (i) => {
        const h = $('wm-h' + i); if (!h) return; const m = S.holes[i];
        h.className = 'wm-hole' + (m && m.state === 'up' ? ' up' : '') + (m && m.state === 'hit' ? ' hit' : '') + (S.bad === i ? ' bad' : '');
      };
      const begin = () => { if (S.state !== 'ready') return; S.state = 'play'; const g = $('wm-go'); if (g) g.hidden = true; S.msg = 'Go!'; hud(); };
      const togglePause = () => { if (S.state !== 'play') return; S.paused = !S.paused; const p = $('wm-pause'); if (p) p.textContent = S.paused ? 'Resume' : 'Pause'; const b = $('wm-board'); if (b) b.classList.toggle('paused', S.paused); S.msg = S.paused ? 'Paused' : 'Back to it.'; hud(); };
      const popUp = () => {
        const free = []; for (let i = 0; i < N; i++) if (!S.holes[i]) free.push(i); if (!free.length) return;
        const i = pickOne(free); S.holes[i] = { state: 'up', until: S.el * 1000 + lifeMs() }; paint(i);
      };
      const finish = (won) => { S.state = 'over'; hud(); A.end(won, won ? `You scored ${S.score}. You win!` : `Time is up. You scored ${S.score} of ${TARGET}.`); };
      const whack = (i) => {
        if (S.state !== 'play' || S.paused) return;
        const m = S.holes[i];
        if (m && m.state === 'up') {
          m.state = 'hit'; m.until = S.el * 1000 + 220; S.score++; S.hit++; S.msg = 'Whack! +1'; A.sfx('good'); paint(i);
          if (S.score >= TARGET) { hud(); finish(true); return; }
        } else if (!m) { S.score = Math.max(0, S.score - 1); S.miss++; S.msg = 'Empty hole. -1'; A.sfx('bad'); S.bad = i; S.badUntil = S.el * 1000 + 250; paint(i); }
        hud();
      };
      return {
        start() {
          S = { state: 'ready', paused: false, score: 0, hit: 0, miss: 0, el: 0, holes: Array(N).fill(null), nextPop: 600, bad: -1, badUntil: 0, msg: '' };
          if (window.__fullDebug) window.__fullDebug.wm = S;
          const cells = Array.from({ length: N }, (_, i) => `<button type="button" class="wm-hole" id="wm-h${i}" data-act="whack" data-v="${i}" aria-label="Hole ${i + 1}"><span class="wm-mole"><i></i><i></i></span><span class="wm-rim"></span></button>`).join('');
          A.draw(`<style>
            .wm-board{display:grid;grid-template-columns:repeat(3,1fr);gap:0.6rem;width:min(100%,24rem);padding:0.7rem;border-radius:14px;background:#2d5a2a;border:2px solid var(--line)}
            .wm-board.paused{opacity:0.45}
            .wm-hole{position:relative;aspect-ratio:1/0.9;border:0;padding:0;cursor:pointer;background:radial-gradient(ellipse at 50% 80%,#1a0f08 0 45%,#3b2412 46% 60%,transparent 61%);overflow:hidden;border-radius:10px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
            .wm-mole{position:absolute;left:18%;right:18%;bottom:-70%;height:68%;border-radius:50% 50% 12% 12%;background:#8b5a2b;transition:bottom 0.08s;display:flex;justify-content:space-around;align-items:flex-start;padding:22% 18% 0}
            .wm-mole i{width:14%;aspect-ratio:1;border-radius:50%;background:#14110e;display:block}
            .wm-hole.up .wm-mole{bottom:18%}.wm-hole.hit .wm-mole{bottom:8%;background:#c97a7a}
            .wm-hole.bad{outline:3px solid var(--ruby)}
            .wm-rim{position:absolute;left:8%;right:8%;bottom:6%;height:26%;border-radius:50%;background:#3b2412;box-shadow:0 -3px 0 #4a2f18 inset;z-index:2}
            .wm-hole:focus-visible{outline:2px solid var(--brass-hi)}
          </style><div class="arc-scene" style="width:100%"><div class="arc-top"><span class="chip">Score <b id="wm-sc">0</b> / ${TARGET}</span><span class="chip">Time <b id="wm-tm">${TIME}</b></span><span class="chip">Hits <b id="wm-hit">0</b></span><span class="chip">Misses <b id="wm-miss">0</b></span></div>
            <div class="wm-board" id="wm-board">${cells}</div>
            <div class="arc-opts">${abtn('go', '', 'Start', 'primary').replace('<button', '<button id="wm-go"')}${abtn('pause', '', 'Pause').replace('<button', '<button id="wm-pause"')}</div>
            <p class="arc-fb" id="wm-live" aria-live="polite">Tap Start when you are ready.</p></div>`);
          A.key((e) => {
            if (/^[1-9]$/.test(e.key)) { e.preventDefault(); whack(Number(e.key) - 1); }
            else if (e.key === 'p' || e.key === 'P') togglePause();
            else if (e.key === ' ') { e.preventDefault(); if (S.state === 'ready') begin(); else togglePause(); }
          });
          let last = performance.now();
          A.timer(() => {
            const n = performance.now(), dt = Math.min(100, n - last); last = n;
            if (S.state !== 'play' || S.paused) return;
            S.el += dt / 1000; const now = S.el * 1000;
            for (let i = 0; i < N; i++) {
              const m = S.holes[i]; if (!m || now < m.until) continue;
              S.holes[i] = null; if (m.state === 'up') { S.msg = 'It got away.'; } paint(i);
            }
            if (S.bad >= 0 && now > S.badUntil) { const b = S.bad; S.bad = -1; paint(b); }
            if (now >= S.nextPop) { popUp(); if (S.el > 25 && Math.random() < 0.5) popUp(); S.nextPop = now + gapMs() * (0.7 + Math.random() * 0.6); }
            if (S.el >= TIME) { S.el = TIME; finish(S.score >= TARGET); return; }
            hud();
          }, 50);
          hud();
        },
        act(a, v) {
          if (a === 'go') begin(); else if (a === 'pause') togglePause(); else if (a === 'whack') whack(Number(v));
          try { document.activeElement.blur(); } catch (_) { /* ignore */ }
        },
      };
    },
  };
})();

/* --- wordle.js --- */
(() => {
  /* Wordle: 6 tries to find a hidden 5-letter word. Answers come from a list of common words.
     Guesses are accepted if they are any 5 letters (no dictionary check), so you can use odd words to test letters. */
  const ANS = ('about above actor adapt admit adopt adult after again agent agree ahead alarm album alert alike alive allow alone along alter among angel anger angle angry ankle apart apple apply arena argue arise armed army aside asset avoid awake award aware badly baker basic basis beach beard beast begin being below bench berry birth black blade blame blank blast blaze bleed blend bless blind block blood bloom board boast bonus boost booth bound brain brand brave bread break breed brick bride brief bring broad broke brown brush build bunch burst buyer cabin cable candy carry carve catch cause chain chair chalk charm chart chase cheap check cheek cheer chess chest chief child chill choir chose chunk civil claim class clean clear clerk click cliff climb clock close cloth cloud coach coast color couch could count court cover crack craft crane crash crazy cream crime crisp cross crowd crown cruel crush curve cycle daily dairy dance dealt death debut delay depth diary dirty doubt dozen draft drain drama drank drawn dream dress dried drift drink drive eager early earth eight elbow elder elect elite empty enemy enjoy enter entry equal error essay event every exact exist extra faint fairy faith false fancy fault feast fence fever fiber field fifth fifty fight final first flame flash fleet flesh float flock flood floor flour fluid flute focus force forge forth forty forum found frame fresh front frost fruit fully funny ghost giant given glass globe glory glove grace grade grain grand grant grape grass grave great green greet grief grill group grown guard guess guest guide habit happy harsh heart heavy hedge hello hence honey honor horse hotel house human humor hurry ideal image imply index inner input issue ivory jelly jewel joint judge juice knife knock known label labor large laser later laugh layer learn lease least leave legal lemon level light limit linen local logic loose lover lower lucky lunch magic major maker march match maybe mayor meant medal media merit metal meter might minor minus mixed model money month moral motor mount mouse mouth movie music naive naked nerve never newly night noble noise north novel nurse ocean offer often olive onion opera orbit order other ought outer owner paint panel paper party pasta patch pause peace pearl phase phone photo piano piece pilot pitch pizza place plain plane plant plate plaza point polar pound power press price pride prime print prior prize proof proud prove pulse punch pupil queen query quick quiet quite quote radar radio raise rally ranch range rapid ratio reach react ready realm rebel refer relax reply rider ridge right rigid rival river roast robot rocky roman rough round route royal rural salad sauce scale scene scope score scout sense serve seven shade shake shall shape share sharp sheep sheet shelf shell shift shine shirt shock shoot shore short shout sight silly since sixth sixty skill skirt sleep slice slide small smart smile smoke snake solar solid solve sorry sound south space spare speak speed spell spend spice spine split spoke sport staff stage stair stamp stand stare start state steam steel steep stick still stock stone stood store storm story stove strip stuck study stuff style sugar suite sunny super sweet swept swift swing sword table taste teach tenth thank theme there thick thing think third those three threw throw thumb tiger tight timer tired title toast today token tooth topic total touch tough tower toxic trace track trade trail train treat trend trial tribe trick troop truck truly trunk trust truth twice twist ultra uncle under union unity until upper upset urban usage usual valid value video virus visit vital vocal voice waste watch water weigh wheel where which while white whole whose wider woman world worry worse worth would wound write wrong yield young youth zebra').split(' ');
  const ROWS = ['qwertyuiop', 'asdfghjkl', '-zxcvbnm='];
  const CSS = '<style>.wf-keys{display:grid;gap:.3rem;width:100%;max-width:25rem}.wf-kr{display:flex;gap:.25rem;justify-content:center}.wf-k{flex:1 1 0;min-width:0;padding:.7rem 0;border-radius:6px;border:1px solid var(--line);background:#2b3a34;color:#fff;font:700 .85rem var(--mono);text-transform:uppercase;cursor:pointer}.wf-k.w{flex:1.6 1 0;font-size:.65rem}.wf-k.green{background:#538d4e}.wf-k.yellow{background:#b59f3b}.wf-k.grey{background:#121a17;color:#7d8f87}.wf-k:disabled{opacity:.5;cursor:default}@keyframes wflip{from{transform:rotateX(90deg)}to{transform:none}}.wf-rev{animation:wflip .45s backwards}.wf-msg{min-height:1.3rem;margin:0;text-align:center;font-weight:600}</style>';
  const score = (g, a) => {
    const r = Array(5).fill('grey'), left = {};
    for (let i = 0; i < 5; i++) { if (g[i] === a[i]) r[i] = 'green'; else left[a[i]] = (left[a[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) if (r[i] !== 'green' && left[g[i]] > 0) { r[i] = 'yellow'; left[g[i]]--; }
    return r;
  };
  FULL['Wordle'] = {
    title: 'Wordle: the full game',
    intro: 'Find the hidden 5-letter word in 6 tries. Green means right letter, right spot. Yellow means the letter is in the word but elsewhere. Grey means it is not there (or you used it too many times). Any 5 letters are accepted as a guess.',
    make: (A) => {
      let ans, guesses, cur, msg, done;
      const best = () => {
        const rank = { grey: 1, yellow: 2, green: 3 }, k = {};
        guesses.forEach((g) => score(g, ans).forEach((c, i) => { if (!k[g[i]] || rank[c] > rank[k[g[i]]]) k[g[i]] = c; }));
        return k;
      };
      const draw = () => {
        const k = best();
        const rows = [];
        for (let r = 0; r < 6; r++) {
          let cells = '';
          if (r < guesses.length) { const sc = score(guesses[r], ans); cells = [...guesses[r]].map((ch, i) => `<span class="wd-tile ${sc[i]}${r === guesses.length - 1 ? ' wf-rev' : ''}" style="animation-delay:${i * 0.12}s">${ch}</span>`).join(''); }
          else if (r === guesses.length && !done) cells = Array.from({ length: 5 }, (_, i) => `<span class="wd-tile plain${cur[i] ? ' pick' : ''}">${cur[i] || ''}</span>`).join('');
          else cells = Array.from({ length: 5 }, () => '<span class="wd-tile plain"></span>').join('');
          rows.push(`<div class="wd-row" aria-label="Guess ${r + 1}${r < guesses.length ? ': ' + guesses[r] + ' ' + score(guesses[r], ans).join(' ') : ''}">${cells}</div>`);
        }
        const kb = ROWS.map((row) => `<div class="wf-kr">${[...row].map((c) => c === '-' ? `<button type="button" class="wf-k w" data-act="enter" aria-label="Enter guess">Enter</button>` : c === '=' ? `<button type="button" class="wf-k w" data-act="del" aria-label="Delete letter">Del</button>` : `<button type="button" class="wf-k ${k[c] || ''}" data-act="key" data-v="${c}" aria-label="Letter ${c}">${c}</button>`).join('')}</div>`).join('');
        A.draw(`${CSS}<div class="arc-scene"><div class="wd-rows">${rows.join('')}</div><p class="wf-msg">${msg}</p><div class="wf-keys">${kb}</div></div>`);
      };
      const type = (c) => { if (cur.length < 5) { cur += c; msg = ''; A.sfx('tick'); draw(); } };
      const del = () => { cur = cur.slice(0, -1); msg = ''; draw(); };
      const enter = () => {
        if (cur.length < 5) { msg = 'Type 5 letters first.'; A.sfx('bad'); draw(); return; }
        guesses.push(cur); const g = cur; cur = ''; msg = '';
        if (g === ans) { done = true; draw(); A.end(true, `You got it in ${guesses.length} ${guesses.length === 1 ? 'try' : 'tries'}!`); return; }
        if (guesses.length === 6) { done = true; draw(); A.end(false, `Out of tries. The word was ${ans.toUpperCase()}.`); return; }
        A.sfx('good'); draw();
      };
      return {
        start() {
          ans = pickOne(ANS); guesses = []; cur = ''; msg = 'Type a word, then press Enter.'; done = false; draw();
          A.key((e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toLowerCase());
            else if (e.key === 'Backspace') del();
            else if (e.key === 'Enter') { e.preventDefault(); enter(); }
          });
        },
        act(a, v) { if (a === 'key') type(v); else if (a === 'del') del(); else if (a === 'enter') enter(); },
      };
    },
  };
})();

/* --- yahtzee.js --- */
(() => {
  /* Yahtzee with full scoring: upper bonus (35 at 63+), Yahtzee 50, Yahtzee bonus 100, joker rules. A bot plays a full card in the background. */
  const CATS = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes', 'k3', 'k4', 'fh', 'ss', 'ls', 'yz', 'chance'];
  const LABEL = { ones: 'Ones', twos: 'Twos', threes: 'Threes', fours: 'Fours', fives: 'Fives', sixes: 'Sixes', k3: '3 of a kind', k4: '4 of a kind', fh: 'Full house (25)', ss: 'Small straight (30)', ls: 'Large straight (40)', yz: 'Yahtzee (50)', chance: 'Chance' };
  const PAR = { ones: 2.1, twos: 4.2, threes: 6.3, fours: 8.4, fives: 10.5, sixes: 12.6, k3: 21, k4: 13, fh: 22, ss: 29, ls: 32, yz: 16, chance: 22 };
  const TARGET = 150;
  const counts = (d) => { const c = [0, 0, 0, 0, 0, 0, 0]; d.forEach((x) => c[x]++); return c; };
  const sum = (d) => d.reduce((a, b) => a + b, 0);
  const isYz = (d) => d.every((x) => x === d[0]);
  const run = (d, n) => { const c = counts(d); for (let s = 1; s + n - 1 <= 6; s++) { let ok = true; for (let k = s; k < s + n; k++) if (!c[k]) ok = false; if (ok) return true; } return false; };
  const raw = (cat, d, joker) => {
    const c = counts(d), mx = Math.max(...c.slice(1)), i = CATS.indexOf(cat);
    if (i < 6) return c[i + 1] * (i + 1);
    switch (cat) {
      case 'k3': return mx >= 3 ? sum(d) : 0;
      case 'k4': return mx >= 4 ? sum(d) : 0;
      case 'fh': return joker || (c.includes(3) && c.includes(2)) ? 25 : 0;
      case 'ss': return joker || run(d, 4) ? 30 : 0;
      case 'ls': return joker || run(d, 5) ? 40 : 0;
      case 'yz': return isYz(d) ? 50 : 0;
      default: return sum(d);
    }
  };
  const jokerOn = (sc, d) => isYz(d) && sc.yz !== null;
  const allowed = (sc, d) => {
    const open = CATS.filter((c) => sc[c] === null);
    if (!jokerOn(sc, d)) return open;
    const up = CATS[d[0] - 1];
    if (sc[up] === null) return [up];
    const low = open.filter((c) => CATS.indexOf(c) >= 6);
    return low.length ? low : open;
  };
  const scoreOf = (sc, cat, d) => raw(cat, d, jokerOn(sc, d));
  const upperSum = (sc) => CATS.slice(0, 6).reduce((a, c) => a + (sc[c] || 0), 0);
  const total = (sc) => CATS.reduce((a, c) => a + (sc[c] || 0), 0) + (upperSum(sc) >= 63 ? 35 : 0) + sc.bonus;
  const newCard = () => { const o = { bonus: 0 }; CATS.forEach((c) => { o[c] = null; }); return o; };
  const place = (sc, cat, d) => { if (isYz(d) && sc.yz === 50) sc.bonus += 100; sc[cat] = scoreOf(sc, cat, d); };
  const botTurn = (sc) => {
    let d = [1, 2, 3, 4, 5].map(() => 1 + rnd(6));
    const bestVal = (dd) => Math.max(...allowed(sc, dd).map((c) => scoreOf(sc, c, dd) - PAR[c] + (isYz(dd) && sc.yz === 50 ? 100 : 0)));
    for (let r = 0; r < 2; r++) {
      let best = -1e9, bm = 31;
      for (let m = 0; m < 32; m++) {
        let t = 0; const N = 24;
        for (let n = 0; n < N; n++) t += bestVal(d.map((x, i) => (m >> i & 1 ? x : 1 + rnd(6))));
        if (t / N > best) { best = t / N; bm = m; }
      }
      d = d.map((x, i) => (bm >> i & 1 ? x : 1 + rnd(6)));
    }
    const cat = allowed(sc, d).sort((a, b) => (scoreOf(sc, b, d) - PAR[b]) - (scoreOf(sc, a, d) - PAR[a]))[0];
    place(sc, cat, d);
  };
  FULL['Yahtzee'] = {
    title: 'Yahtzee: the full game',
    intro: `Thirteen turns. Roll five dice up to three times, tap dice to hold them, then fill one box on your scorecard. Upper boxes total 63 or more for a 35 bonus. Extra Yahtzees earn 100 and act as jokers. Score at least ${TARGET} and beat the bot's card to win.`,
    make: (A) => {
      let sc, dice, held, rolls, turn, fb, bot, botTot, busy;
      const draw = () => {
        const pot = rolls > 0 ? allowed(sc, dice) : [];
        const up = upperSum(sc);
        A.draw(`<style>.yz-d{width:3rem;height:3.4rem;font:700 1.5rem var(--mono);border-radius:10px;border:2px solid var(--line);background:var(--ivory);color:var(--ink);cursor:pointer}.yz-d.h{border-color:var(--ruby);background:#ffd9d4;transform:translateY(-6px)}.yz-sc{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;width:100%}.yz-c{display:flex;justify-content:space-between;gap:.3rem;padding:.35rem .5rem;font:600 .72rem var(--mono);border:1px solid var(--line);border-radius:8px;background:rgba(0,0,0,.2);color:var(--ivory);text-align:left}button.yz-c{cursor:pointer}button.yz-c.can{border-color:var(--brass-hi)}.yz-c.done{opacity:.75}</style>
          <div class="arc-scene" style="width:100%">
          <div class="arc-top"><span class="chip">Turn ${Math.min(turn + 1, 13)} of 13</span><span class="chip">Score ${total(sc)}</span><span class="chip">Target ${TARGET}</span><span class="chip">Bot ${botTot[Math.min(turn, 13)]}${turn < 13 ? '' : ' final'}</span></div>
          <div class="arc-row">${dice.map((x, i) => `<button type="button" class="yz-d${held[i] ? ' h' : ''}" data-act="hold" data-v="${i}" aria-label="Die ${i + 1} shows ${x}${held[i] ? ', held' : ''}" ${rolls === 0 || rolls === 3 || busy ? 'disabled' : ''}>${rolls ? x : '?'}</button>`).join('')}</div>
          <div class="arc-opts">${abtn('roll', '', rolls === 0 ? 'Roll dice (space)' : `Re-roll unheld (${3 - rolls} left)`, 'primary', busy || rolls >= 3)}</div>
          <p class="arc-fb">${fb}</p>
          <div class="yz-sc">${CATS.map((c) => {
            if (sc[c] !== null) return `<div class="yz-c done"><span>${LABEL[c]}</span><b>${sc[c]}</b></div>`;
            const ok = pot.includes(c);
            return `<button type="button" class="yz-c${ok ? ' can' : ''}" data-act="score" data-v="${c}" ${ok && !busy ? '' : 'disabled'}><span>${LABEL[c]}</span><b>${rolls ? scoreOf(sc, c, dice) : '-'}</b></button>`;
          }).join('')}</div>
          <p class="muted">Upper total ${up} of 63 (bonus 35). Yahtzee bonus: ${sc.bonus}.${rolls && jokerOn(sc, dice) ? ' Joker rule is active: another Yahtzee!' : ''}</p></div>`);
      };
      const doRoll = () => {
        if (busy || rolls >= 3) return;
        dice = dice.map((x, i) => (rolls && held[i] ? x : 1 + rnd(6))); rolls++; if (rolls === 3) held = [0, 0, 0, 0, 0];
        fb = isYz(dice) ? 'Yahtzee!' : rolls === 3 ? 'No rolls left. Choose a box.' : 'Hold dice you want to keep, or pick a box.'; A.sfx(isYz(dice) ? 'clear' : 'tick'); draw();
      };
      return {
        start() {
          sc = newCard(); dice = [1, 1, 1, 1, 1]; held = [0, 0, 0, 0, 0]; rolls = 0; turn = 0; busy = false; fb = 'Roll the dice to begin.';
          const b = newCard(); botTot = [0]; for (let t = 0; t < 13; t++) { botTurn(b); botTot.push(total(b)); }
          draw();
          A.key((e) => { if (e.key === ' ') { e.preventDefault(); doRoll(); } else if (/^[1-5]$/.test(e.key) && rolls > 0 && rolls < 3) { held[+e.key - 1] ^= 1; draw(); } });
        },
        act(a, v) {
          if (busy) return;
          if (a === 'roll') doRoll();
          else if (a === 'hold' && rolls > 0 && rolls < 3) { held[+v] ^= 1; draw(); }
          else if (a === 'score' && rolls > 0 && allowed(sc, dice).includes(v) && sc[v] === null) {
            const bonus = isYz(dice) && sc.yz === 50; const pts = scoreOf(sc, v, dice); place(sc, v, dice);
            turn++; rolls = 0; held = [0, 0, 0, 0, 0]; fb = `${LABEL[v]}: ${pts} points${bonus ? ' plus 100 Yahtzee bonus' : ''}.`; A.sfx(pts ? 'good' : 'bad');
            if (turn >= 13) {
              busy = true; draw(); const me = total(sc), bt = botTot[13];
              const win = me >= TARGET && me > bt;
              A.end(win, `Final score ${me}. Bot scored ${bt}. ${win ? 'You hit the target and beat the bot. You win!' : me < TARGET ? `You needed ${TARGET}. Try again.` : 'The bot got more than you this time.'}`);
            } else draw();
          }
        },
      };
    },
  };
})();

/*FULL:END*/
class FullPlay {
  constructor(game, name, def) { this.game = game; this.name = name; this.def = def; this.over = false; this.full = true; this.cl = []; this.impl = def.make(this); }
  draw(html) { const st = this.game.el.arcadeStage; st.innerHTML = html; const i = st.querySelector('input:not([disabled])'); if (i) i.focus(); }
  sfx(k) { this.game.sfx.play(k); }
  timer(fn, ms) { const id = setInterval(() => { if (!this.over) fn(); }, ms); this.cl.push(() => clearInterval(id)); return id; }
  after(fn, ms) { const id = setTimeout(fn, ms); this.cl.push(() => clearTimeout(id)); return id; }
  key(fn) { const h = (e) => { if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).nodeName) || this.game.view !== 'arcade') return; fn(e); }; document.addEventListener('keydown', h); this.cl.push(() => document.removeEventListener('keydown', h)); }
  dispose() { this.cl.forEach((f) => { try { f(); } catch (e) { /* ignore */ } }); this.cl = []; }
  end(won, text) {
    this.over = true; this.dispose(); const m = this.game.el.arcadeMsg; m.className = 'arc-msg ' + (won ? 'won' : 'lost'); m.textContent = text;
    if (won) this.game.fullWin(this.name); else this.sfx('bad');
    this.game.el.arcadeAgain.hidden = false;
    this.game.el.arcadeStage.querySelectorAll('button[data-act], input').forEach((b) => { b.disabled = true; });
  }
  start() { this.dispose(); this.over = false; const m = this.game.el.arcadeMsg; m.className = 'arc-msg'; m.textContent = ''; this.game.el.arcadeAgain.hidden = true; this.impl.start(); }
  act(a, v) { if (!this.over) this.impl.act(a, v); }
}
class Arcade {
  constructor(game, level, view) {
    this.game = game; this.level = level; this.over = false; this.view = view;
    this.def = ARCADE[level.id]; this.impl = this.def.make(this); this.calls = [];
    this.src = [level.fix.keepBefore || '', level.fix.lines.join('\n')].join('\n');
  }
  run(tail, quiet, label) {
    const r = new Interpreter(`${this.src}\n${tail}`, { trace: false, limit: 20000, lang: 'js' }).run();
    const out = r.error ? `error: ${r.error.message}` : r.out.join('\n');
    if (!quiet) { this.calls.unshift({ call: this.callText(label ? `console.log(${label});` : tail), out }); this.calls.length = Math.min(this.calls.length, 6); this.game.renderArcadeLog(this); }
    return out;
  }
  callText(tail) { const m = tail.match(/^console\.log\((.*)\);$/s); let t = m ? m[1] : tail; if (this.game.lang === 'py') t = t.replace(/\b[a-z]+(?:[A-Z][a-z0-9]*)+\b/g, snakeCase).replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False'); return t; }
  show(v) { const s = String(v); return this.game.lang === 'py' && (s === 'true' || s === 'false') ? (s === 'true' ? 'True' : 'False') : s; }
  draw(html) { const st = this.game.el.arcadeStage; st.innerHTML = html; const i = st.querySelector('input:not([disabled])'); if (i) i.focus(); }
  sfx(k) { this.game.sfx.play(k); }
  end(won, text) {
    this.over = true; this.game.el.arcadeMsg.className = 'arc-msg ' + (won ? 'won' : 'lost'); this.game.el.arcadeMsg.textContent = text;
    if (won) this.game.arcadeWin(this.level.id); else this.sfx('bad');
    this.game.el.arcadeAgain.hidden = false;
    this.game.el.arcadeStage.querySelectorAll('button[data-act], input').forEach((b) => { b.disabled = true; });
  }
  start() { this.game.el.arcadeMsg.className = 'arc-msg'; this.game.el.arcadeMsg.textContent = ''; this.game.el.arcadeAgain.hidden = true; this.calls = []; this.game.renderArcadeLog(this); this.impl.start(); }
  act(a, v) { this.impl.act(a, v); }
}

class Game {
  constructor() {
    this.store = new Store('logic-engine-v3');
    let saved = this.store.load();
    if (!saved.prog) {   // first run on v3: carry over the old JavaScript-only progress
      const old = new Store('logic-engine-v2').load();
      saved = { score: old.score || 0, level: old.level || 0, lang: 'js', prog: { js: { completed: old.completed || [], stars: old.stars || {} } } };
    }
    this.lang = LANGS.some((l) => l.id === saved.lang) ? saved.lang : 'js';
    UI_LANG = this.lang;
    this.score = saved.score || 0;
    this.full = (saved.full && typeof saved.full === 'object') ? saved.full : {};
    this.prog = {};
    LANGS.forEach(({ id }) => { const p = (saved.prog || {})[id] || {}; this.prog[id] = { completed: new Set(p.completed || []), stars: p.stars || {} }; });
    this.levelsRaw = LEVELS;
    this.levels = LEVELS.map((l) => viewLevel(l, this.lang));
    this.streak = 0;
    this.awarded = new Set();   // keys of point awards already granted (no farming via Reset)
    this.sfx = new Sfx();
    this.shownScore = this.score;
    this.view = 'lobby';
    this.rankShown = -1;
    this.predictMode = true;
    this.tab = 'predict';
    this.el = {};
    document.querySelectorAll('[id]').forEach((n) => { this.el[n.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = n; });
    this.confetti = new Confetti(this.el.confetti);
    this.bind();
    { const k = saved.levelId ? this.levels.findIndex((L) => L.id === saved.levelId) : -1; this.loadLevel(Math.min(k >= 0 ? k : 0, this.unlockedCount() - 1)); }
    this.renderSound();
    this.renderLangs();
    this.showLobby();
  }

  /* ---------- setup ---------- */
  unlockedCount() { return this.levels.length; }
  get completed() { return this.prog[this.lang].completed; }
  get stars() { return this.prog[this.lang].stars; }
  get langName() { return LANGS.find((l) => l.id === this.lang).name; }
  save() {
    const prog = {};
    LANGS.forEach(({ id }) => { prog[id] = { completed: [...this.prog[id].completed], stars: this.prog[id].stars }; });
    this.store.save({ score: this.score, lang: this.lang, level: this.li, levelId: this.level.id, prog, full: this.full });
  }
  /** Same tables, same bugs, another language: progress is kept per language. */
  setLang(id) {
    if (id === this.lang || !LANGS.some((l) => l.id === id)) return;
    this.lang = id;
    UI_LANG = id;
    this.levels = LEVELS.map((l) => viewLevel(l, id));
    this.streak = 0;
    this.loadLevel(this.li);
    this.renderLangs();
    this.renderLobby();
    toast(this.el, `Now learning in ${this.langName}. Your progress is saved per language.`, 'info');
  }
  renderLangs() {
    document.querySelectorAll('[data-lang]').forEach((b) => { const on = b.dataset.lang === this.lang; b.setAttribute('aria-checked', String(on)); b.classList.toggle('on', on); });
  }

  /* ---------- views ---------- */
  showLobby() {
    const from = this.view;
    if (from === 'table' || from === 'arcade') { const L = this.levels[from === 'arcade' && this.arcLi !== undefined ? this.arcLi : this.li], f = L && FAMS.find((x) => x.name === L.family); this.hub = f && f.members.length > 1 ? f.name : null; }
    this.view = 'lobby';
    this.el.lobby.hidden = false; this.el.tableView.hidden = true; this.el.arcade.hidden = true; this.disposeArc(); this.arc = null; this.el.btnLobby.hidden = true;
    this.renderLobby();
    try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
  }
  showTable() {
    this.view = 'table';
    this.el.lobby.hidden = true; this.el.tableView.hidden = false; this.el.arcade.hidden = true; this.disposeArc(); this.arc = null; this.el.btnLobby.hidden = false;
    try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
  }
  openLevel(i) { if (i !== this.li) this.loadLevel(i); this.showTable(); }

  /* ---------- arcade: play the real game once the table is cleared ---------- */
  arcadeUnlocked(L) { return LANGS.some((l) => this.prog[l.id].completed.has(L.id)); }
  showArcade(i) {
    const L = this.levels[i], raw = this.levelsRaw[i];
    if (!this.arcadeUnlocked(L) || !ARCADE[L.id]) return;
    this.view = 'arcade'; this.arcLi = i;
    this.el.lobby.hidden = true; this.el.tableView.hidden = true; this.el.arcade.hidden = false; this.el.btnLobby.hidden = false;
    this.el.modal.hidden = true;
    this.arcFull = null; { const ey = this.el.arcade.querySelector('.eyebrow'); if (ey) ey.textContent = 'Play time · you earned it'; const ac = this.el.arcade.querySelector('.arc-code'); if (ac) ac.hidden = false; this.el.arcadeTable.textContent = 'Back to the lesson'; }
    this.disposeArc();
    const def = ARCADE[L.id];
    this.el.arcadeTitle.textContent = def.title; this.el.arcadeIntro.textContent = def.intro;
    this.el.arcadeCode.innerHTML = `<code>${(L.fix.given ? L.fix.given + '\n\n' : '') + L.fix.reference}</code>`.split('\n').join('\n');
    this.el.arcadeCode.textContent = (L.fix.given ? L.fix.given + '\n\n' : '') + L.fix.reference;
    this.arc = new Arcade(this, raw.fix ? Object.assign({}, raw, { fix: raw.fix }) : raw, L);
    this.arc.start();
    try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
  }
  disposeArc() { if (this.arc && this.arc.dispose) this.arc.dispose(); }
  fullUnlocked(f) { return !!f && f.members.every((L) => LANGS.some((l) => this.prog[l.id].completed.has(L.id))); }
  showFull(name, force) {
    const f = FAMS.find((x) => x.name === name), def = FULL[name];
    if (!f || !def || !(force || this.fullUnlocked(f))) return;
    this.disposeArc();
    this.view = 'arcade'; this.arcLi = this.levels.findIndex((L) => L.id === f.main); this.arcFull = name;
    this.el.lobby.hidden = true; this.el.tableView.hidden = true; this.el.arcade.hidden = false; this.el.btnLobby.hidden = false; this.el.modal.hidden = true;
    this.el.arcadeTitle.textContent = def.title; this.el.arcadeIntro.textContent = def.intro;
    const ey = this.el.arcade.querySelector('.eyebrow'); if (ey) ey.textContent = 'Full game · you mastered it';
    const ac = this.el.arcade.querySelector('.arc-code'); if (ac) ac.hidden = true;
    this.el.arcadeTable.textContent = 'Back to the lessons';
    this.arc = new FullPlay(this, name, def); this.arc.start();
    try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
  }
  fullWin(name) {
    this.sfx.play('clear');
    if (!this.full[name]) { this.full[name] = 0; this.award(100); toast(this.el, 'Full game won: +100', 'ok'); }
    this.full[name] = (this.full[name] | 0) + 1; this.save();
  }
  renderArcadeLog(a) {
    this.el.arcadeLog.innerHTML = a.calls.length ? a.calls.map((c) => `<li><code>${esc(c.call)}</code> <span>→</span> <b>${esc(a.show(c.out))}</b></li>`).join('') : '<li class="muted">Nothing yet. Play a round.</li>';
  }
  arcadeWin(id) {
    this.sfx.play('clear');
    const k = `arcade:${id}`;
    if (!this.awarded.has(k)) { this.awarded.add(k); this.award(40); toast(this.el, 'You won the game!', 'ok'); this.save(); }
  }

  renderSound() {
    const on = this.sfx.on;
    this.el.soundUse.setAttribute('href', on ? '#i-sound-on' : '#i-sound-off');
    this.el.btnSound.setAttribute('aria-pressed', String(on));
    this.el.btnSound.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
  }

  renderFilters() {
    const box = this.el.lobbyFilters; if (!box) return;
    if (!this.filter) this.filter = { diff: 0, theme: '', topic: '', hideDone: false };
    const f = this.filter;
    const group = (key, label, opts) => `<div class="fgroup" role="group" aria-label="${label}"><span class="flabel">${label}</span>`
      + opts.map(([v, text]) => `<button type="button" class="fchip" data-f="${key}" data-v="${esc(String(v))}" aria-pressed="${String(f[key] === v)}">${esc(text)}</button>`).join('') + '</div>';
    box.innerHTML = group('diff', 'Difficulty', [[0, 'All'], ...DIFFICULTY.map((d, i) => [i + 1, d])])
      + group('theme', 'Theme', [['', 'All'], ...THEMES.map((t) => [t, t])])
      + group('topic', 'What it teaches', [['', 'All'], ...TOPICS.map((t) => [t, t])])
      + `<div class="fgroup"><button type="button" class="fchip" data-f="hideDone" data-v="toggle" aria-pressed="${String(f.hideDone)}">Hide cleared</button><button type="button" class="fchip ghost" id="filter-reset">Reset filters</button><span class="fcount" id="filter-count" aria-live="polite"></span></div>`;
    box.querySelectorAll('[data-f]').forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.f;
        if (k === 'hideDone') f.hideDone = !f.hideDone; else f[k] = k === 'diff' ? Number(b.dataset.v) : b.dataset.v;
        this.renderFilters(); this.renderLobby();
      };
    });
    const r = document.getElementById('filter-reset'); if (r) r.onclick = () => { this.filter = null; this.renderFilters(); this.renderLobby(); };
  }

  renderLobby() {
    const grid = this.el.lobbyGrid;
    if (!grid) return;
    const idxOf = (L) => this.levels.findIndex((x) => x.id === L.id);
    const next = this.levels.findIndex((L) => !this.completed.has(L.id));
    const hub = this.hub ? FAMS.find((f) => f.name === this.hub) : null;
    const title = document.getElementById('lobby-title'), eyebrow = document.querySelector('#lobby .eyebrow');
    const lessonTicket = (L, k) => {
      const i = idxOf(L), done = this.completed.has(L.id), s = done ? (this.stars[L.id] || 1) : 0;
      const raw = L.title.replace(/^Table \d+ · /, '').replace(/^[^:]*: /, ''), name = raw.charAt(0).toUpperCase() + raw.slice(1);
      return `<div class="tk"><button type="button" class="ticket${done ? ' cleared' : ''}${i === next ? ' next' : ''}" data-i="${i}" aria-label="Part ${k + 1}, ${esc(name)}${done ? `, done with ${s} of 3 stars` : ''}">`
        + `<span class="plate"><span class="no">PART ${k + 1}</span>${emblem(L.id)}${done ? '<span class="stamp">Done</span>' : ''}</span>`
        + `<span class="t-body"><span class="t-name">${esc(name)}</span><span class="t-tags"><span class="diff d${L.difficulty}" title="${DIFFICULTY[L.difficulty - 1]}"><i></i><i></i><i></i></span><em>${DIFFICULTY[L.difficulty - 1]}</em></span></span>`
        + `<span class="t-foot"><span class="t-stars">${starsHtml(s)}</span><span class="t-go">${done ? 'Again' : i === next ? 'Start' : 'Open'}</span></span></button>${done && ARCADE[L.id] ? `<button type="button" class="t-play" data-play="${i}">Play</button>` : ''}</div>`;
    };
    if (hub) {
      grid.innerHTML = hub.members.map((L, k) => lessonTicket(L, k)).join('');
      if (title) title.textContent = hub.name; if (eyebrow) eyebrow.textContent = `${hub.members.length} small lessons`;
    } else {
      grid.innerHTML = FAMS.map((f) => {
        const n = f.members.length, doneN = f.members.filter((L) => this.completed.has(L.id)).length, all = doneN === n;
        if (n === 1) return lessonTicket(f.members[0], 0).replace(/PART 1/, 'GAME').replace('aria-label="Part 1, ', 'aria-label="');
        const hasNext = f.members.some((L) => idxOf(L) === next), stars = f.members.reduce((t, L) => t + (this.completed.has(L.id) ? (this.stars[L.id] || 1) : 0), 0);
        const main = f.members.find((L) => L.id === f.main) || f.members[0];
        return `<div class="tk"><button type="button" class="ticket fam${all ? ' cleared' : ''}${hasNext ? ' next' : ''}" data-fam="${esc(f.name)}" aria-label="${esc(f.name)}, ${n} lessons, ${doneN} done">`
          + `<span class="plate"><span class="no">${n} LESSONS</span>${emblem(main.id)}${all ? '<span class="stamp">Done</span>' : ''}${all && FULL[f.name] ? '<span class="stamp" style="top:auto;bottom:.4rem">Full game</span>' : ''}</span>`
          + `<span class="t-body"><span class="t-name">${esc(f.name)}</span><span class="fam-dots" aria-hidden="true">${f.members.map((L) => `<i class="${this.completed.has(L.id) ? 'on' : ''}"></i>`).join('')}</span></span>`
          + `<span class="t-foot"><span class="t-stars">${starsHtml(Math.round(stars / n))}</span><span class="t-go">${doneN}/${n} done</span></span></button></div>`;
      }).join('');
      if (title) title.textContent = 'Pick a game'; if (eyebrow) eyebrow.textContent = "Let's play";
    }
    grid.querySelectorAll('.ticket[data-i]').forEach((b) => { b.onclick = () => this.openLevel(Number(b.dataset.i)); });
    grid.querySelectorAll('[data-play]').forEach((b) => { b.onclick = () => this.showArcade(Number(b.dataset.play)); });
    grid.querySelectorAll('[data-fam]').forEach((b) => { b.onclick = () => { this.hub = b.dataset.fam; this.renderLobby(); try { window.scrollTo(0, 0); } catch (e) { /* ignore */ } }; });
    const total = this.levels.length, cleared = this.completed.size;
    const starSum = this.levels.reduce((n, L) => n + (this.completed.has(L.id) ? (this.stars[L.id] || 1) : 0), 0);
    const scope = hub ? hub.members : this.levels, scopeDone = scope.filter((L) => this.completed.has(L.id)).length;
    const nextHere = hub ? idxOf(hub.members.find((L) => !this.completed.has(L.id)) || hub.members[0]) : next;
    const mainL = hub ? hub.members.find((L) => L.id === hub.main) : null, mi = mainL ? idxOf(mainL) : -1;
    const canPlay = mainL && ARCADE[mainL.id] && this.arcadeUnlocked(mainL), fullF = hub && FULL[hub.name] && this.fullUnlocked(hub), fullLock = hub && FULL[hub.name] && !fullF;
    if (this.el.lobbyLead) this.el.lobbyLead.innerHTML = hub
      ? `<button type="button" class="btn small" id="hub-back">${icon('i-back')} All games</button> Do the lessons in order. Each one teaches one small piece of ${esc(hub.name)}. You are learning <b>${esc(this.langName)}</b>.`
      : `Every game is split into small lessons. Pick a game, then do its lessons one by one. You are learning <b>${esc(this.langName)}</b>.`;
    this.el.lobbyStats.innerHTML = `<div class="lstat"><b>${hub ? scopeDone : cleared}<span>/${hub ? scope.length : total}</span></b><small>Lessons done</small></div>`
      + `<div class="lstat"><b>${starSum}<span>/${total * 3}</span></b><small>Stars</small></div>`
      + (hub && canPlay ? `<button type="button" class="btn big" id="hub-play">${icon('i-play')} Quick game</button>` : '')
      + (fullF ? `<button type="button" class="btn primary big" id="hub-full">${icon('i-play')} Play the full game</button>` : '')
      + (fullLock ? `<div class="lstat"><small>Full game: finish all ${hub.members.length} lessons to unlock</small></div>` : '')
      + (nextHere >= 0 && (hub ? scopeDone < scope.length : next >= 0) ? `<button type="button" class="btn primary big" id="lobby-play">${icon('i-play')} ${(hub ? scopeDone : cleared) ? 'Next lesson' : 'Start here'}</button>` : '');
    const lp = document.getElementById('lobby-play'); if (lp) lp.onclick = () => this.openLevel(hub ? nextHere : next);
    const hb = document.getElementById('hub-back'); if (hb) hb.onclick = () => { this.hub = null; this.renderLobby(); };
    const hp = document.getElementById('hub-play'); if (hp) hp.onclick = () => this.showArcade(mi);
    const hf = document.getElementById('hub-full'); if (hf) hf.onclick = () => this.showFull(hub.name);
  }

  /** Counts the chip total up instead of jumping. */
  tweenScore() {
    const el = this.el.statScore, target = this.score, from = this.shownScore;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (from === target || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) { this.shownScore = target; el.textContent = target; return; }
    const t0 = performance.now(), dur = 450;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      this.shownScore = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      el.textContent = this.shownScore;
      if (p < 1) this.raf = requestAnimationFrame(tick); else { this.shownScore = target; el.textContent = target; }
    };
    this.raf = requestAnimationFrame(tick);
  }

  bind() {
    const el = this.el;
    el.modalPlay.onclick = () => this.showArcade(this.li);
    el.arcadeAgain.onclick = () => this.arc && this.arc.start();
    el.arcadeBack.onclick = () => this.showLobby();
    el.arcadeTable.onclick = () => { if (this.arcFull) this.showLobby(); else this.openLevel(this.arcLi); };
    el.arcadeStage.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b || b.disabled || !this.arc) return; e.preventDefault(); this.arc.act(b.dataset.act, b.dataset.v); });
    el.arcadeStage.addEventListener('submit', (e) => { e.preventDefault(); const f = e.target.dataset.form; if (f && this.arc && this.arc.full) { this.arc.act('submit:' + f, Object.fromEntries(new FormData(e.target))); return; } if (f && this.arc) this.arc.act(f === 'guess' ? 'guess' : 'word'); });
    el.btnStep.onclick = () => this.stepForward();
    el.btnRun.onclick = () => this.runAll();
    el.btnReset.onclick = () => this.reset();
    el.togglePredict.onchange = (e) => {
      this.predictMode = e.target.checked;
      if (!this.predictMode) this.cleanTrace = false;
      this.preparePrediction(); this.render();
    };
    document.querySelectorAll('.tab').forEach((t) => { t.onclick = () => this.setTab(t.dataset.tab); });
    el.btnHint.onclick = () => this.useHint();
    el.btnTests.onclick = () => this.runTests();
    el.btnClear.onclick = () => this.clearBuilder();
    el.codeView.addEventListener('click', (e) => { const li = e.target.closest('li[data-line]'); if (li) this.runToLine(Number(li.dataset.line)); });
    el.codeView.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches && e.target.matches('li[data-line]')) this.runToLine(Number(e.target.dataset.line)); });
    el.playForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const vals = {};
      for (const f of this.level.play.inputs) {
        const v = f.parse(document.getElementById('play-' + f.id).value);
        if (v === null) { el.playError.textContent = `${f.label}: enter ${f.hint}`; return; }
        vals[f.id] = v;
      }
      el.playError.textContent = '';
      this.playFixed(vals);
    });
    el.btnOriginal.onclick = () => this.showOriginal();
    el.btnLobby.onclick = () => this.showLobby();
    document.querySelectorAll('[data-lang]').forEach((b) => { b.onclick = () => this.setLang(b.dataset.lang); });
    el.btnSound.onclick = () => { this.sfx.setOn(!this.sfx.on); this.renderSound(); if (this.sfx.on) this.sfx.play('good'); };
    el.modalLobby.onclick = () => { el.modal.hidden = true; this.showLobby(); };
    el.modalNext.onclick = () => { el.modal.hidden = true; if (this.li + 1 < this.levels.length) this.openLevel(this.li + 1); };
    el.modalClose.onclick = () => { el.modal.hidden = true; };

    el.predCard.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('pred-input');
      if (input) this.submitPrediction(input.value);
    });
    el.predCard.addEventListener('click', (e) => {
      const b = e.target.closest('[data-answer]');
      if (b) this.submitPrediction(b.dataset.answer);
    });
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (e.key === 'ArrowRight' && this.view === 'table' && !['input', 'textarea', 'select'].includes(tag) && el.modal.hidden) { e.preventDefault(); this.stepForward(); }
    });
    this.bindBuilder();
    this.bindCode();
    this.bindThinking();
  }

  bindThinking() {
    const el = this.el;
    el.modeBuild.onclick = () => { if (this.mode !== 'build') this.setMode('build'); };
    el.modeDebug.onclick = () => { if (this.mode !== 'debug') this.setMode('debug'); };
    el.challenge.querySelectorAll('.tab').forEach((t) => { t.onclick = () => this.setTab(t.dataset.tab); });
    el.undQuiz.addEventListener('input', (e) => { const i = e.target.closest('input[data-k]'); if (i) this.und.vals[i.dataset.k] = i.value; });
    el.undQuiz.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const i = e.target.closest('input[data-k]'); if (i) { e.preventDefault(); this.und.vals[i.dataset.k] = i.value; this.checkUnderstand(Number(i.dataset.k)); } } });
    el.undQuiz.addEventListener('click', (e) => {
      const c = e.target.closest('[data-chk]'), s = e.target.closest('[data-show]');
      if (c) { const k = Number(c.dataset.chk); const inp = el.undQuiz.querySelector(`input[data-k="${k}"]`); if (inp) this.und.vals[k] = inp.value; this.checkUnderstand(k); }
      if (s) { this.und.state[Number(s.dataset.show)] = 'shown'; this.renderUnderstand(); }
    });
    el.btnMeetNext.onclick = () => this.setTab('understand');
    el.btnUndNext.onclick = () => this.setTab('plan');
    el.steps.addEventListener('click', (e) => { const b = e.target.closest('[data-step]'); if (b) this.setTab(b.dataset.step === 'done' && !this.completed.has(this.level.id) ? this.tab : b.dataset.step); });
    el.sHint.onclick = () => this.useHint();
    el.btnAdvanced.onclick = () => this.setAdvanced(true);
    el.btnSimple.onclick = () => this.setAdvanced(false);
    el.btnDonePlay.onclick = () => this.showArcade(this.li);
    el.btnDoneNext.onclick = () => this.openLevel(this.li + 1);
    el.btnDoneLobby.onclick = () => this.showLobby();
    el.btnDoneWatch.onclick = () => { this.setAdvanced(true); this.setTab('predict'); };
    el.planPool.addEventListener('click', (e) => { const b = e.target.closest('[data-add]'); if (b && !this.plan.solved) { this.plan.order.push(Number(b.dataset.add)); this.el.planFb.hidden = true; this.renderPlan(); } });
    el.planList.addEventListener('click', (e) => {
      if (this.plan.solved) return;
      const u = e.target.closest('[data-up]'), d = e.target.closest('[data-down]'), r = e.target.closest('[data-rm]'), o = this.plan.order;
      if (u) { const i = Number(u.dataset.up); [o[i - 1], o[i]] = [o[i], o[i - 1]]; }
      else if (d) { const i = Number(d.dataset.down); [o[i + 1], o[i]] = [o[i], o[i + 1]]; }
      else if (r) o.splice(Number(r.dataset.rm), 1); else return;
      this.el.planFb.hidden = true; this.renderPlan();
    });
    el.btnPlanCheck.onclick = () => this.checkPlan();
    el.btnPlanNext.onclick = () => this.setTab('code');
    el.codePlanBox.addEventListener('click', (e) => { if (e.target.closest('[data-goplan]')) this.setTab('plan'); });
  }

  /* ---------- level lifecycle ---------- */
  loadLevel(i) {
    this.li = i;
    this.level = this.levels[i];
    this.diag = { done: false, attempts: 0, wrong: new Set() };
    this.diagOrder = shuffle(this.level.diagnose.options.map((_, i) => i));
    this.fix = { done: false, failures: 0 };
    this.code = { runs: 0, failures: 0, peeked: false, passed: false };
    this.viewingMine = false;
    this.traceDone = false;
    this.cleanTrace = true;
    this.hintsShown = [];
    this.mode = 'build'; this.advanced = false; this.metSeen = false; this.undDone = false;
    this.el.simple.hidden = false; this.el.advanced.hidden = true;
    const pl = this.level.plan, nSteps = pl.steps.length;
    this.und = { vals: {}, state: {}, notes: '' };
    this.plan = { order: [], solved: false, fails: 0, ids: shuffle(Array.from({ length: nSteps + pl.decoys.length }, (_, k) => k)) };
    this.codeSource = '';
    this.viewingFixed = false;
    this.initBuilder();
    this.el.testResults.innerHTML = '';
    this.buildTrace();
    this.save();
    this.setMode('build', true);
    this.renderNav();
    this.renderStatic();
    this.render();
  }

  buildTrace() {
    this.idx = 0;
    this.codeDirty = true;
    try {
      const interp = new Interpreter(this.codeSource, { limit: TRACE_LIMIT, lang: this.lang });
      this.events = interp.run().events;
    } catch (e) {
      if (!(e instanceof LangError)) throw e;
      this.events = [{ id: 0, kind: 'end', status: 'error', line: e.line, desc: `Syntax error: ${e.message}`, before: { frames: [{ name: 'global', vars: [] }], out: [], hasRet: false } }];
    }
    this.preparePrediction();
  }

  reset() {
    this.streak = 0; this.cleanTrace = true;
    this.buildTrace(); this.render();
    toast(this.el, 'CPU reset. Points for each step are only awarded once.', 'info');
  }

  get ev() { return this.events[this.idx]; }

  /* ---------- stepping & prediction ---------- */
  preparePrediction() {
    const spec = this.predictMode ? PredictionRules.make(this.ev, this.lang) : null;
    this.pred = { idx: this.idx, spec, attempts: 0, resolved: !spec, feedback: null };
  }

  stepForward() {
    if (this.idx >= this.events.length - 1) return;
    if (this.predictMode && this.pred && !this.pred.resolved) {
      toast(this.el, 'Predict first. Or switch off Predict mode to step freely.', 'bad');
      const input = document.getElementById('pred-input'); if (input) input.focus();
      return;
    }
    if (!this.predictMode) this.cleanTrace = false;
    this.idx++;
    this.sfx.play('tick');
    this.preparePrediction();
    this.setTab('predict', true);
    this.render();
    if (this.ev.kind === 'end') this.onTraceEnd();
  }

  runAll() {
    this.cleanTrace = false;
    this.idx = this.events.length - 1;
    this.preparePrediction();
    this.render();
    toast(this.el, 'Ran to the end. No trace bonus for skipping the steps.', 'info');
  }

  onTraceEnd() {
    if (this.predictMode && this.cleanTrace && !this.traceDone && !this.viewingFixed) {
      this.traceDone = true;
      const key = `${this.lang}:${this.level.id}:trace`;
      if (!this.awarded.has(key)) { this.awarded.add(key); this.award(PTS.fullTrace); toast(this.el, `Full trace complete! +${PTS.fullTrace}`, 'ok'); }
      this.renderHUD();
    }
  }

  submitPrediction(value) {
    const p = this.pred;
    if (!p || p.resolved || !p.spec) return;
    if (p.spec.check(value)) {
      p.resolved = true;
      const first = p.attempts === 0;
      const key = `${this.lang}:${this.level.id}:p${p.idx}`;
      if (!this.viewingFixed && !this.awarded.has(key)) {
        this.awarded.add(key);
        if (first) { this.streak++; this.award(PTS.predict + Math.min(this.streak - 1, PTS.streakCap)); } else this.award(PTS.predictRetry);
      }
      this.sfx.play('good');
      p.feedback = { cls: 'ok', text: first ? 'Correct! Press Step Forward to watch it happen.' : 'Correct on the retry. Press Step Forward.' };
    } else {
      p.attempts++; this.streak = 0;
      this.sfx.play('bad');
      if (p.attempts >= 2) {
        p.resolved = true;
        p.feedback = { cls: 'bad', text: `The answer was ${p.spec.reveal}. Step forward and watch RAM to see why.` };
      } else p.feedback = { cls: 'bad', text: `Not quite. ${p.spec.hint}` };
    }
    this.renderPredict(); this.renderHUD(); this.updateControls();
  }

  /* ---------- diagnose ---------- */
  chooseOption(i) {
    const d = this.level.diagnose;
    if (this.diag.done || this.diag.wrong.has(i)) return;
    if (i === d.answer) {
      this.diag.done = true;
      const key = `${this.lang}:${this.level.id}:diag`;
      if (!this.awarded.has(key)) {
        this.awarded.add(key);
        const pts = this.diag.attempts === 0 ? PTS.diagnose : this.diag.attempts === 1 ? PTS.diagnoseRetry : 0;
        if (pts) this.award(pts);
      }
      this.codeDirty = false; this.paintCode();
      this.sfx.play('good');
      this.checkLevelDone();
    } else { this.diag.attempts++; this.diag.wrong.add(i); this.streak = 0; this.sfx.play('bad'); }
    this.renderDiagnose(); this.renderHUD();
  }

  /* ---------- hints ---------- */
  useHint() {
    let text = null;
    if (this.mode === 'build') {
      const pl = this.level.plan;
      if (this.tab === 'meet') text = 'Read the rules slowly, then look at the examples. Can you see why each answer comes out like that?'; else if (this.tab === 'understand') text = 'Look at the examples on the first page. Work out each answer with the rules, one step at a time.';
      else if (this.tab === 'plan') text = `${pl.decoys.length} of the steps do not belong. For each step ask: do we really need this to get the answer?`;
      else if (this.tab === 'code' || this.tab === 'predict') {
        const k = this.code.hints || 0;
        if (k >= pl.steps.length) { toast(this.el, 'That was every step. Try writing them one after the other.', 'info'); return; }
        text = `Recipe step ${k + 1}: ${pl.steps[k][1]}`; this.code.hints = k + 1;
      }
      if (text === null) { toast(this.el, 'No hint here.', 'info'); return; }
      if (this.hintsShown.includes(text)) return;
    } else {
      const hints = this.level.hints;
      if (this.hintsShown.length >= hints.length) { toast(this.el, 'No more hints for this level.', 'info'); return; }
      text = hints[this.hintsShown.length];
    }
    this.hintsShown.push(text);
    this.save(); this.renderHUD(); this.renderHints();
  }

  /* ---------- block builder (Fix phase) ---------- */
  initBuilder() {
    const f = this.level.fix;
    this.blocks = shuffle([...f.lines.map((text) => ({ text })), ...f.decoys.map((text) => ({ text, decoy: true }))]).map((b, i) => ({ ...b, id: 'b' + i }));
    this.bin = this.blocks.map((b) => b.id);
    this.asm = [];
    this.dragId = null;
  }
  blockById(id) { return this.blocks.find((b) => b.id === id); }
  moveToAsm(id, idx) {
    this.bin = this.bin.filter((x) => x !== id);
    const cur = this.asm.indexOf(id);
    if (cur >= 0) { this.asm.splice(cur, 1); if (cur < idx) idx--; }
    this.asm.splice(Math.max(0, Math.min(idx, this.asm.length)), 0, id);
    this.renderBuilder();
  }
  moveToBin(id) {
    this.asm = this.asm.filter((x) => x !== id);
    if (!this.bin.includes(id)) this.bin.push(id);
    this.renderBuilder();
  }
  clearBuilder() { this.bin = this.blocks.map((b) => b.id); this.asm = []; this.renderBuilder(); this.el.testResults.innerHTML = ''; }

  bindBuilder() {
    const { binList, asmList } = this.el;
    [binList, asmList].forEach((list) => {
      list.addEventListener('dragstart', (e) => {
        const b = e.target.closest('.block'); if (!b) return;
        this.dragId = b.dataset.id; b.classList.add('dragging');
        e.dataTransfer.setData('text/plain', this.dragId); e.dataTransfer.effectAllowed = 'move';
      });
      list.addEventListener('dragend', (e) => { const b = e.target.closest('.block'); if (b) b.classList.remove('dragging'); this.dragId = null; binList.classList.remove('drag-over'); asmList.classList.remove('drag-over'); });
      list.addEventListener('dragover', (e) => { e.preventDefault(); list.classList.add('drag-over'); });
      list.addEventListener('dragleave', () => list.classList.remove('drag-over'));
      list.addEventListener('click', (e) => {
        const mv = e.target.closest('[data-move]');
        const b = e.target.closest('.block'); if (!b) return;
        const id = b.dataset.id;
        if (mv) {
          const i = this.asm.indexOf(id), j = i + Number(mv.dataset.move);
          if (j >= 0 && j < this.asm.length) { [this.asm[i], this.asm[j]] = [this.asm[j], this.asm[i]]; this.renderBuilder(); }
          return;
        }
        if (list === binList) this.moveToAsm(id, this.asm.length); else this.moveToBin(id);
      });
      list.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('block')) { e.preventDefault(); e.target.click(); }
      });
    });
    asmList.addEventListener('drop', (e) => {
      e.preventDefault(); asmList.classList.remove('drag-over');
      const id = this.dragId; if (!id) return;
      const over = e.target.closest('.block');
      let idx = this.asm.length;
      if (over && over.dataset.id !== id) {
        idx = this.asm.indexOf(over.dataset.id);
        const r = over.getBoundingClientRect();
        if (e.clientY > r.top + r.height / 2) idx++;
      }
      this.moveToAsm(id, idx);
    });
    binList.addEventListener('drop', (e) => { e.preventDefault(); binList.classList.remove('drag-over'); if (this.dragId) this.moveToBin(this.dragId); });
  }

  assembledSource(tail) { return this.level.fix.build(this.asm.map((id) => this.blockById(id).text), tail); }

  runTests() {
    const list = this.el.testResults;
    list.innerHTML = '';
    if (!this.asm.length) { list.innerHTML = '<li class="err">Your program is empty. Add some blocks first.</li>'; return; }
    let allPass = true;
    const canon = this.levelsRaw[this.li].fix.tests;
    for (const [ti, t] of this.level.fix.tests.entries()) {
      const li = document.createElement('li');
      try {
        const r = new Interpreter(this.assembledSource(canon[ti].run), { trace: false, limit: RUN_LIMIT, lang: this.lang }).run();
        const got = r.out.join('\n');
        if (r.error) { li.className = 'fail'; li.textContent = `${t.label} — ${r.error.message}`; allPass = false; }
        else if (r.halted) { li.className = 'fail'; li.textContent = `${t.label}: your code never stops. A loop may repeat forever.`; allPass = false; }
        else if (got === t.expect) { li.className = 'pass'; li.textContent = t.label; }
        else { li.className = 'fail'; li.textContent = `${t.label} — got ${JSON.stringify(got)}`; allPass = false; }
      } catch (e) {
        if (!(e instanceof LangError)) throw e;
        li.className = 'err'; li.textContent = `Syntax error${e.line ? ' on line ' + e.line : ''}: ${e.message}`; allPass = false;
        list.appendChild(li); break;
      }
      list.appendChild(li);
    }
    if (allPass) {
      if (!this.fix.done) {
        this.fix.done = true;
        const key = `${this.lang}:${this.level.id}:fix`;
        if (!this.awarded.has(key)) {
          this.awarded.add(key);
          const pts = Math.max(PTS.fixFloor, PTS.fix - PTS.fixPenalty * this.fix.failures);
          this.award(pts); toast(this.el, 'It works!', 'ok');
        }
      }
      this.renderPlay();
      this.sfx.play('good');
      this.checkLevelDone();
    } else { this.fix.failures++; this.streak = 0; this.sfx.play('bad'); }
    this.renderHUD();
  }

  playFixed(vals) {
    this.codeSource = this.assembledSource(this.level.play.driver(vals));
    this.viewingFixed = true; this.viewingMine = false; this.cleanTrace = false;
    this.buildTrace(); this.setTab('predict'); this.render();
    toast(this.el, 'Playing your fixed game. Predictions here are practice, no points.', 'ok');
    try { this.el.stagePanel.scrollIntoView({ block: 'start' }); } catch (e) { /* ignore */ }
  }

  showOriginal() { this.codeSource = this.mode === 'build' ? '' : this.level.code; this.viewingFixed = false; this.viewingMine = false; this.cleanTrace = true; this.buildTrace(); this.render(); }

  /* ---------- completion ---------- */
  checkLevelDone() {
    if (!this.code.passed || this.completed.has(this.level.id)) { this.renderNav(); return; }
    this.completed.add(this.level.id);
    const planned = this.plan.solved && this.plan.fails === 0, selfMade = !this.code.peeked && this.hintsShown.length === 0;
    const stars = 1 + (planned ? 1 : 0) + (selfMade ? 1 : 0);
    this.stars[this.level.id] = Math.max(this.stars[this.level.id] || 0, stars);
    this.award(PTS.levelBonus);
    this.save(); this.renderNav();
    this.showDone(stars, planned, selfMade);
  }

  showDone(stars, planned, selfMade) {
    const last = this.li + 1 >= this.levels.length, el = this.el;
    el.doneCard.innerHTML = `<div class="stars-row" role="img" aria-label="${stars} of 3 stars">${starsHtml(stars, true)}</div>`
      + `<p class="big">You turned the rules into code!</p>`
      + `<ul class="receipt"><li><span>Your code works</span><b>★</b></li><li class="${planned ? '' : 'off'}"><span>You made the recipe right the first time</span><b>${planned ? '★' : '–'}</b></li><li class="${selfMade ? '' : 'off'}"><span>You did it with no hints and no peeking</span><b>${selfMade ? '★' : '–'}</b></li></ul>`
      + `<p class="muted">The recipe you followed:</p><ol class="plan-ol">${this.level.plan.steps.map(([t]) => `<li>${esc(t)}</li>`).join('')}</ol>`;
    el.btnDonePlay.hidden = !ARCADE[this.level.id]; el.btnDoneNext.hidden = last;
    this.setTab('done');
    this.sfx.play('clear'); this.confetti.burst();
  }

  award(n) {
    if (!n) return;
    const rankBefore = rankFor(this.score);
    this.score += n; this.save(); this.renderHUD();
    if (rankFor(this.score) !== rankBefore) { toast(this.el, `Rank up: ${rankFor(this.score)}!`, 'ok'); this.sfx.play('rank'); }
    const host = this.el.statScore.parentElement;
    const s = document.createElement('span');
    s.className = 'float-pts'; s.textContent = '+' + n;
    s.addEventListener('animationend', () => s.remove());
    host.appendChild(s);
  }

  /* ================================================== rendering ================================================== */
  setMode(mode, quiet) {
    this.mode = mode;
    const el = this.el;
    el.modeBuild.setAttribute('aria-pressed', String(mode === 'build')); el.modeDebug.setAttribute('aria-pressed', String(mode === 'debug'));
    el.challenge.querySelectorAll('.tab').forEach((t) => { t.hidden = t.dataset.mode !== mode; });
    el.challenge.querySelector('.tabs').dataset.mode = mode;
    if (mode === 'debug') { this.codeSource = this.level.code; this.viewingFixed = false; this.viewingMine = false; }
    else if (!this.viewingMine) this.codeSource = '';
    this.cleanTrace = true; this.buildTrace();
    this.renderMission();
    this.setTab(mode === 'build' ? (this.advanced ? 'predict' : (quiet ? 'meet' : (this.tab && ['meet', 'understand', 'plan', 'code', 'done'].includes(this.tab) ? this.tab : 'meet'))) : 'predict', quiet);
    this.render();
  }

  setTab(name, quiet) {
    this.tab = name;
    const el = this.el;
    el.challenge.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(!t.hidden && t.dataset.tab === name)));
    ['meet', 'understand', 'plan', 'predict', 'diagnose', 'fix', 'code', 'done'].forEach((t) => { el['pane' + t[0].toUpperCase() + t.slice(1)].hidden = t !== name; });
    this.renderSteps();
    if (!quiet) {
      if (name === 'meet') this.renderMeet();
      if (name === 'understand') this.renderUnderstand();
      if (name === 'plan') this.renderPlan();
      if (name === 'diagnose') this.renderDiagnose();
      if (name === 'fix') this.renderBuilder();
      if (name === 'code') this.renderEditor();
      if (name === 'predict') { if (this.mode === 'build') this.ensureMineTrace(); this.renderPredict(); }
    }
    try { if (!this.advanced && !quiet) this.el.simple.scrollIntoView({ block: 'start' }); } catch (e) { /* ignore */ }
  }

  setAdvanced(on) {
    this.advanced = on;
    this.el.simple.hidden = on; this.el.advanced.hidden = !on;
    if (on) { this.setMode('build'); this.setTab('predict'); this.render(); } else { this.setTab(this.stepBack || 'meet'); this.render(); }
  }

  renderSteps() {
    const names = STEP_NAMES, cur = names.findIndex(([k]) => k === this.tab);
    if (cur < 0) return;
    const doneMap = { meet: this.metSeen, understand: this.undDone, plan: this.plan && this.plan.solved, code: this.code && this.code.passed, done: this.completed.has(this.level.id) };
    this.el.steps.innerHTML = names.map(([k, t], i) => `<li class="${i === cur ? 'cur' : ''}${doneMap[k] ? ' done' : ''}"><button type="button" data-step="${k}" aria-current="${i === cur ? 'step' : 'false'}"><b>${doneMap[k] && i !== cur ? '✓' : i + 1}</b><span>${t}</span></button></li>`).join('');
    this.el.sTitle.textContent = this.tab === 'meet' ? this.level.title.replace(/^Table \d+ · /, '') : (STEP_TITLES[this.tab] || '');
    this.stepBack = this.tab;
  }

  renderMeet() {
    const L = this.level, el = this.el;
    el.meetArt.innerHTML = emblem(L.id);
    el.meetGoal.textContent = L.kid;
    el.meetRules.innerHTML = L.rules.map((r) => `<li>${esc(r)}</li>`).join('');
    const { ex } = this.examplesAndQuiz();
    el.undExamples.innerHTML = ex.map(({ t }) => `<li><span>Put in</span><code>${esc(callTextFor(t.run, this.lang))}</code><span>You get</span><b>${esc(t.expect)}</b></li>`).join('');
    this.metSeen = true;
  }

  renderMission() {
    const L = this.level, el = this.el;
    el.levelObjective.textContent = this.mode === 'build' ? L.task : L.objective;
    const items = this.mode === 'build' ? [['understand', 'Understand'], ['plan', 'Plan'], ['code', 'Code'], ['trace', 'Trace']] : [['trace', 'Trace'], ['diagnose', 'Diagnose'], ['fix', 'Fix']];
    el.objectives.innerHTML = items.map(([k, t]) => `<li data-obj="${k}">${t}</li>`).join('');
  }

  /* ---------- tab 1: understand the rules by being the function ---------- */
  examplesAndQuiz() {
    const tests = this.level.fix.tests;
    const nEx = Math.min(3, Math.ceil(tests.length / 2)), all = tests.map((t, k) => ({ t, k })), seen = new Set(), pick = [];
    all.forEach((x) => { if (pick.length < nEx && !seen.has(x.t.expect)) { seen.add(x.t.expect); pick.push(x); } });
    all.forEach((x) => { if (pick.length < nEx && !pick.includes(x)) pick.push(x); });
    pick.sort((a, b) => a.k - b.k);
    return { ex: pick, quiz: all.filter((x) => !pick.includes(x)).slice(0, 4) };
  }
  renderUnderstand() {
    const el = this.el, { quiz } = this.examplesAndQuiz();
    const call = (t) => callTextFor(t.run, this.lang);
    el.undQuiz.innerHTML = quiz.map(({ t, k }) => {
      const st = this.und.state[k], val = this.und.vals[k] || '';
      const done = st === 'ok' || st === 'shown';
      return `<li class="uq ${st || ''}"><span>Put in</span><code>${esc(call(t))}</code><span>You get</span>`
        + (done ? `<b>${esc(t.expect)}</b>${st === 'shown' ? '<em>shown</em>' : '<em class="ok">✓ right</em>'}` : `<input data-k="${k}" value="${esc(val)}" aria-label="What does ${esc(call(t))} give?" autocomplete="off" spellcheck="false"><button type="button" class="btn small" data-chk="${k}">Check</button>${st === 'bad' ? `<button type="button" class="btn small ghost" data-show="${k}">Show me</button>` : ''}`)
        + (st === 'bad' ? '<small class="bad">Not yet. Read the rules again and try once more.</small>' : '') + '</li>';
    }).join('');
    const doneN = quiz.filter(({ k }) => ['ok', 'shown'].includes(this.und.state[k])).length, all = doneN === quiz.length;
    el.undStatus.textContent = all ? 'Great! You know what it should do.' : `${doneN} of ${quiz.length} done.`;
    el.btnUndNext.disabled = !all;
    this.undDone = all;
    this.renderSteps(); this.renderHUD();
  }
  checkUnderstand(k) {
    const t = this.level.fix.tests[k], val = this.und.vals[k] || '';
    if (!val.trim()) return;
    const key = `${this.lang}:${this.level.id}:u${k}`;
    if (normAns(val) === normAns(t.expect)) {
      this.und.state[k] = 'ok';
      if (!this.awarded.has(key) && this.und.state[k + '_bad'] !== true) { this.awarded.add(key); this.award(PTS.understand); this.streak++; }
      this.sfx.play('good');
    } else { this.und.state[k] = 'bad'; this.und.state[k + '_bad'] = true; this.streak = 0; this.sfx.play('bad'); }
    this.renderUnderstand();
  }

  /* ---------- tab 2: plan the logic in plain words ---------- */
  planCards() {
    const pl = this.level.plan, n = pl.steps.length;
    return (id) => (id < n ? { text: pl.steps[id][0], real: true } : { text: pl.decoys[id - n][0], real: false, why: pl.decoys[id - n][1] });
  }
  renderPlan() {
    const el = this.el, card = this.planCards(), P = this.plan;
    const pool = P.ids.filter((id) => !P.order.includes(id));
    el.planPool.innerHTML = pool.map((id) => `<li><button type="button" class="pcardbtn" data-add="${id}"${P.solved ? ' disabled' : ''}>${esc(card(id).text)}</button></li>`).join('') || '<li class="muted">All cards used.</li>';
    el.planList.innerHTML = P.order.map((id, i) => `<li class="${P.solved ? 'ok' : ''}">${P.solved ? `<span class="ptxt">${esc(card(id).text)}</span>` : `<button type="button" class="planitem" data-rm="${i}" aria-label="Remove: ${esc(card(id).text)}"><span class="ptxt">${esc(card(id).text)}</span><span class="x">tap to remove</span></button>`}</li>`).join('');
    el.planList.dataset.empty = P.order.length ? '' : 'Tap a step to put it here.';
    el.btnPlanCheck.disabled = P.solved || !P.order.length; el.btnPlanNext.hidden = !P.solved;
    this.renderSteps(); this.renderHUD();
  }
  checkPlan() {
    const P = this.plan, pl = this.level.plan, n = pl.steps.length, card = this.planCards(), fb = this.el.planFb;
    const dec = P.order.find((id) => id >= n);
    let msg = '', ok = false;
    if (dec !== undefined) msg = `This step does not belong: “${card(dec).text}” ${card(dec).why}`;
    else if (P.order.length < n) msg = `Not finished yet. A step is missing: you have ${P.order.length}, the recipe needs ${n}.`;
    else { const bad = P.order.findIndex((id, i) => id !== i); if (bad < 0) ok = true; else msg = bad === 0 ? 'The first step is not right. What has to happen first?' : `The first ${bad} step${bad === 1 ? ' is' : 's are'} right. Look at step ${bad + 1}: what has to happen before it?`; }
    if (ok) {
      P.solved = true; fb.className = 'feedback ok'; fb.textContent = 'Yes! That is the recipe. Now you turn each step into code.';
      const key = `${this.lang}:${this.level.id}:plan`;
      if (!this.awarded.has(key)) { this.awarded.add(key); const pts = Math.max(PTS.planFloor, PTS.plan - PTS.planPenalty * P.fails); this.award(pts); toast(this.el, 'Recipe done!', 'ok'); }
      this.sfx.play('good');
    } else { P.fails++; fb.className = 'feedback bad'; fb.textContent = msg; this.streak = 0; this.sfx.play('bad'); }
    fb.hidden = false;
    this.renderPlan();
  }

  renderStatic() {
    const L = this.level;
    this.el.levelConcept.textContent = `${L.game} · ${L.concept}`;
    this.el.stageGame.textContent = L.game;
    this.el.rulesList.innerHTML = L.rules.map((r) => `<li>${esc(r)}</li>`).join('');
    const keep = L.fix.keepBefore || '';
    this.el.fixGivenWrap.hidden = !keep;
    this.el.fixGiven.innerHTML = keep.split('\n').map((t) => highlight(t, this.lang)).join('\n');
    const notes = { js: '', py: 'In Python the indentation is part of each block, so choose the block at the right depth. There are no closing braces.', java: 'The class and main() are added for you. Arrange the lines of the method, braces included.' };
    this.el.fixNote.textContent = notes[this.lang]; this.el.fixNote.hidden = !notes[this.lang];
    this.el.playForm.innerHTML = L.play.inputs.map((f) => `<label for="play-${f.id}">${esc(f.label)}<input id="play-${f.id}" value="${esc(f.value)}" spellcheck="false" autocomplete="off"></label>`).join('')
      + '<div class="row"><button type="submit" class="btn primary">Play it</button></div>';
    this.el.playError.textContent = '';
    this.el.levelTitle.textContent = L.title;
    this.renderMission();
    this.el.targetOutput.textContent = L.expected.split('\n').join(' ⏎ ');
    this.el.fixExpected.textContent = L.fix.tests.map((t) => t.label).join(' · ');
    this.renderHints();
  }

  render() {
    this.renderHUD(); this.renderStage(); this.renderCode(); this.renderMemory(); this.renderPredict(); this.renderDiagnose(); this.renderBuilder(); this.renderPlay(); this.updateControls();
    if (this.tab === 'meet') this.renderMeet(); else if (this.tab === 'understand') this.renderUnderstand(); else if (this.tab === 'plan') this.renderPlan(); else if (this.tab === 'code') this.renderEditor();
  }

  renderNav() {
    const nav = this.el.levelNav;
    nav.innerHTML = '';
    this.levels.forEach((L, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pip';
      const s = this.completed.has(L.id) ? (this.stars[L.id] || 1) : 0;
      b.innerHTML = `<b>${i + 1}</b><span class="pip-stars" aria-hidden="true">${s ? '★'.repeat(s) + '☆'.repeat(3 - s) : '···'}</span>`;
      b.title = L.title; b.setAttribute('aria-label', L.title + (s ? `, ${s} of 3 stars` : ''));
      if (this.completed.has(L.id)) b.classList.add('done');
      if (i === this.li) b.classList.add('current');
      b.onclick = () => this.openLevel(i);
      nav.appendChild(b);
    });
    this.renderLobby();
  }


  renderHUD() {
    const el = this.el;
    this.tweenScore();
    el.statStreak.textContent = this.streak;
    if (!el.streakPips.children.length) el.streakPips.innerHTML = '<i></i>'.repeat(10);
    [...el.streakPips.children].forEach((p, k) => p.classList.toggle('on', k < this.streak));
    el.flame.classList.toggle('hot', this.streak > 0);
    el.flame.style.setProperty('--heat', String(Math.min(this.streak, 10) / 10));
    const rp = rankProgress(this.score);
    if (this.rankShown !== rp.i) { el.rankBadge.innerHTML = rankSvg(rp.i); this.rankShown = rp.i; }
    el.statRank.textContent = rp.name;
    el.rankNext.textContent = rp.next ? `${rp.need} to ${rp.next}` : 'Top rank';
    el.rankFill.style.width = Math.round(rp.pct * 100) + '%';
    el.statStep.textContent = `${this.idx} / ${this.events.length - 1}`;
    const build = this.mode === 'build';
    const done = build ? { understand: !!this.undDone, plan: this.plan.solved, code: this.code.passed, trace: this.traceDone } : { trace: this.traceDone, diagnose: this.diag.done, fix: this.fix.done };
    el.objectives.querySelectorAll('li').forEach((li) => li.classList.toggle('done', !!done[li.dataset.obj]));
    el.tabDiagnose.classList.toggle('done', this.diag.done); el.tabFix.classList.toggle('done', this.fix.done);
    const cur = this.completed.has(this.level.id) ? 1 : (build ? [!!this.undDone, this.plan.solved, this.code.passed].filter(Boolean).length / 4 : 0);
    const base = [...this.completed].filter((id) => id !== this.level.id).length;
    const pct = Math.min(100, Math.round(((base + cur) / this.levels.length) * 100));
    el.progressFill.style.width = pct + '%';
    el.progress.setAttribute('aria-valuenow', String(pct));
  }

  updateControls() {
    const atEnd = this.idx >= this.events.length - 1;
    const blocked = this.predictMode && this.pred && !this.pred.resolved;
    const none = !this.codeSource.trim();
    this.el.btnStep.disabled = atEnd || none;
    this.el.btnStep.title = none ? 'Write and run your code first' : blocked ? 'Make your prediction first' : '';
    this.el.btnRun.disabled = atEnd || none;
  }

  renderCode() {
    if (!this.codeSource.trim()) {
      this.el.codeView.innerHTML = '<li class="empty-code"><span>Your own code will appear here.</span><span>Write it in tab 3, run the tests, then trace it in tab 4 to watch it work.</span></li>';
      this.codeDirty = true; this.el.codeBanner.hidden = true; this.el.codeTitle.textContent = 'Code Inspector · ' + this.langName; this.el.narration.textContent = ''; return;
    }
    if (this.codeDirty || !this.el.codeView.children.length) {
      this.el.codeView.innerHTML = this.codeSource.split('\n')
        .map((t, i) => `<li data-line="${i + 1}" tabindex="0" title="Run to this line"><span class="ln">${i + 1}</span><code>${highlight(t, this.lang) || ' '}</code></li>`).join('');
      this.codeDirty = false;
    }
    this.paintCode();
    this.el.codeBanner.hidden = !this.viewingFixed;
    this.el.codeTitle.textContent = (this.viewingMine ? 'Code Inspector (yours)' : this.viewingFixed ? 'Code Inspector (fixed)' : 'Code Inspector') + ' · ' + this.langName;
    this.el.codeBannerWhat.textContent = this.viewingMine ? 'your own' : 'your fixed';
    this.el.btnOriginal.textContent = this.mode === 'build' ? 'Close trace' : 'Show original';
    this.renderNarration();
  }

  paintCode() {
    const visited = new Set();
    for (let i = 0; i < this.idx; i++) if (this.events[i].line) visited.add(this.events[i].line);
    const ev = this.ev, bugLine = this.diag.done && !this.viewingFixed ? this.level.diagnose.bugLine : null;
    this.el.codeView.querySelectorAll('li').forEach((li) => {
      const n = Number(li.dataset.line);
      li.classList.toggle('visited', visited.has(n));
      li.classList.toggle('active', ev.kind !== 'end' && ev.line === n);
      li.classList.toggle('error-line', ev.kind === 'end' && ev.status === 'error' && ev.line === n);
      li.classList.toggle('bug', bugLine === n);
    });
    const active = this.el.codeView.querySelector('li.active');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
  }

  renderNarration() {
    const ev = this.ev, n = this.el.narration;
    n.className = 'narration';
    if (ev.kind === 'end') {
      n.classList.add(ev.status === 'ok' ? 'end-ok' : 'end-bad');
      n.innerHTML = `<div class="src">■ ${ev.status === 'ok' ? 'Program ended' : ev.status === 'halted' ? 'Execution halted' : 'Execution error'}</div><p>${esc(ev.desc)}</p>`;
    } else {
      const src = (this.codeSource.split('\n')[ev.line - 1] || '').trim();
      n.innerHTML = `<div class="src">Line ${ev.line} · ${esc(src)}</div><p>${esc(ev.desc)}</p>`;
    }
  }

  renderMemory() {
    const ev = this.ev, snap = ev.before;
    const prev = this.idx > 0 ? this.events[this.idx - 1].before : null;
    const rows = [];
    snap.frames.forEach((f, fi) => {
      const pf = prev && prev.frames[fi] && prev.frames[fi].name === f.name ? prev.frames[fi] : null;
      f.vars.forEach(([name, val], vi) => {
        const pv = pf ? pf.vars.find((x) => x[0] === name) : null;
        const changed = !pv || fmtVal(pv[1], this.lang) !== fmtVal(val, this.lang);
        const addr = '0x' + (0x1000 + fi * 0x100 + vi * 8).toString(16);
        rows.push(`<tr class="${changed ? 'changed' : ''}"><td class="scope" title="${esc(f.name)}">${esc(f.name)}</td><td class="name">${esc(name)}</td><td class="type">${esc(typeName(val, this.lang))}</td><td class="val">${this.valueHtml(val)}</td><td class="addr">${addr}</td></tr>`);
      });
    });
    this.el.ramBody.innerHTML = rows.join('');
    this.el.ramEmpty.hidden = rows.length > 0;

    this.el.stackList.innerHTML = snap.frames.slice().reverse()
      .map((f, i, arr) => `<li class="${i === 0 ? 'top' : ''}"><span class="depth">#${arr.length - 1 - i}</span>${esc(f.name)}</li>`).join('');
    this.el.lastReturn.hidden = !snap.hasRet;
    if (snap.hasRet) this.el.lastReturn.textContent = `↩ last return value: ${fmtVal(snap.ret, this.lang)}`;
    this.el.consoleOut.textContent = snap.out.join('\n');
  }

  valueHtml(v) {
    if (!Array.isArray(v)) return esc(fmtVal(v, this.lang));
    const MAX = 12;
    const cells = v.slice(0, MAX).map((x, i) => `<span class="cell"><i>${i}</i><b>${esc(fmtVal(x, this.lang))}</b></span>`).join('');
    return `<div class="cells">${cells}${v.length > MAX ? `<span class="more">+${v.length - MAX} more</span>` : ''}</div>`;
  }

  renderPredict() {
    const card = this.el.predCard, ev = this.ev, p = this.pred;
    const fb = p && p.feedback ? `<div class="feedback ${p.feedback.cls}">${esc(p.feedback.text)}</div>` : '';
    if (ev.kind === 'end') {
      const got = ev.before.out.join('\n'), match = got === this.level.expected;
      const verdict = ev.status !== 'ok' ? `<div class="feedback bad"><strong>${ev.status === 'halted' ? 'The CPU never finished.' : 'The program crashed.'}</strong><p>${esc(ev.desc)}</p></div>`
        : this.viewingFixed ? '<div class="feedback ok"><strong>Round finished.</strong><p>Your fixed code ran to the end. Try new inputs in the Fix tab.</p></div>'
        : match ? '<div class="feedback ok"><strong>✔ Output matches the target.</strong></div>'
        : '<div class="feedback bad"><strong>✘ Output does not match the target.</strong><p>Time to find out why. Open the Diagnose tab.</p></div>';
      card.innerHTML = `${verdict}<p class="muted">Final console output: <code>${esc(got || '(nothing)')}</code></p>`;
      return;
    }
    if (!this.predictMode) {
      card.innerHTML = '<div class="feedback info"><strong>Free-step mode.</strong><p>Press Step Forward and watch RAM and the call stack. Turn on Predict mode to earn points.</p></div>';
      return;
    }
    if (!p.spec) {
      card.innerHTML = `<div class="feedback info"><strong>Nothing to predict on this tick.</strong><p>${esc(ev.desc)} Press Step Forward.</p></div>`;
      return;
    }
    const resolved = p.resolved;
    if (p.spec.type === 'bool') {
      card.innerHTML = `<p class="question">${rich(p.spec.question)}</p><div class="bool-row"><button type="button" class="btn" data-answer="true" ${resolved ? 'disabled' : ''}>${fmtVal(true, this.lang)}</button><button type="button" class="btn" data-answer="false" ${resolved ? 'disabled' : ''}>${fmtVal(false, this.lang)}</button></div>${fb}`;
    } else {
      card.innerHTML = `<form id="pred-form" autocomplete="off"><label class="question" for="pred-input">${rich(p.spec.question)}</label></form>`;
      const form = card.querySelector('form');
      form.insertAdjacentHTML('beforeend', `<div class="row" style="margin-top:.6rem"><input id="pred-input" ${resolved ? 'disabled' : ''} spellcheck="false" placeholder="your prediction"><button class="btn primary" type="submit" ${resolved ? 'disabled' : ''}>Check</button></div>`);
      card.insertAdjacentHTML('beforeend', fb);
      const input = document.getElementById('pred-input');
      if (input && !resolved) input.focus({ preventScroll: true });
    }
  }

  renderDiagnose() {
    const d = this.level.diagnose;
    this.el.diagQuestion.innerHTML = rich(d.question);
    this.el.diagOptions.innerHTML = '';
    this.diagOrder.forEach((i) => {
      const text = d.options[i];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'option'; b.innerHTML = rich(text);
      if (this.diag.done && i === d.answer) b.classList.add('correct');
      if (this.diag.wrong.has(i)) b.classList.add('wrong');
      b.disabled = this.diag.done || this.diag.wrong.has(i);
      b.onclick = () => this.chooseOption(i);
      this.el.diagOptions.appendChild(b);
    });
    const fb = this.el.diagFeedback;
    fb.hidden = !(this.diag.done || this.diag.attempts);
    if (this.diag.done) { fb.className = 'feedback ok'; fb.innerHTML = `<strong>Bug found on line ${d.bugLine}.</strong><p>${esc(d.explain)}</p><p>Now head to the Fix tab.</p>`; }
    else if (this.diag.attempts) { fb.className = 'feedback bad'; fb.textContent = 'Not that one. Re-read your trace and look at what the variables did.'; }
  }

  renderBuilder() {
    const mk = (id, inAsm) => {
      const b = this.blockById(id);
      const li = document.createElement('li');
      li.className = 'block'; li.draggable = true; li.dataset.id = id; li.tabIndex = 0;
      li.title = inAsm ? 'Click to return to the bin' : 'Click to add to your program';
      li.innerHTML = `<code>${highlight(b.text, this.lang)}</code>` + (inAsm ? '<span class="move"><button type="button" data-move="-1" aria-label="Move up">▲</button><button type="button" data-move="1" aria-label="Move down">▼</button></span>' : '');
      return li;
    };
    this.el.binList.replaceChildren(...this.bin.map((id) => mk(id, false)));
    this.el.asmList.replaceChildren(...this.asm.map((id) => mk(id, true)));
  }

  renderStage() {
    const L = this.level, ev = this.ev, snap = ev.before;
    const prev = this.idx > 0 ? this.events[this.idx - 1] : null;
    const ctx = { ev, prev, snap, get: (n) => lookupVar(snap, n) };
    let html = '', say = '';
    try {
      html = L.stage.render(ctx);
      say = ev.kind === 'end'
        ? (ev.status === 'ok' ? `Round over. The program printed ${snap.out.length ? snap.out.join(' / ') : 'nothing'}.` : ev.desc)
        : L.stage.say(ctx);
    } catch (e) { html = '<p class="muted">The table cannot draw this state.</p>'; }
    this.el.stageBoard.innerHTML = html;
    this.el.stageSay.textContent = say;
  }


  /* ---------- tab 4: write it yourself ---------- */
  codeKey() { return `${this.lang}:${this.level.id}`; }
  bindCode() {
    const el = this.el, ta = el.codeEditor;
    this.drafts = {};
    let trap = true;
    const unit = () => (this.lang === 'js' ? '  ' : '    ');
    const save = () => { this.drafts[this.codeKey()] = ta.value; };
    const lineStart = (pos) => ta.value.lastIndexOf('\n', pos - 1) + 1;
    ta.addEventListener('focus', () => { trap = true; });
    ta.addEventListener('input', save);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { trap = false; return; }
      if (e.key === 'Tab' && trap && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const u = unit(), s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
        const multi = v.slice(s, en).includes('\n');
        if (!e.shiftKey && !multi) { ta.setRangeText(u, s, en, 'end'); save(); return; }
        const a = lineStart(s), b = en;
        const block = v.slice(a, b).split('\n').map((l) => (e.shiftKey ? l.replace(new RegExp(`^ {1,${u.length}}`), '') : u + l)).join('\n');
        ta.setRangeText(block, a, b, 'select'); save();
      } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        const s = ta.selectionStart, cur = ta.value.slice(lineStart(s), s);
        const lead = cur.match(/^ */)[0] + (/[{:]\s*$/.test(cur) ? unit() : '');
        ta.setRangeText('\n' + lead, s, ta.selectionEnd, 'end'); save();
      }
    });
    el.btnCodeRun.onclick = () => this.runMine();
    el.btnCodeTrace.onclick = () => this.traceMine();
    el.btnCodeReset.onclick = () => { this.drafts[this.codeKey()] = this.level.fix.starter; this.renderEditor(); el.codeResults.innerHTML = ''; };
    el.btnCodeScratch.onclick = () => { this.drafts[this.codeKey()] = this.level.fix.scratch; this.renderEditor(); el.codeResults.innerHTML = ''; };
    el.btnCodeReveal.onclick = () => this.revealRef();
  }
  renderEditor() {
    const el = this.el, key = this.codeKey();
    if (this.drafts[key] === undefined) this.drafts[key] = '';
    el.codeEditor.value = this.drafts[key];
    el.codeEditor.setAttribute('aria-label', `Your ${this.langName} code`);
    el.btnCodeReset.hidden = true;
    if (this.plan.solved) el.codePlanList.innerHTML = `<ol class="plan-ol">${this.level.plan.steps.map(([t, tip]) => `<li>${esc(t)}<small>${esc(tip)}</small></li>`).join('')}</ol>`;
    else el.codePlanList.innerHTML = '<p class="muted">You have not made the recipe yet. It makes the code much easier. <button type="button" class="btn small" data-goplan>Make the recipe</button></p>';
    el.codeEditor.placeholder = `Type your code here.\nFollow your recipe.`;
    el.codeGiven.hidden = !this.level.fix.given; el.codeGivenBox.hidden = !this.level.fix.given;
    if (this.level.fix.given) el.codeGiven.innerHTML = this.level.fix.given.split('\n').map((l) => highlight(l, this.lang) || ' ').join('\n');
    el.codeTask.innerHTML = '';
    el.cheatList.innerHTML = (CHEAT[this.lang] || []).map(([a, b]) => `<div class="cheat-row"><span>${esc(a)}</span><code>${esc(b)}</code></div>`).join('');
    const c = this.code;
    el.codeStatus.textContent = c.passed ? 'It works! Every example gives the right answer.' : c.runs ? 'Not there yet. Read what went wrong, change one thing, and check again.' : '';
    el.btnCodeReveal.disabled = c.runs < 1 || c.peeked;
    el.codeRevealNote.textContent = c.peeked ? 'Here is one way to write it. Yours can look different and still be right.'
      : c.runs < 1 ? 'Try your code first. The answer opens after your first try.'
        : c.passed ? 'You did it! You can still look at one way to write it.'
          : 'Stuck? You can look at the answer now. (You keep going, but you lose the no-help star.)';
    el.codeReveal.hidden = !c.peeked;
    if (c.peeked) {
      const mine = new Set(el.codeEditor.value.split('\n').map((s) => s.trim()).filter(Boolean));
      el.codeRef.innerHTML = this.level.fix.reference.split('\n').map((l) => { const t = l.trim(); const miss = t && t !== '}' && !mine.has(t); return `<span class="ref-line${miss ? ' miss' : ''}">${highlight(l, this.lang) || ' '}</span>`; }).join('');
    }
  }
  revealRef() {
    if (this.code.runs < 1 || this.code.peeked) return;
    this.code.peeked = true;
    if (!this.fix.done) this.fix.failures++;
    this.renderEditor();
  }
  /** Line numbers of the editor text, once the language's wrapper lines are taken away. */
  editorLine(n, text) {
    const off = this.lang === 'java' ? 1 : 0, k = n - off;
    return n && k >= 1 && k <= text.split('\n').length ? ` on line ${k}` : '';
  }
  runMine() {
    const el = this.el, text = el.codeEditor.value, list = el.codeResults;
    this.drafts[this.codeKey()] = text;
    list.innerHTML = '';
    if (!text.trim()) { list.innerHTML = '<li class="err">The box is empty. Type your code first.</li>'; return; }
    this.code.runs++;
    const canon = this.levelsRaw[this.li].fix.tests;
    let allPass = true;
    for (const [ti, t] of this.level.fix.tests.entries()) {
      const li = document.createElement('li');
      try {
        const r = new Interpreter(this.level.fix.fromText(text, canon[ti].run), { trace: false, limit: RUN_LIMIT, lang: this.lang }).run();
        const got = r.out.join('\n');
        if (r.error) { li.className = 'fail'; li.textContent = `${t.label}: something broke${this.editorLine(r.error.line, text)}. ${r.error.message}`; allPass = false; }
        else if (r.halted) { li.className = 'fail'; li.textContent = `${t.label}: your code never stops. A loop may repeat forever.`; allPass = false; }
        else if (got === t.expect) { li.className = 'pass'; li.textContent = t.label; }
        else { li.className = 'fail'; li.textContent = `${t.label}: your code gave ${got === '' ? 'nothing' : got}, but it should give ${t.expect}`; allPass = false; }
      } catch (e) {
        if (!(e instanceof LangError)) throw e;
        li.className = 'err'; li.textContent = `The computer cannot read this${this.editorLine(e.line, text)}: ${e.message}`; allPass = false;
        list.appendChild(li); break;
      }
      list.appendChild(li);
    }
    if (allPass) {
      this.code.passed = true;
      if (!this.fix.done) {
        this.fix.done = true;
        const fk = `${this.lang}:${this.level.id}:fix`;
        if (!this.awarded.has(fk)) {
          this.awarded.add(fk);
          const pts = Math.max(PTS.fixFloor, PTS.fix - PTS.fixPenalty * this.fix.failures);
          this.award(pts); toast(this.el, 'It works!', 'ok');
        }
      }
      const bk = `${this.lang}:${this.level.id}:code`;
      if (!this.code.peeked && !this.awarded.has(bk)) {
        this.awarded.add(bk);
        const pts = Math.max(PTS.codeFloor, PTS.code - PTS.codePenalty * this.code.failures);
        this.award(pts); /* bonus is silent */
      }
      this.renderPlay(); this.sfx.play('good'); this.checkLevelDone();
    } else { this.code.failures++; if (!this.fix.done) this.fix.failures++; this.streak = 0; this.sfx.play('bad'); }
    this.renderHUD();
    this.renderEditor();
  }
  /** Loads the student's own program onto the table so they can step through it like the CPU would. */
  loadMine(text) {
    const vals = {};
    this.level.play.inputs.forEach((inp) => { vals[inp.id] = inp.parse(inp.value); });
    const src = this.level.fix.fromText(text, this.levelsRaw[this.li].play.driver(vals));
    try { makeParser(this.lang, src).parseProgram(); } catch (e) {
      if (!(e instanceof LangError)) throw e;
      this.el.codeResults.innerHTML = `<li class="err">Syntax error${this.editorLine(e.line, text)}: ${esc(e.message)}</li>`;
      return false;
    }
    this.codeSource = src; this.viewingFixed = true; this.viewingMine = true; this.traceText = text; this.cleanTrace = false;
    this.buildTrace();
    return true;
  }
  ensureMineTrace() {
    const text = this.drafts[this.codeKey()] || '';
    const ready = this.code.runs >= 1 && text.trim();
    this.el.traceNote.hidden = !!ready; this.el.predCard.hidden = !ready;
    if (!ready) { this.el.traceNote.textContent = 'Write your function in tab 3 and run the tests once. Then you can watch your own code run here, one step at a time, with your predictions as practice.'; this.codeSource = ''; this.viewingMine = false; this.buildTrace(); this.render(); return; }
    if (!(this.viewingMine && this.traceText === text)) { this.loadMine(text); this.render(); }
  }
  /** Loads the student's own program onto the table so they can step through it like the CPU would. */
  traceMine() {
    const text = this.el.codeEditor.value;
    this.drafts[this.codeKey()] = text;
    if (!text.trim()) { this.el.codeResults.innerHTML = '<li class="err">The editor is empty. Write your function first.</li>'; return; }
    if (!this.loadMine(text)) return;
    this.setTab('predict'); this.render();
    toast(this.el, 'Stepping through your own code. Predictions here are practice, no points.', 'ok');
    try { this.el.stagePanel.scrollIntoView({ block: 'start' }); } catch (e) { /* ignore */ }
  }

  renderPlay() { this.el.playBox.hidden = !(this.fix.done && this.level.play); }

  /** Debugger-style "run to cursor": jump to the next tick that runs line n. No points for skipped steps. */
  runToLine(n) {
    if (this.idx >= this.events.length - 1) return;
    let j = -1;
    for (let k = this.idx + 1; k < this.events.length; k++) { if (this.events[k].kind !== 'end' && this.events[k].line === n) { j = k; break; } }
    if (j < 0) { toast(this.el, `Line ${n} does not run again from here.`, 'info'); return; }
    this.cleanTrace = false;
    this.idx = j;
    this.preparePrediction();
    this.setTab('predict', true);
    this.render();
    toast(this.el, `Jumped to line ${n}. Skipped steps earn no points.`, 'info');
  }

  renderHints() {
    this.el.hintBox.innerHTML = this.hintsShown.map((h) => `<li>${icon('i-bulb')}<span>${esc(h)}</span></li>`).join('');
  }
}

/* ------------------------------------------------------------------ toast */
function toast(el, msg, type) {
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.textContent = msg;
  el.toastRegion.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* -------------------------------------------------------------- bootstrap */
if (typeof document !== 'undefined') {
  const boot = () => { window.game = new Game(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}
if (typeof module !== 'undefined') {
  module.exports = { PyParser, JavaParser, Translator, LANGS, viewLevel, levelEnv, proseFor, snakeCase, javaType, typeName, Tokenizer, Parser, Interpreter, PredictionRules, LEVELS, LangError, fmtVal, lookupVar, rankFor, rankIndex, rankProgress, rankSvg, EMBLEMS, emblem, starsHtml, icon, TRACE_LIMIT, OOP_LEVELS, fmtOut };
}
