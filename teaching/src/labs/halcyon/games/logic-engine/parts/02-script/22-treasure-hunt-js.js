/* --- treasure-hunt.js --- */
(() => {
  /* Treasure Hunt: 6 by 6 map, one hidden treasure. Walk one step at a time (0 up, 1 right, 2 down, 3 left). Dig where you stand. 6 digs. */
  const TH_W = 6, TH_DIGS = 6;
  const TH_DX = [0, 1, 0, -1], TH_DY = [1, 0, -1, 0], TH_NAME = ['Up', 'Right', 'Down', 'Left'], TH_ARR = ['↑', '→', '↓', '←'];
  const TH_CSS = '<style>.th-map{display:grid;grid-template-columns:1.2rem repeat(6,1fr);gap:.2rem;width:min(100%,21rem)}.th-ax{font:600 .7rem var(--mono);color:#a9c9b8;display:grid;place-items:center}.th-c{aspect-ratio:1;border-radius:8px;border:1px solid var(--line);background:rgba(0,0,0,.25);color:var(--ivory);font:700 .9rem var(--mono);padding:0;cursor:pointer;display:grid;place-items:center}.th-c.dug{background:rgba(0,0,0,.5);color:#a9c9b8}.th-c.me{outline:3px solid var(--brass-hi);background:var(--brass-hi);color:#14211c}.th-c.gold{background:var(--mint);color:#14211c}.th-pad{display:grid;grid-template-columns:repeat(3,3.2rem);grid-template-rows:repeat(2,3rem);gap:.3rem;justify-content:center}.th-pad .btn{padding:0}</style>';
  FULL['Treasure Hunt'] = {
    title: 'Treasure Hunt: the full game',
    intro: 'The map is 6 by 6 squares, numbered 0 to 5 across (x) and up (y). Treasure is buried on one square. Walk one step at a time: up, right, down or left. If a step would leave the map, you stay where you are. Dig where you stand. A miss tells you how many steps away the treasure is. You have 6 digs. Arrow keys or WASD walk, Space or Enter digs. Tap a next-door square to walk there, or tap your own square to dig.',
    make: (A) => {
      let tx, ty, x, y, digs, dug, steps, msg, done;
      const find = (cx, cy) => dug.find((d) => d.x === cx && d.y === cy);
      const draw = () => {
        const rows = [];
        for (let yy = TH_W - 1; yy >= 0; yy--) {
          rows.push(`<span class="th-ax">${yy}</span>`);
          for (let xx = 0; xx < TH_W; xx++) {
            const d = find(xx, yy), me = xx === x && yy === y, gold = done && xx === tx && yy === ty;
            const cls = 'th-c' + (d ? ' dug' : '') + (me ? ' me' : '') + (gold ? ' gold' : '');
            const txt = gold ? 'X' : me ? '●' : d ? d.dist : '';
            rows.push(`<button type="button" class="${cls}" data-act="cell" data-v="${xx},${yy}" aria-label="Square ${xx}, ${yy}${me ? ', you are here' : ''}${d ? ', dug, treasure was ' + d.dist + ' steps away' : ''}">${txt}</button>`);
          }
        }
        rows.push('<span></span>'); for (let xx = 0; xx < TH_W; xx++) rows.push(`<span class="th-ax">${xx}</span>`);
        const pad = `<div class="th-pad"><span></span>${abtn('go', 0, TH_ARR[0], '', done).replace('<button', '<button aria-label="Step up"')}<span></span>${abtn('go', 3, TH_ARR[3], '', done).replace('<button', '<button aria-label="Step left"')}${abtn('go', 2, TH_ARR[2], '', done).replace('<button', '<button aria-label="Step down"')}${abtn('go', 1, TH_ARR[1], '', done).replace('<button', '<button aria-label="Step right"')}</div>`;
        A.draw(`${TH_CSS}<div class="arc-scene"><div class="arc-top"><span class="chip">Digs left <b>${TH_DIGS - dug.length}</b> / ${TH_DIGS}</span><span class="chip">You at <b>${x}, ${y}</b></span><span class="chip">Steps <b>${steps}</b></span></div>
          <div class="th-map" aria-label="Treasure map">${rows.join('')}</div>${pad}<div class="arc-opts">${abtn('dig', '', 'Dig here', 'primary', done)}</div><p class="arc-fb">${msg}</p></div>`);
      };
      const go = (d) => {
        if (done) return;
        const nx = x + TH_DX[d], ny = y + TH_DY[d];
        if (nx < 0 || nx >= TH_W || ny < 0 || ny >= TH_W) { msg = `Edge of the map. You stay at ${x}, ${y}.`; A.sfx('bad'); }
        else { x = nx; y = ny; steps++; msg = `You walk ${TH_NAME[d].toLowerCase()} to ${x}, ${y}.`; A.sfx('tick'); }
        draw();
      };
      const dig = () => {
        if (done) return;
        if (find(x, y)) { msg = 'You already dug here. Walk somewhere else.'; draw(); return; }
        const dist = Math.abs(x - tx) + Math.abs(y - ty);
        if (dist === 0) { done = true; dug.push({ x, y, dist }); msg = ''; draw(); A.end(true, `You found the treasure at ${tx}, ${ty} with ${TH_DIGS - dug.length + 1} ${TH_DIGS - dug.length + 1 === 1 ? 'dig' : 'digs'} to spare, after ${steps} steps!`); return; }
        dug.push({ x, y, dist });
        msg = `Nothing here. The treasure is ${dist} ${dist === 1 ? 'step' : 'steps'} away (across plus up or down).`;
        if (dug.length >= TH_DIGS) { done = true; draw(); A.end(false, `Out of digs. The treasure was at ${tx}, ${ty}.`); return; }
        A.sfx('tick'); draw();
      };
      return {
        start() {
          tx = rnd(TH_W); ty = rnd(TH_W); do { x = rnd(TH_W); y = rnd(TH_W); } while (x === tx && y === ty);
          dug = []; steps = 0; done = false; msg = 'Walk to a square and dig. Each miss gives you a clue.'; draw();
          A.key((e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key, m = { ArrowUp: 0, w: 0, W: 0, ArrowRight: 1, d: 1, D: 1, ArrowDown: 2, s: 2, S: 2, ArrowLeft: 3, a: 3, A: 3 };
            if (k in m) { e.preventDefault(); go(m[k]); } else if (k === ' ' || k === 'Enter') { e.preventDefault(); dig(); }
          });
        },
        act(a, v) {
          if (a === 'go') go(+v); else if (a === 'dig') dig();
          else if (a === 'cell') {
            const [cx, cy] = v.split(',').map(Number);
            if (cx === x && cy === y) dig();
            else { const d = [0, 1, 2, 3].find((k) => x + TH_DX[k] === cx && y + TH_DY[k] === cy); if (d !== undefined) go(d); else { msg = 'Walk one step at a time. Tap a square next to you.'; draw(); } }
          }
        },
      };
    },
  };
})();

