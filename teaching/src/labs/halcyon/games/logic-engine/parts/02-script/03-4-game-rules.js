/* ======================================================= 4. GAME RULES */
const norm = (s) => String(s).replace(/\s+/g, '').replace(/'/g, '"').toLowerCase();
const acceptedFor = (v, lang) => {
  const a = [fmtVal(v, lang), fmtVal(v, 'js')];
  if (typeof v === 'string') a.push(v);
  if (Array.isArray(v)) a.push(fmtVal(v, 'py'));
  return a;
};

class PredictionRules {
  static text(question, accepted, reveal, hint, numeric) {
    return {
      type: 'text', question, reveal, hint,
      check: (input) => {
        const n = norm(input);
        if (!n) return false;
        return accepted.some((a) => norm(a) === n) || (typeof numeric === 'number' && String(input).trim() !== '' && Number(String(input).trim()) === numeric);
      },
    };
  }
  /** Returns a prediction spec for an event, or null when nothing needs predicting. */
  static make(ev, lang = 'js') {
    switch (ev.kind) {
      case 'assign': {
        const v = ev.expected;
        if (Array.isArray(v) && v.length > 6) {
          return PredictionRules.text(`After line ${ev.line} runs, how many items will \`${ev.name}\` hold?`, [String(v.length)], String(v.length), 'Count the items, including any being added right now.');
        }
        return PredictionRules.text(
          `After line ${ev.line} runs, what value will \`${ev.name}\` hold?` + (Array.isArray(v) ? (lang === 'java' ? ' (write arrays like {1, 2})' : ' (write arrays like [1, 2])') : ''),
          acceptedFor(v, lang), fmtVal(v, lang), 'Work out the right-hand side using the current values in RAM.', typeof v === 'number' ? v : undefined);
      }
      case 'return': {
        const v = ev.expected;
        return PredictionRules.text('What value does this return to the caller?', acceptedFor(v, lang), fmtVal(v, lang), 'Evaluate the return expression with the values in this stack frame.', typeof v === 'number' ? v : undefined);
      }
      case 'print':
        return PredictionRules.text(`What will line ${ev.line} print to the console?`, [ev.expected, '"' + ev.expected + '"'], ev.expected, 'Evaluate each argument, then join them with spaces.');
      case 'branch':
        return {
          type: 'bool',
          question: ev.loopy ? `Will the loop run another pass? Is \`${ev.text}\` true?` : `Is \`${ev.text}\` true or false right now?`,
          reveal: fmtVal(ev.expected, lang),
          hint: 'Substitute the current values from RAM into the condition.',
          check: (input) => input === String(ev.expected),
        };
      default: return null;
    }
  }
}

/* ---------------------------------------------------------- stage helpers */
const FACE = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
const SUITS = ['♠', '♥', '♣', '♦'];
const DICE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const RANKS = [[0, 'Rookie'], [150, 'Operator'], [600, 'Debugger'], [1600, 'Architect'], [3200, 'Grandmaster']];
const rankFor = (score) => RANKS.reduce((r, [min, name]) => (score >= min ? name : r), RANKS[0][1]);
const rankIndex = (score) => RANKS.reduce((r, [min], i) => (score >= min ? i : r), 0);
function rankProgress(score) {
  const i = rankIndex(score), cur = RANKS[i], nxt = RANKS[i + 1];
  return nxt ? { i, name: cur[1], next: nxt[1], need: nxt[0] - score, pct: (score - cur[0]) / (nxt[0] - cur[0]) } : { i, name: cur[1], next: null, need: 0, pct: 1 };
}

/** Looks a variable up the way the CPU would: innermost stack frame first. */
function lookupVar(snap, name) {
  for (let i = snap.frames.length - 1; i >= 0; i--) {
    const hit = snap.frames[i].vars.find((v) => v[0] === name);
    if (hit) return hit[1];
  }
  return undefined;
}
const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);

function cardHtml(rank, i, mode) {
  const label = FACE[rank] || String(rank);
  const suit = SUITS[(i + (isNum(rank) ? rank : 0)) % 4];
  const red = suit === '♥' || suit === '♦';
  return `<div class="pcard ${red ? 'red' : ''} ${mode || ''}"><b>${esc(label)}</b><span>${suit}</span></div>`;
}
function totalBadge(total, label) {
  if (!isNum(total)) return `<div class="badge"><small>${label}</small><strong>–</strong></div>`;
  const cls = total > 21 ? 'bust' : total === 21 ? 'max' : '';
  const tag = total > 21 ? '<em>BUST</em>' : total === 21 ? '<em>21!</em>' : '<em>&nbsp;</em>';
  return `<div class="badge ${cls}"><small>${label}</small><strong>${total}</strong>${tag}</div>`;
}
const valBadge = (label, v) => `<div class="badge"><small>${label}</small><strong>${v === undefined ? '–' : esc(fmtVal(v))}</strong></div>`;

