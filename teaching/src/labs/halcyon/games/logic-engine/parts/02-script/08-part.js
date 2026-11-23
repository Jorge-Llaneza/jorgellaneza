/* =====================================================================
   FULL GAMES: master every lesson of a game and the real, complete game unlocks.
   Defined in full/*.js and inlined between the markers below.
   ===================================================================== */
const FULL = {};
/*FULL:BEGIN*/
/* --- baccarat.js --- */
(() => {
  /* Punto banco baccarat with the real third-card rules. Bet on Player (1 to 1), Banker (1 to 1 minus 5 percent commission) or Tie (8 to 1). A tie returns Player and Banker bets. */
  const START = 200, GOAL = 500, BETS = [20, 40, 100], MIN = 20;
  const pts = (r) => (r >= 10 ? 0 : r);
  const tot = (h) => h.reduce((a, c) => a + pts(c.r), 0) % 10;
  const RANKS = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  const STYLE = `<style>
.bc-top{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;font:600 .8rem var(--mono)}
.bc-top span{padding:.25rem .6rem;border:1px solid var(--line);border-radius:999px;background:rgba(0,0,0,.25)}
.bc-tbl{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;width:100%;max-width:26rem}
.bc-side{display:grid;gap:.3rem;justify-items:center;padding:.4rem;border-radius:10px;background:rgba(0,0,0,.2)}
.bc-side.win{outline:3px solid var(--mint)}
.bc-hand{display:flex;gap:.25rem;justify-content:center;min-height:4.6rem}
.bc-hand .pcard{width:min(3rem,12vw)}
.bc-lab{font:700 .85rem var(--mono);color:var(--brass-hi);margin:0}
.bc-road{display:flex;gap:.2rem;flex-wrap:wrap;justify-content:center}
.bc-road b{display:grid;place-items:center;width:1.6rem;height:1.6rem;border-radius:50%;font:700 .72rem var(--mono);color:#fff}
.bc-P{background:#2a6fb5}.bc-B{background:#b3262f}.bc-T{background:#1f7a4d}
.bc-pick.sel{outline:3px solid var(--brass-hi)}
</style>`;
  FULL['Baccarat'] = {
    title: 'Baccarat: the full game',
    intro: 'Punto banco. Bet on Player, Banker or Tie. Aces are 1, cards 2 to 9 are their number, tens and faces are 0, and a hand is worth the last digit of its sum. Closest to 9 wins. A total of 8 or 9 on the first two cards is a natural and ends the round. Otherwise the third-card rules decide who draws. Player and Banker pay 1 to 1 (Banker takes 5 percent commission), Tie pays 8 to 1. Reach ' + GOAL + ' chips to win.',
    make: (A) => {
      let bank, bet, side, shoe, P, B, phase, fb, road, rounds, winner;
      const mkShoe = () => { const s = []; for (let d = 0; d < 6; d++) for (let r = 1; r <= 13; r++) for (let k = 0; k < 4; k++) s.push({ r, s: k }); for (let i = s.length - 1; i > 0; i--) { const j = rnd(i + 1); [s[i], s[j]] = [s[j], s[i]]; } return s; };
      const take = () => { if (shoe.length < 20) shoe = mkShoe(); return shoe.pop(); };
      const ch = (c) => pokerCardHtml(c.r === 1 ? 14 : c.r, c.s, '', '', undefined);
      const SIDE = { P: 'Player', B: 'Banker', T: 'Tie' };
      const draw = () => {
        let ctl;
        if (phase === 'bet') ctl = `<div class="arc-row" role="group" aria-label="Bet on">${['P', 'B', 'T'].map((s) => `<button type="button" class="btn small bc-pick${s === side ? ' sel primary' : ''}" data-act="side" data-v="${s}">${SIDE[s]} ${s === 'T' ? '8:1' : s === 'B' ? '0.95:1' : '1:1'}</button>`).join('')}</div>
          <div class="arc-row" role="group" aria-label="Bet size">${BETS.map((b) => `<button type="button" class="btn small bc-pick${b === bet ? ' sel primary' : ''}" data-act="amt" data-v="${b}" ${b > bank ? 'disabled' : ''}>Bet ${b}</button>`).join('')}</div>
          <div class="arc-opts">${abtn('deal', '', `Deal: ${bet} on ${SIDE[side]} (D)`, 'primary', bet > bank)}</div>`;
        else if (phase === 'over') ctl = `<div class="arc-opts">${abtn('next', '', 'Next round (D)', 'primary')}</div>`;
        else ctl = '<p class="arc-ask">Dealing...</p>';
        A.draw(`${STYLE}<div class="arc-scene">
          <div class="bc-top"><span>Chips ${bank}</span><span>Goal ${GOAL}</span><span>Round ${rounds}</span></div>
          <div class="bc-tbl">
            <div class="bc-side${winner === 'P' ? ' win' : ''}"><p class="bc-lab">Player${P.length ? ' ' + tot(P) : ''}</p><div class="bc-hand" aria-label="Player hand">${P.map(ch).join('')}</div></div>
            <div class="bc-side${winner === 'B' ? ' win' : ''}"><p class="bc-lab">Banker${B.length ? ' ' + tot(B) : ''}</p><div class="bc-hand" aria-label="Banker hand">${B.map(ch).join('')}</div></div>
          </div>
          <p class="arc-fb">${fb}</p>
          <div class="bc-road" aria-label="Recent results">${road.map((x) => `<b class="bc-${x}" aria-label="${SIDE[x]}">${x}</b>`).join('')}</div>
          ${ctl}</div>`);
      };
      const finish = () => {
        const p = tot(P), b = tot(B); winner = p > b ? 'P' : b > p ? 'B' : 'T';
        let ret = 0, msg;
        if (side === winner) {
          if (winner === 'T') { ret = bet * 9; msg = `Tie at ${p}. Tie pays 8 to 1: +${bet * 8}.`; }
          else if (winner === 'P') { ret = bet * 2; msg = `Player wins ${p} to ${b}. +${bet}.`; }
          else { const w = Math.floor(bet * 0.95); ret = bet + w; msg = `Banker wins ${b} to ${p}. Pays ${w} after 5 percent commission.`; }
        } else if (winner === 'T' && side !== 'T') { ret = bet; msg = `Tie at ${p}. Player and Banker bets are returned.`; }
        else msg = `${winner === 'P' ? 'Player' : 'Banker'} wins ${winner === 'P' ? p + ' to ' + b : b + ' to ' + p}. You lose ${bet}.`;
        bank += ret; road = [...road, winner].slice(-18); fb = msg; phase = 'over';
        A.sfx(ret > bet ? 'good' : ret === bet ? 'tick' : 'bad'); draw();
        if (bank >= GOAL) A.end(true, `You reached ${bank} chips. You win!`);
        else if (bank < MIN) A.end(false, 'You cannot cover the minimum bet. The table wins.');
      };
      const run = () => {
        phase = 'deal'; P = []; B = []; winner = null; bank -= bet; rounds++; fb = 'Dealing...';
        const seq = [[P], [B], [P], [B]];
        let i = 0;
        const step = () => {
          if (i < 4) { seq[i][0].push(take()); i++; A.sfx('tick'); draw(); A.after(step, 450); return; }
          const p = tot(P), b = tot(B);
          if (p >= 8 || b >= 8) { fb = `Natural! Player ${p}, Banker ${b}. No more cards.`; draw(); return A.after(finish, 800); }
          let p3 = null;
          if (p <= 5) { P.push(take()); p3 = pts(P[2].r); fb = `Player has ${p} and draws a third card.`; } else fb = `Player has ${p} and stands.`;
          draw();
          A.after(() => {
            const bt = tot(B); let draws;
            if (p3 === null) draws = bt <= 5;
            else if (bt <= 2) draws = true;
            else if (bt === 3) draws = p3 !== 8;
            else if (bt === 4) draws = p3 >= 2 && p3 <= 7;
            else if (bt === 5) draws = p3 >= 4 && p3 <= 7;
            else if (bt === 6) draws = p3 === 6 || p3 === 7;
            else draws = false;
            if (draws) { B.push(take()); fb += ` Banker has ${bt} and draws.`; } else fb += ` Banker has ${bt} and stands.`;
            draw(); A.after(finish, 800);
          }, 800);
        };
        draw(); A.after(step, 400);
      };
      const act = (a, v) => {
        if (phase === 'bet') {
          if (a === 'side') { side = v; draw(); } else if (a === 'amt') { bet = Number(v); draw(); } else if (a === 'deal' && bet <= bank) run();
        } else if (phase === 'over' && a === 'next') { phase = 'bet'; P = []; B = []; winner = null; if (bet > bank) bet = BETS.filter((b) => b <= bank).pop() || MIN; fb = 'Place your bet.'; draw(); }
      };
      return {
        start() {
          bank = START; bet = 20; side = 'P'; shoe = mkShoe(); P = []; B = []; phase = 'bet'; road = []; rounds = 0; winner = null; fb = 'Choose a side and a bet.'; draw();
          A.key((e) => { const k = e.key.toLowerCase(); if (k === 'p' || k === 'b' || k === 't') act('side', k.toUpperCase()); else if (k === 'd' || k === 'enter') act(phase === 'over' ? 'next' : 'deal'); });
        },
        act,
      };
    },
  };
  void RANKS;
})();

