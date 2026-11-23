/* --- tennis.js --- */
(() => {
  /* Tennis: points love/15/30/40, deuce, advantage, games and a set (first to 6 games, two ahead, 7-5 or 7-6 stops it). Each point you choose a shot; the bot chooses too. */
  const NAMES = ['love', '15', '30', '40'];
  const SHOTS = [['power', 'Power'], ['angle', 'Angle'], ['lob', 'Lob']];
  const BEATS = { power: 'lob', angle: 'power', lob: 'angle' };
  FULL['Tennis'] = {
    title: 'Tennis: the full set',
    intro: 'Win a set. Each point, pick a shot. Power beats Lob, Lob beats Angle, Angle beats Power. If you both pick the same shot, it is a coin flip. First to 6 games, two ahead, wins the set.',
    make: (A) => {
      let pts, games, server, fb, hist, busy;
      const label = () => {
        const [a, b] = pts;
        if (a >= 3 && b >= 3) return a === b ? 'Deuce' : (a > b ? 'Advantage you' : 'Advantage bot');
        return NAMES[Math.min(a, 3)] + ' - ' + NAMES[Math.min(b, 3)];
      };
      const gameWinner = () => { const [a, b] = pts; if (a >= 4 && a - b >= 2) return 0; if (b >= 4 && b - a >= 2) return 1; return -1; };
      const setWinner = () => { const [a, b] = games; if ((a >= 6 && a - b >= 2) || a === 7) return 0; if ((b >= 6 && b - a >= 2) || b === 7) return 1; return -1; };
      const draw = () => A.draw(`<div class="arc-scene"><div class="arc-top"><span>Games: you <b>${games[0]}</b> - bot <b>${games[1]}</b></span><span>${server === 0 ? 'You serve' : 'Bot serves'}</span></div>
        <div class="arc-big-text" aria-live="polite">${label()}</div>
        <p class="arc-ask">Pick your shot.</p><div class="arc-opts">${SHOTS.map(([k, n]) => abtn('shot', k, n, '', busy)).join('')}</div>
        <p class="arc-fb">${fb}</p><p class="muted">${hist.slice(-4).join(' · ')}</p></div>`);
      const point = (mine) => {
        busy = true; const theirs = SHOTS[rnd(3)][0];
        let youWin = Math.random() < 0.5; let how;
        if (mine === theirs) how = 'Same shot, coin flip.'; else if (BEATS[mine] === theirs) { youWin = true; how = `${mine} beats ${theirs}.`; } else { youWin = false; how = `${theirs} beats ${mine}.`; }
        if (server === 0 && mine !== theirs && Math.random() < 0.1) youWin = true;
        pts[youWin ? 0 : 1]++; fb = `Bot played ${theirs}. ${how} ${youWin ? 'You win the point.' : 'Bot wins the point.'}`; A.sfx(youWin ? 'good' : 'bad');
        const gw = gameWinner();
        if (gw >= 0) { games[gw]++; hist.push(`Game ${gw === 0 ? 'you' : 'bot'} (${games[0]}-${games[1]})`); pts = [0, 0]; server = 1 - server; fb += gw === 0 ? ' You won the game!' : ' Bot won the game.'; }
        const sw = setWinner();
        if (sw >= 0) { busy = false; draw(); return A.end(sw === 0, sw === 0 ? `You won the set ${games[0]}-${games[1]}!` : `Bot won the set ${games[1]}-${games[0]}.`); }
        busy = false; draw();
      };
      return { start() { pts = [0, 0]; games = [0, 0]; server = 0; fb = ''; hist = []; busy = false; draw(); }, act(a, v) { if (a === 'shot' && !busy) point(v); } };
    },
  };
})();