/* ----------------------------------------------------------------- stages
   Each stage reads variables from the CURRENT RAM snapshot only, so the table
   always shows what the CPU knows right now, never the answer to the next step.
   ctx = { ev, prev, snap, out, expected, get(name) } */
const ROULETTE_LINE = /chambers\[pos\]/;
const rouletteStage = {
  render({ get, prev }) {
    const chambers = Array.isArray(get('chambers')) ? get('chambers') : [0, 0, 0, 0, 0, 0];
    let pos = get('pos'); if (pos === undefined) pos = get('spin');
    const n = chambers.length || 6;
    const hit = prev && prev.kind === 'branch' && prev.expected && ROULETTE_LINE.test(prev.text);
    const miss = prev && prev.kind === 'branch' && !prev.expected && ROULETTE_LINE.test(prev.text);
    const off = isNum(pos) && (pos < 0 || pos >= n);
    const slots = chambers.map((c, i) => `<div class="chamber ${c === 1 ? 'loaded' : ''} ${i === pos ? 'current' : ''}" style="--a:${(360 / n) * i}deg"><i>${i}</i></div>`).join('');
    return `<div class="cylinder-wrap ${hit ? 'bang' : ''}"><div class="cylinder">${slots}<div class="hub"></div></div></div>
      <div class="readouts">${valBadge('pos', pos)}${valBadge('turn', get('turn'))}</div>
      ${hit ? '<div class="shout bad">BANG</div>' : miss ? '<div class="shout">click</div>' : ''}
      ${off ? '<p class="warn">pos points at a chamber that does not exist.</p>' : ''}`;
  },
  say({ prev, get }) {
    const pos = get('pos'), turn = get('turn');
    if (prev && prev.kind === 'branch' && ROULETTE_LINE.test(prev.text)) {
      return prev.expected ? `BANG! Chamber ${pos} was loaded. That player is out.` : 'Click. Empty chamber. The gun passes to the next player.';
    }
    if (pos !== undefined && turn !== undefined) return `Turn ${turn}: the trigger is pulled on chamber ${pos}.`;
    return 'The revolver is loaded and spun. Step through to play the game.';
  },
};

const handOf = (get) => (Array.isArray(get('cards')) ? get('cards') : Array.isArray(get('hand')) ? get('hand') : []);
const blackjackStage = {
  render({ get }) {
    const cards = handOf(get), i = get('i');
    const html = cards.map((c, k) => cardHtml(c, k, k === i ? 'pick' : isNum(i) && k < i ? 'counted' : '')).join('');
    return `<div class="hand">${html || '<p class="muted">No cards dealt yet.</p>'}</div><div class="readouts">${totalBadge(get('total'), 'total')}</div>`;
  },
  say({ get }) {
    const cards = handOf(get), i = get('i'), total = get('total');
    if (isNum(total) && total > 21) return `The total is ${total}. That is a bust.`;
    if (isNum(i) && i < cards.length) return `The dealer counts card ${i + 1} of ${cards.length}.`;
    return 'The cards are on the table. Step through to see how the total is built.';
  },
};

const dealerStage = {
  render({ get }) {
    const deck = Array.isArray(get('deck')) ? get('deck') : [];
    const next = isNum(get('next')) ? get('next') : 0, total = get('total');
    const drawn = deck.slice(0, next).map((c, k) => cardHtml(c, k)).join('');
    const rest = deck.slice(next).map(() => '<div class="pcard back"><b>?</b></div>').join('');
    const pct = isNum(total) ? Math.min(100, (total / 25) * 100) : 0;
    return `<div class="dealer"><div class="hand">${drawn}${rest}</div>
      <div class="meter"><i style="width:${pct}%"></i><span class="mk" style="left:${(17 / 25) * 100}%"><span>stand 17</span></span><span class="mk" style="left:${(21 / 25) * 100}%"><span>21</span></span></div></div>
      <div class="readouts">${totalBadge(total, 'dealer')}</div>`;
  },
  say({ get }) {
    const total = get('total'), next = get('next');
    if (!isNum(total)) return 'The dealer is dealt a starting hand. Step through to watch the draws.';
    return `The dealer holds ${total}${isNum(next) ? ` after drawing ${next} card${next === 1 ? '' : 's'}` : ''}.`;
  },
};