/* --- uno.js --- */
(() => {
  /* Uno vs 3 bots: match colour, number or symbol. Skip, Reverse, Draw 2, Wild, Wild Draw 4. Say UNO when you go down to one card. First to empty their hand wins. */
  const COL = ['red', 'yellow', 'green', 'blue'], HEX = { red: '#c0392b', yellow: '#d4a017', green: '#2e8b57', blue: '#2a6fb0', wild: '#333' };
  const mk = () => { const d = []; COL.forEach((c) => { d.push({ c, v: '0' }); for (let n = 1; n <= 9; n++) { d.push({ c, v: '' + n }, { c, v: '' + n }); } ['skip', 'rev', '+2'].forEach((v) => d.push({ c, v }, { c, v })); }); for (let i = 0; i < 4; i++) d.push({ c: 'wild', v: 'wild' }, { c: 'wild', v: '+4' }); for (let i = d.length - 1; i > 0; i--) { const j = rnd(i + 1); [d[i], d[j]] = [d[j], d[i]]; } return d; };
  const sym = (v) => ({ skip: 'Skip', rev: 'Rev', '+2': '+2', wild: 'Wild', '+4': '+4' }[v] || v);
  FULL['Uno'] = {
    title: 'Uno: the full game',
    intro: 'Match the top card by colour, number or symbol, or play a Wild. Skip, Reverse, +2 and +4 hit the next player. When you have 2 cards, press Say UNO before you play your second to last card, or you draw 2. First to empty their hand wins.',
    make: (A) => {
      let deck, disc, hands, cur, dir, color, said, fb, busy, pending;
      const names = ['You', 'Ava', 'Ben', 'Cy'];
      const top = () => disc[disc.length - 1];
      const take = () => { if (!deck.length) { const t = disc.pop(); deck = disc.splice(0); for (let i = deck.length - 1; i > 0; i--) { const j = rnd(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; } disc = [t]; } return deck.pop(); };
      const ok = (c) => c.c === 'wild' || c.c === color || c.v === top().v;
      const next = (n = 1) => { cur = (cur + dir * n + 40) % 4; };
      const draw = () => {
        const mine = hands[0];
        A.draw(`<div class="arc-scene"><div class="arc-top">${[1, 2, 3].map((i) => `<span>${names[i]} <b>${hands[i].length}</b>${cur === i ? ' *' : ''}</span>`).join('')}<span>Deck <b>${deck.length}</b></span></div>
        <div style="display:flex;gap:10px;align-items:center;justify-content:center"><div style="width:64px;height:90px;border-radius:8px;background:${HEX[color]};color:#fff;display:grid;place-items:center;font:800 22px var(--mono);border:3px solid #fff" aria-label="Top card ${color} ${sym(top().v)}">${sym(top().v)}</div><div class="muted">Colour: <b>${color}</b><br>${dir > 0 ? 'Clockwise' : 'Counter-clockwise'}</div></div>
        <p class="arc-ask">${cur === 0 ? (pending ? 'Choose a colour.' : 'Your turn.') : names[cur] + ' is playing...'}</p>
        ${pending ? `<div class="arc-opts">${COL.map((c) => `<button type="button" class="btn" data-act="color" data-v="${c}" style="background:${HEX[c]};color:#fff">${c}</button>`).join('')}</div>` : `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${mine.map((c, i) => `<button type="button" data-act="play" data-v="${i}" ${cur !== 0 || busy || !ok(c) ? 'disabled' : ''} aria-label="${c.c} ${sym(c.v)}" style="width:52px;height:74px;border-radius:7px;border:2px solid #fff;background:${HEX[c.c]};color:#fff;font:800 15px var(--mono);opacity:${cur === 0 && ok(c) ? 1 : .55}">${sym(c.v)}</button>`).join('')}</div>
        <div class="arc-opts">${abtn('drawc', '', 'Draw a card', '', cur !== 0 || busy)}${abtn('uno', '', said ? 'UNO said' : 'Say UNO', said ? 'primary' : '', said || mine.length > 2 || cur !== 0)}</div>`}
        <p class="arc-fb">${fb}</p></div>`);
      };
      const win = (i) => { draw(); A.end(i === 0, i === 0 ? 'You played your last card. You win!' : `${names[i]} played their last card.`); };
      const apply = (c, who) => { /* effects after a card is played by who; turn advance */
        if (c.v === 'rev') { dir *= -1; fb += ' Direction reversed.'; next(); }
        else if (c.v === 'skip') { next(); fb += ` ${names[cur]} is skipped.`; next(); }
        else if (c.v === '+2') { next(); for (let k = 0; k < 2; k++) hands[cur].push(take()); fb += ` ${names[cur]} draws 2 and is skipped.`; next(); }
        else if (c.v === '+4') { next(); for (let k = 0; k < 4; k++) hands[cur].push(take()); fb += ` ${names[cur]} draws 4 and is skipped.`; next(); }
        else next();
      };
      const botTurn = () => {
        busy = true; draw();
        A.after(() => {
          const h = hands[cur], who = cur, pl = h.map((c, i) => [c, i]).filter(([c]) => ok(c));
          if (!pl.length) { const c = take(); h.push(c); fb = `${names[who]} draws a card.`; if (ok(c)) { h.pop(); disc.push(c); fb += ` and plays ${c.c} ${sym(c.v)}.`; if (c.c === 'wild') color = COL[rnd(4)]; else color = c.c; if (!h.length) return win(who); apply(c, who); } else next(); }
          else {
            const pick = pl.find(([c]) => c.c !== 'wild') || pl[0], [c, i] = pick; h.splice(i, 1); disc.push(c);
            if (c.c === 'wild') { const cnt = {}; h.forEach((x) => { if (x.c !== 'wild') cnt[x.c] = (cnt[x.c] || 0) + 1; }); color = COL.slice().sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0))[0]; } else color = c.c;
            fb = `${names[who]} plays ${c.c === 'wild' ? '' : c.c + ' '}${sym(c.v)}${c.c === 'wild' ? ' and picks ' + color : ''}.${h.length === 1 ? ' UNO!' : ''}`;
            if (!h.length) return win(who);
            apply(c, who);
          }
          busy = false; if (cur === 0) { A.sfx('tick'); draw(); } else botTurn();
        }, 800);
      };
      const after = () => { if (cur === 0) { busy = false; draw(); } else botTurn(); };
      return {
        start() {
          deck = mk(); hands = [[], [], [], []]; for (let k = 0; k < 7; k++) hands.forEach((h) => h.push(take()));
          let f = take(); while (f.c === 'wild' || ['skip', 'rev', '+2'].includes(f.v)) { deck.unshift(f); f = take(); }
          disc = [f]; color = f.c; cur = 0; dir = 1; said = false; fb = 'You go first.'; busy = false; pending = null; draw();
        },
        act(a, v) {
          if (cur !== 0 || busy) return;
          if (a === 'uno') { said = true; draw(); return; }
          if (a === 'drawc') { const c = take(); hands[0].push(c); fb = ok(c) ? `You drew ${c.c} ${sym(c.v)}. You can play it or draw again to pass.` : `You drew ${c.c} ${sym(c.v)}. No play, turn passes.`; if (!ok(c)) { next(); said = false; return after(); } draw(); return; }
          if (a === 'color') { color = v; const c = pending; pending = null; fb = `You chose ${v}.`; if (!hands[0].length) return win(0); apply(c, 0); return after(); }
          if (a === 'play') {
            const c = hands[0][+v]; if (!c || !ok(c)) return; hands[0].splice(+v, 1); disc.push(c); A.sfx('good');
            if (hands[0].length === 1 && !said) { hands[0].push(take(), take()); fb = 'You forgot to say UNO! Draw 2.'; A.sfx('bad'); }
            else fb = '';
            said = false;
            if (c.c === 'wild') { pending = c; draw(); return; }
            color = c.c; if (!hands[0].length) return win(0); fb += ` You play ${c.c} ${sym(c.v)}.`; apply(c, 0); after();
          }
        },
      };
    },
  };
})();

