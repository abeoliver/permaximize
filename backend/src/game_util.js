/*
 * game_util.js - Permaximize Online
 * Abraham Oliver, 2020
 */

exports.DEFAULT_SIZE = 7;

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
 * executeMove
 * Flip two pieces and solidify the first selected one
 */
function executeMove(board, selected, second) {
  let player = board[selected[0]][selected[1]] % 2 == 1 ? 1 : 2;
  // Make solid status
  board[selected[0]][selected[1]] = player + 2;
  // Flip pieces
  let tmp = board[second[0]][second[1]];
  board[second[0]][second[1]] = board[selected[0]][selected[1]];
  board[selected[0]][selected[1]] = tmp;
  return board;
}


function result(score) {
  if (score[0] === score[1]) return 0;
  else if (score[0] > score[1]) return 1;
  else return 2;
}

exports.initialBoard = initialBoard;
exports.executeMove = executeMove;
exports.zeros = zeros;
exports.result = result;