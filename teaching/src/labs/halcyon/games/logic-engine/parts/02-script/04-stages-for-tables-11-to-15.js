/* ---------------------------------------------------------- stages for tables 11 to 15 */
const hanoiStage = {
  render({ get, snap }) {
    const frames = (snap && snap.frames) || [];
    const n = get('n'), discs = get('discs');
    const count = isNum(n) ? n : isNum(discs) ? discs : 0;
    const shown = Math.max(0, Math.min(8, count));
    let stack = '';
    for (let k = 1; k <= shown; k++) stack += `<i class="hn-disc d${k}" style="width:${26 + k * 9}%"></i>`;
    const peg = (label, inner) => `<div class="hn-peg"><span class="hn-pole"></span><div class="hn-stack">${inner}</div><b>${label}</b></div>`;
    const calls = frames.slice(1).map((f, k) => `<span class="hn-call${k === frames.length - 2 ? ' now' : ''}">${esc(f.name)}</span>`).join('');
    return `<div class="hn-pegs" role="img" aria-label="Tower of ${shown} discs">${peg('A', stack)}${peg('B', '')}${peg('C', '')}</div>
      <div class="hn-calls" aria-label="Active calls">${calls || '<span class="muted">No calls yet</span>'}</div>
      <div class="readouts">${valBadge('discs', isNum(n) ? n : discs)}${valBadge('depth', Math.max(0, frames.length - 1))}${valBadge('returned', snap && snap.ret)}</div>`;
  },
  say({ get, snap }) {
    const n = get('n'), depth = Math.max(0, ((snap && snap.frames) || []).length - 1);
    if (isNum(n)) return `Working on a tower of ${n} disc${n === 1 ? '' : 's'}. ${depth} call${depth === 1 ? ' is' : 's are'} open right now.`;
    return 'A tower of discs on peg A. The function counts the moves needed to carry the whole tower to another peg.';
  },
};

const nimStage = {
  render({ get }) {
    const stones = get('stones'), take = get('take');
    if (!isNum(stones)) return '<p class="muted">The heap has not been set up yet.</p>';
    const total = Math.max(0, Math.min(40, stones)), t = isNum(take) ? Math.max(0, Math.min(total, take)) : 0;
    let groups = '';
    for (let g = 0; g < total; g += 4) {
      let inner = '';
      for (let k = g; k < Math.min(g + 4, total); k++) inner += `<i class="nm-stone${k >= total - t ? ' taken' : ''}"></i>`;
      groups += `<span class="nm-group">${inner}</span>`;
    }
    return `<div class="nm-heap" role="img" aria-label="${total} stones">${groups}</div>
      <div class="readouts">${valBadge('stones', stones)}${valBadge('take', take)}${valBadge('left', isNum(take) ? stones - take : undefined)}</div>`;
  },
  say({ get }) {
    const stones = get('stones'), take = get('take');
    if (isNum(stones) && isNum(take)) {
      const left = stones - take;
      return `${stones} stones. The bot takes ${take} and leaves ${left}${left > 0 && left % 4 === 0 ? ', a multiple of 4' : ''}.`;
    }
    if (isNum(stones)) return `A heap of ${stones} stones. Whoever takes the last one wins.`;
    return 'A heap of stones. Each player takes 1, 2 or 3. The bot wants to leave a multiple of 4.';
  },
};