/* --- tetris.js --- */
(() => {
  /* Tetris: seven tetrominoes, rotation with wall kicks, 7-bag, ghost piece, levels, next preview, hard drop. Clear 20 lines to win. */
  FULL['Tetris'] = {
    title: 'Tetris: the full game',
    intro: 'Stack the falling pieces and fill whole rows to clear them. Clear 20 lines to win. If the stack reaches the top, you lose. Pieces fall faster every 4 lines. Arrow keys or WASD move and rotate (Up or X turns right, Z turns left), Down drops softly, Space drops hard, P pauses. On a phone use the buttons.',
    make: (A) => {
      const COLS = 10, ROWS = 20, C = 24, SW = 104, W = COLS * C + SW, H = ROWS * C, WIN = 20;
      const DBG = window.__fullDebug || {};
      let S, cv, cx, last;
      const $ = (id) => document.getElementById(id);
      const SH = {
        I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[0, 0], [1, 0], [0, 1], [1, 1]], T: [[1, 0], [0, 1], [1, 1], [2, 1]],
        S: [[1, 0], [2, 0], [0, 1], [1, 1]], Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]], L: [[2, 0], [0, 1], [1, 1], [2, 1]],
      };
      const SZ = { I: 4, O: 2, T: 3, S: 3, Z: 3, J: 3, L: 3 };
      const COL = { I: '#7fc8e8', O: '#f6dc8f', T: '#b58cf0', S: '#6fd08c', Z: '#ff6b5e', J: '#5b8def', L: '#f0a050' };
      const KEYS_ALL = 'IOTSZJL'.split('');
      const bagNext = () => {
        if (!S.bag.length) { const b = KEYS_ALL.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } S.bag = b; }
        return S.bag.pop();
      };
      const level = () => Math.floor(S.lines / 4) + 1;
      const gravMs = () => Math.max(90, 800 - (level() - 1) * 120);
      const fits = (cells, x, y) => cells.every(([a, b]) => { const px = x + a, py = y + b; if (px < 0 || px >= COLS || py >= ROWS) return false; return py < 0 || !S.board[py][px]; });
      const mk = (k) => ({ k, cells: SH[k].map((c) => c.slice()), n: SZ[k], x: Math.floor((COLS - SZ[k]) / 2), y: k === 'I' ? -1 : 0 });
      const say = (t) => { const e = $('tt-live'); if (e) e.textContent = t; };
      const spawn = () => {
        S.cur = mk(S.next); S.next = bagNext(); S.lockT = 0; S.resets = 0; S.acc = 0;
        if (!fits(S.cur.cells, S.cur.x, S.cur.y)) { S.over = true; render(); A.end(false, `Top out. You cleared ${S.lines} lines and scored ${S.score}. Try again.`); }
      };
      const grounded = () => !fits(S.cur.cells, S.cur.x, S.cur.y + 1);
      const touched = () => { if (grounded() && S.resets < 12) { S.lockT = 0; S.resets++; } };
      const move = (dx) => {
        if (!S.cur || !fits(S.cur.cells, S.cur.x + dx, S.cur.y)) return false;
        S.cur.x += dx; touched(); return true;
      };
      const rotate = (dir) => {
        const p = S.cur; if (!p || p.k === 'O') return;
        const n = p.n, cells = p.cells.map(([x, y]) => (dir > 0 ? [n - 1 - y, x] : [y, n - 1 - x]));
        for (const [kx, ky] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]]) {
          if (fits(cells, p.x + kx, p.y + ky)) { p.cells = cells; p.x += kx; p.y += ky; touched(); return; }
        }
      };
      const softStep = () => {
        if (!S.cur) return;
        if (fits(S.cur.cells, S.cur.x, S.cur.y + 1)) { S.cur.y++; S.score += 1; S.acc = 0; } else lock();
      };
      const hardDrop = () => {
        if (!S.cur) return;
        let d = 0; while (fits(S.cur.cells, S.cur.x, S.cur.y + 1)) { S.cur.y++; d++; }
        S.score += d * 2; lock();
      };
      const lock = () => {
        const p = S.cur;
        p.cells.forEach(([a, b]) => { const px = p.x + a, py = p.y + b; if (py >= 0) S.board[py][px] = p.k; });
        S.cur = null;
        let n = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (S.board[r].every(Boolean)) { S.board.splice(r, 1); S.board.unshift(Array(COLS).fill(0)); n++; r++; }
        }
        if (n) {
          S.score += [0, 100, 300, 500, 800][n] * level(); S.lines += n; A.sfx('clear');
          say(n === 4 ? 'Tetris! Four lines at once.' : `${n} line${n > 1 ? 's' : ''} cleared. ${S.lines} of ${WIN}.`);
          if (S.lines >= WIN) { S.over = true; render(); A.end(true, `${S.lines} lines cleared with a score of ${S.score}. You win!`); return; }
        } else A.sfx('tick');
        spawn();
      };
      const begin = () => { if (S.state !== 'ready') return; S.state = 'play'; const g = $('tt-go'); if (g) g.hidden = true; };
      const togglePause = () => { if (S.state === 'ready' || S.over) return; S.paused = !S.paused; const p = $('tt-pause'); if (p) p.textContent = S.paused ? 'Resume' : 'Pause'; };
      const cell = (x, y, color, alpha) => {
        cx.globalAlpha = alpha || 1; cx.fillStyle = color; cx.fillRect(x * C + 1, y * C + 1, C - 2, C - 2);
        cx.fillStyle = 'rgba(255,255,255,0.28)'; cx.fillRect(x * C + 1, y * C + 1, C - 2, 4); cx.globalAlpha = 1;
      };
      const render = () => {
        cx.fillStyle = '#06160f'; cx.fillRect(0, 0, W, H);
        cx.strokeStyle = 'rgba(244,242,234,0.06)'; cx.lineWidth = 1; cx.beginPath();
        for (let x = 0; x <= COLS; x++) { cx.moveTo(x * C + 0.5, 0); cx.lineTo(x * C + 0.5, H); }
        for (let y = 0; y <= ROWS; y++) { cx.moveTo(0, y * C + 0.5); cx.lineTo(COLS * C, y * C + 0.5); }
        cx.stroke();
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (S.board[y][x]) cell(x, y, COL[S.board[y][x]]);
        const p = S.cur;
        if (p) {
          let gy = p.y; while (fits(p.cells, p.x, gy + 1)) gy++;
          p.cells.forEach(([a, b]) => { if (gy + b >= 0) cell(p.x + a, gy + b, COL[p.k], 0.22); });
          p.cells.forEach(([a, b]) => { if (p.y + b >= 0) cell(p.x + a, p.y + b, COL[p.k]); });
        }
        cx.strokeStyle = '#2f5a49'; cx.lineWidth = 2; cx.strokeRect(1, 1, COLS * C - 2, H - 2);
        const px = COLS * C + 14; cx.textAlign = 'left'; cx.fillStyle = 'rgba(244,242,234,0.6)'; cx.font = '600 12px ui-monospace, monospace';
        cx.fillText('NEXT', px, 22);
        const nk = S.next, nc = SH[nk]; cx.fillStyle = COL[nk];
        const ox = px + (4 - SZ[nk]) * 8 + (nk === 'O' ? 0 : 0), oy = 34 + (nk === 'I' ? -4 : 4);
        nc.forEach(([a, b]) => { cx.fillRect(ox + a * 16, oy + b * 16, 15, 15); });
        cx.fillStyle = 'rgba(244,242,234,0.6)';
        cx.fillText('SCORE', px, 130); cx.fillText('LINES', px, 190); cx.fillText('LEVEL', px, 250);
        cx.fillStyle = '#f6dc8f'; cx.font = '700 20px ui-monospace, monospace';
        cx.fillText(String(S.score), px, 154); cx.fillText(`${S.lines}/${WIN}`, px, 214); cx.fillText(String(level()), px, 274);
        const msg = S.state === 'ready' ? 'Tap Start or press a key' : S.paused ? 'Paused' : '';
        if (msg) { cx.fillStyle = 'rgba(0,0,0,0.65)'; cx.fillRect(0, H / 2 - 28, COLS * C, 50); cx.fillStyle = '#f6dc8f'; cx.font = '700 15px ui-monospace, monospace'; cx.textAlign = 'center'; cx.fillText(msg, COLS * C / 2, H / 2 + 5); }
      };
      const update = (dt) => {
        if (!S.cur) return;
        const h = S.hold;
        if (h.dir) {
          h.t += dt; const first = h.first ? 0.17 : (h.dir === 'down' ? 0.04 : 0.055);
          if (h.t >= first) { h.t = 0; h.first = false; if (h.dir === 'down') softStep(); else move(h.dir === 'left' ? -1 : 1); }
          if (!S.cur) return;
        }
        if (grounded()) {
          S.lockT += dt; if (S.lockT >= 0.4) lock();
        } else {
          S.acc += dt * 1000;
          const g = gravMs();
          while (S.cur && S.acc >= g) { S.acc -= g; if (fits(S.cur.cells, S.cur.x, S.cur.y + 1)) S.cur.y++; else break; }
        }
      };
      const key = (e) => {
        const k = e.key;
        const map = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', x: 'u', X: 'u', z: 'z', Z: 'z', ArrowDown: 'd', s: 'd', S: 'd' };
        const m = map[k];
        if (m || k === ' ') e.preventDefault();
        if (k === 'p' || k === 'P') { togglePause(); return; }
        if (S.paused || S.over) return;
        if (S.state === 'ready') { begin(); if (m || k === ' ') return; return; }
        if (m === 'l') move(-1); else if (m === 'r') move(1); else if (m === 'u') rotate(1); else if (m === 'z') rotate(-1);
        else if (m === 'd') softStep(); else if (k === ' ') hardDrop();
      };
      return {
        start() {
          S = { state: 'ready', paused: false, over: false, board: Array.from({ length: ROWS }, () => Array(COLS).fill(0)), bag: [], cur: null, next: null, score: 0, lines: 0, acc: 0, lockT: 0, resets: 0, hold: { dir: null, t: 0, first: true } };
          if (DBG) DBG.state = S;
          S.next = bagNext(); spawn();
          const hb = (d, t) => `<button type="button" class="btn big" data-hold="${d}" aria-label="Move ${d}" style="touch-action:none;user-select:none;-webkit-user-select:none;min-width:4.6rem">${t}</button>`;
          A.draw(`<div class="arc-scene" style="width:100%"><canvas id="tt-cv" width="${W}" height="${H}" role="img" aria-label="Tetris board" style="width:min(100%,${W}px);height:auto;border-radius:10px;border:2px solid var(--line);display:block;touch-action:none"></canvas>
            <div class="arc-opts">${hb('left', 'Left')}${hb('right', 'Right')}${abtn('rot', 'cw', 'Rotate', 'big')}</div>
            <div class="arc-opts">${hb('down', 'Down')}${abtn('drop', '', 'Hard drop', 'big')}</div>
            <div class="arc-opts">${abtn('go', '', 'Start', 'primary')}${abtn('pause', '', 'Pause')}</div>
            <p class="arc-fb" id="tt-live" aria-live="polite">Clear ${WIN} lines to win.</p></div>`);
          cv = $('tt-cv'); cx = cv.getContext('2d');
          cv.addEventListener('pointerdown', () => { if (S.state === 'ready') begin(); });
          document.querySelectorAll('[data-hold]').forEach((b) => {
            const off = () => { if (S.hold.dir === b.dataset.hold) S.hold.dir = null; };
            b.addEventListener('pointerdown', (e) => {
              e.preventDefault(); if (S.state === 'ready') { begin(); return; } if (S.paused || S.over) return;
              const d = b.dataset.hold; S.hold = { dir: d, t: 0, first: true };
              if (d === 'down') softStep(); else move(d === 'left' ? -1 : 1);
            });
            ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => b.addEventListener(n, off));
            b.addEventListener('contextmenu', (e) => e.preventDefault());
            b.addEventListener('click', (e) => e.preventDefault());
          });
          A.key(key);
          last = performance.now();
          A.timer(() => {
            const n = performance.now(); const dt = Math.min(0.1, (n - last) / 1000); last = n;
            if (S.state === 'play' && !S.paused && !S.over) update(dt);
            render();
          }, 16);
          render();
        },
        act(a) {
          try { document.activeElement.blur(); } catch (_) { /* ignore */ }
          if (a === 'go') begin(); else if (a === 'pause') togglePause();
          else if (a === 'rot') { if (S.state === 'play' && !S.paused && !S.over) rotate(1); else if (S.state === 'ready') begin(); }
          else if (a === 'drop') { if (S.state === 'play' && !S.paused && !S.over) hardDrop(); else if (S.state === 'ready') begin(); }
        },
      };
    },
  };
})();

