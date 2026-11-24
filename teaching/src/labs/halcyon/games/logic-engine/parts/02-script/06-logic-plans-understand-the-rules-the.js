/* ---------------------------------------------------------------- logic plans: understand the rules, then plan in plain words, then code */
const PLANS = {
  'chess-board': {
    task: 'Write onBoard(x, y). Answer true when the square is on the 8 by 8 board (both numbers from 0 to 7), otherwise false.',
    steps: [['If x is below 0, the square is off the board: answer false.', 'Compare x with 0 and return early.'], ['If x is above 7, answer false.', 'The same idea for the other edge.'], ['Do the same two checks for y.', 'Below 0 and above 7.'], ['If no check failed, the square is on the board: answer true.', 'This line runs only when every earlier check passed.']],
    decoys: [['If x is 8, answer true.', 'Column 8 does not exist. The last column is 7.'], ['Check whether another piece is standing on the square.', 'This function only looks at the numbers.']],
  },
  'chess-rook': {
    task: 'Write rookMove(x1, y1, x2, y2). A rook slides along a row or a column. Answer true for a real slide and false otherwise. Staying put is not a slide.',
    steps: [['If both squares are the same, the rook did not move: answer false.', 'Both x and y are equal.'], ['If the columns are equal, it slid up or down: answer true.', 'Compare x1 with x2.'], ['If the rows are equal, it slid sideways: answer true.', 'Compare y1 with y2.'], ['Otherwise answer false.', 'Anything else is not a straight line.']],
    decoys: [['If the columns or the rows are equal, answer true right away.', 'Standing still has equal columns and rows, so this wrongly says yes.'], ['Check whether another piece blocks the way.', 'The function does not know about other pieces.']],
  },
  'chess-bishop': {
    task: 'Write bishopMove(x1, y1, x2, y2). A bishop slides along a diagonal, any length. Answer true or false.',
    steps: [['Work out how many columns apart the squares are, never negative.', 'Subtract and use Math.abs.'], ['Work out how many rows apart, never negative.', 'The same for the rows.'], ['If it did not move at all, answer false.', 'dx is 0.'], ['If the two distances are equal, it is a diagonal: answer true.', 'Compare dx with dy.'], ['Otherwise answer false.', 'Anything else is not a diagonal.']],
    decoys: [['Answer true only when both distances are exactly 1.', 'That allows single steps only. A bishop can slide far.'], ['Answer true when dx plus dy is even.', 'Many non-diagonals have an even sum, for example 2 and 0.']],
  },
  'werewolf-count': {
    task: 'Write countVotes(votes, who). Answer how many ballots in the list are for player who.',
    steps: [['Start a counter at 0.', 'A variable that holds a number.'], ['Look at every ballot in the list, one after the other.', 'A loop from 0 up to the length of the list.'], ['If the ballot is for who, add 1 to the counter.', 'An if inside the loop.'], ['When the loop is finished, answer the counter.', 'Return after the loop, not inside it.']],
    decoys: [['Answer the first ballot.', 'One ballot says nothing about the total.'], ['Stop as soon as one ballot matches.', 'You need all the matches, so the loop must keep going.']],
  },
  'wordle-letter': {
    task: 'Write inWord(secret, letter). Answer true if the letter is anywhere in the 5-letter secret word, otherwise false.',
    steps: [['Look at the five positions of the secret one after the other.', 'A loop from 0 to 4.'], ['If the letter at this position is the one we look for, answer true.', 'Returning ends the function straight away.'], ['If the loop ends without a match, answer false.', 'Return false after the loop, never inside it.']],
    decoys: [['If a position does not match, answer false.', 'One wrong position does not mean the letter is missing elsewhere.'], ['Answer true after the loop.', 'Reaching the end means nothing matched.']],
  },
  'wordle-score': {
    task: 'Write letterScore(secret, guess, i). Score letter number i of the guess: 2 if it is in the right place, 1 if it is somewhere else in the secret, otherwise 0. The helper inWord is already written.',
    steps: [['If the guess letter equals the secret letter at the same position, answer 2.', 'Compare guess[i] with secret[i].'], ['Otherwise, if the letter is somewhere in the secret, answer 1.', 'Use the helper inWord.'], ['Otherwise answer 0.', 'The letter is not there at all.']],
    decoys: [['First check whether the letter is anywhere in the word and answer 1.', 'A letter in the right place is also in the word, so it would score 1 instead of 2.'], ['Add up the scores of all five letters.', 'This function scores one letter only.']],
  },
  'blackjack-card': {
    task: 'Write cardValue(rank). Jack, queen and king (11, 12, 13) are worth 10. Every other card is worth its own number.',
    steps: [['If the card is above 10, it is a face card.', 'A comparison with 10.'], ['A face card is worth 10: answer 10.', 'Return the fixed value.'], ['Any other card is worth its own number: answer rank.', 'This line runs only for the number cards.']],
    decoys: [['If the card is above 11, answer 10.', 'The jack is exactly 11, so it would be missed.'], ['Answer 10 for every card.', 'Number cards keep their own value.']],
  },
  'hanoi-next': {
    task: 'Write nextMoves(m). The tower with one disc fewer needs m moves. Answer the moves for the tower with one more disc.',
    steps: [['The small tower moves out of the way: that is m moves.', 'Use the number m.'], ['The big disc moves once: add 1.', 'One more move.'], ['The small tower moves back on top: add m again. In total 2 * m + 1.', 'Double m and add 1, then answer it.']],
    decoys: [['Answer m + 1.', 'That forgets that the small tower must move twice.'], ['Answer 3 * m.', 'The big disc moves once, not m times.']],
  },
  casino: {
    task: 'Write dozen(pocket). It answers 1, 2 or 3 for the dozen a roulette number belongs to (1 to 12, 13 to 24, 25 to 36), and 0 for the green zero.',
    steps: [['Check whether the number is the green zero.', 'A condition that compares the number with 0.'], ['If it is zero, answer 0 right away.', 'Returning ends the function, so nothing after it runs.'], ['Shift the number down by one, so 12 counts as 11 and 13 counts as 12.', 'Subtract 1. Groups of 12 start at 1, not at 0.'], ['Divide by 12 and drop the remainder to get the group: 0, 1 or 2.', 'Whole-number division, the kind that throws the remainder away.'], ['Add 1, because dozens are numbered from 1, and answer with that.', 'Group 0, 1, 2 becomes dozen 1, 2, 3.']],
    decoys: [['Multiply the number by 12.', 'Multiplying makes the number bigger. Dividing is what splits it into groups of 12.'], ['Check whether the number is red or black.', 'Colour plays no part in a dozen bet.']],
  },
  bingo: {
    task: 'Write prize(ball). A ball that divides by 15 pays 15 chips, one that divides by 3 pays 3, one that divides by 5 pays 5, and every other ball pays 0.',
    steps: [['If the ball divides by 15, answer 15.', 'A number divides evenly when the remainder is 0.'], ['Otherwise, if it divides by 3, answer 3.', 'Only reached when the first check failed.'], ['Otherwise, if it divides by 5, answer 5.', 'Same idea, one more branch.'], ['If none of the checks matched, answer 0.', 'The last line, outside every check.']],
    decoys: [['Check 3 first, then 5, then 15.', 'The ball 15 would stop at the first check and never earn the jackpot. The strictest rule goes first.'], ['Add up the prizes of every rule that matches.', 'Each ball pays exactly one prize.']],
  },
  rps: {
    task: 'Write winner(a, b). Moves are 0 rock, 1 paper, 2 scissors. Answer "Tie", "Player 1" or "Player 2" (each move beats the one before it, and rock beats scissors).',
    steps: [['Work out the difference of the moves around the circle: (a - b + 3) mod 3.', 'Adding 3 first keeps the result from going negative before taking the remainder.'], ['If the difference is 0, answer "Tie".', 'Equal moves cancel out.'], ['If the difference is 1, answer "Player 1".', 'Rock (0) minus scissors (2) wraps around to 1.'], ['Otherwise answer "Player 2".', 'The only difference left is 2.']],
    decoys: [['If a is bigger than b, player 1 wins.', 'Rock beats scissors even though 0 is smaller than 2.'], ['Pick a random winner.', 'The answer must follow the rules.']],
  },
  nim: {
    task: 'Write bestMove(stones). The bot may take 1, 2 or 3 stones. Answer how many to take so that a multiple of 4 stays in the heap. If no move can do that, take 1.',
    steps: [['Find the remainder when the heap is divided by 4.', 'The remainder operator.'], ['If the remainder is 0, there is no winning move: answer 1.', 'A heap that is already a multiple of 4 favours the opponent.'], ['Otherwise answer the remainder itself.', 'Taking exactly the remainder leaves a multiple of 4.']],
    decoys: [['Always take 3.', 'A fixed number only works for some heaps.'], ['Take half of the stones.', 'A move is only allowed to take 1 to 3 stones.']],
  },
  battleship: {
    task: 'Write isHit(sea, row, col). sea is a flat list of 25 squares (1 is a ship) holding a 5 by 5 grid row after row. Answer true when the shot hits a ship.',
    steps: [['Turn the row and column into one position in the flat list.', 'Each row holds 5 squares: skip row times 5 squares, then add the column.'], ['Look at what is stored at that position.', 'Index into the list.'], ['Answer true if it holds a ship (1), otherwise false.', 'Compare it with 1.']],
    decoys: [['Multiply the row by 4 and add the column.', 'A row holds five squares, not four.'], ['Count how many ship squares exist.', 'Only the square that was shot matters.']],
  },
  'poker-flush': {
    task: 'Write suitOf(card). The deck is numbered 0 to 51 with 13 cards per suit in order (0 to 12 is suit 0, 13 to 25 is suit 1, and so on). Answer the suit number, 0 to 3. The flush check is already written for you.',
    steps: [['Notice that each suit is a block of 13 consecutive numbers.', 'No code yet: just spot the pattern.'], ['Divide the card number by 13 and drop the remainder.', 'Whole-number division.'], ['Answer that result.', 'It is the block number, which is the suit.']],
    decoys: [['Take the remainder of dividing by 13.', 'That gives the rank of the card inside its suit, not the suit.'], ['Divide by 12.', 'There are 13 cards per suit, so the blocks are 13 wide.']],
  },
  slots: {
    task: 'Write payout(a, b, c). Three equal symbols pay 10, any two equal symbols pay 2 (wherever they are), and anything else pays 0.',
    steps: [['If all three reels match, answer 10.', 'Two comparisons joined with "and".'], ['Otherwise, if a equals b, or b equals c, or a equals c, answer 2.', 'Three comparisons joined with "or": there are three possible pairs.'], ['Otherwise answer 0.', 'Nothing matched.']],
    decoys: [['If a equals b or b equals c, answer 2.', 'The first and last reels can match with another symbol between them.'], ['Add the prizes of every match.', 'A spin pays one prize.']],
  },
  tictactoe: {
    task: 'Write lineWins(board, a, b, c, mark). a, b and c are three squares of the board. Answer true when all three hold the given mark. The code that tries all eight lines is already written for you.',
    steps: [['Look at the square at position a and check it holds the mark.', 'Index into the board and compare.'], ['Do the same for position b.', 'The same comparison again.'], ['Do the same for position c.', 'And once more.'], ['Answer true only when all three checks passed.', 'Combine the three comparisons with "and".']],
    decoys: [['Answer true when any one of the squares holds the mark.', 'One matching square is not a line of three.'], ['Check that the three squares are next to each other.', 'The caller already chooses squares that form a line.']],
  },
  chess: {
    task: 'Write knightMove(x1, y1, x2, y2). Answer true when a knight can jump from the first square to the second, otherwise false.',
    steps: [['Work out how many columns apart the squares are, never negative.', 'Subtract and take the absolute value.'], ['Work out how many rows apart they are, never negative.', 'The same, for the rows.'], ['If it is 1 column and 2 rows, the jump is legal: answer true.', 'Two comparisons joined with "and".'], ['If it is 2 columns and 1 row, the jump is legal: answer true.', 'The mirror image of the previous case.'], ['Otherwise answer false.', 'Whatever is left is not a knight move.']],
    decoys: [['If the two distances add up to 3, answer true.', 'Several pairs add up to 3, for example 0 and 3, and those are not an L-shape.'], ['Check whether the target square is empty.', 'The board contents are not part of this function.']],
  },
  pistolero: {
    task: 'Write duel(a, b). Moves are 0 reload, 1 shoot, 2 shield, 3 cannon. Answer 1 when player A hits, -1 when player B hits and 0 when nobody does.',
    steps: [['If A fires a cannon and B does not, A hits: answer 1.', 'A cannon beats everything except another cannon.'], ['If B fires a cannon and A does not, B hits: answer -1.', 'The mirror image.'], ['If A shoots while B is reloading, A hits: answer 1.', 'A shot only hurts someone who is reloading.'], ['If B shoots while A is reloading, B hits: answer -1.', 'The mirror image again.'], ['In every other case nobody is hit: answer 0.', 'Shields, draws and wasted moves all end here.']],
    decoys: [['If A shoots and B does anything except shoot, A hits.', 'That lets a bullet go straight through a shield.'], ['Count how many bullets each player has left.', 'The game keeps track of ammo, not duel().']],
  },
  dealer: {
    task: 'Write dealerDraw(total, deck). The dealer takes cards from the deck, in order, while the total is below 17. Answer the final total.',
    steps: [['Keep a position in the deck, starting at the first card.', 'A counter that starts at 0.'], ['Repeat while the total is below 17.', 'A loop with a condition.'], ['Add the next card to the total.', 'Use the position to pick the card.'], ['Move on to the following card.', 'Increase the position by 1.'], ['When the loop ends, answer the total.', 'After the loop, not inside it.']],
    decoys: [['Draw exactly one card and stop.', 'The dealer may need several cards.'], ['Keep drawing while the total is 17 or less.', 'The dealer stands on 17.']],
  },
  roulette: {
    task: 'Write fireTurn(chambers, spin). The toy revolver has 6 chambers (1 is loaded). It starts at chamber spin and every turn moves to the next chamber, wrapping from the last back to the first. Answer the turn on which the loaded chamber comes up, or 0 if none is loaded.',
    steps: [['Start at chamber spin, on turn 1.', 'Two variables: the position and the turn.'], ['Repeat for as many turns as there are chambers.', 'A loop that stops after the last chamber.'], ['If the current chamber is loaded, answer the current turn.', 'Returning ends the function.'], ['Otherwise move to the next chamber, wrapping around at the end.', 'The remainder operator wraps a position around a list.'], ['Count the turn.', 'Increase the turn number by 1.'], ['If the loop ends without a hit, answer 0.', 'After the loop.']],
    decoys: [['Pick a random chamber.', 'The answer must be predictable from the inputs.'], ['Always start at chamber 0.', 'The spin decides where it starts.']],
  },
  coins: {
    task: 'Write longestStreak(flips). flips holds 1 for heads and 0 for tails. Answer the longest run of heads in a row.',
    steps: [['Keep two numbers: the current run and the best run, both starting at 0.', 'Two variables.'], ['Look at every flip in order.', 'A loop over the list.'], ['If it is heads, make the current run 1 longer.', 'Increase by 1.'], ['If it is tails, reset the current run to 0.', 'A tail ends a run.'], ['If the current run beats the best so far, remember it as the best.', 'Compare, then assign.'], ['After all the flips, answer the best run.', 'After the loop.']],
    decoys: [['Count all the heads.', 'Heads separated by a tail belong to different runs.'], ['Never reset the current run.', 'A tail must end a run.']],
  },
  connect4: {
    task: 'Write fourInRow(cells, mark). cells holds 7 slots (0 empty, 1 red, 2 yellow). Answer true when the given mark fills four slots side by side.',
    steps: [['Slide a window of four slots along the row. It can start at position 0, 1, 2 or 3.', 'A loop that counts from 0 up to 3.'], ['If all four slots in the window hold the mark, answer true.', 'Four comparisons joined with "and".'], ['After every window has been checked, answer false.', 'After the loop.']],
    decoys: [['Count the discs of that colour and answer true when there are four.', 'Four discs far apart are not four in a row.'], ['Stop the loop after position 2.', 'The last window starts at position 3.']],
  },
  darts: {
    task: 'Write dartScore(x, y). The centre is (0, 0). Let d = x * x + y * y. d up to 1 scores 50, up to 16 scores 20, up to 64 scores 10, and anything further scores 0.',
    steps: [['Work out d, the squared distance from the centre.', 'x times x plus y times y.'], ['If d is 1 or less, answer 50.', 'The smallest ring first.'], ['Otherwise, if d is 16 or less, answer 20.', 'Only reached when the first check failed.'], ['Otherwise, if d is 64 or less, answer 10.', 'One more branch.'], ['Otherwise answer 0.', 'A miss.']],
    decoys: [['Work out x + y instead.', 'That is not a distance: a dart at (3, -3) would give 0.'], ['Take the square root of d.', 'Not needed: compare the squared distance with squared limits.']],
  },
  'poker-straight': {
    task: 'Write isStraight(ranks). ranks holds five ranks in ascending order. Answer true when every rank is exactly one more than the one before it.',
    steps: [['Compare each card with the next one, from the first up to the second-last.', 'A loop that stops one early, so that i + 1 stays inside the list.'], ['If the next card is not exactly one more, answer false straight away.', 'One failing pair is enough.'], ['If every pair passed, answer true.', 'After the loop.']],
    decoys: [['Add up all the ranks and compare with a fixed number.', 'Different hands share the same sum.'], ['Check that all the ranks are different.', 'Different is not enough: 2, 4, 6, 8, 10.']],
  },
  pong: {
    task: 'Write ballAt(steps). A ball starts on square 0 moving right, one square per step, and bounces back when it reaches the walls on squares 0 and 9. Answer where it is after the given number of steps.',
    steps: [['Start with the ball at 0 and a speed of 1 (moving right).', 'Two variables: the position and the speed.'], ['Repeat once for every step.', 'A loop that counts up to the number of steps.'], ['Move the ball by its speed.', 'Add the speed to the position.'], ['If the ball has reached the right wall (9), turn it around: speed -1.', 'A condition on the position.'], ['Otherwise, if it has reached the left wall (0), turn it around: speed 1.', 'The mirror image.'], ['After all the steps, answer the position.', 'After the loop.']],
    decoys: [['Answer the number of steps modulo 10.', 'The ball bounces back, it does not wrap around.'], ['Make the ball go faster after every bounce.', 'The speed is always 1 or -1.']],
  },
  'blackjack-ace': {
    task: 'Write handValue(cards). Cards are ranks 1 (ace) to 13 (king). cardValue(rank) is already written for you: it gives 10 for face cards and the rank otherwise. An ace counts 1, or 11 when that does not push the hand over 21. Answer the hand total.',
    steps: [['Start a total at 0 and an ace counter at 0.', 'Two variables.'], ['Go through every card in the hand.', 'A loop over the list.'], ['Add the card\'s value to the total, using cardValue.', 'Call the provided function.'], ['If the card is an ace (rank 1), count it.', 'Increase the ace counter.'], ['After the loop: if there is an ace and counting it as 11 (adding 10) keeps the total at 21 or less, add 10.', 'Two conditions joined with "and".'], ['Answer the total.', 'Last line.']],
    decoys: [['Count every ace as 11.', 'Three aces would already be worth 33.'], ['Add 10 for every ace in the hand.', 'At most one ace can count as 11 without going over 21.']],
  },
  guess: {
    task: 'Write guessesNeeded(secret). The secret is a number from 1 to 100. Search for it by always guessing the middle of the range that is left. Answer how many guesses it takes.',
    steps: [['Start with the range 1 to 100 and 0 guesses.', 'Three variables: low, high and a counter.'], ['Repeat while the range still has numbers in it.', 'A loop with a condition on low and high.'], ['Guess the middle of the range and count the guess.', 'Whole-number division of low + high by 2.'], ['If the guess is the secret, answer the number of guesses.', 'Returning ends the function.'], ['If the guess is too low, the new range starts just above it.', 'Move low past the guess.'], ['If the guess is too high, the new range ends just below it.', 'Move high below the guess.']],
    decoys: [['If the guess is too low, keep the guess itself in the range.', 'The range would stop shrinking and the loop would never end.'], ['Guess a random number each time.', 'The count must be predictable.']],
  },
  werewolf: {
    task: 'Write eliminated(votes). votes lists who each player voted for (players 0 to 4). Answer the player with strictly the most votes, or -1 when the top spot is tied.',
    steps: [['Make five counters, one per player, all starting at 0.', 'A list of five zeros.'], ['Go through the ballots and add 1 to the counter of the player each ballot names.', 'A loop. The ballot value is the position in the counters list.'], ['Remember the leader so far (start with player 0) and a flag "tied" set to false.', 'Two variables.'], ['Look at players 1 to 4 one by one and compare each with the leader.', 'A second loop.'], ['If a player has more votes than the leader, they become the leader and the tie flag is cleared.', 'Two assignments in the same branch.'], ['Otherwise, if a player has the same votes as the leader, set the tie flag.', 'An else-if branch.'], ['After the loop: if the flag is set answer -1, otherwise answer the leader.', 'The final decision.']],
    decoys: [['Sort the ballots from smallest to largest.', 'Sorting does not count how many votes each player got.'], ['If two ballots are the same, banish both players.', 'A tie spares everybody.']],
  },
  hanoi: {
    task: 'Write hanoiMoves(n). Answer the fewest moves needed to carry a tower of n discs to another peg. Think about how a tower of n - 1 discs fits in.',
    steps: [['A tower of 0 discs needs no moves: answer 0.', 'The simplest case that stops the repetition.'], ['Moving the n - 1 smaller discs out of the way is the same problem with a smaller tower.', 'The function calls itself with n - 1.'], ['Moving the biggest disc takes exactly 1 move.', 'A constant.'], ['Putting the n - 1 smaller discs back on top costs the same as before.', 'The same smaller problem again.'], ['Answer twice the smaller cost, plus 1.', 'Combine the pieces.']],
    decoys: [['Answer n times 2.', 'The cost doubles with every extra disc, it does not grow by 2.'], ['Answer n + 1.', 'Far too small: 3 discs need 7 moves.']],
  },
  'poker-pairs': {
    task: 'Write countPairs(ranks). Count every pair of cards in the hand that have the same rank (three equal cards make 3 pairs).',
    steps: [['Start a pair counter at 0.', 'One variable.'], ['Take each card in turn.', 'The outer loop.'], ['Compare it with every card that comes after it, never with itself or earlier cards.', 'An inner loop that starts just after the outer position.'], ['If the two ranks are equal, add 1 to the counter.', 'A condition, then an increase.'], ['After all the comparisons, answer the counter.', 'After both loops.']],
    decoys: [['Compare each card with every other card, including earlier ones.', 'Every pair would be counted twice.'], ['Sort the hand and count the biggest group.', 'That counts groups, not pairs.']],
  },
  wordle: {
    task: 'Write wordleScore(secret, guess). Both are lists of 5 letters. Each guess letter scores 2 when it is in the right place, 1 when it appears elsewhere in the secret (once, however many times), and 0 otherwise. Answer the total.',
    steps: [['Start a total at 0.', 'One variable.'], ['Go through the 5 positions of the guess.', 'A loop from 0 to 4.'], ['If the letter matches the secret letter at the same position, add 2.', 'Compare guess[i] with secret[i].'], ['Otherwise, search the whole secret for that letter and remember whether you found it.', 'A second loop and a yes/no flag that starts as false.'], ['After the search, add 1 if the flag says it was found.', 'Add once, after the inner loop ends.'], ['When all the positions are done, answer the total.', 'After the outer loop.']],
    decoys: [['Add 1 every time the search finds the letter.', 'A letter that appears twice in the secret would then score twice.'], ['Sort both words alphabetically first.', 'Positions matter in this game and sorting destroys them.']],
  },
};
const KID = {
 "casino": "Roulette has 37 pockets, numbered 0 to 36. You will write dozen(pocket). Give it the number the ball landed on. It answers 1, 2 or 3: which third of the board that number is in. For the green 0 it answers 0.",
 "bingo": "In bingo some balls pay more than others. You will write prize(ball). Give it a ball number. A number in the 15 times table pays 15. In the 3 times table it pays 3. In the 5 times table it pays 5. Anything else pays 0.",
 "rps": "Rock, paper, scissors. Rock is 0, paper is 1, scissors is 2. You will write winner(a, b). Give it the two moves. It answers who won, or that it is a tie.",
 "nim": "There is a heap of stones. On your turn you take 1, 2 or 3 stones. You will write bestMove(stones). Give it the number of stones. It answers how many to take, so the other player is in trouble.",
 "battleship": "The sea is a grid of squares and a ship hides in some of them. You will write isHit(sea, row, col). Give it the sea and the row and column you shoot at. It answers yes or no.",
 "poker-flush": "In poker, a flush is five cards of the same suit. You will write suitOf(card). Give it a card number from 0 to 51. It answers which suit it is: 0, 1, 2 or 3.",
 "slots": "A slot machine has three wheels. You will write payout(a, b, c). Give it the three pictures. Three the same pays 10. Two the same pays 2. Nothing the same pays 0.",
 "tictactoe": "In tic-tac-toe, three in a row wins. You will write lineWins(board, a, b, c, mark). Give it the board, three squares and a player. It answers yes if all three squares belong to that player.",
 "chess": "In chess a knight jumps in an L: two squares one way and one square the other way. You will write knightMove(x1, y1, x2, y2). Give it two squares. It answers yes if a knight can jump between them.",
 "pistolero": "Two gunslingers each pick one move: reload, shoot, shield or cannon. You will write duel(a, b). Give it both moves. It answers who gets hit, or that nobody does.",
 "dealer": "In blackjack the dealer keeps taking cards until the total reaches 17. You will write dealerDraw(total, deck). Give it the dealer's total and the deck. It answers the final total.",
 "roulette": "A toy revolver has 6 chambers and one is loaded. Players pull the trigger in turns. You will write fireTurn(chambers, spin). Give it the chambers and where it starts. It answers on which turn it fires.",
 "coins": "You flip coins and write down heads (1) or tails (0). You will write longestStreak(flips). Give it the list of flips. It answers the longest row of heads.",
 "connect4": "In Connect Four, four of the same colour in a row wins. You will write fourInRow(cells, mark). Give it a row of slots and a colour. It answers yes if that colour has four side by side.",
 "darts": "The closer a dart lands to the middle, the more points it scores. You will write dartScore(x, y). Give it where the dart landed. It answers the points.",
 "poker-straight": "A straight is five cards in a row, like 5, 6, 7, 8, 9. You will write isStraight(ranks). Give it the card numbers. It answers yes if each one is exactly one more than the one before.",
 "pong": "A ball bounces between two walls. You will write ballAt(steps). Give it a number of steps. It answers where the ball is after that many steps.",
 "blackjack-ace": "In blackjack an ace counts 1 or 11, whichever is better, and face cards count 10. You will write handValue(cards). Give it the cards. It answers the total of the hand.",
 "guess": "Someone thinks of a number from 1 to 100. A smart guesser always tries the middle of what is left. You will write guessesNeeded(secret). Give it the secret number. It answers how many guesses it takes.",
 "werewolf": "A village votes on who to send away. You will write eliminated(votes). Give it the list of votes. It answers who got the most votes, or says it is a tie.",
 "hanoi": "In the Tower of Hanoi you carry discs between three pegs. You will write hanoiMoves(n). Give it the number of discs. It answers the fewest moves needed.",
 "poker-pairs": "A pair is two cards with the same number. You will write countPairs(ranks). Give it a hand of cards. It answers how many pairs the hand holds.",
 "wordle": "In Wordle every letter of your guess scores: 2 if it is in the right place, 1 if it is in the word but somewhere else, 0 if it is not there. You will write wordleScore(secret, guess). It answers the total."
};
Object.assign(KID, {
 'chess-board': "The chess board is a grid, 8 squares wide and 8 tall. You will write onBoard(x, y). Give it a square. It answers yes if the square is on the board and no if it is off the edge.",
 'chess-rook': "A rook slides in a straight line, up, down, left or right. You will write rookMove(x1, y1, x2, y2). Give it two squares. It answers yes if a rook can slide between them.",
 'chess-bishop': "A bishop slides along a diagonal, as far as it likes. You will write bishopMove(x1, y1, x2, y2). Give it two squares. It answers yes if a bishop can slide between them.",
 'werewolf-count': "In Werewolf the village votes. You will write countVotes(votes, who). Give it the list of votes and a player. It answers how many votes that player got.",
 'wordle-letter': "In Wordle you want to know if a letter is hiding in the secret word. You will write inWord(secret, letter). Give it the word and a letter. It answers yes or no.",
 'wordle-score': "Now score one letter of a Wordle guess: 2 if it is in the right place, 1 if it is somewhere else in the word, 0 if it is not there. You will write letterScore(secret, guess, i). The yes-or-no helper from the last lesson is already written.",
 'blackjack-card': "In blackjack a card is worth something. You will write cardValue(rank). Give it a card number from 1 to 13. Jack, queen and king are worth 10. The other cards are worth their number.",
 'hanoi-next': "In the Tower of Hanoi, every extra disc needs a lot more moves. You will write nextMoves(m). Give it the moves for a small tower. It answers the moves for a tower with one more disc.",
});
Object.assign(PLANS, PART_PLANS); Object.assign(KID, PART_KID);
LEVELS.forEach((L) => { const p = PLANS[L.id]; L.kid = KID[L.id] || ''; L.task = p.task; L.plan = { steps: p.steps, decoys: p.decoys }; });
const TOPICS = [...new Set(LEVELS.map((L) => L.topic))];