const bingoStage = {
  render({ get, snap }) {
    const ball = get('ball');
    const flag = (label, on) => `<span class="bg-flag${on ? ' on' : ''}">${label}</span>`;
    const ret = snap && snap.ret;
    return `<div class="bg-ball${isNum(ball) ? '' : ' empty'}"><b>${isNum(ball) ? ball : '?'}</b></div>
      <div class="bg-flags">${flag('divides by 3', isNum(ball) && ball % 3 === 0)}${flag('divides by 5', isNum(ball) && ball % 5 === 0)}${flag('divides by 15', isNum(ball) && ball % 15 === 0)}</div>
      <div class="readouts">${valBadge('ball', ball)}${valBadge('prize', ret)}</div>`;
  },
  say({ get, snap }) {
    const ball = get('ball'), ret = snap && snap.ret;
    if (isNum(ball) && isNum(ret)) return `Ball ${ball} pays ${ret} chip${ret === 1 ? '' : 's'}.`;
    if (isNum(ball)) return `Ball ${ball} is drawn. Which prize does it win?`;
    return 'A bingo ball is drawn. The hall pays chips depending on what the number divides by.';
  },
};

const battleStage = {
  render({ get }) {
    const sea = arrOf(get('sea')), row = get('row'), col = get('col'), index = get('index');
    if (sea.length !== 25) return '<p class="muted">The sea has not been set up yet.</p>';
    const target = isNum(row) && isNum(col) ? row * 5 + col : -1;
    let cells = '';
    for (let k = 0; k < 25; k++) {
      const cls = ['bs-cell', sea[k] === 1 ? 'ship' : '', k === target ? 'aim' : '', k === index ? 'look' : ''].join(' ');
      cells += `<div class="${cls}"><small>${k}</small></div>`;
    }
    return `<div class="bs-grid" role="img" aria-label="5 by 5 sea">${cells}</div>
      <div class="bs-key"><span><i class="aim"></i>shot</span><span><i class="look"></i>square the program checks</span><span><i class="ship"></i>ship</span></div>
      <div class="readouts">${valBadge('row', row)}${valBadge('col', col)}${valBadge('index', index)}</div>`;
  },
  say({ get }) {
    const row = get('row'), col = get('col');
    if (isNum(row) && isNum(col)) return `A shot at row ${row}, column ${col}.`;
    return 'A 5 by 5 sea stored as one flat list of 25 squares, row after row. Where did the shot land?';
  },
};

const pongStage = {
  render({ get }) {
    const x = get('x'), speed = get('speed'), i = get('i');
    if (!isNum(x)) return '<p class="muted">The ball has not been served yet.</p>';
    let cells = '';
    for (let k = 0; k < 10; k++) cells += `<div class="pg-cell${k === x ? ' ball' : ''}"><small>${k}</small></div>`;
    const out = x < 0 || x > 9;
    const arrow = speed === 1 ? '→' : speed === -1 ? '←' : '·';
    return `<div class="pg-court${out ? ' out' : ''}"><span class="pg-wall"></span><div class="pg-track">${cells}</div><span class="pg-wall"></span></div>
      ${out ? `<p class="pg-out">The ball has left the court at ${x}!</p>` : ''}
      <div class="readouts">${valBadge('x', x)}${valBadge('speed', speed)}<div class="badge"><small>heading</small><strong>${arrow}</strong></div>${valBadge('step', isNum(i) ? i + 1 : undefined)}</div>`;
  },
  say({ get }) {
    const x = get('x');
    if (!isNum(x)) return 'A ball bounces between a wall at 0 and a wall at 9.';
    if (x < 0 || x > 9) return `x is ${x}. That is outside the court between 0 and 9.`;
    return `The ball is on ${x}.`;
  },
};