/* --- werewolf.js --- */
(() => {
  /* Werewolf: 7 players (you and 6 bots). 2 werewolves, 1 seer, 1 doctor, 3 villagers. Night, dawn, day talk, vote. */
  const NAMES = ['You', 'Ana', 'Ben', 'Cy', 'Dee', 'Eli', 'Fay'];
  const ROLE = { wolf: 'Werewolf', seer: 'Seer', doctor: 'Doctor', villager: 'Villager' };
  const DESC = {
    wolf: 'Each night you and your partner choose a villager to eat. By day, blend in. The wolves win when they are as many as the villagers.',
    seer: 'Each night you look at one player and learn if they are a werewolf. Use what you learn, but wolves will hunt the seer.',
    doctor: 'Each night you protect one player. If the wolves pick them, they live. You cannot protect the same player two nights in a row.',
    villager: 'You have no night power. Listen to the talk, watch the votes, and banish the werewolves. The village wins when no wolves are left.',
  };
  const STYLE = `<style>
.ww-roster{display:flex;flex-wrap:wrap;gap:.35rem;justify-content:center}
.ww-p{display:grid;gap:0;text-align:center;padding:.25rem .5rem;border-radius:8px;border:1px solid var(--line);background:rgba(0,0,0,.25);min-width:3.6rem}
.ww-p b{font:700 .8rem var(--mono)}.ww-p small{font:.65rem var(--mono);color:#a9c9b8}
.ww-p.me{border-color:var(--brass-hi)}.ww-p.dead{opacity:.55}.ww-p.dead b{text-decoration:line-through}
.ww-log{list-style:none;margin:0;padding:.5rem .6rem;width:min(100%,28rem);max-height:11rem;overflow-y:auto;display:grid;gap:.25rem;border:1px solid var(--line);border-radius:10px;background:rgba(0,0,0,.25);font-size:.85rem;box-sizing:border-box}
.ww-log .sys{color:var(--brass-hi);font-weight:600}.ww-log .you{color:var(--sky)}
.ww-sec{margin:0;font:.72rem var(--mono);color:#a9c9b8;text-align:center}
</style>`;
  FULL['Werewolf'] = {
    title: 'Village Square: Werewolf, the full game',
    intro: 'Seven players: two werewolves, a seer, a doctor and three villagers. You get a random role. Nights are secret, days are for talk and a vote. The player with the most votes is banished. A tie banishes nobody. The village wins when no wolves are left. The wolves win when they are at least as many as the villagers.',
    make: (A) => {
      let P, day, phase, log, claims, history, lastSave, myChecks, botFound, accused, shared, spoke, banner, lastVotes;
      const rnd = (n) => Math.floor(Math.random() * n);
      const pick = (a) => a[rnd(a.length)];
      const wpick = (a, f) => { const w = a.map((x) => Math.max(0.01, f(x))); let r = Math.random() * w.reduce((s, x) => s + x, 0); for (let k = 0; k < a.length; k++) { r -= w[k]; if (r <= 0) return a[k]; } return a[a.length - 1]; };
      const alive = () => P.map((p, i) => i).filter((i) => P[i].alive);
      const isWolf = (i) => P[i].role === 'wolf';
      const winner = () => { const w = alive().filter(isWolf).length, o = alive().length - w; return w === 0 ? 'village' : (w >= o ? 'wolves' : null); };
      const say = (t, k) => { log.push({ t, k: k || '' }); };
      const myTeamWins = (w) => (w === 'wolves') === isWolf(0);
      const wolvesHiding = () => P.filter((p) => p.role === 'wolf' && p.alive).length;

      const discredited = (by) => claims.some((c) => c.by === by && !P[c.target].alive && c.res === 'wolf' && P[c.target].role !== 'wolf');
      const trusted = (c) => !(P[c.by].role === 'wolf' && !P[c.by].alive) && !discredited(c.by);
      const susOf = (t) => {
        let s = (accused[t] || 0) * 0.8;
        history.forEach((h) => { if (h.banished >= 0 && h.votes[t] === h.banished) s += P[h.banished].role === 'wolf' ? -2 : 1.5; });
        claims.forEach((c) => { if (c.by === t && c.res === 'wolf' && !P[c.target].alive) s += P[c.target].role === 'wolf' ? -3 : 6; });
        return s;
      };
      const botWolfTarget = () => {
        const pool = alive().filter((j) => !isWolf(j));
        return wpick(pool, (j) => 1 + (claims.some((c) => c.by === j && c.res === 'wolf' && trusted(c)) ? 5 : 0) + (P[j].role === 'seer' ? 0.5 : 0));
      };
      const botVote = (i) => {
        const cand = alive().filter((j) => j !== i);
        if (isWolf(i)) return wpick(cand.filter((j) => !isWolf(j)), (j) => 1 + (claims.some((c) => c.by === j && c.res === 'wolf' && !c.fake) ? 4 : 0) + (accused[j] || 0) * 0.8);
        if (P[i].role === 'seer') { const f = botFound.find((x) => x.wolf && P[x.id].alive); if (f) return f.id; }
        const mine = claims.find((c) => c.target === i && c.res === 'wolf' && P[c.by].alive && c.by !== i);
        if (mine && Math.random() < 0.9) return mine.by;
        const wc = claims.filter((c) => c.res === 'wolf' && P[c.target].alive && c.target !== i && c.by !== i && trusted(c));
        if (wc.length && Math.random() < 0.8) return pick(wc).target;
        const safe = (j) => P[i].role === 'seer' && botFound.some((x) => x.id === j && !x.wolf);
        return wpick(cand, (j) => (1 + susOf(j)) * (safe(j) ? 0.1 : 1));
      };
      const speak = (i) => {
        const p = P[i], n = p.name;
        if (p.role === 'seer') {
          const f = botFound.filter((x) => P[x.id].alive);
          const w = f.find((x) => x.wolf && !p.claimed.has(x.id));
          if (w && Math.random() < 0.8) { p.claimed.add(w.id); claims.push({ by: i, target: w.id, res: 'wolf' }); return `${n}: I am the seer. I looked at ${P[w.id].name}. ${P[w.id].name} is a werewolf!`; }
          const s = f.find((x) => !x.wolf && !p.claimed.has(x.id));
          if (s && Math.random() < 0.3) { p.claimed.add(s.id); claims.push({ by: i, target: s.id, res: 'safe' }); return `${n}: I am the seer. I looked at ${P[s.id].name}. They are not a wolf.`; }
        }
        if (isWolf(i) && !claims.some((c) => c.by === i) && !claims.some((c) => c.res === 'wolf' && P[c.by].role === 'seer') && Math.random() < 0.2) {
          const t = pick(alive().filter((j) => !isWolf(j)));
          claims.push({ by: i, target: t, res: 'wolf', fake: true });
          return `${n}: I am the seer! I looked at ${P[t].name}. ${P[t].name} is a werewolf!`;
        }
        const seerClaimers = new Set(claims.filter((c) => c.res === 'wolf' && P[c.by].alive).map((c) => c.by));
        if (seerClaimers.size > 1 && Math.random() < 0.5) return `${n}: Two players say they are the seer. One of them must be lying.`;
        const pool = alive().filter((j) => j !== i && !(isWolf(i) && isWolf(j)));
        const t = isWolf(i) ? pick(pool) : wpick(pool, (j) => 1 + susOf(j));
        const tn = P[t].name;
        const last = history[history.length - 1];
        if (last && last.banished >= 0 && P[last.banished].role !== 'wolf' && last.votes[t] === last.banished && Math.random() < 0.6) return `${n}: ${tn} voted for ${P[last.banished].name}, who was innocent. That is suspicious.`;
        if (last && last.banished >= 0 && P[last.banished].role === 'wolf' && !isWolf(i) && last.votes[t] === last.banished && Math.random() < 0.5) return `${n}: ${tn} voted for a wolf last time. I trust ${tn}.`;
        accused[t] = (accused[t] || 0) + 0.5;
        return pick([`${n}: I do not trust ${tn}. They are too quiet.`, `${n}: ${tn} has been acting strange.`, `${n}: I have no proof, but ${tn} makes me nervous.`, `${n}: Think about who stayed calm at dawn. I suspect ${tn}.`]);
      };

      const roster = () => `<div class="ww-roster">${P.map((p, i) => {
        const known = !p.alive || i === 0 || (isWolf(0) && isWolf(i));
        return `<span class="ww-p${p.alive ? '' : ' dead'}${i === 0 ? ' me' : ''}" aria-label="${p.name}, ${p.alive ? 'alive' : 'out'}${known ? ', ' + ROLE[p.role] : ''}"><b>${p.name}</b><small>${known ? ROLE[p.role] : 'alive'}</small></span>`;
      }).join('')}</div>`;
      const targets = (ids, act) => `<div class="arc-opts">${ids.map((i) => abtn(act, i, P[i].name)).join('')}</div>`;
      const logBox = () => `<ul class="ww-log" id="ww-log" aria-live="polite">${log.slice(-14).map((l) => `<li class="${l.k}">${esc(l.t)}</li>`).join('')}</ul>`;
      const top = () => `<div class="arc-top"><span class="chip">${phase === 'night' ? 'Night' : 'Day'} <b>${day}</b></span><span class="chip">Alive <b>${alive().length}</b></span><span class="chip">Wolves hiding <b>${wolvesHiding()}</b></span><span class="chip">You: <b>${ROLE[P[0].role]}</b></span></div>`;
      const wrap = (inner) => A.draw(`${STYLE}${top()}<div class="arc-scene">${roster()}${inner}</div>`);

      const draw = () => {
        const me = P[0], alv = alive();
        if (phase === 'role') {
          const partner = isWolf(0) ? `<p class="arc-ask">Your partner is ${P.filter((p, i) => i && isWolf(i)).map((p) => p.name).join('')}.</p>` : '';
          A.draw(`${STYLE}<div class="arc-scene"><p class="arc-big-text">You are the ${ROLE[me.role]}</p><p class="arc-ask">${DESC[me.role]}</p>${partner}<p class="ww-sec">Seven players. 2 werewolves, 1 seer, 1 doctor, 3 villagers.</p>${roster()}<div class="arc-opts">${abtn('go', '', 'Night falls', 'primary')}</div></div>`);
        } else if (phase === 'night') {
          let ask, opts = '';
          if (!me.alive) ask = 'You are out of the game. Watch the night.';
          else if (me.role === 'wolf') { ask = 'Wolf, choose who to eat tonight.'; opts = targets(alv.filter((j) => !isWolf(j)), 'target'); }
          else if (me.role === 'seer') { ask = 'Seer, choose who to look at.'; opts = targets(alv.filter((j) => j !== 0), 'target'); }
          else if (me.role === 'doctor') { ask = lastSave >= 0 && P[lastSave].alive ? `Doctor, choose who to protect. You cannot pick ${P[lastSave].name} again.` : 'Doctor, choose who to protect.'; opts = targets(alv.filter((j) => j !== lastSave), 'target'); }
          else ask = 'You are a villager. You close your eyes and sleep.';
          const sk = (!me.alive || me.role === 'villager') ? `<div class="arc-opts">${abtn('go', '', me.alive ? 'Sleep until dawn' : 'Watch the night', 'primary')}</div>` : '';
          const seen = me.role === 'seer' && myChecks.length ? `<p class="ww-sec">Your findings: ${myChecks.map((c) => `${P[c.id].name} ${c.wolf ? 'is a WOLF' : 'is safe'}`).join('; ')}.</p>` : '';
          wrap(`<p class="arc-ask">${ask}</p>${opts}${sk}${seen}<p class="arc-fb">${banner}</p>`);
        } else if (phase === 'dawn') {
          wrap(`<p class="arc-ask">Dawn breaks.</p>${logBox()}<div class="arc-opts">${abtn('go', '', 'Start the day', 'primary')}</div>`);
        } else if (phase === 'day') {
          const others = alv.filter((j) => j !== 0);
          let acts = '';
          if (me.alive) {
            const sh = me.role === 'seer' && myChecks.length && !shared ? `<div class="arc-opts">${abtn('share', '', 'Tell the village what I saw', '')}</div>` : '';
            acts = `${sh}<p class="ww-sec">${spoke ? 'You have spoken today.' : 'Say who you suspect:'}</p>${spoke ? '' : targets(others, 'accuse')}<p class="arc-ask">Vote to banish:</p>${targets(others, 'vote')}`;
          } else acts = `<div class="arc-opts">${abtn('go', '', 'Watch the vote', 'primary')}</div>`;
          wrap(`${logBox()}${acts}<p class="arc-fb">${banner}</p>`);
        } else if (phase === 'vote') {
          wrap(`<div class="arc-row">${lastVotes.map((v) => `<span class="arc-vote"><b>${P[v[0]].name}</b> to ${P[v[1]].name}</span>`).join('')}</div>${logBox()}${A.over ? '' : `<div class="arc-opts">${abtn('go', '', 'Night falls', 'primary')}</div>`}`);
        }
        const l = document.getElementById('ww-log'); if (l) l.scrollTop = l.scrollHeight;
      };

      const finish = () => {
        const w = winner(), won = myTeamWins(w);
        say(w === 'village' ? 'No wolves are left. The village wins!' : 'The wolves are as many as the villagers. The wolves win!', 'sys');
        phase = phase === 'night' ? 'dawn' : phase; draw();
        A.end(won, won ? (w === 'village' ? 'You banished every wolf. The village wins!' : 'The wolves took over the village. You win!') : (w === 'village' ? 'The village found every wolf. Your team lost.' : 'The wolves took over the village. Your team lost.'));
      };
      const startNight = () => { phase = 'night'; banner = ''; shared = false; spoke = false; draw(); };
      const resolveNight = (choice) => {
        const wolfT = (P[0].alive && isWolf(0)) ? choice : (alive().some(isWolf) ? botWolfTarget() : -1);
        let saveT = -1;
        if (P[0].alive && P[0].role === 'doctor') saveT = choice;
        else { const d = P.findIndex((p) => p.role === 'doctor' && p.alive); if (d >= 0) saveT = pick(alive().filter((j) => j !== lastSave)); }
        const sIdx = P.findIndex((p) => p.role === 'seer' && p.alive);
        if (sIdx === 0) { myChecks.push({ id: choice, wolf: isWolf(choice) }); say(`You looked at ${P[choice].name}: ${isWolf(choice) ? 'a WEREWOLF!' : 'not a werewolf.'}`, 'you'); }
        else if (sIdx > 0) { const pool = alive().filter((j) => j !== sIdx && !botFound.some((x) => x.id === j)); if (pool.length) { const t = pick(pool); botFound.push({ id: t, wolf: isWolf(t) }); } }
        if (P.some((p) => p.role === 'doctor' && p.alive)) lastSave = saveT;
        say(`Night ${day} is over.`, 'sys');
        if (wolfT >= 0 && wolfT === saveT) {
          say(P[0].role === 'doctor' && P[0].alive ? `The wolves picked ${P[wolfT].name}, and you saved them!` : 'Nobody died last night. The doctor saved someone.', 'sys');
        } else if (wolfT >= 0) {
          P[wolfT].alive = false;
          say(wolfT === 0 ? `You were eaten in the night. You were the ${ROLE[P[0].role]}.` : `${P[wolfT].name} was found eaten. They were the ${ROLE[P[wolfT].role]}.`, 'sys');
        }
        phase = 'dawn'; A.sfx(wolfT >= 0 && wolfT !== saveT ? 'bad' : 'good');
        if (winner()) return finish();
        draw();
      };
      const startDay = () => {
        say(`Day ${day}. The village talks.`, 'sys');
        alive().filter((i) => i !== 0).forEach((i) => { say(speak(i)); });
        phase = 'day'; banner = ''; draw();
      };
      const resolveVote = (myVote) => {
        const votes = {}; const list = [];
        alive().forEach((i) => { const t = i === 0 ? myVote : botVote(i); votes[i] = t; list.push([i, t]); });
        const tally = {}; list.forEach(([, t]) => { tally[t] = (tally[t] || 0) + 1; });
        const top = Math.max(...Object.values(tally)), lead = Object.keys(tally).filter((k) => tally[k] === top).map(Number);
        let b = -1;
        if (lead.length === 1) { b = lead[0]; P[b].alive = false; }
        history.push({ votes, banished: b });
        lastVotes = list; day++;
        say(`Votes: ${Object.keys(tally).map((k) => `${P[k].name} ${tally[k]}`).join(', ')}.`, 'sys');
        if (b < 0) say('The vote is tied. Nobody is banished.', 'sys');
        else say(b === 0 ? `You were banished! You were the ${ROLE[P[0].role]}.` : `${P[b].name} is banished. They were the ${ROLE[P[b].role]}.`, 'sys');
        phase = 'vote'; A.sfx(b >= 0 && P[b].role === 'wolf' ? 'good' : 'tick');
        if (winner()) return finish();
        draw();
      };

      return {
        start() {
          const roles = ['wolf', 'wolf', 'seer', 'doctor', 'villager', 'villager', 'villager'];
          for (let k = roles.length - 1; k > 0; k--) { const j = rnd(k + 1); [roles[k], roles[j]] = [roles[j], roles[k]]; }
          P = NAMES.map((name, i) => ({ name, role: roles[i], alive: true, claimed: new Set() }));
          day = 1; phase = 'role'; log = []; claims = []; history = []; lastSave = -1; myChecks = []; botFound = []; accused = {}; shared = false; spoke = false; banner = ''; lastVotes = [];
          draw();
        },
        act(a, v) {
          const me = P[0];
          if (a === 'go') {
            if (phase === 'role') startNight();
            else if (phase === 'night' && (!me.alive || me.role === 'villager')) resolveNight(-1);
            else if (phase === 'dawn') startDay();
            else if (phase === 'day' && !me.alive) resolveVote(-1);
            else if (phase === 'vote') startNight();
            return;
          }
          const i = Number(v);
          if (a === 'target' && phase === 'night' && me.alive) {
            if (!P[i] || !P[i].alive) return;
            if (me.role === 'wolf' && !isWolf(i)) resolveNight(i);
            else if (me.role === 'seer' && i !== 0) resolveNight(i);
            else if (me.role === 'doctor' && i !== lastSave) resolveNight(i);
          } else if (a === 'accuse' && phase === 'day' && me.alive && !spoke && P[i] && P[i].alive && i !== 0) {
            spoke = true; accused[i] = (accused[i] || 0) + 1; say(`You: I think ${P[i].name} is a werewolf.`, 'you'); A.sfx('tick'); draw();
          } else if (a === 'share' && phase === 'day' && me.alive && me.role === 'seer' && !shared) {
            shared = true; myChecks.forEach((c) => { if (P[c.id].alive || c.wolf) claims.push({ by: 0, target: c.id, res: c.wolf ? 'wolf' : 'safe' }); });
            say(`You: I am the seer. ${myChecks.map((c) => `${P[c.id].name} ${c.wolf ? 'is a werewolf' : 'is not a wolf'}`).join('. ')}.`, 'you'); A.sfx('tick'); draw();
          } else if (a === 'vote' && phase === 'day' && me.alive && P[i] && P[i].alive && i !== 0) resolveVote(i);
        },
      };
    },
  };
})();