/* --- basketball.js --- */
(() => {
  /* Basketball: set the angle and power, shoot, and score 10 points in 60 seconds. A clean swish is worth 2. */
  FULL['Basketball'] = {
    title: 'Basketball: the full game',
    intro: 'Set the angle and the power, then shoot. The hoop moves after every shot. A basket is 1 point and a clean swish (no rim or backboard) is 2. Score 10 points in 60 seconds. Keys: Up and Down change the angle, Left and Right change the power, Space shoots, P pauses.',
    make: (A) => {
      const CW = 400, CH = 260, FLOOR = 244, BR = 9, RIM = 20, G = 0.17, TIME = 60, TARGET = 10, BX = 42, BY = FLOOR - BR - 2;
      let S, cv, cx;
      const $ = (id) => document.getElementById(id);
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const newHoop = () => { S.hx = 235 + rnd(115); S.hy = 95 + rnd(60); };
      const hud = () => {
        $('bb-sc').textContent = S.score; $('bb-tm').textContent = Math.max(0, Math.ceil(S.time)); $('bb-sh').textContent = S.shots;
        $('bb-an').textContent = S.ang; $('bb-pw').textContent = S.pow; $('bb-ang').value = S.ang; $('bb-pow').value = S.pow;
        const l = $('bb-live'); if (l && S.msg !== null) { l.textContent = S.msg; S.msg = null; }
        const sb = $('bb-shoot'); if (sb) sb.disabled = S.state !== 'play' || !!S.ball || S.paused;
      };
      const vel = () => { const a = S.ang * Math.PI / 180, v = S.pow * 0.095; return [Math.cos(a) * v, -Math.sin(a) * v]; };
      const set = (k, d) => { if (k === 'ang') S.ang = clamp(S.ang + d, 15, 80); else S.pow = clamp(S.pow + d, 20, 100); hud(); draw(); };
      const begin = () => { if (S.state !== 'ready') return; S.state = 'play'; const g = $('bb-go'); if (g) g.hidden = true; S.msg = 'Take your shot.'; hud(); };
      const togglePause = () => { if (S.state !== 'play') return; S.paused = !S.paused; const p = $('bb-pause'); if (p) p.textContent = S.paused ? 'Resume' : 'Pause'; hud(); draw(); };
      const shoot = () => {
        if (S.state !== 'play' || S.ball || S.paused) return;
        const [vx, vy] = vel(); S.ball = { x: BX, y: BY, vx, vy, touched: false, scored: false }; S.shots++; S.msg = ''; hud();
      };
      const endShot = () => {
        const b = S.ball; S.ball = null;
        if (!b.scored) { S.msg = b.touched ? 'Rim out. Adjust and try again.' : (b.x < S.hx ? 'Too short.' : 'Too long.'); }
        newHoop(); hud();
      };
      const finish = (won) => { S.state = 'over'; hud(); draw(); A.end(won, won ? `Final score ${S.score}. You made the target. You win!` : `Time is up. You scored ${S.score} of ${TARGET} points.`); };
      const stepBall = () => {
        const b = S.ball, py = b.y; b.vy += G; b.x += b.vx; b.y += b.vy;
        const bx = S.hx + RIM / 2 + 6;
        if (b.vx > 0 && b.x + BR > bx && b.y > S.hy - 48 && b.y < S.hy + 6 && b.x < bx + 8) { b.x = bx - BR; b.vx = -Math.abs(b.vx) * 0.55; b.touched = true; }
        [[S.hx - RIM / 2, S.hy], [S.hx + RIM / 2, S.hy]].forEach(([rx, ry]) => {
          const dx = b.x - rx, dy = b.y - ry, d = Math.hypot(dx, dy);
          if (d < BR + 3 && d > 0) {
            const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
            if (dot < 0) { b.vx = (b.vx - 1.6 * dot * nx) * 0.8; b.vy = (b.vy - 1.6 * dot * ny) * 0.8; }
            b.x = rx + nx * (BR + 3.2); b.y = ry + ny * (BR + 3.2); b.touched = true;
          }
        });
        if (!b.scored && py < S.hy && b.y >= S.hy && b.vy > 0 && Math.abs(b.x - S.hx) < RIM / 2 - 3) {
          b.scored = true; const pts = b.touched ? 1 : 2; S.score += pts; A.sfx('good'); S.msg = pts === 2 ? 'Swish! +2' : 'Basket! +1';
          if (S.score >= TARGET) { endShotQuiet(); finish(true); return; }
        }
        if (b.y + BR >= FLOOR && b.vy > 0) { b.y = FLOOR - BR; endShot(); return; }
        if (b.x > CW + 30 || b.x < -30) endShot();
      };
      const endShotQuiet = () => { S.ball = null; };
      const draw = () => {
        cx.fillStyle = '#16314a'; cx.fillRect(0, 0, CW, CH); cx.fillStyle = '#c98a45'; cx.fillRect(0, FLOOR, CW, CH - FLOOR);
        cx.fillStyle = 'rgba(0,0,0,0.25)'; cx.fillRect(0, FLOOR, CW, 3);
        const hx = S.hx, hy = S.hy;
        cx.fillStyle = '#5a6b78'; cx.fillRect(hx + RIM / 2 + 12, hy - 48, 5, FLOOR - hy + 48);
        cx.fillStyle = '#f4f2ea'; cx.fillRect(hx + RIM / 2 + 6, hy - 48, 7, 54);
        cx.strokeStyle = 'rgba(244,242,234,0.7)'; cx.lineWidth = 1; for (let k = -2; k <= 2; k++) { cx.beginPath(); cx.moveTo(hx + k * 4.5, hy + 1); cx.lineTo(hx + k * 3, hy + 20); cx.stroke(); }
        cx.strokeStyle = '#ff6b5e'; cx.lineWidth = 4; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(hx - RIM / 2, hy); cx.lineTo(hx + RIM / 2, hy); cx.stroke();
        if (!S.ball && S.state !== 'over') {
          const [vx, vy0] = vel(); let x = BX, y = BY, vy = vy0; cx.fillStyle = 'rgba(246,220,143,0.7)';
          for (let i = 0; i < 26; i++) { x += vx; y += vy; vy += G; if (i % 2 === 1) { cx.beginPath(); cx.arc(x, y, 2.2, 0, 7); cx.fill(); } }
        }
        const b = S.ball, bx = b ? b.x : BX, by = b ? b.y : BY;
        cx.fillStyle = '#f08a3c'; cx.beginPath(); cx.arc(bx, by, BR, 0, 7); cx.fill();
        cx.strokeStyle = '#6b3510'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(bx, by, BR, 0, 7); cx.moveTo(bx - BR, by); cx.lineTo(bx + BR, by); cx.moveTo(bx, by - BR); cx.lineTo(bx, by + BR); cx.stroke();
        const msg = S.state === 'ready' ? 'Tap Start' : S.paused ? 'Paused' : '';
        if (msg) { cx.fillStyle = 'rgba(0,0,0,0.6)'; cx.fillRect(0, CH / 2 - 24, CW, 44); cx.fillStyle = '#f6dc8f'; cx.font = '700 18px ui-monospace, monospace'; cx.textAlign = 'center'; cx.fillText(msg, CW / 2, CH / 2 + 6); }
      };
      return {
        start() {
          S = { state: 'ready', paused: false, score: 0, shots: 0, time: TIME, ang: 50, pow: 60, ball: null, msg: '' };
          if (window.__fullDebug) window.__fullDebug.bb = S;
          newHoop();
          const row = (k, lab, mn, mx) => `<div class="arc-opts" style="align-items:center;width:100%"><span class="chip" style="min-width:6.5rem">${lab} <b id="bb-${k === 'ang' ? 'an' : 'pw'}"></b></span>${abtn('adj', k + ':-5', '-5', 'small').replace('<button', `<button aria-label="${lab} down"`)}<input type="range" id="bb-${k}" min="${mn}" max="${mx}" step="1" aria-label="${lab}" style="flex:1 1 7rem;min-width:6rem;max-width:14rem">${abtn('adj', k + ':5', '+5', 'small').replace('<button', `<button aria-label="${lab} up"`)}</div>`;
          A.draw(`<div class="arc-scene" style="width:100%"><div class="arc-top"><span class="chip">Score <b id="bb-sc">0</b> / ${TARGET}</span><span class="chip">Time <b id="bb-tm">${TIME}</b></span><span class="chip">Shots <b id="bb-sh">0</b></span></div>
            <canvas id="bb-cv" width="${CW}" height="${CH}" role="img" aria-label="Basketball court" style="width:min(100%,${CW}px);height:auto;border-radius:10px;border:2px solid var(--line);display:block"></canvas>
            ${row('ang', 'Angle', 15, 80)}${row('pow', 'Power', 20, 100)}
            <div class="arc-opts">${abtn('go', '', 'Start', 'primary').replace('<button', '<button id="bb-go"')}${abtn('shoot', '', 'Shoot', 'primary', true).replace('<button', '<button id="bb-shoot"')}${abtn('pause', '', 'Pause').replace('<button', '<button id="bb-pause"')}</div>
            <p class="arc-fb" id="bb-live" aria-live="polite"></p></div>`);
          cv = $('bb-cv'); cx = cv.getContext('2d');
          $('bb-ang').addEventListener('input', (e) => { S.ang = Number(e.target.value); hud(); draw(); });
          $('bb-pow').addEventListener('input', (e) => { S.pow = Number(e.target.value); hud(); draw(); });
          A.key((e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); set('ang', 1); } else if (e.key === 'ArrowDown') { e.preventDefault(); set('ang', -1); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); set('pow', 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); set('pow', -1); }
            else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (S.state === 'ready') begin(); else shoot(); }
            else if (e.key === 'p' || e.key === 'P') togglePause();
          });
          let last = performance.now(), sec = Math.ceil(TIME);
          A.timer(() => {
            const n = performance.now(), dt = Math.min(80, n - last); last = n;
            if (S.state !== 'play' || S.paused) return;
            S.time -= dt / 1000;
            if (S.ball) { stepBall(); if (S.state === 'over') return; if (S.ball) stepBall(); }
            if (S.time <= 0) { S.time = 0; S.ball = null; finish(S.score >= TARGET); return; }
            draw(); if (Math.ceil(S.time) !== sec || S.msg !== null) { sec = Math.ceil(S.time); hud(); }
          }, 16);
          hud(); draw();
        },
        act(a, v) {
          try { document.activeElement.blur(); } catch (_) { /* ignore */ }
          if (a === 'go') begin(); else if (a === 'pause') togglePause(); else if (a === 'shoot') shoot();
          else if (a === 'adj') { const [k, d] = v.split(':'); set(k, Number(d)); }
        },
      };
    },
  };
})();

