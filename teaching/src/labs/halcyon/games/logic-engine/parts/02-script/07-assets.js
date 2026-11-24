/* ============================================================ ASSETS
   Everything visual is drawn here as inline SVG. No external images.
   Colours come from CSS classes, so the whole set follows the theme. */
const icon = (id, cls) => `<svg class="ico ${cls || ''}" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;
const starsHtml = (n, pop) => [0, 1, 2].map((k) => `<svg class="star ${k < n ? 'on' : 'off'}${pop && k < n ? ' pop' : ''}" style="--k:${k}" aria-hidden="true" focusable="false"><use href="#i-star"/></svg>`).join('');

/** Poker-chip rank badge: one chevron per rank, a crown for the top rank. */
function rankSvg(i) {
  const chev = (n) => Array.from({ length: n }, (_, k) => { const y = 24 + (k - (n - 1) / 2) * 6; return `<path class="st-bh" d="M17 ${y + 2.5} L24 ${y - 2.5} L31 ${y + 2.5}"/>`; }).join('');
  const inner = i >= 4
    ? '<path class="bh" d="M13 32 L15 17 L20.5 24.5 L24 15 L27.5 24.5 L33 17 L35 32 Z"/><rect class="bh" x="13" y="33.5" width="22" height="3" rx="1.5"/>'
    : chev(i + 1);
  return `<svg class="rank-svg" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle class="br" cx="24" cy="24" r="22"/><circle class="st-iv-dash" cx="24" cy="24" r="19.5"/><circle class="fd" cx="24" cy="24" r="15"/><circle class="st-bh-thin" cx="24" cy="24" r="15"/>${inner}</svg>`;
}

/** One emblem per table, drawn on a 64 x 64 grid. */
const EMBLEMS = {
  roulette: () => {
    let h = '<circle class="fd" cx="32" cy="32" r="28"/><circle class="st" cx="32" cy="32" r="28"/>';
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3, x = (32 + 16 * Math.sin(a)).toFixed(1), y = (32 - 16 * Math.cos(a)).toFixed(1);
      h += k === 1 ? `<circle class="br" cx="${x}" cy="${y}" r="6"/><circle class="bh" cx="${x}" cy="${y}" r="2.4"/>` : `<circle class="hole" cx="${x}" cy="${y}" r="5.4"/>`;
    }
    return h + '<circle class="br" cx="32" cy="32" r="5.5"/><circle class="fd" cx="32" cy="32" r="2"/>';
  },
  'blackjack-ace': () => '<g transform="rotate(11 34 34)"><rect class="rb" x="19" y="9" width="30" height="43" rx="4"/><rect class="st-iv" x="23" y="13" width="22" height="35" rx="2"/></g>'
    + '<g transform="rotate(-9 30 34)"><rect class="iv" x="12" y="8" width="30" height="43" rx="4"/><text class="ink-t" x="16.5" y="22" font-size="12" font-weight="700">A</text><use href="#s-spade" class="ci" x="19" y="26" width="16" height="17"/></g>',
  dealer: () => '<g transform="rotate(-6 24 36)"><rect class="rb" x="8" y="14" width="26" height="38" rx="4"/><rect class="st-iv" x="12" y="18" width="18" height="30" rx="2"/></g>'
    + '<g transform="rotate(2 30 34)"><rect class="rb" x="16" y="11" width="26" height="38" rx="4"/><rect class="st-iv" x="20" y="15" width="18" height="30" rx="2"/></g>'
    + '<g transform="rotate(10 40 34)"><rect class="rb" x="26" y="8" width="26" height="38" rx="4"/><rect class="st-iv" x="30" y="12" width="18" height="30" rx="2"/></g>'
    + '<circle class="br" cx="46" cy="46" r="11"/><circle class="st-dark" cx="46" cy="46" r="8"/><text class="ink-t" x="46" y="50" font-size="10" font-weight="700" text-anchor="middle">17</text>',
  tictactoe: () => '<path class="st" d="M24 8V56M40 8V56M8 24H56M8 40H56"/><path class="st-rb" d="M11 11l10 10M21 11l-10 10"/><circle class="st-mn" cx="32" cy="32" r="5.5"/><path class="st-rb" d="M43 43l10 10M53 43l-10 10"/><circle class="st-mn" cx="16" cy="48" r="4.5"/>',
  rps: () => '<circle class="iv" cx="19" cy="21" r="11"/><circle class="shade" cx="22" cy="24" r="5"/><rect class="iv" x="35" y="10" width="20" height="24" rx="3"/><path class="st-ink" d="M39 17H51M39 22H51M39 27H47"/>'
    + '<path class="st-bh" d="M16 56L34 38M34 56L16 38"/><circle class="st-bh" cx="14" cy="58" r="3.4"/><circle class="st-bh" cx="36" cy="58" r="3.4"/>',
  guess: () => '<path class="st" d="M7 44H57"/><path class="st-dim" d="M13 40V48M21 41V47M29 41V47M37 41V47M45 41V47M53 40V48"/><rect class="mn" x="22" y="40" width="24" height="8" rx="4" opacity=".5"/>'
    + '<path class="st-bh" d="M24 31H20V57H24M44 31H48V57H44"/><path class="rb" d="M46 5C39 5 35 10 35 15C35 22 46 31 46 31C46 31 57 22 57 15C57 10 53 5 46 5Z"/><circle class="iv" cx="46" cy="15" r="4"/>',
  coins: () => '<circle class="br" cx="24" cy="38" r="17"/><circle class="st-dark" cx="24" cy="38" r="13"/><text class="ink-t" x="24" y="44" font-size="16" font-weight="700" text-anchor="middle">H</text>'
    + '<circle class="sv" cx="42" cy="26" r="17"/><circle class="st-dark" cx="42" cy="26" r="13"/><text class="ink-t" x="42" y="32" font-size="16" font-weight="700" text-anchor="middle">T</text>',
  'poker-flush': () => ['-24', '24', '0'].map((r) => `<g transform="rotate(${r} 32 58)"><rect class="iv" x="20" y="8" width="24" height="36" rx="3"/><use href="#s-spade" class="ci" x="26" y="19" width="12" height="13"/></g>`).join(''),
  'poker-pairs': () => '<g transform="rotate(-8 22 36)"><rect class="iv" x="8" y="8" width="24" height="36" rx="3"/><text class="ink-t" x="12" y="22" font-size="11" font-weight="700">K</text><use href="#s-heart" class="cr" x="14" y="26" width="12" height="12"/></g>'
    + '<g transform="rotate(8 42 36)"><rect class="iv" x="32" y="8" width="24" height="36" rx="3"/><text class="ink-t" x="36" y="22" font-size="11" font-weight="700">K</text><use href="#s-diamond" class="cr" x="38" y="26" width="12" height="12"/></g>'
    + '<path class="st-bh" d="M16 53Q32 63 48 53"/>',
  'poker-straight': () => [0, 1, 2, 3, 4].map((k) => { const h = 14 + k * 8, x = 5 + k * 11.5, y = 56 - h; return `<rect class="iv" x="${x}" y="${y}" width="10" height="${h}" rx="2"/><circle class="br" cx="${x + 5}" cy="${y + 6}" r="2.6"/>`; }).join(''),
  hanoi: () => '<rect class="br" x="6" y="51" width="52" height="5" rx="2"/><rect class="br" x="30" y="9" width="4" height="44" rx="2"/>'
    + '<rect class="rb" x="13" y="42" width="38" height="9" rx="4.5"/><rect class="mn" x="19" y="33" width="26" height="9" rx="4.5"/><rect class="iv" x="25" y="24" width="14" height="9" rx="4.5"/>',
  nim: () => '<circle class="iv" cx="17" cy="46" r="8"/><circle class="iv" cx="33" cy="48" r="8"/><circle class="iv" cx="48" cy="45" r="8"/><circle class="iv" cx="25" cy="32" r="8"/><circle class="iv" cx="41" cy="30" r="8"/>'
    + '<circle class="rb" cx="33" cy="15" r="8"/><path class="st-ink" d="M29 15H37M33 11V19" opacity=".55"/>',
  bingo: () => '<circle class="br" cx="32" cy="32" r="24"/><circle class="st-dark" cx="32" cy="32" r="24"/><circle class="iv" cx="32" cy="32" r="14"/><text class="ink-t" x="32" y="38" font-size="16" font-weight="700" text-anchor="middle">15</text>',
  battleship: () => '<path class="st" d="M10 10H54V54H10Z"/><path class="st-dim" d="M24.7 10V54M39.3 10V54M10 24.7H54M10 39.3H54"/><rect class="mn" x="26" y="27" width="12" height="26" rx="3"/>'
    + '<circle class="st-rb" cx="45" cy="18" r="8"/><path class="st-rb" d="M45 6V30M33 18H57"/>',
  casino: () => '<circle class="st" cx="32" cy="32" r="22"/><circle class="st-dim" cx="32" cy="32" r="13"/><path class="st-dim" d="M32 10V54M10 32H54M16.4 16.4L47.6 47.6M47.6 16.4L16.4 47.6"/><circle class="mn" cx="32" cy="32" r="5"/><circle class="iv" cx="49" cy="21" r="4"/>',
  chess: () => '<path class="st" d="M18 50V30H42"/><path class="st-mn" d="M36 23L44 30L36 37"/><circle class="br" cx="18" cy="50" r="6"/><rect class="st-dim" x="40" y="10" width="14" height="14" rx="2"/>',
  pistolero: () => '<circle class="st" cx="32" cy="32" r="19"/><path class="st-dim" d="M32 8V19M32 45V56M8 32H19M45 32H56"/><circle class="br" cx="32" cy="32" r="5.5"/><path class="st-mn" d="M22 22L42 42"/>',
  werewolf: () => '<path class="br" d="M40 8A24 24 0 1 0 56 42A19 19 0 0 1 40 8Z"/><circle class="mn" cx="26" cy="34" r="3"/><circle class="mn" cx="36" cy="40" r="3"/><path class="st-dim" d="M12 54L20 46M44 54L52 46"/>',
  wordle: () => '<rect class="mn" x="6" y="20" width="14" height="22" rx="3"/><rect class="br" x="25" y="20" width="14" height="22" rx="3"/><rect class="iv" x="44" y="20" width="14" height="22" rx="3"/><path class="st-dim" d="M10 50H54"/>',
  slots: () => '<rect class="mn" x="6" y="18" width="14" height="26" rx="3"/><rect class="br" x="25" y="18" width="14" height="26" rx="3"/><rect class="mn" x="44" y="18" width="14" height="26" rx="3"/><path class="st-dim" d="M10 52H54"/><circle class="iv" cx="32" cy="31" r="3.5"/>',
  connect4: () => '<circle class="br" cx="14" cy="32" r="6"/><circle class="br" cx="28" cy="32" r="6"/><circle class="iv" cx="42" cy="32" r="6"/><circle class="br" cx="56" cy="32" r="0"/><path class="st-dim" d="M8 44H52"/><circle class="mn" cx="49" cy="20" r="4"/>',
  darts: () => '<circle class="st" cx="32" cy="32" r="22"/><circle class="st-dim" cx="32" cy="32" r="12"/><circle class="br" cx="32" cy="32" r="4"/><path class="st-mn" d="M52 12L36 28"/>',
  pong: () => '<rect class="br" x="6" y="16" width="6" height="28" rx="3"/><rect class="br" x="52" y="22" width="6" height="28" rx="3"/><path class="st-dim" d="M32 8V56"/><circle class="iv" cx="36" cy="32" r="5.5"/><path class="st-mn" d="M24 32H16"/>',
};
const GLYPHS = { snakes: ['S&L', 'SNAKES'], mines: ['✹', 'MINES'], hangman: ['H_', 'HANGMAN'], uno: ['UNO', 'CARDS'], dominoes: ['6|4', 'DOMINOES'], bowling: ['10', 'BOWLING'], craps: ['7!', 'CRAPS'], checkers: ['◉', 'CHECKERS'], mastermind: ['●●', 'CODE'], memory: ['??', 'MEMORY'], fizzbuzz: ['15', 'FIZZBUZZ'], yahtzee: ['5x', 'YAHTZEE'], sudoku: ['4x4', 'SUDOKU'], mancala: ['○○', 'MANCALA'], tennis: ['40', 'TENNIS'], property: ['GO', 'PROPERTY'], lottery: ['$', 'LOTTERY'], simon: ['◀▶', 'SIMON'], baccarat: ['9', 'BACCARAT'], highlow: ['↕', 'HI-LO'], golf: ['⚑', 'GOLF'], gofish: ['GO', 'FISH'], snake: ['~S', 'SNAKE'], tetris: ['▦', 'TETRIS'], flappy: ['^', 'FLAPPY'], invaders: ['▲', 'INVADERS'], pacman: ['◖', 'PAC-MAN'], basketball: ['3pt', 'HOOPS'], pig: ['1!', 'PIG'], game2048: ['2048', '2048'], whack: ['WHAM', 'WHACK'], hunt: ['X', 'TREASURE'], hotcold: ['HOT', 'HOT/COLD'] };
Object.entries(GLYPHS).forEach(([k, [g, l]]) => { EMBLEMS[k] = () => `<rect class="br" x="6" y="6" width="52" height="52" rx="12"/><text class="ink-t" x="32" y="${g.length > 2 ? 34 : 38}" font-size="${g.length > 3 ? 15 : g.length > 2 ? 19 : 26}" font-weight="700" text-anchor="middle">${g}</text><text class="ink-t" x="32" y="51" font-size="6.5" font-weight="700" text-anchor="middle">${l}</text>`; });
/* original emblems for the families that used to show a gold plate with letters */
(() => {
  const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  const die = (x, y, s, rot, cls, n, pc) => `<g transform="rotate(${rot} ${x + s / 2} ${y + s / 2})"><rect class="${cls}" x="${x}" y="${y}" width="${s}" height="${s}" rx="${s / 5}"/>${PIPS[n].map(([a, b]) => `<circle class="${pc}" cx="${(x + s / 2 + a * s * 0.27).toFixed(1)}" cy="${(y + s / 2 + b * s * 0.27).toFixed(1)}" r="${(s * 0.08 + 0.8).toFixed(1)}"/>`).join('')}</g>`;
  const pix = (rows, cls, x0, y0, s) => rows.map((r, j) => [...r].map((c, i) => (c === '#' ? `<rect class="${cls}" x="${x0 + i * s}" y="${y0 + j * s}" width="${s}" height="${s}"/>` : '')).join('')).join('');
  const peg = (x, y, cls) => `<circle class="${cls}" cx="${x}" cy="${y}" r="6"/><circle class="iv" cx="${x - 2}" cy="${y - 2}" r="1.6" opacity=".8"/>`;
  const N = {
    snakes: () => '<path class="st-bh" d="M10 56L20 8M28 58L38 10"/><path class="st-bh" d="M13 44H31M15 34H33M17 24H35M19 14H37"/><path class="st-mn" style="stroke-width:6" d="M36 56C58 50 58 38 46 35C32 32 34 20 52 12"/><circle class="rb" cx="53" cy="11" r="4.5"/><circle class="fd" cx="54.5" cy="10" r="1.3"/>',
    mines: () => '<path class="st-rb" d="M32 5V59M5 32H59M13 13L51 51M51 13L13 51"/><circle class="fd" cx="32" cy="32" r="17"/><circle class="st" cx="32" cy="32" r="17"/><circle class="iv" cx="26" cy="26" r="4" opacity=".8"/><path class="st-bh" d="M45 8L52 3"/>',
    hangman: () => '<path class="st-bh" d="M8 58H38M16 58V6H44V15"/><path class="st-bh" d="M16 16L26 6"/><circle class="st-iv" style="stroke-width:2.6;opacity:1" cx="44" cy="22" r="6"/><path class="st-iv" style="stroke-width:2.6;opacity:1" d="M44 28V41M44 32L37 38M44 32L51 38M44 41L38 52M44 41L50 52"/><path class="st-mn" d="M6 8H12M6 3H12" opacity="0"/>',
    uno: () => '<g transform="rotate(-18 32 58)"><rect class="rb" x="17" y="6" width="26" height="40" rx="4"/></g><g transform="rotate(0 32 58)"><rect class="mn" x="19" y="6" width="26" height="40" rx="4"/></g><g transform="rotate(18 32 58)"><rect class="bl" x="21" y="6" width="26" height="40" rx="4"/><ellipse class="iv" cx="34" cy="26" rx="8" ry="14" transform="rotate(28 34 26)"/><circle class="rb" cx="34" cy="26" r="4"/></g>',
    dominoes: () => '<g transform="rotate(-16 32 32)"><rect class="iv" x="19" y="5" width="26" height="54" rx="5"/><path class="st-ink" d="M23 32H41"/>' + [[26, 14], [38, 14], [26, 24], [38, 24]].map(([x, y]) => `<circle class="ink-t" cx="${x}" cy="${y}" r="2.6"/>`).join('') + [[26, 40], [38, 40], [32, 46], [26, 52], [38, 52]].map(([x, y]) => `<circle class="rb" cx="${x}" cy="${y}" r="2.6"/>`).join('') + '</g>',
    bowling: () => '<path class="iv" d="M44 4H50C52 13 54 17 54 23C54 29 51 33 51 39C51 45 53 51 53 58H41C41 51 43 45 43 39C43 33 40 29 40 23C40 17 42 13 44 4Z"/><path class="rb" d="M42 20H52V24H42ZM42 28H52" opacity=".95"/><circle class="fd" cx="22" cy="42" r="17"/><circle class="st" cx="22" cy="42" r="17"/><circle class="bh" cx="17" cy="36" r="2.4"/><circle class="bh" cx="25" cy="34" r="2.4"/><circle class="bh" cx="22" cy="42" r="2.4"/><path class="st-dim" d="M6 60H58" opacity=".5"/>',
    craps: () => die(5, 22, 30, -12, 'iv', 3, 'ink-t') + die(31, 9, 28, 14, 'rb', 4, 'iv'),
    checkers: () => '<ellipse class="fd" cx="24" cy="52" rx="19" ry="8"/><ellipse class="rb" cx="24" cy="46" rx="19" ry="8"/><ellipse class="rb" cx="24" cy="40" rx="19" ry="8"/><ellipse class="st-dark" cx="24" cy="40" rx="12" ry="4.5"/><path class="st-bh" d="M15 33L18 26L24 31L30 26L33 33Z"/><ellipse class="fd" cx="46" cy="30" rx="14" ry="6"/><ellipse class="iv" cx="46" cy="25" rx="14" ry="6"/><ellipse class="st-dark" cx="46" cy="25" rx="8" ry="3"/>',
    mastermind: () => peg(14, 16, 'rb') + peg(30, 16, 'mn') + peg(14, 34, 'bh') + peg(30, 34, 'bl') + '<rect class="st-dim" x="6" y="6" width="32" height="38" rx="6"/><circle class="iv" cx="48" cy="12" r="3.4"/><circle class="iv" cx="56" cy="12" r="3.4"/><circle class="rb" cx="48" cy="21" r="3.4"/><circle class="st-dim" cx="56" cy="21" r="3.4"/><path class="st-bh" d="M8 54H56"/><circle class="mn" cx="16" cy="54" r="0"/>',
    memory: () => '<g transform="rotate(-9 20 34)"><rect class="br" x="6" y="10" width="26" height="38" rx="4"/><path class="st-dark" d="M11 18H27M11 26H27M11 34H27M11 42H27"/></g><g transform="rotate(9 44 30)"><rect class="iv" x="32" y="8" width="26" height="38" rx="4"/><use href="#s-heart" class="cr" x="38" y="17" width="14" height="14"/></g><path class="st-mn" d="M14 56Q32 64 50 56"/>',
    fizzbuzz: () => '<path class="rb" d="M32 4L48 54H16Z"/><path class="st-iv" style="opacity:1;stroke-width:2.4" d="M25 32L39 28M22 42L42 37M28 20L36 18"/><circle class="bh" cx="32" cy="5" r="4.5"/><circle class="mn" cx="12" cy="20" r="3.5"/><circle class="mn" cx="54" cy="26" r="2.6"/><circle class="iv" cx="9" cy="38" r="2.2"/><circle class="bl" cx="55" cy="44" r="3.4"/><path class="st-bh" d="M10 58H54"/>',
    yahtzee: () => die(4, 24, 24, -14, 'iv', 5, 'ink-t') + die(22, 6, 22, 12, 'rb', 5, 'iv') + die(32, 32, 24, 8, 'mn', 5, 'ink-t'),
    sudoku: () => '<rect class="iv" x="6" y="6" width="52" height="52" rx="5"/><rect class="mn" x="19" y="6" width="13" height="13" opacity=".55"/><rect class="mn" x="32" y="45" width="13" height="13" opacity=".55"/><path class="st-ink" style="stroke-width:1.2" d="M19 6V58M45 6V58M6 19H58M6 45H58"/><path class="st-ink" style="stroke-width:2.6" d="M32 6V58M6 32H58"/><text class="ink-t" x="12.5" y="16" font-size="11" font-weight="700" text-anchor="middle">4</text><text class="ink-t" x="38.5" y="29" font-size="11" font-weight="700" text-anchor="middle">2</text><text class="ink-t" x="25.5" y="42" font-size="11" font-weight="700" text-anchor="middle">1</text><text class="ink-t" x="51.5" y="55" font-size="11" font-weight="700" text-anchor="middle">3</text>',
    mancala: () => '<rect class="br" x="3" y="14" width="58" height="36" rx="17"/>' + [0, 1, 2, 3].map((k) => `<circle class="hole" cx="${17 + k * 10.4}" cy="25" r="4.4"/><circle class="hole" cx="${17 + k * 10.4}" cy="39" r="4.4"/>`).join('') + '<ellipse class="hole" cx="9" cy="32" rx="3.4" ry="9"/><ellipse class="hole" cx="55" cy="32" rx="3.4" ry="9"/><circle class="iv" cx="27.4" cy="25" r="1.9"/><circle class="rb" cx="29" cy="26.4" r="1.9"/><circle class="mn" cx="37.8" cy="39" r="1.9"/><circle class="iv" cx="55" cy="29" r="1.9"/><circle class="rb" cx="55" cy="34" r="1.9"/>',
    tennis: () => '<g transform="rotate(-38 24 26)"><ellipse class="st-bh" style="stroke-width:3.6" cx="24" cy="22" rx="14" ry="18"/><path class="st-dim" d="M24 4V40M12 14H36M10 22H38M12 30H36M17 7V37M31 7V37"/><path class="st-bh" style="stroke-width:5" d="M24 40V58"/></g><circle class="mn" cx="49" cy="46" r="9"/><path class="st-iv" style="opacity:1;stroke-width:1.6" d="M42 41Q49 46 42 51M56 41Q49 46 56 51"/><path class="st-dim" d="M44 58H58" opacity=".6"/>',
    property: () => '<path class="rb" d="M6 30L32 8L58 30Z"/><rect class="iv" x="12" y="30" width="40" height="26" rx="2"/><rect class="br" x="28" y="38" width="10" height="18" rx="2"/><rect class="mn" x="16" y="35" width="8" height="8" rx="1"/><rect class="mn" x="41" y="35" width="8" height="8" rx="1"/><rect class="rb" x="42" y="10" width="7" height="12"/><path class="st-dim" d="M4 58H60"/>',
    lottery: () => '<rect class="iv" x="5" y="14" width="54" height="36" rx="5"/><path class="st-dark" style="stroke-dasharray:3 3" d="M14 14V50"/>' + peg(26, 32, 'rb').replace('r="6"', 'r="7"') + peg(40, 32, 'bl').replace('r="6"', 'r="7"') + peg(53, 32, 'mn').replace('r="6"', 'r="5"') + '<path class="st-ink" d="M20 22H48M20 43H40" opacity=".5"/><circle class="bh" cx="10" cy="32" r="2"/>',
    simon: () => '<path class="rb" d="M30 30V6A24 24 0 0 0 6 30Z"/><path class="bh" d="M34 30V6A24 24 0 0 1 58 30Z"/><path class="mn" d="M30 34V58A24 24 0 0 1 6 34Z"/><path class="bl" d="M34 34V58A24 24 0 0 0 58 34Z"/><circle class="fd" cx="32" cy="32" r="9"/><circle class="st" cx="32" cy="32" r="9"/>',
    baccarat: () => '<g transform="rotate(-10 24 36)"><rect class="iv" x="6" y="8" width="28" height="42" rx="4"/><text class="ink-t" x="10" y="23" font-size="14" font-weight="700">9</text><use href="#s-heart" class="cr" x="13" y="28" width="14" height="14"/></g><g transform="rotate(12 44 34)"><rect class="rb" x="30" y="8" width="26" height="40" rx="4"/><rect class="st-iv" x="34" y="12" width="18" height="32" rx="2"/></g><circle class="bh" cx="50" cy="54" r="7"/><circle class="st-dark" cx="50" cy="54" r="4.5"/>',
    highlow: () => '<rect class="iv" x="14" y="10" width="36" height="44" rx="5"/><path class="mn" d="M32 14L44 28H20Z"/><path class="rb" d="M32 50L44 36H20Z"/><path class="st-ink" d="M18 32H46" opacity=".5"/>',
    golf: () => '<path class="mn" d="M2 50Q30 38 62 50V60H2Z"/><ellipse class="fd" cx="44" cy="51" rx="6" ry="2.4"/><path class="st-bh" style="stroke-width:3" d="M44 49V9"/><path class="rb" d="M44 9L58 15L44 22Z"/><circle class="iv" cx="18" cy="48" r="5"/><path class="st-dim" style="stroke-dasharray:2 3.4" d="M20 42Q30 20 42 28"/>',
    gofish: () => '<path class="bl" d="M6 32C16 15 38 15 48 32C38 49 16 49 6 32Z"/><path class="bl" d="M46 32L59 19V45Z"/><circle class="iv" cx="17" cy="29" r="4"/><circle class="fd" cx="16" cy="29" r="2"/><path class="st-iv" style="opacity:.9" d="M27 23Q32 32 27 41M35 24Q40 32 35 40"/><circle class="st-iv" style="opacity:1" cx="12" cy="12" r="3"/><circle class="st-iv" style="opacity:1" cx="20" cy="6" r="2"/>',
    snake: () => '<path class="st-mn" style="stroke-width:8" d="M10 50H42V34H20V18H50"/><circle class="mn" cx="52" cy="18" r="8"/><circle class="fd" cx="50" cy="15" r="1.8"/><circle class="fd" cx="55" cy="15" r="1.8"/><path class="st-rb" style="stroke-width:2" d="M58 19L63 21M58 19L63 17"/><circle class="rb" cx="12" cy="14" r="6"/><path class="st-mn" style="stroke-width:2" d="M12 8V5"/>',
    tetris: () => '<g class="blk"><rect class="bl" x="6" y="38" width="13" height="13"/><rect class="bl" x="19" y="38" width="13" height="13"/><rect class="bl" x="32" y="38" width="13" height="13"/><rect class="bl" x="45" y="38" width="13" height="13"/><rect class="rb" x="6" y="25" width="13" height="13"/><rect class="rb" x="19" y="25" width="13" height="13"/><rect class="rb" x="19" y="12" width="13" height="13"/><rect class="mn" x="45" y="25" width="13" height="13"/><rect class="mn" x="45" y="12" width="13" height="13"/><rect class="mn" x="32" y="12" width="13" height="13" opacity="0"/></g><path class="st-dark" d="M6 51H58M6 38H58M6 25H58M19 12V51M32 12V51M45 12V51"/>',
    flappy: () => '<rect class="mn" x="44" y="0" width="16" height="24"/><rect class="mn" x="41" y="20" width="22" height="8" rx="2"/><rect class="mn" x="44" y="42" width="16" height="22"/><rect class="mn" x="41" y="36" width="22" height="8" rx="2"/><ellipse class="bh" cx="22" cy="32" rx="15" ry="12"/><path class="rb" d="M35 29L47 33L35 37Z"/><circle class="iv" cx="28" cy="27" r="4.4"/><circle class="fd" cx="29" cy="27" r="2"/><path class="iv" d="M10 34Q16 26 22 36Q16 42 10 34Z"/>',
    invaders: () => pix(['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'], 'mn', 6, 8, 4.7) + '<path class="st-bh" d="M10 58H54"/><path class="st-rb" d="M32 49V55"/>',
    pacman: () => '<path class="bh" d="M24 32L40.6 24.8A18 18 0 1 0 40.6 39.2Z"/><circle class="fd" cx="26" cy="22" r="2.4"/><circle class="iv" cx="49" cy="32" r="3"/><circle class="iv" cx="58" cy="32" r="3"/><path class="rb" d="M40 56V46A8 8 0 0 1 56 46V56L52 52L48 56L44 52Z" transform="translate(-1 -1)"/><circle class="iv" cx="44" cy="46" r="2"/><circle class="iv" cx="51" cy="46" r="2"/>',
    basketball: () => '<rect class="iv" x="36" y="4" width="24" height="18" rx="2"/><path class="st-rb" d="M38 22H58"/><path class="st-iv" style="opacity:1;stroke-width:1.4" d="M40 22L43 34M46 22L46 34M52 22L49 34M56 22L52 34"/><circle class="br" cx="18" cy="42" r="14"/><path class="st-dark" d="M4 42H32M18 28V56M8 32Q18 42 8 52M28 32Q18 42 28 52"/><path class="st-dim" style="stroke-dasharray:2 3.4" d="M28 30Q38 12 40 20"/>',
    pig: () => '<circle class="pk" cx="32" cy="34" r="22"/><path class="pk" d="M12 20L22 10L26 22ZM52 20L42 10L38 22Z"/><ellipse class="iv" cx="32" cy="42" rx="11" ry="8" opacity=".5"/><ellipse class="rb" cx="32" cy="42" rx="9" ry="6.5" opacity=".7"/><circle class="fd" cx="28" cy="42" r="1.8"/><circle class="fd" cx="36" cy="42" r="1.8"/><circle class="fd" cx="23" cy="30" r="2.4"/><circle class="fd" cx="41" cy="30" r="2.4"/>' + die(44, 44, 15, 12, 'iv', 1, 'rb'),
    game2048: () => '<rect class="iv" x="6" y="6" width="23" height="23" rx="4"/><text class="ink-t" x="17.5" y="22" font-size="13" font-weight="700" text-anchor="middle">2</text><rect class="bh" x="35" y="6" width="23" height="23" rx="4"/><text class="ink-t" x="46.5" y="22" font-size="13" font-weight="700" text-anchor="middle">4</text><rect class="mn" x="6" y="35" width="23" height="23" rx="4"/><text class="ink-t" x="17.5" y="51" font-size="13" font-weight="700" text-anchor="middle">8</text><rect class="rb" x="35" y="35" width="23" height="23" rx="4"/><text class="ink-t" x="46.5" y="51" font-size="11" font-weight="700" text-anchor="middle" fill="#fff" style="fill:#fff">16</text>',
    whack: () => '<ellipse class="hole" cx="26" cy="52" rx="20" ry="7"/><path class="bn" d="M10 50C10 26 42 26 42 50Z"/><ellipse class="pk" cx="26" cy="36" rx="5.5" ry="4"/><circle class="fd" cx="19" cy="31" r="2.2"/><circle class="fd" cx="33" cy="31" r="2.2"/><ellipse class="hole" cx="26" cy="52" rx="20" ry="3.4" opacity="0"/><g transform="translate(-7 3) rotate(35 50 20)"><rect class="bh" x="47" y="12" width="5" height="40" rx="2"/><rect class="rb" x="38" y="4" width="24" height="16" rx="4"/></g><path class="st-iv" style="opacity:1" d="M44 40L50 44M46 34L54 36"/>',
    hunt: () => '<g transform="rotate(-6 32 32)"><rect class="iv" x="6" y="8" width="52" height="46" rx="4"/><path class="shade" d="M6 40Q20 34 30 42T58 40V54H6Z" opacity=".6"/></g><circle class="rb" cx="16" cy="18" r="3"/><path class="st-rb" style="stroke-width:2;stroke-dasharray:4 4" d="M16 18C28 18 22 34 34 32S42 24 46 36"/><path class="st-rb" style="stroke-width:4.4" d="M42 34L52 46M52 34L42 46"/>',
    hotcold: () => '<rect class="iv" x="28" y="6" width="9" height="40" rx="4.5"/><circle class="rb" cx="32.5" cy="50" r="9"/><rect class="rb" x="30.5" y="22" width="4" height="26"/><path class="rb" d="M12 40C6 32 14 28 12 18C20 24 22 34 18 40C16 44 14 44 12 40Z"/><path class="st-bl" d="M52 22V42M43 32H61M45.5 25.5L58.5 38.5M58.5 25.5L45.5 38.5"/>',
  };
  Object.assign(EMBLEMS, N);
})();

Object.entries(PART_EMB).forEach(([id, e]) => { if (EMBLEMS[e]) EMBLEMS[id] = EMBLEMS[e]; });
Object.assign(EMBLEMS, { 'chess-board': EMBLEMS.chess, 'chess-rook': EMBLEMS.chess, 'chess-bishop': EMBLEMS.chess, 'werewolf-count': EMBLEMS.werewolf, 'wordle-letter': EMBLEMS.wordle, 'wordle-score': EMBLEMS.wordle, 'blackjack-card': EMBLEMS['blackjack-ace'], 'hanoi-next': EMBLEMS.hanoi });
const emblem = (id) => `<svg class="emb" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${EMBLEMS[id] ? EMBLEMS[id]() : ''}</svg>`;

/* ------------------------------------------------------------------ sound: tiny synth, no audio files */
class Sfx {
  constructor() {
    this.on = true; this.ctx = null;
    try { const v = localStorage.getItem('logic-engine-sfx'); if (v !== null) this.on = v === '1'; } catch (e) { /* storage unavailable */ }
  }
  setOn(v) { this.on = v; try { localStorage.setItem('logic-engine-sfx', v ? '1' : '0'); } catch (e) { /* ignore */ } }
  tone(freq, at, dur, type, vol) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.03);
  }
  play(kind) {
    if (!this.on) return;
    try {
      if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; this.ctx = new AC(); }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const song = {
        tick: [[1250, 0, 0.03, 'square', 0.012]],
        good: [[660, 0, 0.09, 'triangle', 0.07], [990, 0.09, 0.16, 'triangle', 0.07]],
        bad: [[190, 0, 0.12, 'sawtooth', 0.05], [140, 0.1, 0.2, 'sawtooth', 0.05]],
        clear: [[523, 0, 0.14, 'triangle', 0.07], [659, 0.12, 0.14, 'triangle', 0.07], [784, 0.24, 0.14, 'triangle', 0.07], [1047, 0.36, 0.4, 'triangle', 0.08]],
        rank: [[392, 0, 0.12, 'triangle', 0.07], [523, 0.1, 0.12, 'triangle', 0.07], [659, 0.2, 0.12, 'triangle', 0.07], [784, 0.3, 0.12, 'triangle', 0.07], [1047, 0.4, 0.45, 'triangle', 0.08]],
      }[kind] || [];
      song.forEach((n) => this.tone(...n));
    } catch (e) { /* audio unavailable */ }
  }
}

/* ------------------------------------------------------------------ confetti for a cleared table */
class Confetti {
  constructor(canvas) { this.c = canvas; this.parts = []; this.running = false; this.dpr = 1; this.t0 = 0; }
  burst() {
    if (!this.c || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const c = this.c, d = (this.dpr = window.devicePixelRatio || 1);
    c.width = Math.round(window.innerWidth * d); c.height = Math.round(window.innerHeight * d);
    const cols = ['#e0b04f', '#f6dc8f', '#e05a55', '#5fd39a', '#f4f2ea'];
    this.parts = Array.from({ length: 120 }, () => ({
      x: Math.random() * c.width, y: -Math.random() * c.height * 0.4,
      vx: (Math.random() - 0.5) * 4 * d, vy: (2 + Math.random() * 4) * d,
      w: (6 + Math.random() * 6) * d, h: (3 + Math.random() * 5) * d,
      r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35, col: cols[Math.floor(Math.random() * cols.length)],
    }));
    this.t0 = performance.now();
    if (!this.running) { this.running = true; requestAnimationFrame((t) => this.step(t)); }
  }
  step(now) {
    const c = this.c, ctx = c.getContext('2d'), age = now - this.t0;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.globalAlpha = age > 2200 ? Math.max(0, 1 - (age - 2200) / 600) : 1;
    this.parts.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.05 * this.dpr; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    });
    if (age < 2800) requestAnimationFrame((t) => this.step(t));
    else { ctx.clearRect(0, 0, c.width, c.height); this.running = false; }
  }
}

/* ============================================================ 5. UI / GAME */
class Store {
  constructor(key) { this.key = key; }
  load() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; } }
  save(data) { try { localStorage.setItem(this.key, JSON.stringify(data)); } catch (e) { /* storage unavailable */ } }
}

const rich = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* =====================================================================
   ARCADE: after a table is cleared, the real game can be played.
   Every ruling of the game is made by the student's own fixed function.
   ===================================================================== */
const rnd = (n) => Math.floor(Math.random() * n);
const pickOne = (a) => a[rnd(a.length)];
const abtn = (act, v, text, cls = '', dis = false) => `<button type="button" class="btn ${cls}" data-act="${act}"${v !== undefined ? ` data-v="${esc(String(v))}"` : ''}${dis ? ' disabled' : ''}>${text}</button>`;
const bjCard = (r) => pokerCardHtml(r === 1 ? 14 : r, r % 4, '', '', undefined);
const pCard = (c) => pokerCardHtml((c % 13) + 2, Math.floor(c / 13), '', '', undefined);
const rankCard = (r, k) => pokerCardHtml(r, (k || 0) % 4, '', '', undefined);
const deck52 = () => shuffle(Array.from({ length: 52 }, (_, i) => i));
const WORDS = ['crane', 'slate', 'irate', 'stare', 'about', 'house', 'plant', 'light', 'world', 'music', 'smile', 'water', 'tiger', 'bread', 'chair', 'dream', 'flame', 'ghost', 'honey', 'jelly', 'knife', 'lemon', 'mango', 'night', 'ocean', 'piano', 'queen', 'river', 'sugar', 'table', 'uncle', 'vivid', 'whale', 'young', 'zebra', 'beach', 'candy', 'dance', 'eagle', 'fruit', 'balls', 'llama', 'lolly', 'bells', 'alley'];

/** A game of "answer the question about this situation": the table's function gives the true answer. */
function roundGame(cfg) {
  return (A) => {
    let streak = 0, r = null, fb = '';
    const draw = () => A.draw(`<div class="arc-top"><span class="chip">In a row: <b>${streak} / ${cfg.goal}</b></span></div><div class="arc-scene">${cfg.show(r)}</div>`
      + `<p class="arc-ask">${cfg.ask}</p><div class="arc-opts">${cfg.options(r).map(([l, v]) => abtn('pick', v, esc(l))).join('')}</div><p class="arc-fb">${fb}</p>`);
    const deal = () => { r = cfg.deal(); draw(); };
    return {
      start() { streak = 0; fb = ''; A.over = false; deal(); },
      act(a, v) {
        if (a !== 'pick' || A.over) return;
        const truth = A.run(cfg.call(r));
        if (String(truth) === String(v)) { streak++; fb = `<b class="good">Right.</b> Your code says ${esc(A.show(truth))}.`; A.sfx('good'); }
        else { streak = 0; fb = `<b class="bad">Not quite.</b> Your code says ${esc(A.show(truth))}. You answered ${esc(A.show(v))}.`; A.sfx('bad'); }
        if (streak >= cfg.goal) { A.end(true, `${cfg.goal} in a row. You have this game figured out.`); return; }
        deal();
      },
    };
  };
}

const KNIGHT = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const knightDist = (a, b) => { const seen = new Map([[a, 0]]); const q = [a]; while (q.length) { const c = q.shift(); if (c === b) return seen.get(c); const x = c % 8, y = Math.floor(c / 8); for (const [dx, dy] of KNIGHT) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx > 7 || ny > 7) continue; const n = ny * 8 + nx; if (!seen.has(n)) { seen.set(n, seen.get(c) + 1); q.push(n); } } } return 99; };

const ARCADE = {
  casino: {
    title: 'Casino Floor: Dozens', intro: 'Bet 10 chips on a dozen. The ball drops in a random pocket and your dozen() function decides who wins. Reach 160 chips before you go broke. A winning dozen pays 3 to 1.',
    make: (A) => { let bank = 100, last = null, fb = '';
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Chips: <b>${bank}</b> / 160</span></div><div class="arc-scene">${last === null ? '<p class="muted">Place your bet.</p>' : `<div class="cz-cell ${last === 0 ? 'zero' : RED_POCKETS.has(last) ? 'red' : 'black'} arc-big">${last}</div>`}</div><p class="arc-ask">Bet 10 chips on:</p><div class="arc-opts">${[1, 2, 3].map((d) => abtn('bet', d, `Dozen ${d}`)).join('')}</div><p class="arc-fb">${fb}</p>`);
      return { start() { bank = 100; last = null; fb = ''; A.over = false; draw(); },
        act(a, v) { if (a !== 'bet' || A.over) return; last = rnd(37); const d = Number(A.run(`console.log(dozen(${last}));`));
          if (d === Number(v)) { bank += 20; fb = `<b class="good">Dozen ${d}: you win 20.</b>`; A.sfx('good'); } else { bank -= 10; fb = `<b class="bad">Your code says dozen ${d}${last === 0 ? ' (the zero)' : ''}. You lose 10.</b>`; A.sfx('bad'); }
          draw(); if (bank >= 160) A.end(true, 'You broke the bank!'); else if (bank <= 0) A.end(false, 'Out of chips. The house always wins eventually.'); } }; },
  },
  bingo: {
    title: 'Bingo Hall: Pick a Ball', intro: 'Two balls roll out. Choose one and the hall pays what your prize() function says. Collect 35 chips in 8 rounds. Remember what pays best.',
    make: (A) => { let pool, rounds, total, pair, fb = '';
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Round <b>${Math.min(rounds + 1, 8)} / 8</b></span><span class="chip">Chips <b>${total} / 35</b></span></div><div class="arc-scene arc-row">${pair.map((b, k) => `<button type="button" class="bg-ball arc-ballbtn" data-act="pick" data-v="${k}" aria-label="Ball ${b}"><b>${b}</b></button>`).join('')}</div><p class="arc-ask">Pick a ball.</p><p class="arc-fb">${fb}</p>`);
      const next = () => { pair = [pool.pop(), pool.pop()]; };
      return { start() { pool = shuffle(Array.from({ length: 75 }, (_, i) => i + 1)); rounds = 0; total = 0; fb = ''; A.over = false; next(); draw(); },
        act(a, v) { if (a !== 'pick' || A.over) return; const b = pair[Number(v)]; const p = Number(A.run(`console.log(prize(${b}));`)); total += p; rounds++;
          fb = `Ball ${b} paid <b>${p}</b>.`; A.sfx(p ? 'good' : 'bad');
          if (total >= 35) { draw(); A.end(true, `${total} chips. The hall is impressed.`); return; } if (rounds >= 8) { draw(); A.end(false, `Only ${total} chips. Look at which balls pay most and try again.`); return; } next(); draw(); } }; },
  },
  rps: {
    title: 'Duel Room: Rock Paper Scissors', intro: 'First to win 3 rounds. The computer picks at random and your winner() function is the referee.',
    make: (A) => { let me, cpu, fb; const NAMES = ['Rock', 'Paper', 'Scissors'];
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">You <b>${me}</b></span><span class="chip">Computer <b>${cpu}</b></span></div><p class="arc-ask">Choose:</p><div class="arc-opts">${NAMES.map((n, k) => abtn('pick', k, n)).join('')}</div><p class="arc-fb">${fb}</p>`);
      return { start() { me = 0; cpu = 0; fb = ''; A.over = false; draw(); },
        act(a, v) { if (a !== 'pick' || A.over) return; const c = rnd(3); const out = A.run(`console.log(winner(${Number(v)}, ${c}));`);
          fb = `You: ${NAMES[v]}. Computer: ${NAMES[c]}. Your code says <b>${esc(out)}</b>.`;
          if (out === 'Player 1') me++; else if (out === 'Player 2') cpu++; A.sfx(out === 'Player 1' ? 'good' : out === 'Tie' ? 'tick' : 'bad'); draw();
          if (me >= 3) A.end(true, 'You win the match.'); else if (cpu >= 3) A.end(false, 'The computer wins the match.'); } }; },
  },
  nim: {
    title: 'Pebble Pit: Nim', intro: '21 stones. Take 1, 2 or 3 per turn, you go first. Whoever takes the last stone wins. The bot picks its move with your bestMove() function. Can you out-think it?',
    make: (A) => { let heap, fb;
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Stones left <b>${heap}</b></span></div><div class="arc-scene"><div class="nm-heap">${Array.from({ length: heap }, () => '<i class="nm-stone"></i>').join('')}</div></div><p class="arc-ask">Take:</p><div class="arc-opts">${[1, 2, 3].map((n) => abtn('take', n, String(n), '', n > heap || A.over)).join('')}</div><p class="arc-fb">${fb}</p>`);
      return { start() { heap = 21; fb = 'Your move.'; A.over = false; draw(); },
        act(a, v) { if (a !== 'take' || A.over) return; heap -= Number(v); fb = `You took ${v}.`; if (heap === 0) { draw(); A.end(true, 'You took the last stone. You win!'); return; }
          const t = Math.min(heap, Math.max(1, Number(A.run(`console.log(bestMove(${heap}));`)))); heap -= t; fb += ` The bot took ${t}.`; A.sfx('tick');
          if (heap === 0) { draw(); A.end(false, 'The bot took the last stone. Hint: leave a multiple of 4 and it can never recover.'); return; } draw(); } }; },
  },
  battleship: {
    title: 'Harbour: Battleship', intro: 'A 3-square ship hides in the 5 by 5 sea. You have 12 shots. Every shot is judged by your isHit() function.',
    make: (A) => { let sea, shots, hits, seen;
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Shots left <b>${12 - shots}</b></span><span class="chip">Hits <b>${hits} / 3</b></span></div><div class="arc-scene"><div class="bs-grid">${sea.map((_, k) => `<button type="button" class="bs-cell arc-cell ${seen[k] === 'h' ? 'ship' : seen[k] === 'm' ? 'miss' : ''}" data-act="fire" data-v="${k}" aria-label="Row ${Math.floor(k / 5)}, column ${k % 5}${seen[k] ? (seen[k] === 'h' ? ', hit' : ', miss') : ''}"${seen[k] || A.over ? ' disabled' : ''}><small>${k}</small></button>`).join('')}</div></div>`);
      return { start() { sea = Array(25).fill(0); const v = rnd(2), r = rnd(v ? 3 : 5), c = rnd(v ? 5 : 3); for (let k = 0; k < 3; k++) sea[(v ? r + k : r) * 5 + (v ? c : c + k)] = 1; shots = 0; hits = 0; seen = {}; A.over = false; draw(); },
        act(a, v) { if (a !== 'fire' || A.over) return; const k = Number(v); const out = A.run(`console.log(isHit([${sea.join(', ')}], ${Math.floor(k / 5)}, ${k % 5}));`, false, `isHit(sea, ${Math.floor(k / 5)}, ${k % 5})`); shots++;
          if (out === 'true') { hits++; seen[k] = 'h'; A.sfx('good'); } else { seen[k] = 'm'; A.sfx('tick'); } draw();
          if (hits >= 3) A.end(true, `Sunk in ${shots} shots.`); else if (shots >= 12) A.end(false, 'Out of shots. The ship got away.'); } }; },
  },
  'poker-flush': { title: 'Poker Room: Spot the Flush', intro: 'Five cards are dealt. Is it a flush? Your isFlush() gives the true answer. Get 4 right in a row.',
    make: roundGame({ goal: 4, ask: 'Is this hand a flush?', deal: () => { if (Math.random() < 0.5) { const s = rnd(4); return shuffle(Array.from({ length: 13 }, (_, i) => s * 13 + i)).slice(0, 5); } const h = deck52().slice(0, 5); return h; },
      show: (h) => `<div class="hand">${h.map(pCard).join('')}</div>`, options: () => [['Yes, a flush', 'true'], ['No', 'false']], call: (h) => `console.log(isFlush([${h.join(', ')}]));` }) },
  'poker-straight': { title: 'Poker Room: Spot the Straight', intro: 'Five ranks in order. Is it a straight? Your isStraight() decides. Get 4 right in a row.',
    make: roundGame({ goal: 4, ask: 'Is this hand a straight?', deal: () => { const st = 2 + rnd(9); if (Math.random() < 0.5) return Array.from({ length: 5 }, (_, i) => st + i); const h = Array.from({ length: 5 }, (_, i) => st + i + (i >= 1 + rnd(4) ? 1 : 0)); return h; },
      show: (h) => `<div class="hand">${h.map((r, k) => rankCard(r, k)).join('')}</div>`, options: () => [['Yes, a straight', 'true'], ['No', 'false']], call: (h) => `console.log(isStraight([${h.join(', ')}]));` }) },
  'poker-pairs': { title: 'Poker Room: Count the Pairs', intro: 'How many pairs of equal ranks hide in this hand? Your countPairs() counts every matching pair. Get 4 right in a row.',
    make: roundGame({ goal: 4, ask: 'How many pairs?', deal: () => Array.from({ length: 5 }, () => 2 + rnd(5)), show: (h) => `<div class="hand">${h.map((r, k) => rankCard(r, k)).join('')}</div>`, options: () => [0, 1, 2, 3, 4, 6].map((n) => [String(n), String(n)]), call: (h) => `console.log(countPairs([${h.join(', ')}]));` }) },
  coins: { title: 'Coin Pit: Streaks', intro: 'A row of 10 coin flips. What is the longest run of heads? Your longestStreak() counts it. Get 3 right in a row.',
    make: roundGame({ goal: 3, ask: 'Longest run of heads in a row:', deal: () => Array.from({ length: 10 }, () => rnd(2)), show: (f) => `<div class="coins">${f.map((x) => `<div class="coin ${x ? 'H' : 'T'}">${x ? 'H' : 'T'}</div>`).join('')}</div>`, options: () => Array.from({ length: 8 }, (_, i) => [String(i), String(i)]), call: (f) => `console.log(longestStreak([${f.join(', ')}]));` }) },
  pong: { title: 'Arcade: Pong Prophet', intro: 'The ball starts on 0 moving right and bounces between the walls on 0 and 9. Where is it after a number of steps? ballAt() knows. Get 4 right in a row.',
    make: roundGame({ goal: 4, ask: 'Where is the ball?', deal: () => 3 + rnd(28), show: (n) => `<p class="arc-big-text">After <b>${n}</b> steps</p><div class="pg-track arc-track">${Array.from({ length: 10 }, (_, k) => `<div class="pg-cell"><small>${k}</small></div>`).join('')}</div>`, options: () => Array.from({ length: 10 }, (_, i) => [String(i), String(i)]), call: (n) => `console.log(ballAt(${n}));` }) },
  roulette: { title: 'Party Corner: The Toy Revolver', intro: 'A toy revolver squirts water from one loaded chamber. It starts at the marked chamber and players pull in turn. On which turn does it squirt? fireTurn() works it out. Get 4 right in a row.',
    make: roundGame({ goal: 4, ask: 'On which turn does it squirt?', deal: () => { const c = [0, 0, 0, 0, 0, 0]; c[rnd(6)] = 1; return { c, s: rnd(6) }; }, show: (r) => `<div class="arc-row">${r.c.map((x, k) => `<span class="arc-chamber${x ? ' loaded' : ''}${k === r.s ? ' start' : ''}">${k === r.s ? '▶' : ''}${x ? '●' : '○'}</span>`).join('')}</div>`, options: () => [1, 2, 3, 4, 5, 6].map((n) => [`Turn ${n}`, String(n)]), call: (r) => `console.log(fireTurn([${r.c.join(', ')}], ${r.s}));` }) },
  tictactoe: {
    title: 'Parlour: Tic Tac Toe', intro: 'You are X. The bot plays O. Your hasWon() function declares the winner.',
    make: (A) => { let b, fb;
      const won = (m) => A.run(`console.log(hasWon([${b.map((x) => JSON.stringify(x)).join(', ')}], "${m}"));`, true) === 'true';
      const draw = () => A.draw(`<div class="arc-scene"><div class="ttt-board">${b.map((x, k) => `<button type="button" class="ttt-cell" data-act="mark" data-v="${k}"${x !== '.' || A.over ? ' disabled' : ''}>${x === '.' ? '' : x}</button>`).join('')}</div></div><p class="arc-fb">${fb}</p>`);
      const bot = () => { const free = b.map((x, k) => (x === '.' ? k : -1)).filter((k) => k >= 0); for (const m of ['O', 'X']) for (const k of free) { b[k] = m; const w = won(m); b[k] = '.'; if (w) return k; } return b[4] === '.' ? 4 : pickOne(free); };
      return { start() { b = Array(9).fill('.'); fb = 'Your move.'; A.over = false; draw(); },
        act(a, v) { if (a !== 'mark' || A.over) return; b[Number(v)] = 'X'; A.run(`console.log(hasWon([${b.map((x) => JSON.stringify(x)).join(', ')}], "X"));`);
          if (won('X')) { draw(); A.end(true, 'Three X in a row. You win!'); return; } if (!b.includes('.')) { draw(); A.end(false, 'A draw. Nobody wins.'); return; }
          b[bot()] = 'O'; if (won('O')) { draw(); A.end(false, 'The bot got three in a row.'); return; } if (!b.includes('.')) { draw(); A.end(false, 'A draw. Nobody wins.'); return; } fb = 'Your move.'; draw(); } }; },
  },
  dealer: {
    title: 'Blackjack Table: Beat the Dealer', intro: 'Hit or stand. Cards count their value (aces are 11). When you stand, your dealerDraw() function plays the dealer\'s hand: it draws until 17 or more.',
    make: (A) => { let deck, me, dealer, fb;
      const val = (x) => x;
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Your total <b>${me.reduce((a, b) => a + b, 0)}</b></span></div><div class="arc-scene"><p class="muted">Your cards</p><div class="arc-row">${me.map((x) => `<span class="arc-num">${x}</span>`).join('')}</div><p class="muted">Dealer shows <b>${dealer[0]}</b> and one hidden card.</p></div><div class="arc-opts">${abtn('hit', undefined, 'Hit', '', A.over)}${abtn('stand', undefined, 'Stand', '', A.over)}</div><p class="arc-fb">${fb}</p>`);
      return { start() { deck = shuffle(Array.from({ length: 52 }, (_, i) => [11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10][i % 13])); me = [deck.pop(), deck.pop()]; dealer = [deck.pop(), deck.pop()]; fb = ''; A.over = false; draw(); },
        act(a) { if (A.over) return; const mine = () => me.reduce((x, y) => x + y, 0);
          if (a === 'hit') { me.push(deck.pop()); if (mine() > 21) { draw(); A.end(false, `Bust with ${mine()}.`); return; } draw(); return; }
          if (a === 'stand') { const d = Number(A.run(`console.log(dealerDraw(${dealer[0] + dealer[1]}, [${deck.slice(-8).reverse().join(', ')}]));`)); fb = `The dealer ends on ${d}.`; draw();
            if (d > 21 || mine() > d) A.end(true, `The dealer ends on ${d}, you have ${mine()}. You win!`); else if (mine() === d) A.end(false, `Both on ${d}. A push, nobody wins.`); else A.end(false, `The dealer's ${d} beats your ${mine()}.`); } } }; },
  },
  'blackjack-ace': {
    title: 'Blackjack Table: Twenty-One', intro: 'Aces count 1 or 11, face cards 10. Both hands are valued by your handValue(). The dealer hits below 17. Beat the dealer without going over 21.',
    make: (A) => { let deck, me, dealer, fb, hide;
      const hv = (h) => Number(A.run(`console.log(handValue([${h.join(', ')}]));`, true));
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Your hand <b>${hv(me)}</b></span></div><div class="arc-scene"><p class="muted">You</p><div class="hand">${me.map(bjCard).join('')}</div><p class="muted">Dealer${hide ? '' : ` (${hv(dealer)})`}</p><div class="hand">${dealer.map((c, k) => (hide && k === 1 ? '<div class="pslot"><div class="pcard back"></div></div>' : bjCard(c))).join('')}</div></div><div class="arc-opts">${abtn('hit', undefined, 'Hit', '', A.over)}${abtn('stand', undefined, 'Stand', '', A.over)}</div><p class="arc-fb">${fb}</p>`);
      return { start() { deck = shuffle(Array.from({ length: 52 }, (_, i) => (i % 13) + 1)); me = [deck.pop(), deck.pop()]; dealer = [deck.pop(), deck.pop()]; hide = true; fb = ''; A.over = false; draw(); A.run(`console.log(handValue([${me.join(', ')}]));`); },
        act(a) { if (A.over) return;
          if (a === 'hit') { me.push(deck.pop()); const v = hv(me); A.run(`console.log(handValue([${me.join(', ')}]));`); if (v > 21) { hide = false; draw(); A.end(false, `Bust with ${v}.`); return; } draw(); return; }
          if (a === 'stand') { hide = false; while (hv(dealer) < 17) dealer.push(deck.pop()); const d = hv(dealer), m = hv(me); A.run(`console.log(handValue([${dealer.join(', ')}]));`); draw();
            if (d > 21 || m > d) A.end(true, `You have ${m}, the dealer ${d > 21 ? 'busts with ' + d : d}. You win!`); else if (m === d) A.end(false, `Both on ${m}. A push.`); else A.end(false, `The dealer's ${d} beats your ${m}.`); } } }; },
  },
  guess: {
    title: 'Number Lounge: Guess the Number', intro: 'A secret number from 1 to 100. Your guessesNeeded() tells how many guesses the best strategy needs. Match that number of guesses or fewer.',
    make: (A) => { let secret, par, n, lo, hi, fb;
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Guesses <b>${n}</b> / ${par}</span><span class="chip">Range <b>${lo} to ${hi}</b></span></div><div class="arc-scene"><form class="arc-form" data-form="guess"><label>Your guess <input type="number" min="1" max="100" inputmode="numeric" id="arc-guess" autocomplete="off"></label>${abtn('guess', undefined, 'Guess', 'primary')}</form></div><p class="arc-fb">${fb}</p>`);
      return { start() { secret = 1 + rnd(100); par = Number(A.run(`console.log(guessesNeeded(${secret}));`, false, 'guessesNeeded(secret)')); n = 0; lo = 1; hi = 100; fb = `Your code needs ${par} guesses for this number. Try the middle each time.`; A.over = false; draw(); },
        act(a) { if (a !== 'guess' || A.over) return; const el = document.getElementById('arc-guess'); const g = Number(el && el.value); if (!Number.isInteger(g) || g < 1 || g > 100) { fb = 'Type a whole number from 1 to 100.'; draw(); return; }
          n++; if (g === secret) { draw(); A.end(n <= par, n <= par ? `Found in ${n}. You matched your code.` : `Found in ${n}, but your code needs only ${par}.`); return; }
          if (g < secret) { lo = Math.max(lo, g + 1); fb = `${g} is too low.`; } else { hi = Math.min(hi, g - 1); fb = `${g} is too high.`; } A.sfx('tick'); draw(); if (n >= par) A.end(false, `Out of guesses. The number was ${secret}.`); } }; },
  },
  hanoi: {
    title: 'Puzzle Room: Tower of Hanoi', intro: 'Move the whole tower from peg A to peg C. Only move one disc at a time and never put a bigger disc on a smaller one. Your hanoiMoves() gives the shortest possible number of moves.',
    make: (A) => { let pegs, sel, moves, par, fb; const N = 4;
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Moves <b>${moves}</b></span><span class="chip">Best possible <b>${par}</b></span></div><div class="arc-scene"><div class="hn-pegs">${pegs.map((p, k) => `<button type="button" class="hn-peg arc-peg${sel === k ? ' sel' : ''}" data-act="peg" data-v="${k}" aria-label="Peg ${'ABC'[k]}, ${p.length} discs"${A.over ? ' disabled' : ''}><span class="hn-pole"></span><div class="hn-stack">${p.slice().reverse().map((d) => `<i class="hn-disc d${d}" style="width:${26 + d * 9}%"></i>`).join('')}</div><b>${'ABC'[k]}</b></button>`).join('')}</div></div><p class="arc-fb">${fb}</p>`);
      return { start() { pegs = [Array.from({ length: N }, (_, i) => N - i), [], []]; sel = null; moves = 0; fb = 'Pick a peg to lift a disc from, then the peg to drop it on.'; A.over = false; par = Number(A.run(`console.log(hanoiMoves(${N}));`)); draw(); },
        act(a, v) { if (a !== 'peg' || A.over) return; const k = Number(v);
          if (sel === null) { if (pegs[k].length) { sel = k; fb = `Lifted from ${'ABC'[k]}.`; } } else if (sel === k) { sel = null; fb = ''; } else { const d = pegs[sel][pegs[sel].length - 1], t = pegs[k][pegs[k].length - 1]; if (t !== undefined && t < d) { fb = 'A bigger disc cannot sit on a smaller one.'; A.sfx('bad'); } else { pegs[k].push(pegs[sel].pop()); moves++; sel = null; fb = ''; A.sfx('tick'); } }
          draw(); if (pegs[2].length === N) A.end(moves <= par, moves <= par ? `Solved in ${moves} moves, the best possible!` : `Solved in ${moves} moves. The best possible is ${par}, can you match it?`); } }; },
  },
  chess: {
    title: 'Chess Club: Knight Hop', intro: 'Hop the knight onto the target square in as few moves as possible. Every hop is checked by your knightMove() function.',
    make: (A) => { let at, target, moves, par, fb;
      const sq = (k) => `${'abcdefgh'[k % 8]}${Math.floor(k / 8) + 1}`;
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Moves <b>${moves}</b></span><span class="chip">Fewest possible <b>${par}</b></span></div><div class="arc-scene"><div class="ch-board arc-board">${Array.from({ length: 64 }, (_, i) => { const r = 7 - Math.floor(i / 8), c = i % 8, k = r * 8 + c; return `<button type="button" class="ch-cell ${(r + c) % 2 ? 'light' : 'dark'}${k === at ? ' from' : ''}${k === target ? ' to' : ''}" data-act="hop" data-v="${k}" aria-label="${sq(k)}${k === at ? ', knight' : k === target ? ', target' : ''}"${A.over ? ' disabled' : ''}>${k === at ? '<span class="ch-knight">&#9822;</span>' : k === target ? '<span class="ch-target">&#9678;</span>' : ''}</button>`; }).join('')}</div></div><p class="arc-fb">${fb}</p>`);
      return { start() { do { at = rnd(64); target = rnd(64); par = knightDist(at, target); } while (par < 2 || par > 4); moves = 0; fb = `Knight on ${sq(at)}, target ${sq(target)}.`; A.over = false; draw(); },
        act(a, v) { if (a !== 'hop' || A.over) return; const k = Number(v); const ok = A.run(`console.log(knightMove(${at % 8}, ${Math.floor(at / 8)}, ${k % 8}, ${Math.floor(k / 8)}));`) === 'true';
          if (ok) { at = k; moves++; fb = `Hopped to ${sq(k)}.`; A.sfx('tick'); } else { fb = `Your code says the knight cannot jump to ${sq(k)}.`; A.sfx('bad'); } draw();
          if (at === target) A.end(moves <= par, moves <= par ? `Reached in ${moves}, the fewest possible!` : `Reached in ${moves}. The fewest possible is ${par}.`); } }; },
  },
  pistolero: {
    title: 'Saloon: Pistolero', intro: 'Each of you has 3 lives. Reload to gain ammo. Shooting costs 1 ammo, the cannon costs 3. Both choose at once and your duel() function says who gets hit.',
    make: (A) => { let hp, ammo, fb; const N = ['Reload', 'Shoot', 'Shield', 'Cannon'];
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">You <b>${'♥'.repeat(hp[0])}</b> ammo ${ammo[0]}</span><span class="chip">Bandit <b>${'♥'.repeat(hp[1])}</b> ammo ${ammo[1]}</span></div><p class="arc-ask">Your move:</p><div class="arc-opts">${N.map((n, k) => abtn('mv', k, n, '', A.over || (k === 1 && ammo[0] < 1) || (k === 3 && ammo[0] < 3))).join('')}</div><p class="arc-fb">${fb}</p>`);
      return { start() { hp = [3, 3]; ammo = [0, 0]; fb = 'Draw!'; A.over = false; draw(); },
        act(a, v) { if (a !== 'mv' || A.over) return; const m = Number(v); const opts = [0, 2]; if (ammo[1] >= 1) opts.push(1, 1); if (ammo[1] >= 3) opts.push(3, 3); const c = pickOne(opts);
          const res = Number(A.run(`console.log(duel(${m}, ${c}));`)); if (m === 0) ammo[0]++; if (c === 0) ammo[1]++; if (m === 1) ammo[0]--; if (c === 1) ammo[1]--; if (m === 3) ammo[0] -= 3; if (c === 3) ammo[1] -= 3;
          if (res === 1) hp[1]--; else if (res === -1) hp[0]--; fb = `You: ${N[m]}. Bandit: ${N[c]}. ${res === 1 ? '<b class="good">You hit him!</b>' : res === -1 ? '<b class="bad">He hit you!</b>' : 'Nobody is hit.'}`; A.sfx(res === 1 ? 'good' : res === -1 ? 'bad' : 'tick'); draw();
          if (hp[1] <= 0) A.end(true, 'The bandit is down. You win the duel!'); else if (hp[0] <= 0) A.end(false, 'You are down. Better luck next time, partner.'); } }; },
  },
  werewolf: {
    title: 'Village Square: Werewolf', intro: 'You are the seer and you know who the werewolf is. The other four villagers have voted. Cast the last vote so that the village banishes the wolf. A tie banishes nobody. Your eliminated() function counts the votes. Win 3 nights.',
    make: (A) => { let wolf, votes, wins, fb;
      const who = (v) => { const c = [0, 0, 0, 0, 0]; v.forEach((x) => c[x]++); const m = Math.max(...c); return c.filter((x) => x === m).length > 1 ? -1 : c.indexOf(m); };
      const deal = () => { do { wolf = rnd(4); votes = [0, 1, 2, 3].map((p) => { let t; do { t = rnd(5); } while (t === p); return t; }); } while (![0, 1, 2, 3, 4].some((m) => who([...votes, m]) === wolf)); };
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Nights won <b>${wins} / 3</b></span></div><div class="arc-scene"><p class="muted">The werewolf is <b>${PLAYERS[wolf]}</b>. Votes so far:</p><div class="arc-row">${votes.map((v, p) => `<span class="arc-vote"><b>${PLAYERS[p]}</b> → ${PLAYERS[v]}</span>`).join('')}</div></div><p class="arc-ask">You are ${PLAYERS[4]}. Who do you vote for?</p><div class="arc-opts">${PLAYERS.map((n, k) => abtn('vote', k, n, '', k === 4)).join('')}</div><p class="arc-fb">${fb}</p>`);
      return { start() { wins = 0; fb = ''; A.over = false; deal(); draw(); },
        act(a, v) { if (a !== 'vote' || A.over) return; const out = Number(A.run(`console.log(eliminated([${[...votes, Number(v)].join(', ')}]));`));
          if (out === wolf) { wins++; fb = `<b class="good">${PLAYERS[wolf]} is banished!</b>`; A.sfx('good'); if (wins >= 3) { A.draw(''); A.end(true, 'Three nights, three wolves. The village is safe.'); return; } deal(); draw(); return; }
          fb = out === -1 ? '<b class="bad">Tied vote: nobody is banished and the wolf strikes.</b>' : `<b class="bad">The village banished ${PLAYERS[out]}, an innocent villager.</b>`; A.sfx('bad'); A.end(false, 'The wolf won this night.'); } }; },
  },
  wordle: {
    title: 'Word Salon: Wordle', intro: 'Guess the secret 5-letter word in 6 tries. Tiles show green and yellow. Beside them, your wordleScore() adds up the points of every guess (2 per green, 1 per yellow).',
    make: (A) => { let secret, rows, fb;
      const tiles = (g) => { const col = g.split('').map(() => 'grey'); const left = {}; secret.split('').forEach((c, i) => { if (g[i] === c) col[i] = 'green'; else left[c] = (left[c] || 0) + 1; }); g.split('').forEach((c, i) => { if (col[i] !== 'green' && left[c] > 0) { col[i] = 'yellow'; left[c]--; } }); return col; };
      const draw = () => A.draw(`<div class="arc-scene wd-rows">${rows.map((r) => { const c = tiles(r.g); return `<div class="wd-row">${r.g.split('').map((ch, i) => `<span class="wd-tile ${c[i]}">${ch}</span>`).join('')}<span class="chip arc-pts">${r.pts} pts</span></div>`; }).join('')}</div><form class="arc-form" data-form="word"><label>Guess ${rows.length + 1} of 6 <input type="text" id="arc-word" maxlength="5" autocomplete="off" autocapitalize="off" spellcheck="false"${A.over ? ' disabled' : ''}></label>${abtn('word', undefined, 'Guess', 'primary', A.over)}</form><p class="arc-fb">${fb}</p>`);
      return { start() { secret = pickOne(WORDS); rows = []; fb = 'Type any 5-letter word.'; A.over = false; draw(); },
        act(a) { if (a !== 'word' || A.over) return; const el = document.getElementById('arc-word'); const g = String((el && el.value) || '').trim().toLowerCase(); if (!/^[a-z]{5}$/.test(g)) { fb = 'Five letters, a to z.'; draw(); return; }
          const pts = Number(A.run(`console.log(wordleScore([${secret.split('').map((c) => JSON.stringify(c)).join(', ')}], [${g.split('').map((c) => JSON.stringify(c)).join(', ')}]));`, false, `wordleScore(secret, [${g.split('').map((c) => JSON.stringify(c)).join(', ')}])`)); rows.push({ g, pts }); fb = ''; A.sfx('tick'); draw();
          if (g === secret) A.end(true, `Solved in ${rows.length}. ${pts} points: all green.`); else if (rows.length >= 6) A.end(false, `Out of tries. The word was ${secret.toUpperCase()}.`); } }; },
  },
  slots: {
    title: 'Slot Hall: The One-Armed Bandit', intro: 'Each spin costs 5 chips and your payout() function decides what comes back (multiplied by the 5 chips you bet). Reach 150 chips before you run out.',
    make: (A) => { let bank, reels, fb;
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Chips <b>${bank}</b> / 150</span></div><div class="arc-scene"><div class="sl-machine">${reels.map((v) => `<span class="sl-reel s${v}"><b>${v === null ? '?' : SLOT_SYMBOLS[v]}</b></span>`).join('')}</div></div><div class="arc-opts">${abtn('spin', undefined, 'Spin for 5', 'primary', A.over)}</div><p class="arc-fb">${fb}</p>`);
      return { start() { bank = 100; reels = [null, null, null]; fb = ''; A.over = false; draw(); },
        act(a) { if (a !== 'spin' || A.over) return; reels = [rnd(6), rnd(6), rnd(6)]; const p = Number(A.run(`console.log(payout(${reels.join(', ')}));`)); bank += p * 5 - 5;
          fb = p ? `<b class="good">Pays ${p}: +${p * 5 - 5} chips.</b>` : '<b class="bad">Nothing. -5 chips.</b>'; A.sfx(p ? 'good' : 'bad'); draw();
          if (bank >= 150) A.end(true, 'Jackpot night. You cashed out!'); else if (bank <= 0) A.end(false, 'Broke. The machine ate your chips.'); } }; },
  },
  connect4: { title: 'Game Night: Four in a Row', intro: 'A row of a Connect Four grid. Did the colour shown win it? Your fourInRow() says. Get 4 right in a row.',
    make: roundGame({ goal: 4, ask: 'Does this colour have four in a row?', deal: () => { const mark = 1 + rnd(2); const row = Array.from({ length: 7 }, () => rnd(3)); if (Math.random() < 0.6) { const s = rnd(4); for (let k = 0; k < 4; k++) row[s + k] = mark; } return { row, mark }; },
      show: (r) => `<div class="c4-row">${r.row.map((v, k) => `<span class="c4-slot"><i class="c4-disc d${v}"></i><small>${k}</small></span>`).join('')}</div><p class="arc-big-text">Colour: <b>${r.mark === 1 ? 'red' : 'yellow'}</b></p>`,
      options: () => [['Yes, four in a row', 'true'], ['No', 'false']], call: (r) => `console.log(fourInRow([${r.row.join(', ')}], ${r.mark}));` }) },
  darts: {
    title: 'Pub: Darts', intro: 'Throw 5 darts by clicking the board. The centre is (0, 0). Your dartScore() scores every throw. Score at least 100.',
    make: (A) => { let left, total, last, fb;
      const ring = (x, y) => { const d = x * x + y * y; return d <= 1 ? 'r50' : d <= 16 ? 'r20' : d <= 64 ? 'r10' : ''; };
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">Darts left <b>${left}</b></span><span class="chip">Score <b>${total} / 100</b></span></div><div class="arc-scene"><div class="dt-click">${Array.from({ length: 441 }, (_, k) => { const x = (k % 21) - 10, y = 10 - Math.floor(k / 21); return `<button type="button" class="dt-sq ${ring(x, y)}${last && last.x === x && last.y === y ? ' last' : ''}" data-act="throw" data-v="${x},${y}" aria-label="x ${x}, y ${y}"${A.over ? ' disabled' : ''}></button>`; }).join('')}</div></div><p class="arc-fb">${fb}</p>`);
      return { start() { left = 5; total = 0; last = null; fb = 'Aim for the middle.'; A.over = false; draw(); },
        act(a, v) { if (a !== 'throw' || A.over) return; const [x, y] = String(v).split(',').map(Number); const s = Number(A.run(`console.log(dartScore(${x}, ${y}));`)); total += s; left--; last = { x, y }; fb = `Dart at (${x}, ${y}) scores <b>${s}</b>.`; A.sfx(s ? 'good' : 'tick'); draw();
          if (total >= 100) A.end(true, `${total} points. Bullseye hunter!`); else if (left <= 0) A.end(false, `${total} points. You needed 100.`); } }; },
  },
};