const tttStage = {
  render({ get }) {
    const board = Array.isArray(get('board')) ? get('board') : new Array(9).fill('.');
    let hl = [get('a'), get('b'), get('c')];
    if (!hl.every(isNum)) { const l = get('line'); hl = Array.isArray(l) ? l : []; }
    const cells = board.map((m, i) => `<div class="sq ${m === 'X' || m === 'O' ? m : ''} ${hl.includes(i) ? 'hl' : ''}"><i>${i}</i>${m === '.' ? '' : esc(m)}</div>`).join('');
    return `<div class="ttt">${cells}</div><div class="readouts">${valBadge('mark', get('mark'))}</div>`;
  },
  say({ get }) {
    let hl = [get('a'), get('b'), get('c')];
    if (!hl.every(isNum)) { const l = get('line'); hl = Array.isArray(l) ? l : []; }
    if (hl.length) return `Checking squares ${hl.join(', ')} for ${get('mark')}.`;
    return 'The board is on the table. Step through to see how a win is detected.';
  },
};

/* ---- real-card helpers (poker): rank 2..14 (14 = Ace), suit 0..3 */
const FACE_HI = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const POKER_SUITS = ['♠', '♥', '♦', '♣'];
function pokerCardHtml(rank, suit, cls, idxLabel, subLabel) {
  const label = FACE_HI[rank] || String(rank);
  const red = suit === 1 || suit === 2;
  return `<div class="pslot"><i>${idxLabel}</i><div class="pcard ${red ? 'red' : ''} ${cls || ''}"><b>${esc(label)}</b><span>${POKER_SUITS[suit]}</span></div>${subLabel !== undefined ? `<small>${esc(subLabel)}</small>` : ''}</div>`;
}
/** Rank-only hands get a stable suit per card: equal ranks never share a suit. */
function suitsForRanks(ranks) {
  const seen = {};
  return ranks.map((r) => { seen[r] = (seen[r] || 0); const s = (r + seen[r]) % 4; seen[r]++; return s; });
}
const arrOf = (v) => (Array.isArray(v) ? v : []);

const flushStage = {
  render({ get }) {
    const hand = arrOf(get('hand')), cardVar = get('card'), i = get('i');
    const active = isNum(cardVar) ? hand.indexOf(cardVar) : (isNum(i) ? i : -1);
    const cards = hand.map((c, k) => pokerCardHtml((c % 13) + 2, Math.floor(c / 13), k === active ? 'pick' : '', k, '#' + c)).join('');
    return `<div class="hand">${cards || '<p class="muted">No cards dealt yet.</p>'}</div><div class="readouts">${valBadge('card', cardVar)}${valBadge('suit', get('suit'))}</div>`;
  },
  say({ get }) {
    const c = get('card'), i = get('i');
    if (isNum(c)) return `Decoding card #${c} into a suit number.`;
    if (isNum(i)) return `Comparing the suit of card ${i} with the suit of the first card.`;
    return 'Five cards are on the table. Step through to see if they make a flush.';
  },
};

const pairsStage = {
  render({ get }) {
    const ranks = arrOf(get('ranks')), i = get('i'), j = get('j');
    const inRange = isNum(i) && isNum(j) && i < ranks.length && j < ranks.length;
    const same = inRange && ranks[i] === ranks[j];
    const suits = suitsForRanks(ranks);
    const cards = ranks.map((r, k) => {
      let cls = '';
      if (inRange && (k === i || k === j)) cls = i === j ? 'self' : same ? 'match' : 'pick';
      return pokerCardHtml(r, suits[k], cls, k, 'rank ' + r);
    }).join('');
    return `<div class="hand">${cards || '<p class="muted">No cards dealt yet.</p>'}</div><div class="readouts">${valBadge('i', i)}${valBadge('j', j)}${valBadge('pairs', get('pairs'))}</div>`;
  },
  say({ get }) {
    const ranks = arrOf(get('ranks')), i = get('i'), j = get('j');
    if (isNum(i) && isNum(j) && j < ranks.length && i < ranks.length) {
      if (i === j) return `Card ${i} is being compared with itself.`;
      return `Comparing card ${i} with card ${j}${ranks[i] === ranks[j] ? ': same rank, a pair!' : '.'}`;
    }
    return 'Five cards are on the table. Step through to count the pairs.';
  },
};

