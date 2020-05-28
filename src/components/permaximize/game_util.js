/*
 * game_util.js - Permaximize Online
 * Abraham Oliver, 2020
 */

/*
 * initialBoard
 * Create the initial board state array
 */
function initialBoard(size) {
  let board = [];
  for (let i = 0; i < size; i++) {
    let row = [];
    // Alternate row start color
    let status = (i % 2) + 1;
    for (let j = 0; j < size; j++) {
      row.push(status);
      // Flip color for next piece
      status = (status === 1 ? 2 : 1);
    }
    board.push(row);
  }
  return board;
}

function zeros(w) {
  let arr = [];
  for (let i = 0; i < w; i++) {
    arr.push(new Array(w).fill(0));
  }
  return arr;
}

/*
 * flipPieces
 * Flip two game pieces
 */
function flipPieces(board, selected, second) {
  let tmp = board[second[0]][second[1]];
  board[second[0]][second[1]] = board[selected[0]][selected[1]];
  board[selected[0]][selected[1]] = tmp;
  return board;
}


/*
 * analyzeBoard
 * Find the largest blobs of each player and their sizes
 * Returns a tuple (largest blobs, score)
 */
function analyzeBoard(player, board) {
  let size = board.length();
  let searched = zeros(size);
  let largestBlobs = zeros(size);
  // Initial largest is top corner piece of player's color
  let largest = [[0, 0], [0, 1]];
  let maxSizes = [0, 0];
  let counts = [0, 0];

  // Process for analyzing each piece
  // Done in-function to maintain scope for array and avoid copying
  let analyzePiece = (row, col, player) => {
    // Base cases
    if (row < 0 || col < 0 || row > size - 1 || col > size - 1) {
      return 0;
    } else if ((board[row][col] % 2) !== 2 - player || searched[row][col]) {
      return 0;
    }
    // Mark searched
    searched[row][col] = player;
    // Search left, up, right, down
    return 1 + analyzePiece(row, col - 1, player) + analyzePiece(row - 1, col, player) +
        analyzePiece(row, col + 1, player) + analyzePiece(row + 1, col, player);
  }

  // Analyze all pieces
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let player = 2 - (board[r][c] % 2);
      counts[player - 1] = analyzePiece(r, c, player);
      if (counts[player - 1] > maxSizes[player - 1]) {
        largest[player - 1] = [r, c];
        maxSizes[player - 1] = counts[player - 1];
      }
    }
  }

  // Record largest blobs
  let recordBlobs = (row, col, player) => {
    // Base cases
    if (row < 0 || col < 0 || row > size - 1 || col > size - 1) {
      return;
    } else if ((board[row][col] % 2) !== 2 - player || largestBlobs[row][col]) {
      return;
    }
    // Mark searched
    largestBlobs[row][col] = player;
    // Search left, up, right, down
    recordBlobs(row, col - 1, player);
    recordBlobs(row - 1, col, player);
    recordBlobs(row, col + 1, player);
    recordBlobs(row + 1, col, player);
  }
  recordBlobs(largest[0][0], largest[0][1], 1);
  recordBlobs(largest[1][0], largest[1][1], 2);

  return [largestBlobs, maxSizes];
}

exports.initialBoard = initialBoard;
exports.flipPieces = flipPieces;
exports.zeros = zeros;
exports.analyzeBoard = analyzeBoard;