/* ---------------------------------------------------------- stages for tables 16 to 20 */
const RED_POCKETS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const casinoStage = {
  render({ get, snap }) {
    const pocket = get('pocket'), ret = snap && snap.ret;
    let cells = '';
    for (let k = 0; k <= 36; k++) cells += `<i class="cz-cell ${k === 0 ? 'zero' : RED_POCKETS.has(k) ? 'red' : 'black'}${k === pocket ? ' ball' : ''}">${k}</i>`;
    const band = (label, n) => `<span class="cz-band${isNum(ret) && ret === n ? ' on' : ''}${isNum(pocket) && pocket >= 1 && Math.floor((pocket - 1) / 12) + 1 === n ? ' truth' : ''}">${label}</span>`;
    return `<div class="cz-wheel" role="img" aria-label="Roulette numbers 0 to 36">${cells}</div>
      <div class="cz-bands">${band('1st dozen · 1 to 12', 1)}${band('2nd dozen · 13 to 24', 2)}${band('3rd dozen · 25 to 36', 3)}</div>
      <div class="readouts">${valBadge('pocket', pocket)}${valBadge('dozen', ret)}</div>`;
  },
  say({ get, snap }) {
    const pocket = get('pocket'), ret = snap && snap.ret;
    if (isNum(pocket) && isNum(ret)) return `The ball is on ${pocket}. The program calls it dozen ${ret}. Check it against the bands: the outlined band is the true one.`;
    if (isNum(pocket)) return `The ball drops into pocket ${pocket}. Which dozen is that?`;
    return 'A roulette wheel. A dozen bet covers a third of the numbers 1 to 36.';
  },
};

const MOVES = ['Reload', 'Shoot', 'Shield', 'Cannon'];
const duelStage = {
  render({ get, snap }) {
    const a = get('a'), b = get('b'), ret = snap && snap.ret;
    const side = (label, m, hit) => `<div class="du-side${hit ? ' hit' : ''}"><small>${label}</small><span class="du-move m${isNum(m) ? m : 'x'}">${isNum(m) ? MOVES[m] || '?' : '?'}</span>${hit ? '<b class="du-hit">HIT</b>' : ''}</div>`;
    return `<div class="du-ring" role="img" aria-label="Duel">${side('Player A', a, ret === 1)}<span class="du-vs">vs</span>${side('Player B', b, ret === -1)}</div>
      <div class="readouts">${valBadge('a', a)}${valBadge('b', b)}${valBadge('result', ret)}</div>`;
  },
  say({ get, snap }) {
    const a = get('a'), b = get('b'), ret = snap && snap.ret;
    if (isNum(ret)) return ret === 0 ? 'The program says nobody is hit.' : `The program says ${ret === 1 ? 'player A' : 'player B'} lands the hit.`;
    if (isNum(a) && isNum(b)) return `A plays ${MOVES[a]}, B plays ${MOVES[b]}. Who gets hit?`;
    return 'Two gunslingers choose reload, shoot, shield or cannon at the same time.';
  },
};

const PLAYERS = ['Ana', 'Ben', 'Cy', 'Dee', 'Eli'];
const voteStage = {
  render({ get, snap }) {
    const votes = arrOf(get('votes')), counts = arrOf(get('counts')), top = get('top'), tied = get('tied'), p = get('p'), ret = snap && snap.ret;
    const seats = PLAYERS.map((n, k) => {
      const c = counts.length ? counts[k] : votes.filter((v) => v === k).length;
      let bar = ''; for (let t = 0; t < (c || 0); t++) bar += '<i></i>';
      return `<div class="wv-seat${k === top ? ' top' : ''}${k === p ? ' look' : ''}${isNum(ret) && ret === k ? ' out' : ''}"><b>${n}</b><span class="wv-bar">${bar}</span><small>${isNum(c) ? c : 0} vote${c === 1 ? '' : 's'}</small></div>`;
    }).join('');
    return `<div class="wv-night"><span class="wv-moon"></span><div class="wv-seats">${seats}</div></div>
      <div class="wv-ballots">${votes.map((v) => `<span>${esc(PLAYERS[v] || '?')}</span>`).join('') || '<span class="muted">No ballots yet</span>'}</div>
      <div class="readouts">${valBadge('top', top)}${valBadge('tied', tied)}${valBadge('result', ret)}</div>`;
  },
  say({ get, snap }) {
    const ret = snap && snap.ret, tied = get('tied'), top = get('top');
    if (isNum(ret)) return ret === -1 ? 'Nobody is banished: the vote was tied.' : `${PLAYERS[ret]} is banished by the village.`;
    if (isNum(top)) return `${PLAYERS[top]} leads so far.${tied === true ? ' The flag says the top spot is tied.' : ''}`;
    return 'Dawn in the village. Every player votes for who to banish.';
  },
};

