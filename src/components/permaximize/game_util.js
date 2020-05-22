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

exports.initialBoard = initialBoard;
exports.flipPieces = flipPieces;
exports.zeros = zeros;