/* --- battleship.js --- */
(() => {
  /* Battleship: 10x10 sea, five ships. Place your fleet, then trade shots with a hunt-and-target bot. Sink all five enemy ships first. */
  const N = 10;
  const FLEET = [['Carrier', 5], ['Battleship', 4], ['Cruiser', 3], ['Submarine', 3], ['Destroyer', 2]];
  const LET = 'ABCDEFGHIJ';
  const nm = (k) => `${LET[Math.floor(k / N)]}${(k % N) + 1}`;
  const cellsOf = (start, len, vert) => {
    const out = [], r = Math.floor(start / N), c = start % N;
    for (let i = 0; i < len; i++) { const rr = r + (vert ? i : 0), cc = c + (vert ? 0 : i); if (rr >= N || cc >= N) return null; out.push(rr * N + cc); }
    return out;
  };
  // random legal fleet: array of {name,len,cells}
  const randomFleet = () => {
    for (;;) {
      const used = new Set(), ships = []; let ok = true;
      for (const [name, len] of FLEET) {
        let placed = false;
        for (let t = 0; t < 200 && !placed; t++) {
          const cs = cellsOf(rnd(N * N), len, Math.random() < 0.5);
          if (cs && !cs.some((c) => used.has(c))) { cs.forEach((c) => used.add(c)); ships.push({ name, len, cells: cs }); placed = true; }
        }
        if (!placed) { ok = false; break; }
      }
      if (ok) return ships;
    }
  };
  const shipAt = (fleet, k) => fleet.find((s) => s && s.cells.includes(k));
  const sunk = (s, shots) => s.cells.every((c) => shots[c] === 2);

  // Bot: probability density over every placement of the ships still afloat. Placements covering an unsunk hit are weighted heavily (target mode).
  const botChoose = (shots, afloat, sunkCells) => {
    const w = new Array(N * N).fill(0);
    const hits = []; for (let k = 0; k < N * N; k++) if (shots[k] === 2 && !sunkCells.has(k)) hits.push(k);
    for (const len of afloat) for (const vert of [false, true]) for (let s = 0; s < N * N; s++) {
      const cs = cellsOf(s, len, vert); if (!cs) continue;
      if (cs.some((c) => shots[c] === 1 || sunkCells.has(c))) continue;
      const cover = cs.filter((c) => shots[c] === 2).length;
      const weight = cover ? Math.pow(30, cover) : 1;
      cs.forEach((c) => { if (!shots[c]) w[c] += weight; });
    }
    // parity bonus when hunting: skip cells that cannot hold the smallest ship efficiently
    let best = -1, picks = [];
    for (let k = 0; k < N * N; k++) {
      if (shots[k]) continue;
      let v = w[k]; if (!hits.length && (Math.floor(k / N) + (k % N)) % 2 === 0) v *= 1.25;
      if (v > best + 1e-9) { best = v; picks = [k]; } else if (Math.abs(v - best) <= 1e-9) picks.push(k);
    }
    return picks.length ? pickOne(picks) : shots.findIndex((x) => !x);
  };

  FULL['Battleship'] = {
    title: 'Battleship: the full game',
    intro: 'Place your fleet of five ships on the 10 by 10 sea, then take turns firing at hidden squares. The bot hunts, and once it hits it hunts around the hit. Sink all five enemy ships before it sinks yours.',
    make: (A) => {
      let fbYou = '', fbBot = '', phase, mine, enemy, selected, vert, myShots, botShots, turn, fb, botSunk;
      const css = `<style>.bsf-wrap{display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;width:100%}.bsf-box{display:grid;gap:.3rem;justify-items:center;min-width:0;flex:1 1 15rem;max-width:22rem}
        .bsf-box h3{margin:0;font:600 .75rem var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--brass-hi)}
        .bsf-grid{display:grid;grid-template-columns:1.1rem repeat(10,minmax(0,1fr));gap:2px;width:100%}
        .bsf-grid .h{font:600 .55rem var(--mono);color:#a9c9b8;display:grid;place-items:center}
        .bsf-c{position:relative;aspect-ratio:1;border-radius:4px;background:rgba(10,60,90,.55);border:1px solid rgba(127,200,232,.35);padding:0;font:700 .8rem var(--mono);color:var(--ivory);min-width:0;display:grid;place-items:center;cursor:default}
        button.bsf-c:not(:disabled){cursor:pointer}button.bsf-c:hover:not(:disabled){outline:2px solid var(--brass-hi)}
        .bsf-c.ship{background:#586a77;border-color:#9bb0be}.bsf-c.miss{background:rgba(127,200,232,.25)}.bsf-c.miss::after{content:"\\2022";color:var(--sky);font-size:1rem}
        .bsf-c.hit{background:#8c2b2b;border-color:#ff8a8a}.bsf-c.hit::after{content:"\\2715";color:#ffd0d0}.bsf-c.sunk{background:#4a1616}
        .bsf-c.lastshot{box-shadow:0 0 0 2px var(--brass-hi)}
        .bsf-fleet{display:flex;flex-wrap:wrap;gap:.35rem;justify-content:center}.bsf-fleet .btn.sel{outline:2px solid var(--brass-hi)}.bsf-fleet .btn.done{opacity:.6}
        .bsf-stat{font:600 .7rem var(--mono);color:#a9c9b8;text-align:center}</style>`;
      const grid = (kind) => {
        let s = '<span class="h"></span>' + Array.from({ length: N }, (_, c) => `<span class="h">${c + 1}</span>`).join('');
        for (let r = 0; r < N; r++) {
          s += `<span class="h">${LET[r]}</span>`;
          for (let c = 0; c < N; c++) {
            const k = r * N + c; let cls = 'bsf-c', dis = true, lab = '', act = '';
            if (kind === 'place') {
              const sh = shipAt(mine, k); if (sh) cls += ' ship'; dis = A.over;
              act = 'cell'; lab = `Place ${sh ? 'or pick up ship at ' : 'at '}${nm(k)}`;
            } else if (kind === 'mine') {
              const sh = shipAt(mine, k); if (sh) cls += ' ship'; const v = botShots[k];
              if (v === 1) cls += ' miss'; if (v === 2) cls += ' hit' + (sunk(sh, botShots) ? ' sunk' : '');
              lab = `Your sea ${nm(k)}${sh ? ' ship' : ''}${v === 1 ? ' enemy missed' : v === 2 ? ' hit' : ''}`;
            } else {
              const v = myShots[k]; const sh = shipAt(enemy, k);
              if (v === 1) cls += ' miss'; if (v === 2) cls += ' hit' + (sunk(sh, myShots) ? ' sunk' : '');
              if (A.over && sh && !v) cls += ' ship';
              dis = turn !== 'you' || !!v || A.over; act = 'fire'; lab = `Fire at ${nm(k)}${v === 1 ? ', miss' : v === 2 ? ', hit' : ''}`;
            }
            s += `<button type="button" class="${cls}" ${act ? `data-act="${act}" data-v="${k}"` : ''} aria-label="${lab}"${dis ? ' disabled' : ''}></button>`;
          }
        }
        return `<div class="bsf-grid" role="group" aria-label="${kind === 'enemy' ? 'Enemy sea' : 'Your sea'}">${s}</div>`;
      };
      const remaining = (fleet, shots) => fleet.filter((s) => !sunk(s, shots)).length;
      const draw = () => {
        if (phase === 'place') {
          const placedNames = new Set(mine.map((s) => s.name));
          const fleetBtns = FLEET.map(([n, l], i) => abtn('pick', i, `${n} (${l})${placedNames.has(n) ? ' placed' : ''}`, `small${selected === i ? ' sel' : ''}${placedNames.has(n) ? ' done' : ''}`, A.over)).join('');
          A.draw(`${css}<div class="arc-scene" style="width:100%"><p class="arc-ask">Place your fleet</p>
            <div class="bsf-box" style="max-width:24rem">${grid('place')}</div>
            <div class="bsf-fleet">${fleetBtns}</div>
            <div class="arc-opts">${abtn('rotate', '', `Direction: ${vert ? 'down' : 'across'}`, '')}${abtn('random', '', 'Random fleet', '')}${abtn('clear', '', 'Clear', '')}${abtn('begin', '', 'Start battle', 'primary', mine.length < FLEET.length)}</div>
            <p class="arc-fb">${fb}</p></div>`);
          return;
        }
        const you = remaining(enemy, myShots), me = remaining(mine, botShots);
        const left = (fleet, shots) => fleet.map((s) => `<span style="${sunk(s, shots) ? 'text-decoration:line-through;opacity:.55' : ''}">${s.name}</span>`).join(', ');
        A.draw(`${css}<div class="arc-top"><span class="chip">Enemy ships <b>${you}</b></span><span class="chip">Your ships <b>${me}</b></span></div>
          <div class="bsf-wrap"><div class="bsf-box"><h3>Enemy sea (fire here)</h3>${grid('enemy')}<div class="bsf-stat">${left(enemy, myShots)}</div></div>
          <div class="bsf-box"><h3>Your sea</h3>${grid('mine')}<div class="bsf-stat">${left(mine, botShots)}</div></div></div>
          <p class="arc-ask">${turn === 'you' ? 'Your turn. Tap a square on the enemy sea.' : turn === 'bot' ? 'The bot is aiming...' : ''}</p><p class="arc-fb" aria-live="polite">${fbYou}<br>${fbBot}</p>`);
      };
      const botTurn = () => {
        turn = 'bot'; draw();
        A.after(() => {
          const afloat = mine.filter((s) => !sunk(s, botShots)).map((s) => s.len);
          const k = botChoose(botShots, afloat, botSunk);
          const sh = shipAt(mine, k); botShots[k] = sh ? 2 : 1;
          let t = `Bot fired at ${nm(k)}: `;
          if (!sh) t += 'miss.';
          else if (sunk(sh, botShots)) { sh.cells.forEach((c) => botSunk.add(c)); t += `<b class="bad">it sank your ${sh.name}!</b>`; A.sfx('bad'); } else t += '<b class="bad">hit.</b>';
          fbBot = t;
          if (remaining(mine, botShots) === 0) { turn = 'done'; draw(); A.end(false, 'The bot sank your whole fleet. Try again.'); return; }
          turn = 'you'; draw();
        }, 700);
      };
      return {
        start() {
          phase = 'place'; fbYou = ''; fbBot = ''; mine = []; selected = 0; vert = false; myShots = new Array(N * N).fill(0); botShots = new Array(N * N).fill(0); enemy = randomFleet(); turn = 'you'; botSunk = new Set();
          fb = 'Pick a ship, then click a square for its start. Or press Random fleet.'; draw();
        },
        act(a, v) {
          if (phase === 'place') {
            if (a === 'pick') { selected = Number(v); const n = FLEET[selected][0]; mine = mine.filter((s) => s.name !== n); fb = `Placing the ${n}.`; draw(); }
            else if (a === 'rotate') { vert = !vert; draw(); }
            else if (a === 'clear') { mine = []; selected = 0; fb = 'Fleet cleared.'; draw(); }
            else if (a === 'random') { mine = randomFleet(); selected = null; fb = 'Random fleet placed. You can still pick ships up by clicking them.'; A.sfx('tick'); draw(); }
            else if (a === 'cell') {
              const k = Number(v), hit = shipAt(mine, k);
              if (hit) { mine = mine.filter((s) => s !== hit); selected = FLEET.findIndex(([n]) => n === hit.name); fb = `Picked up the ${hit.name}. Click a square to place it again.`; draw(); return; }
              if (selected === null) { fb = 'Pick a ship from the list first.'; draw(); return; }
              const [name, len] = FLEET[selected]; const used = new Set(); mine.forEach((s) => s.cells.forEach((c) => used.add(c)));
              let cs = cellsOf(k, len, vert);
              if (!cs) { // slide back so it fits
                const r = Math.floor(k / N), c = k % N; const nr = vert ? Math.min(r, N - len) : r, nc = vert ? c : Math.min(c, N - len); cs = cellsOf(nr * N + nc, len, vert);
              }
              if (!cs || cs.some((c) => used.has(c))) { fb = `The ${name} does not fit there. Try another square or turn it.`; A.sfx('bad'); draw(); return; }
              mine = mine.filter((s) => s.name !== name); mine.push({ name, len, cells: cs }); A.sfx('tick');
              const nxt = FLEET.findIndex(([n]) => !mine.some((s) => s.name === n)); selected = nxt >= 0 ? nxt : null;
              fb = nxt >= 0 ? `${name} placed. Now the ${FLEET[nxt][0]}.` : 'Fleet ready. Press Start battle.'; draw();
            } else if (a === 'begin' && mine.length === FLEET.length) { phase = 'play'; turn = 'you'; fbYou = 'Battle begins. You fire first.'; fbBot = ''; A.sfx('good'); draw(); }
            return;
          }
          if (a === 'fire' && turn === 'you') {
            const k = Number(v); if (myShots[k]) return;
            const sh = shipAt(enemy, k); myShots[k] = sh ? 2 : 1;
            let t = `You fired at ${nm(k)}: `;
            if (!sh) t += 'miss.'; else if (sunk(sh, myShots)) { t += `<b class="good">you sank the ${sh.name}!</b>`; A.sfx('clear'); } else { t += '<b class="good">hit!</b>'; A.sfx('good'); }
            fbYou = t; fbBot = '';
            if (remaining(enemy, myShots) === 0) { turn = 'done'; draw(); A.end(true, 'You sank the whole enemy fleet. Victory!'); return; }
            botTurn();
          }
        },
        _lib: { botChoose, randomFleet, cellsOf },
      };
    },
  };
})();