const chessStage = {
  render({ get, snap }) {
    const x1 = get('x1'), y1 = get('y1'), x2 = get('x2'), y2 = get('y2'), dx = get('dx'), dy = get('dy'), ret = snap && snap.ret;
    let cells = '';
    for (let r = 7; r >= 0; r--) for (let c = 0; c < 8; c++) {
      const cls = ['ch-cell', (r + c) % 2 ? 'light' : 'dark', c === x1 && r === y1 ? 'from' : '', c === x2 && r === y2 ? 'to' : ''].join(' ');
      cells += `<div class="${cls}">${c === x1 && r === y1 ? '<span class="ch-knight">&#9822;</span>' : ''}${c === x2 && r === y2 ? '<span class="ch-target">&#9678;</span>' : ''}</div>`;
    }
    return `<div class="ch-board" role="img" aria-label="Chess board">${cells}</div>
      <div class="readouts">${valBadge('dx', dx)}${valBadge('dy', dy)}${valBadge('legal?', ret)}</div>`;
  },
  say({ get, snap }) {
    const x1 = get('x1'), y1 = get('y1'), x2 = get('x2'), y2 = get('y2'), ret = snap && snap.ret;
    if (ret === true || ret === false) return ret ? 'The program says the knight can make this jump.' : 'The program says the knight cannot make this jump.';
    if (isNum(x1) && isNum(x2)) return `The knight on ${'abcdefgh'[x1]}${y1 + 1} wants to jump to ${'abcdefgh'[x2]}${y2 + 1}.`;
    return 'A knight on a chess board. It moves in an L: two squares one way, one square sideways.';
  },
};

const wordleStage = {
  render({ get, snap }) {
    const secret = arrOf(get('secret')), guess = arrOf(get('guess')), i = get('i'), j = get('j'), total = get('total'), found = get('found');
    if (secret.length !== 5 || guess.length !== 5) return '<p class="muted">The words have not been set up yet.</p>';
    const tile = (ch, cls) => `<span class="wd-tile ${cls}">${esc(ch)}</span>`;
    const g = guess.map((ch, k) => tile(ch, `${ch === secret[k] ? 'green' : secret.includes(ch) ? 'yellow' : 'grey'}${k === i ? ' pick' : ''}`)).join('');
    const s = secret.map((ch, k) => tile(ch, `plain${k === j ? ' look' : ''}`)).join('');
    return `<div class="wd-rows" role="img" aria-label="Guess ${esc(guess.join(''))} against secret ${esc(secret.join(''))}"><small>guess</small><div class="wd-row">${g}</div><small>secret</small><div class="wd-row">${s}</div></div>
      <div class="readouts">${valBadge('total', total)}${valBadge('found', found)}${valBadge('i', i)}${valBadge('j', j)}</div>`;
  },
  say({ get }) {
    const guess = arrOf(get('guess')), secret = arrOf(get('secret')), i = get('i'), total = get('total');
    if (isNum(i) && guess[i] !== undefined) return `Scoring letter ${i + 1} of the guess: "${guess[i]}". ${guess[i] === secret[i] ? 'It is in the right place.' : 'It is not in the right place. Look through the secret.'} Total so far: ${fmtVal(total)}.`;
    return 'Wordle. Green letters score 2, letters elsewhere in the word score 1.';
  },
};