const straightStage = {
  render({ get }) {
    const ranks = arrOf(get('ranks')), i = get('i');
    const suits = suitsForRanks(ranks);
    const live = isNum(i);
    const cards = ranks.map((r, k) => pokerCardHtml(r, suits[k], live && (k === i || k === i + 1) ? 'pick' : '', k, 'rank ' + r)).join('');
    const ghost = live && i + 1 >= ranks.length
      ? `<div class="pslot"><i>${i + 1}</i><div class="pcard ghost"><b>?</b></div><small>no card</small></div>` : '';
    return `<div class="hand">${cards || '<p class="muted">No cards dealt yet.</p>'}${ghost}</div><div class="readouts">${valBadge('i', i)}</div>`;
  },
  say({ get }) {
    const ranks = arrOf(get('ranks')), i = get('i');
    if (!isNum(i)) return 'Five cards, lowest to highest. Step through to check they climb by one.';
    if (i + 1 >= ranks.length) return `There is no card ${i + 1}. The loop has run past the end of the hand.`;
    return `Is card ${i + 1} (rank ${ranks[i + 1]}) exactly one higher than card ${i} (rank ${ranks[i]})?`;
  },
};

const RPS_NAMES = ['Rock', 'Paper', 'Scissors'];
const RPS_GLYPH = ['●', '▤', '✂'];
const rpsStage = {
  render({ get }) {
    const a = isNum(get('a')) ? get('a') : get('p1'), b = isNum(get('b')) ? get('b') : get('p2');
    const tile = (label, v) => `<div class="throw"><small>${label}</small><span>${isNum(v) ? (RPS_GLYPH[v] || '?') : '?'}</span><strong>${isNum(v) ? esc(RPS_NAMES[v] || 'invalid') : '–'}</strong></div>`;
    return `<div class="duel">${tile('Player 1', a)}<div class="vs">vs</div>${tile('Player 2', b)}</div><div class="readouts">${valBadge('diff', get('diff'))}</div>`;
  },
  say({ get }) {
    const d = get('diff');
    if (d !== undefined) return `The difference works out to ${fmtVal(d)}. Only 0 and 1 have a rule.`;
    return 'Two throws are on the table. Step through to see who wins.';
  },
};

const guessStage = {
  render({ get }) {
    const lo = get('low'), hi = get('high'), mid = get('mid'), secret = get('secret');
    const pct = (n) => Math.max(0, Math.min(100, ((n - 1) / 99) * 100));
    const win = isNum(lo) && isNum(hi) && lo <= hi
      ? `<div class="win" style="left:${pct(lo)}%;width:${Math.max(pct(hi) - pct(lo), 1.2)}%"></div>` : '';
    const pin = (cls, n, label) => (isNum(n) ? `<span class="pin ${cls}" style="left:${pct(n)}%"><b>${label} ${n}</b></span>` : '');
    return `<div class="numline" role="img" aria-label="Search window from 1 to 100"><div class="track"></div>${win}${pin('mid', mid, 'guess')}${pin('secret', secret, 'secret')}<span class="end" style="left:0">1</span><span class="end" style="right:0">100</span></div>
      <div class="readouts">${valBadge('low', lo)}${valBadge('high', hi)}${valBadge('guesses', get('guesses'))}</div>`;
  },
  say({ get }) {
    const lo = get('low'), hi = get('high'), g = get('guesses');
    if (isNum(lo) && isNum(hi)) return `The secret is somewhere between ${lo} and ${hi}.${isNum(g) ? ` Guesses so far: ${g}.` : ''}`;
    return 'Pick a secret number from 1 to 100. The program narrows it down by halving.';
  },
};

const coinsStage = {
  render({ get }) {
    const flips = arrOf(get('flips')), i = get('i');
    const coins = flips.map((f, k) => `<div class="coin ${f === 1 ? 'H' : 'T'} ${k === i ? 'pick' : ''} ${isNum(i) && k < i ? 'past' : ''}">${f === 1 ? 'H' : 'T'}</div>`).join('');
    return `<div class="coins">${coins || '<p class="muted">No coins flipped yet.</p>'}</div><div class="readouts">${valBadge('run', get('run'))}${valBadge('best', get('best'))}</div>`;
  },
  say({ get }) {
    const flips = arrOf(get('flips')), i = get('i');
    if (isNum(i) && i < flips.length) return `Flip ${i + 1} is ${flips[i] === 1 ? 'heads' : 'tails'}. Run: ${fmtVal(get('run'))}, best so far: ${fmtVal(get('best'))}.`;
    return 'A row of coin flips. Step through to find the longest run of heads.';
  },
};

