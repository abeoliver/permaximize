/*
 * CPU.jsx - Permaximize Online
 * Abraham Oliver, 2020
 */
import BasicGame from "./BasicGame";

const gameUtil = require("./game_util");

class ComputerPlayer {
  constructor(player) {
    this.player = player;
    this.board = gameUtil.initialBoard(7);
  }

  applyMove(move, selected) {
    // Flip board pieces
    let newBoard = gameUtil.flipPieces(this.board, selected, move);
    // Make solid status
    newBoard[move[0]][move[1]] += 2;
    // Save to board
    this.board = newBoard;
  }

  move(executeFunc, prevMove, prevSelected) {
    // Play players move on cpu board
    this.applyMove(prevMove, prevSelected);
    let move = [];
    let selected = []
    //Play move on internal board and on players board
    this.applyMove(move, selected);
    executeFunc(move, selected);
  }
}

export default class CpuGame extends BasicGame {
  constructor(props) {
    super(props);
    this.human = 1;
    this.cpu = null;
  }

  componentDidMount() {
    super.componentDidMount();
    this.cpu = new ComputerPlayer(2);
  }

  // Override to prevent playing as computer
  allowClick(row, col) {
    // Do not allow clicking if game is over
    if (this.state.turn >= this.maxTurn) return false;
    // Do not choose a piece if not your turn
    if (((this.state.turn % 2) + 1) !== this.human) return false;
    // Do not choose a solid piece (return true otherwise)
    return !(this.state.board[row][col] === 3 || this.state.board[row][col] === 4);
  }

  executeCpuMove(move, selected) {
    // Flip board pieces
    let newBoard = gameUtil.flipPieces(this.state.board, selected, move);
    // Make solid status
    newBoard[move[0]][move[1]] += 2;
    this.setState({selected: null, board: newBoard, turn: this.state.turn + 1});
    // Update score
    this.updateScore(newBoard);
  }

  executeMove(move, selected) {
    // Flip board pieces
    let newBoard = gameUtil.flipPieces(this.state.board, selected, move);
    // Make solid status
    newBoard[move[0]][move[1]] -= 2;
    // Save updated game state and have the computer play once this occurs
    this.setState({selected: null, board: newBoard, turn: this.state.turn + 1},
        () => this.cpu.move((m, s) => this.executeCpuMove(m, s), move, selected));
    // Update score
    return this.updateScore(newBoard);
  }
}