const callTextFor = (run, lang) => { const m = String(run).match(/^console\.log\((.*)\);$/s); let t = m ? m[1] : String(run); if (lang === 'py') t = t.replace(/\b[a-z]+(?:[A-Z][a-z0-9]*)+\b/g, snakeCase).replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False'); return t; };
const normAns = (s) => String(s).trim().toLowerCase().replace(/^["']|["']$/g, '');


const CHEAT = {
  js: [['Give back an answer', 'return total;'], ['If something is true', 'if (x === 3) {\n  ...\n}'], ['Otherwise', '} else {\n  ...\n}'], ['And  /  Or', 'a && b      a || b'], ['Make a box that holds a number', 'let total = 0;'], ['Add 1 to the box', 'total += 1;'], ['Repeat 5 times', 'for (let i = 0; i < 5; i++) {\n  ...\n}'], ['Repeat while something is true', 'while (total < 17) {\n  ...\n}'], ['Leftover after dividing', 'x % 4'], ['Divide and drop the leftover', 'Math.floor(x / 4)'], ['Take item number i from a list', 'list[i]']],
  py: [['Give back an answer', 'return total'], ['If something is true', 'if x == 3:\n    ...'], ['Otherwise', 'else:\n    ...'], ['And  /  Or', 'a and b      a or b'], ['Make a box that holds a number', 'total = 0'], ['Add 1 to the box', 'total += 1'], ['Repeat 5 times', 'for i in range(5):\n    ...'], ['Repeat while something is true', 'while total < 17:\n    ...'], ['Leftover after dividing', 'x % 4'], ['Divide and drop the leftover', 'x // 4'], ['Take item number i from a list', 'items[i]']],
  java: [['Give back an answer', 'return total;'], ['If something is true', 'if (x == 3) {\n    ...\n}'], ['Otherwise', '} else {\n    ...\n}'], ['And  /  Or', 'a && b      a || b'], ['Make a box that holds a number', 'int total = 0;'], ['Add 1 to the box', 'total += 1;'], ['Repeat 5 times', 'for (int i = 0; i < 5; i++) {\n    ...\n}'], ['Repeat while something is true', 'while (total < 17) {\n    ...\n}'], ['Leftover after dividing', 'x % 4'], ['Divide and drop the leftover', 'x / 4   (whole numbers drop it)'], ['Take item number i from a list', 'list[i]']],
};
const STEP_NAMES = [['meet', 'Meet it'], ['understand', 'Try it'], ['plan', 'Recipe'], ['code', 'Code it'], ['done', 'Done']];
const STEP_TITLES = { understand: 'What comes out?', plan: 'Make a recipe', code: 'Write the code', done: 'You did it!' };

/* Every lesson without a hand-made game gets a small "beat the machine" game: the machine runs the finished function on a challenge and you guess its answer. */
function autoArcade(L) {
  const fnName = (L.fix.lines.map((l) => l.match(/^function (\w+)/)).find(Boolean) || [0, 'f'])[1];
  const exprs = L.fix.tests.map((t) => t.run.match(/^console\.log\((.*)\);$/s)[1]);
  const split = (e) => { const m = e.match(/^(\w+)\((.*)\)$/s); if (!m) return null; const args = m[2].split(',').map((s) => s.trim()); return args.every((a) => /^-?\d+$/.test(a)) ? { name: m[1], args: args.map(Number) } : null; };
  const nums = exprs.map(split);
  const numeric = nums.every(Boolean) && nums.every((n) => n.args.length === nums[0].args.length && n.name === nums[0].name);
  const domains = numeric ? nums[0].args.map((_, k) => [...new Set(nums.map((n) => n.args[k]))]) : null;
  const expects = [...new Set(L.fix.tests.map((t) => t.expect))];
  const nice = L.title.replace(/^Table \d+ · /, '').replace(/^[^:]*: /, '');
  return {
    title: `${L.game}: ${nice.charAt(0).toUpperCase() + nice.slice(1)}`,
    intro: `Your ${fnName}() function is the machine's brain. Each round the machine gets a challenge and answers it. Guess what it says. Get 5 right in a row to win. Three wrong guesses and the machine wins.`,
    make: (A) => {
      let streak = 0, lives = 3, call = '', truth = '', opts = [], fb = '', bag = [], last = '';
      const pick = () => {
        for (let tries = 0; tries < 6; tries++) {
          let c;
          if (numeric && Math.random() < 0.5) c = `${nums[0].name}(${domains.map((d) => d[rnd(d.length)]).join(', ')})`;
          else { if (!bag.length) bag = shuffle(exprs); c = bag.pop(); }
          if (c !== last || exprs.length < 2) { last = c; return c; }
        }
        return last;
      };
      const deal = () => {
        call = pick(); truth = A.run(`console.log(${call});`, true);
        opts = shuffle([truth, ...shuffle(expects.filter((e) => e !== truth)).slice(0, 3)]);
        draw();
      };
      const draw = () => A.draw(`<div class="arc-top"><span class="chip">In a row: <b>${streak} / 5</b></span><span class="chip">Lives: <b>${'♥'.repeat(lives)}${'♡'.repeat(3 - lives)}</b></span></div>`
        + `<div class="arc-scene"><p class="muted">The machine gets this challenge:</p><code class="arc-call">${esc(A.callText(`console.log(${call});`))}</code></div>`
        + `<p class="arc-ask">What does it answer?</p><div class="arc-opts">${opts.map((v) => abtn('pick', v, esc(A.show(v)))).join('')}</div><p class="arc-fb">${fb}</p>`);
      return {
        start() { streak = 0; lives = 3; fb = ''; last = ''; bag = []; A.over = false; deal(); },
        act(a, v) {
          if (a !== 'pick' || A.over) return;
          if (String(truth) === String(v)) { streak++; fb = `<b class="good">Right.</b> The machine says ${esc(A.show(truth))}.`; A.sfx('good'); }
          else { streak = 0; lives--; fb = `<b class="bad">Not quite.</b> The machine says ${esc(A.show(truth))}. You said ${esc(A.show(v))}.`; A.sfx('bad'); }
          if (streak >= 5) { draw(); A.end(true, '5 in a row. You can predict the machine. That means you really understand it.'); return; }
          if (lives <= 0) { draw(); A.end(false, 'The machine wins this time. Read the rules again and try once more.'); return; }
          deal();
        },
      };
    },
  };
}
LEVELS.forEach((L) => { if (!ARCADE[L.id]) ARCADE[L.id] = autoArcade(L); });