/* ============================================================ 6. TRANSLATOR
   Levels are written once, in the JavaScript subset. The translator rewrites
   them, line by line, into idiomatic Python or Java. The translated text is
   then parsed by the real Python / Java front ends above, so what the student
   steps through, edits and rebuilds is genuine code in that language. */
const LANGS = [
  { id: 'js', short: 'JS', name: 'JavaScript' },
  { id: 'py', short: 'PY', name: 'Python' },
  { id: 'java', short: 'JAVA', name: 'Java' },
];
const snakeCase = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
const PREC = { '||': 1, '&&': 2, '===': 3, '!==': 3, '<': 4, '>': 4, '<=': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6 };
const wrap = (text, prec, min) => (prec < min ? `(${text})` : text);
const jsExpr = (text) => new Parser(text).parseExpr();

class Translator {
  constructor(lang, env) { this.lang = lang; this.env = env || { vars: {}, funcs: {} }; }
  nm(n) { return this.lang === 'py' ? snakeCase(n) : n; }

  typeOf(n) {
    const env = this.env;
    switch (n.type) {
      case 'lit': return typeof n.value === 'number' ? (Number.isInteger(n.value) ? 'int' : 'double') : typeof n.value === 'string' ? 'String' : 'boolean';
      case 'array': return (n.items.length ? this.typeOf(n.items[0]) : 'int') + '[]';
      case 'ident': return env.vars[n.name] || 'int';
      case 'index': return this.typeOf(n.obj).replace(/\[\]$/, '');
      case 'member': return 'int';
      case 'unary': return n.op === '!' ? 'boolean' : 'int';
      case 'binary': return ['<', '>', '<=', '>=', '===', '!==', '&&', '||'].includes(n.op) ? 'boolean' : 'int';
      case 'call': return n.callee.type === 'ident' ? ((env.funcs[n.callee.name] || {}).ret || 'int') : 'int';
      default: return 'int';
    }
  }