/* ---------------------------------------------------------- stages for tables 21 to 23 */
const SLOT_SYMBOLS = ['Cherry', 'Bell', 'Lemon', 'Star', 'Seven', 'Bar'];
const slotsStage = {
  render({ get, snap }) {
    const a = get('a'), b = get('b'), c = get('c'), ret = snap && snap.ret;
    const reel = (v) => `<span class="sl-reel${isNum(v) ? ` s${v}` : ''}"><b>${isNum(v) ? esc(SLOT_SYMBOLS[v] || '?') : '?'}</b><small>${isNum(v) ? v : ''}</small></span>`;
    const link = (x, y, label) => `<span class="sl-link${isNum(x) && isNum(y) && x === y ? ' on' : ''}">${label}</span>`;
    return `<div class="sl-machine" role="img" aria-label="Three reels">${reel(a)}${reel(b)}${reel(c)}</div>
      <div class="sl-links">${link(a, b, 'a = b')}${link(b, c, 'b = c')}${link(a, c, 'a = c')}</div>
      <div class="readouts">${valBadge('a', a)}${valBadge('b', b)}${valBadge('c', c)}${valBadge('pays', ret)}</div>`;
  },
  say({ get, snap }) {
    const ret = snap && snap.ret, a = get('a'), b = get('b'), c = get('c');
    if (isNum(ret)) return `The machine pays ${ret}${isNum(a) && isNum(b) && isNum(c) && (a === b || b === c || a === c) && ret === 0 ? '. Two reels match, so something is wrong' : ''}.`;
    if (isNum(a)) return 'Three reels have stopped. Three equal pays 10, any two equal pays 2.';
    return 'A slot machine with three reels and six symbols.';
  },
};

const c4Stage = {
  render({ get, snap }) {
    const cells = arrOf(get('cells')), i = get('i'), mark = get('mark'), ret = snap && snap.ret;
    if (cells.length !== 7) return '<p class="muted">The row has not been set up yet.</p>';
    const disc = cells.map((v, k) => `<span class="c4-slot${isNum(i) && k >= i && k < i + 4 ? ' win' : ''}"><i class="c4-disc d${v}"></i><small>${k}</small></span>`).join('');
    return `<div class="c4-row" role="img" aria-label="A row of seven slots">${disc}</div>
      <div class="readouts">${valBadge('mark', mark)}${valBadge('window', isNum(i) ? i : undefined)}${valBadge('four?', ret)}</div>`;
  },
  say({ get, snap }) {
    const ret = snap && snap.ret, i = get('i');
    if (ret === true || ret === false) return ret ? 'The program says this player has four in a row.' : 'The program says there is no four in a row.';
    if (isNum(i)) return `Checking the four slots starting at ${i}.`;
    return 'One row of a Connect Four grid. 0 is empty, 1 is red, 2 is yellow.';
  },
};

const dartStage = {
  render({ get, snap }) {
    const x = get('x'), y = get('y'), d = get('d'), ret = snap && snap.ret;
    const has = isNum(x) && isNum(y);
    const dot = has ? `<i class="dt-dart" style="left:${50 + Math.max(-10, Math.min(10, x)) * 5}%;top:${50 - Math.max(-10, Math.min(10, y)) * 5}%"></i>` : '';
    return `<div class="dt-board" role="img" aria-label="Dartboard"><span class="dt-axis h"></span><span class="dt-axis v"></span>${dot}</div>
      <div class="readouts">${valBadge('x', x)}${valBadge('y', y)}${valBadge('d', d)}${valBadge('score', ret)}</div>`;
  },
  say({ get, snap }) {
    const x = get('x'), y = get('y'), d = get('d'), ret = snap && snap.ret;
    if (isNum(ret)) return `The dart scores ${ret}.${has2(x, y) ? ` Its true distance squared is ${x * x + y * y}.` : ''}`;
    if (isNum(d)) return `The program thinks the squared distance from the centre is ${d}.`;
    if (has2(x, y)) return `A dart lands at x ${x}, y ${y}. The centre is (0, 0).`;
    return 'A dartboard. The closer to the centre, the more it scores.';
  },
};
const has2 = (x, y) => isNum(x) && isNum(y);