/* --- tictactoe.js --- */
(() => {
  /* Tic Tac Toe: 3x3 against a bot. Easy bot blunders sometimes. Hard bot plays perfectly (full minimax), so the best you can do on Hard is a draw. */
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const winnerOf = (b) => { for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return b[l[0]]; return null; };
  const freeOf = (b) => b.map((x, k) => (x ? -1 : k)).filter((k) => k >= 0);
  // minimax score from O's (bot) point of view: positive is good for the bot. Shorter wins and longer losses are preferred.
  const minimax = (b, turn, depth) => {
    const w = winnerOf(b);
    if (w) return w === 'O' ? 10 - depth : depth - 10;
    const fr = freeOf(b);
    if (!fr.length) return 0;
    let best = turn === 'O' ? -99 : 99;
    for (const k of fr) { b[k] = turn; const s = minimax(b, turn === 'O' ? 'X' : 'O', depth + 1); b[k] = null; best = turn === 'O' ? Math.max(best, s) : Math.min(best, s); }
    return best;
  };
  const hardMove = (b) => {
    let best = -99, picks = [];
    for (const k of freeOf(b)) { b[k] = 'O'; const s = minimax(b, 'X', 1); b[k] = null; if (s > best) { best = s; picks = [k]; } else if (s === best) picks.push(k); }
    return picks[Math.floor(Math.random() * picks.length)];
  };
  const easyMove = (b) => {
    const fr = freeOf(b);
    for (const m of ['O', 'X']) for (const k of fr) { b[k] = m; const w = winnerOf(b); b[k] = null; if (w && (m === 'O' || Math.random() < 0.5)) return k; }
    return fr[Math.floor(Math.random() * fr.length)];
  };
  const NAMES = ['top left', 'top middle', 'top right', 'middle left', 'centre', 'middle right', 'bottom left', 'bottom middle', 'bottom right'];

  FULL['Tic Tac Toe'] = {
    title: 'Tic Tac Toe: the full game',
    intro: 'Get three in a row. You are X and you move first. Pick Easy or Hard. The Hard bot never makes a mistake, so on Hard a draw is a good result, and a win means you found a trap.',
    make: (A) => {
      let b, mode, turn, fb, line, tally = { w: 0, d: 0, l: 0 };
      const board = () => `<div class="arc-scene"><div class="ttt-board" role="group" aria-label="Tic Tac Toe board">${b.map((x, k) => `<button type="button" class="ttt-cell${line && line.includes(k) ? ' primary' : ''}" data-act="mark" data-v="${k}" aria-label="${NAMES[k]}${x ? ', ' + x : ', empty'}"${x || turn !== 'you' || A.over ? ' disabled' : ''}${line && line.includes(k) ? ' style="background:rgba(246,220,143,.35)"' : ''}>${x || ''}</button>`).join('')}</div></div>`;
      const draw = () => {
        if (!mode) {
          A.draw(`<div class="arc-scene"><p class="arc-ask">Choose the bot level.</p><div class="arc-opts">${abtn('level', 'easy', 'Easy', 'primary')}${abtn('level', 'hard', 'Hard', '')}</div><p class="arc-fb">${fb}</p></div>`);
          return;
        }
        A.draw(`<div class="arc-top"><span class="chip">Level <b>${mode === 'hard' ? 'Hard' : 'Easy'}</b></span><span class="chip">Wins <b>${tally.w}</b></span><span class="chip">Draws <b>${tally.d}</b></span><span class="chip">Losses <b>${tally.l}</b></span></div>${board()}<p class="arc-ask">${turn === 'you' ? 'Your turn. You are X.' : turn === 'bot' ? 'Bot is thinking...' : ''}</p><p class="arc-fb">${fb}</p>`);
      };
      const finish = (res) => {
        turn = 'done';
        const w = winnerOf(b);
        if (w) line = LINES.find((l) => b[l[0]] === w && b[l[1]] === w && b[l[2]] === w);
        tally[res] += 1;
        draw();
        if (res === 'w') A.end(true, 'Three X in a row. You win!');
        else if (res === 'l') A.end(false, 'The bot got three O in a row. Try again.');
        else A.end(false, 'Draw. The board is full and nobody has three in a row.');
      };
      const check = (who) => {
        if (winnerOf(b)) { finish(who === 'X' ? 'w' : 'l'); return true; }
        if (!freeOf(b).length) { finish('d'); return true; }
        return false;
      };
      const botTurn = () => {
        turn = 'bot'; draw();
        A.after(() => {
          const k = mode === 'hard' ? hardMove(b) : easyMove(b);
          b[k] = 'O'; fb = `Bot played ${NAMES[k]}.`; A.sfx('tick');
          if (check('O')) return;
          turn = 'you'; draw();
        }, 600);
      };
      const play = (k) => {
        if (turn !== 'you' || b[k]) return;
        b[k] = 'X'; fb = `You played ${NAMES[k]}.`; A.sfx('good');
        if (check('X')) return;
        botTurn();
      };
      return {
        start() {
          b = Array(9).fill(null); mode = null; turn = 'you'; fb = 'Easy bot sometimes misses a threat. Hard bot never does.'; line = null;
          draw();
          A.key((e) => { if (mode && /^[1-9]$/.test(e.key)) play(Number(e.key) - 1); });
        },
        act(a, v) {
          if (a === 'level') { mode = v === 'hard' ? 'hard' : 'easy'; fb = 'Your move. Keys 1 to 9 also work.'; turn = 'you'; draw(); }
          else if (a === 'mark' && mode) play(Number(v));
        },
        _lib: { winnerOf, hardMove, minimax },
      };
    },
  };
})();