  init(n) { return `{${n.items.map((x) => (x.type === 'array' ? this.init(x) : this.expr(x))).join(', ')}}`; }

  expr(n, min = 0) {
    const py = this.lang === 'py';
    switch (n.type) {
      case 'lit': {
        const v = n.value;
        if (typeof v === 'number') return String(v);
        if (typeof v === 'string') return JSON.stringify(v);
        if (typeof v === 'boolean') return py ? (v ? 'True' : 'False') : String(v);
        return py ? 'None' : 'null';
      }
      case 'ident': return this.nm(n.name);
      case 'array': return py ? `[${n.items.map((x) => this.expr(x)).join(', ')}]` : `new ${this.typeOf(n)}${this.init(n)}`;
      case 'index': return `${this.expr(n.obj, 8)}[${this.expr(n.index)}]`;
      case 'member':
        if (n.prop !== 'length') throw new Error(`translator: unsupported property ${n.prop}`);
        return py ? `len(${this.expr(n.obj)})` : `${this.expr(n.obj, 8)}.length`;
      case 'unary':
        if (n.op === '-') return `-${this.expr(n.arg, 7)}`;
        return py ? wrap(`not ${this.expr(n.arg, 3)}`, 2.5, min) : `!${this.expr(n.arg, 7)}`;
      case 'binary': {
        const op = n.op;
        if (op === '/') throw new Error('translator: use Math.floor(a / b) for division');
        const p = PREC[op];
        if (!py && (op === '===' || op === '!==') && (this.typeOf(n.left) === 'String' || this.typeOf(n.right) === 'String')) {
          const t = `${this.expr(n.left, 8)}.equals(${this.expr(n.right)})`;
          return op === '!==' ? wrap(`!${t}`, 7, min) : t;
        }
        let o = op === '===' ? '==' : op === '!==' ? '!=' : op;
        if (py && op === '&&') o = 'and';
        if (py && op === '||') o = 'or';
        const rmin = op === '&&' || op === '||' ? p : p + 1;
        return wrap(`${this.expr(n.left, p)} ${o} ${this.expr(n.right, rmin)}`, p, min);
      }
      case 'call': {
        const c = n.callee;
        if (c.type === 'ident') return `${this.nm(c.name)}(${n.args.map((a) => this.expr(a)).join(', ')})`;
        if (c.type === 'member' && c.obj.type === 'ident' && c.obj.name === 'Math') {
          if (c.prop === 'floor') {
            const a = n.args[0];
            if (a.type !== 'binary' || a.op !== '/') throw new Error('translator: Math.floor needs a division inside');
            return wrap(`${this.expr(a.left, 6)} ${py ? '//' : '/'} ${this.expr(a.right, 7)}`, 6, min);
          }
          const f = { abs: 'abs', max: 'max', min: 'min' }[c.prop];
          if (!f) throw new Error(`translator: Math.${c.prop} is not supported`);
          return py ? `${f}(${n.args.map((a) => this.expr(a)).join(', ')})` : `Math.${f}(${n.args.map((a) => this.expr(a)).join(', ')})`;
        }
        throw new Error('translator: unsupported call');
      }
      default: throw new Error(`translator: unsupported expression ${n.type}`);
    }
  }

  /** Translates ONE line of canonical code. `base` is the extra Java indent (1 inside the class, 2 inside main). Returns null for lines that vanish (Python has no closing braces). */
  line(raw, base = 0) {
    const m0 = raw.match(/^(\s*)(.*?)\s*$/);
    const ind = m0[1].length, s = m0[2];
    if (ind % 2) throw new Error(`translator: odd indent in "${raw}"`);
    if (!s) return '';
    const py = this.lang === 'py', depth = ind / 2;
    const pad = ' '.repeat(4 * (py ? depth : depth + base));
    const cm = s.match(/^\/\/\s*(.*)$/);
    if (cm) return py ? `${pad}pass  # ${cm[1]}` : `${pad}// ${cm[1]}`;
    const X = (t) => this.expr(jsExpr(t));
    const env = this.env;
    let m;
    if ((m = s.match(/^function\s+(\w+)\s*\(([^)]*)\)\s*\{$/))) {
      const params = m[2].split(',').map((x) => x.trim()).filter(Boolean), f = env.funcs[m[1]] || { params: {} };
      if (py) return `${pad}def ${this.nm(m[1])}(${params.map((p) => this.nm(p)).join(', ')}):`;
      return `${pad}static ${f.ret || 'void'} ${m[1]}(${params.map((p) => `${f.params[p] || env.vars[p] || 'int'} ${p}`).join(', ')}) {`;
    }
    if (s === '}') return py ? null : `${pad}}`;
    if ((m = s.match(/^\}\s*else\s+if\s*\((.*)\)\s*\{$/))) return py ? `${pad}elif ${X(m[1])}:` : `${pad}} else if (${X(m[1])}) {`;
    if (/^\}\s*else\s*\{$/.test(s)) return py ? `${pad}else:` : `${pad}} else {`;
    if ((m = s.match(/^if\s*\((.*)\)\s*\{$/))) return py ? `${pad}if ${X(m[1])}:` : `${pad}if (${X(m[1])}) {`;
    if ((m = s.match(/^while\s*\((.*)\)\s*\{$/))) return py ? `${pad}while ${X(m[1])}:` : `${pad}while (${X(m[1])}) {`;
    if ((m = s.match(/^for\s*\(let\s+(\w+)\s*=\s*(.+?);\s*(.+?);\s*(\w+)\+\+\)\s*\{$/))) {
      const v = m[1], start = jsExpr(m[2]), cond = jsExpr(m[3]);
      if (py) {
        if (cond.type !== 'binary' || cond.left.type !== 'ident' || cond.left.name !== v || !['<', '<='].includes(cond.op)) throw new Error(`translator: unsupported loop test in "${raw}"`);
        let stop;
        if (cond.op === '<') stop = this.expr(cond.right);
        else if (cond.right.type === 'binary' && cond.right.op === '-' && cond.right.right.type === 'lit') { const k = cond.right.right.value - 1; stop = k === 0 ? this.expr(cond.right.left) : `${this.expr(cond.right.left, 5)} - ${k}`; }
        else stop = `${this.expr(cond.right, 5)} + 1`;
        const from = start.type === 'lit' && start.value === 0 ? '' : `${this.expr(start)}, `;
        return `${pad}for ${this.nm(v)} in range(${from}${stop}):`;
      }
      env.vars[v] = env.vars[v] || 'int';
      return `${pad}for (int ${v} = ${this.expr(start)}; ${this.expr(cond)}; ${v}++) {`;
    }
    if ((m = s.match(/^(?:let|const|var)\s+(\w+)\s*=\s*(.+);$/))) {
      const val = jsExpr(m[2]);
      if (py) return `${pad}${this.nm(m[1])} = ${this.expr(val)}`;
      const type = env.vars[m[1]] || this.typeOf(val);
      env.vars[m[1]] = type;
      return `${pad}${type} ${m[1]} = ${val.type === 'array' ? this.init(val) : this.expr(val)};`;
    }
    if ((m = s.match(/^return(?:\s+(.+))?;$/))) return py ? `${pad}return${m[1] ? ' ' + X(m[1]) : ''}` : `${pad}return${m[1] ? ' ' + X(m[1]) : ''};`;
    if ((m = s.match(/^console\.log\((.+)\);$/))) return py ? `${pad}print(${X(m[1])})` : `${pad}System.out.println(${X(m[1])});`;
    if ((m = s.match(/^(\w+)(\+\+|--);$/))) return py ? `${pad}${this.nm(m[1])} ${m[2] === '++' ? '+=' : '-='} 1` : `${pad}${m[1]}${m[2]};`;
    if ((m = s.match(/^(\w+(?:\[.+?\])?)\s*(=|\+=|-=|\*=|\/=|%=)\s*(.+);$/))) return `${pad}${X(m[1])} ${m[2]} ${X(m[3])}${py ? '' : ';'}`;
    throw new Error(`translator: cannot translate "${raw}"`);
  }

  /** Whole program (canonical lines -> text + map from canonical line number to translated line number). */
  program(src) {
    const lines = src.split('\n'), map = [];
    if (this.lang === 'js') { lines.forEach((_, i) => map.push(i + 1)); return { text: src, map }; }
    if (this.lang === 'py') {
      const out = [];
      lines.forEach((raw) => { const t = this.line(raw, 0); if (t !== null) out.push(t); map.push(Math.max(1, out.length)); });
      return { text: out.join('\n'), map };
    }
    const methods = [], tops = [];
    for (let i = 0; i < lines.length; i++) {
      if (/^function\b/.test(lines[i])) { const blk = []; do { blk.push(i); } while (lines[i++] !== '}' && i < lines.length); i--; methods.push(blk); } else if (lines[i].trim()) tops.push(i);
    }
    const out = ['public class Main {'];
    methods.forEach((blk) => blk.forEach((i) => { out.push(this.line(lines[i], 1)); map[i] = out.length; }));
    out.push('    public static void main(String[] args) {');
    tops.forEach((i) => { out.push(this.line(lines[i], 2)); map[i] = out.length; });
    out.push('    }', '}');
    for (let i = 0; i < lines.length; i++) if (map[i] === undefined) map[i] = out.length;
    return { text: out.join('\n'), map };
  }

  /** Lines of one or more whole methods (the fix blocks and keepBefore). */
  methodLines(src) { return src.split('\n').map((l) => this.line(l, 1)).filter((t) => t !== null); }
  /** Top-level statements, e.g. a test run or a play driver, placed where they will run. */
  tailLines(src) { return src.split('\n').map((l) => this.line(l, this.lang === 'java' ? 2 : 0)).filter((t) => t !== null && t !== ''); }
}

/** Collects the value types the program really uses, from a traced run, so Java can declare them. */
function levelEnv(level) {
  if (level._env) return level._env;
  const f = level.fix, env = { vars: {}, funcs: {} };
  const src = [f.keepBefore, f.lines.join('\n'), ...f.tests.map((t) => t.run)].filter(Boolean).join('\n');
  const it = new Interpreter(src, { trace: false, limit: RUN_LIMIT, types: true, lang: 'js' });
  it.run();
  env.vars = it.typeLog.vars; env.funcs = it.typeLog.funcs;
  level._env = env;
  return env;
}

const pyBool = (s) => (s === 'true' ? 'True' : s === 'false' ? 'False' : s);

/** Prose is authored once (in JavaScript terms). Code-ish words are rewritten for the chosen language. */
function proseFor(s, lang, names) {
  if (lang === 'js' || typeof s !== 'string') return s;
  let t = s;
  if (lang === 'py') {
    names.forEach((n) => { t = t.replace(new RegExp(`\\b${n}\\b`, 'g'), snakeCase(n)); });
    t = t.replace(/===/g, '==').replace(/!==/g, '!=').replace(/&&/g, 'and').replace(/\|\|/g, 'or')
      .replace(/\b(\w+)\+\+/g, '$1 += 1').replace(/\b(\w+)--/g, '$1 -= 1')
      .replace(/\b(\w+)\.length\b/g, 'len($1)').replace(/console\.log/g, 'print');
  } else {
    t = t.replace(/===/g, '==').replace(/!==/g, '!=').replace(/\b(\w+)\.length\b/g, '$1.length').replace(/console\.log/g, 'System.out.println');
  }
  return t;
}

/* Java is taught with objects: lessons that take a hand of cards get a Card class and a Card[] hand. Python stays plain functions. */
const CARD_CLASS = {
  card: { cls: 'Card', a: 'rank', b: 'suit', get: 'getRank', text: `class Card {
    private int rank;
    private int suit;

    public Card(int rank, int suit) {
        this.rank = rank;
        this.suit = suit;
    }

    public int getRank() {
        return rank;
    }

    public int getSuit() {
        return suit;
    }
}` },
  uno: { cls: 'UnoCard', a: 'number', b: 'colour', get: 'getNumber', text: `class UnoCard {
    private int number;
    private int colour;

    public UnoCard(int number, int colour) {
        this.number = number;
        this.colour = colour;
    }

    public int getNumber() {
        return number;
    }

    public int getColour() {
        return colour;
    }
}` },
};
const OOP_LEVELS = {
  'poker-high': ['card', 'ranks'], 'poker-straight': ['card', 'ranks'], 'poker-pairs': ['card', 'ranks'], 'poker-kind': ['card', 'ranks'],
  'poker-twopair': ['card', 'ranks'], 'poker-fullhouse': ['card', 'ranks'], 'poker-fourkind': ['card', 'ranks'],
  'blackjack-ace': ['card', 'cards'], 'dealer': ['card', 'deck'], 'blackjack-natural': ['card', 'cards'],
  'gofish-count': ['card', 'hand'], 'gofish-has': ['card', 'hand'], 'gofish-book': ['card', 'hand'], 'gofish-books': ['card', 'hand'],
  'highlow-streak': ['card', 'cards'], 'uno-score': ['uno', 'cards'], 'uno-last': ['uno', 'cards'],
};
const splitTop = (t) => { const out = []; let d = 0, cur = ''; for (const ch of t) { if (ch === '(' || ch === '[' || ch === '{') d++; if (ch === ')' || ch === ']' || ch === '}') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
/** Rewrites Java text that was translated for plain ints so it uses Card objects instead. */
function cardify(text, oop, tail) {
  const C = CARD_CLASS[oop[0]], name = oop[1];
  let t = text;
  const lit = (items) => items.map((x, i) => `new ${C.cls}(${x}, ${i % 4})`).join(', ');
  t = t.replace(/new int\[\]\{([^{}]*)\}/g, (m, body) => `new ${C.cls}[]{${lit(splitTop(body))}}`);
  t = t.replace(/int\[\] (\w+) = \{([^{}]*)\}/g, (m, v, body) => `${C.cls}[] ${v} = {${lit(splitTop(body))}}`);
  t = t.replace(new RegExp('int\\[\\] ' + name + '\\b', 'g'), `${C.cls}[] ${name}`);
  if (!tail) t = t.replace(new RegExp('\\b' + name + '\\[([^\\[\\]]+)\\]', 'g'), `${name}[$1].${C.get}()`);
  return t;
}

const VIEW_CACHE = new Map();
/** The level as one language shows it: translated code, blocks, tests, drivers and prose. */
function viewLevel(level, lang) {
  const key = `${lang}:${level.id}`;
  if (VIEW_CACHE.has(key)) return VIEW_CACHE.get(key);
  const env = lang === 'java' ? levelEnv(level) : { vars: {}, funcs: {} };
  const names = [...new Set(level.code.match(/\b[a-z]+[A-Z][A-Za-z0-9]*\b/g) || [])];
  const tr = new Translator(lang, JSON.parse(JSON.stringify(env)));
  const alt = (level.alt && level.alt[lang]) || {};
  const T = (s) => proseFor(s, lang, names);
  const prog = tr.program(level.code);
  const f = level.fix, keepLines = f.keepBefore ? (lang === 'js' ? f.keepBefore.split('\n') : tr.methodLines(f.keepBefore)) : [];
  const solLines = lang === 'js' ? f.lines.slice() : tr.methodLines(f.lines.join('\n'));
  const decoys = alt.decoys || (lang === 'js' ? f.decoys.slice() : f.decoys.map((d) => tr.line(d, 1)).filter((t) => t !== null));
  const dedent = (ls) => (lang === 'java' ? ls.map((l) => (l.startsWith('    ') ? l.slice(4) : l)) : ls);
  const funcsOf = (src) => {
    const ls = src.split('\n'), out = [];
    for (let i = 0; i < ls.length; i++) {
      if (/^function\b/.test(ls[i])) { const blk = []; do { blk.push(ls[i]); } while (ls[i++] !== '}' && i < ls.length); i--; out.push(blk.join('\n')); }
    }
    return out;
  };
  const toLang = (blocks) => dedent(blocks.flatMap((b, k) => (lang === 'js' ? b.split('\n') : tr.methodLines(b)).concat(k < blocks.length - 1 ? [''] : [])));
  const starter = toLang(funcsOf(level.code)).join('\n');
  const skeletons = funcsOf(f.lines.join('\n')).map((b) => `${b.split('\n')[0]}\n  // your code here\n}`);
  const scratch = skeletons;
  const given = f.keepBefore ? toLang(funcsOf(f.keepBefore)).join('\n') : '';
  const signature = toLang(skeletons.map((s) => s.split('\n')[0] + '\n}'))[0];
  const reference = toLang(funcsOf(f.lines.join('\n'))).join('\n');
  const tailCache = new Map();
  const tail = (src) => { if (!tailCache.has(src)) tailCache.set(src, lang === 'js' ? [src] : tr.tailLines(src)); return tailCache.get(src); };
  const build = (blocks, tailSrc) => {
    const parts = [...keepLines, ...blocks];
    if (lang === 'java') return ['public class Main {', ...parts, '    public static void main(String[] args) {', ...(tailSrc ? tail(tailSrc) : []), '    }', '}'].join('\n');
    return [...parts, ...(tailSrc ? tail(tailSrc) : [])].join('\n');
  };
  const fromText = (text, tailSrc) => {
    const ls = (given ? given.split('\n').concat(['']) : []).concat(String(text).replace(/\r/g, '').split('\n'));
    if (lang === 'java') return ['public class Main {', ...ls.map((l) => (l.trim() ? '    ' + l : l)), '    public static void main(String[] args) {', ...(tailSrc ? tail(tailSrc) : []), '    }', '}'].join('\n');
    return [...ls, ...(tailSrc ? tail(tailSrc) : [])].join('\n');
  };
  const d = level.diagnose, ad = alt.diagnose || {};
  const oop = lang === 'java' ? OOP_LEVELS[level.id] : null;
  let oopView = null;
  const javaNames = lang === 'java' ? [...new Set([...[...keepLines, ...solLines].join('\n').matchAll(/^\s*static\s+[\w\[\]]+\s+(\w+)\(/gm)].map((m) => m[1]))] : [];
  if (lang === 'java' && javaNames.length) {
    const C = oop ? CARD_CLASS[oop[0]] : null;
    const RC = (String(level.game || 'Game').replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('') || 'Game').replace(/^(\d)/, 'Game$1') + 'Rules';
    const cf = (x) => (oop ? cardify(x, oop, false) : x), ct = (x) => (oop ? cardify(x, oop, true) : x);
    const ns = (x) => x.replace(/^(\s*)static\s+/gm, '$1');
    const jx = (x) => ns(cf(x));
    const callRe = new RegExp('(?<![\\w.])(' + javaNames.join('|') + ')\\(', 'g');
    const tw = (x) => x.replace(callRe, 'g.$1(');
    const classText = C ? C.text + '\n\n' : '';
    const classHead = classText;
    const methodsGiven = given;
    const frame = (methods, tailLines) => classHead + [`class ${RC} {`, ...methods, '}', '', 'public class Main {', '    public static void main(String[] args) {', `        ${RC} g = new ${RC}();`, ...tailLines.map((l) => tw(ct(l))), '    }', '}'].join('\n');
    const tl = (tailSrc) => (tailSrc ? tail(tailSrc) : []);
    // trace/meet code: same program, rules wrapped in the class
    const tl0 = prog.text.split('\n'), mi = tl0.findIndex((l) => /public static void main/.test(l));
    let code = prog.text, map = prog.map;
    if (mi > 0) {
      const methods = tl0.slice(1, mi).map(jx), body = tl0.slice(mi + 1, tl0.length - 2).map((l) => tw(cf(l)));
      code = classHead + [`class ${RC} {`, ...methods, '}', '', 'public class Main {', tl0[mi], `        ${RC} g = new ${RC}();`, ...body, '    }', '}'].join('\n');
      const off = classHead ? classHead.split('\n').length - 1 : 0, ml = mi + 1;
      map = prog.map.map((n) => (n === undefined ? n : (n < ml ? n : n + 4) + off));
    } else if (classHead) { code = classHead + cf(prog.text); map = prog.map.map((n) => (n === undefined ? n : n + classHead.split('\n').length - 1)); }
    const gv = C ? C.text + '\n\n' : '';
    oopView = {
      code, codeMap: map,
      keepBefore: keepLines.map(jx).join('\n'), lines: (alt.lines || solLines).map(jx), decoys: decoys.map(jx),
      starter: jx(starter), reference: jx(reference), scratch: jx(toLang(scratch).join('\n')),
      signature: jx(signature),
      given: gv + `class ${RC} {\n` + (methodsGiven ? jx(methodsGiven).split('\n').map((l) => (l.trim() ? '    ' + l : l)).join('\n') + '\n\n' : '') + '    // your code goes here, inside this class\n}',
      build: (blocks, tailSrc) => frame([...keepLines.map(jx), ...blocks], tl(tailSrc)),
      fromText: (text, tailSrc) => {
        const ls = (methodsGiven ? jx(methodsGiven).split('\n').concat(['']) : []).concat(String(text).replace(/\r/g, '').split('\n'));
        return frame(ls.map((l) => (l.trim() ? '    ' + l : l)), tl(tailSrc));
      },
      rule: `In Java the rules live in a class called ${RC}. Your code goes inside that class.` + (C ? ` A hand is an array of ${C.cls} objects: read a card with ${oop[1]}[i].${C.get}().` : ''),
    };
  }
  const view = {
    ...level, lang,
    concept: alt.concept || T(level.concept),
    objective: alt.objective || T(level.objective),
    task: T(level.task), kid: T(level.kid),
    plan: { steps: level.plan.steps.map(([t, tip]) => [T(t), T(tip)]), decoys: level.plan.decoys.map(([t, why]) => [T(t), T(why)]) },
    rules: alt.rules || level.rules.map(T).concat(oopView ? [oopView.rule] : []),
    expected: lang === 'py' ? pyBool(level.expected) : level.expected,
    code: oopView ? oopView.code : prog.text, codeMap: oopView ? oopView.codeMap : prog.map,
    diagnose: {
      question: ad.question || T(d.question), options: ad.options || d.options.map(T), answer: ad.answer !== undefined ? ad.answer : d.answer,
      explain: ad.explain || T(d.explain), bugLine: ad.bugLine || (oopView ? oopView.codeMap[d.bugLine - 1] : prog.map[d.bugLine - 1]),
    },
    fix: {
      keepBefore: keepLines.join('\n'), lines: alt.lines || solLines, decoys,
      tests: f.tests.map((t) => ({ ...t, expect: lang === 'py' ? pyBool(t.expect) : t.expect, label: T(t.label) })),
      build, fromText, starter, reference, given, signature: signature.replace(/\s*\{?\s*:?\s*$/, ''),
      scratch: toLang(scratch).join('\n'),
      ...(oopView ? { keepBefore: oopView.keepBefore, lines: oopView.lines, decoys: oopView.decoys, build: oopView.build, fromText: oopView.fromText, starter: oopView.starter, reference: oopView.reference, scratch: oopView.scratch, given: oopView.given, signature: oopView.signature.replace(/\s*\{?\s*:?\s*$/, '') } : {}),
    },
    hints: alt.hints || level.hints.map(T),
  };
  VIEW_CACHE.set(key, view);
  return view;
}


