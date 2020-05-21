/*
 * PermaximizeGame.js - Permaximize Online
 * Abraham Oliver, 2020
 *
 * Board status key:
 * 1 : Player 1 normal
 * 2 : Player 2 normal
 * 3 : Player 1 solid
 * 4 : Player 2 solid
 * 5 : Player 1 selected
 * 6 : Player 2 selected
 */

import React from 'react';
import { LinearProgress, Button, Hidden } from "@material-ui/core";
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { HelpScreen } from './Screens';
import './Game.css';

function getTheme(player) {
  /*
  let docStyles = getComputedStyle(document.getElementById("permaximize-main"));
  const player1 = {
    light: docStyles.getPropertyValue("--primary-light").toString(),
    main: docStyles.getPropertyValue("--primary").toString(),
  };
  const player2 = {
    light: docStyles.getPropertyValue("--secondary-light").toString(),
    main: docStyles.getPropertyValue("--secondary").toString(),
  };
  return createMuiTheme({
    palette: {
      primary: player === 1 ? player1 : player2,
    },
  });*/
  return createMuiTheme({});
}

function zeros(w) {
  let arr = [];
  for (let i = 0; i < w; i++) {
    arr.push(new Array(w).fill(0));
  }
  return arr;
}

function Piece(props) {
  return (
      <span className={"game-piece game-piece-status-" + props.status + " game-piece-largest-" + props.largest}
            onClick={props.handleClick}/>
  );
}

/*
 * Game
 * Main game control component
 */
export class Game extends React.Component {
  constructor(props) {
    super(props);
    this.size = 7;
    this.maxTurn = 14;
    this.state = {
      board: null,
      largest: null,
      selected: null,
      score: [0, 0],
      turn: 0,
      showHelp: true
    };
    this.searched = null;
    this._searchCount = this._searchCount.bind(this);
  }

  componentDidMount() {
    this.setState(this.initialState(true));
  }

  initialState(showHelp) {
    return {
      board: this.initialBoard(),
      largest: zeros(this.size),
      selected: null,
      score: [1, 1],
      turn: 0,
      showHelp: showHelp
    };
  };

  resetState = () => this.setState(this.initialState(false));

  currentPlayer = () => (this.state.turn % 2) + 1;
  opposingPlayer = () => this.currentPlayer() === 1 ? 2 : 1;

  winningPlayer = () => {
    if (this.state.turn < this.maxTurn) return 0;
    if (this.state.score[0] === this.state.score[1]) return 0;
    if (this.state.score[0] > this.state.score[1]) return 1;
    if (this.state.score[0] < this.state.score[1]) return 2;
  }

  /*
   * initialBoard
   * Create the initial board state array
   */
  initialBoard() {
    let board = [];
    for (let i = 0; i < this.size; i++) {
      let row = [];
      // Alternate row start color
      let status = (i % 2) + 1;
      for (let j = 0; j < this.size; j++) {
        row.push(status);
        // Flip color for next piece
        status = (status === 1 ? 2 : 1);
      }
      board.push(row);
    }
    return board;
  }

  /*
   * handlePieceClick
   * Handler for selecting and switching pieces
   */
  handlePieceClick(row, col) {
    // Do not allow clicking if game is over
    if (this.state.turn >= this.maxTurn) return;
    let newBoard = this.state.board;
    // Do not choose a solid piece for any reason
    if (newBoard[row][col] === 3 || newBoard[row][col] === 4) return;
    // Set the main selected piece if not chosen yet
    if (this.state.selected === null) {
      // Do not choose a piece of the other color
      if (newBoard[row][col] === this.opposingPlayer()) return;
      // Make selected status
      newBoard[row][col] = newBoard[row][col] + 4;
      this.setState({selected: [row, col], board: newBoard});
      return;
      // Un-choose if already selected
    } else if (this.state.selected[0] === row && this.state.selected[1] === col) {
      newBoard[row][col] = newBoard[row][col] - 4;
      this.setState({selected: null, board: newBoard});
      return;
    }
    // Do not choose a piece of the player's own color
    if (newBoard[row][col] === this.currentPlayer()) return;
    // Tell game control to flip pieces
    newBoard = this.flipPieces(newBoard, this.state.selected, [row, col]);
    // Make solid status
    newBoard[row][col] -= 2;
    this.setState({selected: null, board: newBoard, turn: this.state.turn + 1});
    this.updateScore();
  }

  /*
   * flipPieces
   * Flip two game pieces
   */
  flipPieces(board, selected, second) {
    let tmp = board[second[0]][second[1]];
    board[second[0]][second[1]] = board[selected[0]][selected[1]];
    board[selected[0]][selected[1]] = tmp;
    return board;
  }

  /*
   * updateScore
   */
  updateScore() {
    this.setState({score: [this.calculateScore(1), this.calculateScore(2)]});
  }

  /*
   * recordLargestBlob
   * Given one node of the largest user blob, record the location of the entire blob
   */
  recordLargestBlob(r, c, player) {
    // Clear previous recorder
    let largest = [...this.state.largest];
    for (let i = 0; i < largest.length; i++) {
      for (let j = 0; j < largest.length; j++) {
        if (largest[i][j] === player) largest[i][j] = 0;
      }
    }
    // Run recorder
    this._recordLargestBlob(r, c, player, largest);
    this.setState({largest: largest});
  }

  /*
   * _recordLargestBlob
   * Recursive recorder for recording largest blob
   */
  _recordLargestBlob(r, c, player, largest) {
    // Base cases
    if (r < 0 || c < 0 || r > this.size - 1 || c > this.size - 1) {
      return;
    } else if ((this.state.board[r][c] % 2) !== 2 - player || largest[r][c]) {
      return;
    }
    // Mark searched
    largest[r][c] = player;
    // Search left, up, right, down
    this._recordLargestBlob(r, c - 1, player, largest);
    this._recordLargestBlob(r - 1, c, player, largest);
    this._recordLargestBlob(r, c + 1, player, largest);
    this._recordLargestBlob(r + 1, c, player, largest);

  }

  /*
   * calculateScore
   * Calculate largest chain for a given player
   * Side effect: save largest to largest blob tracker
   */
  calculateScore(player) {
    // Clear search array
    this.searched = zeros(this.size);
    let largest = [0, player - 1]
    let maxSize = 0;
    let count = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        count = this._searchCount(r, c, player)
        if (count > maxSize) {
          largest = [r, c];
          maxSize = count;
        }
      }
    }
    // Record largest blob
    this.recordLargestBlob(largest[0], largest[1], player);
    return maxSize;
  }

  /*
   * _searchCount
   * Recursive search to count chains
   * Do not call out of the context of calculateScore
   */
  _searchCount(row, col, player) {
    // Base cases
    if (row < 0 || col < 0 || row > this.size - 1 || col > this.size - 1) {
      return 0;
    } else if ((this.state.board[row][col] % 2) !== 2 - player || this.searched[row][col]) {
      return 0;
    }
    // Mark searched
    this.searched[row][col] = player;
    // Search left, up, right, down
    return 1 + this._searchCount(row, col - 1, player) + this._searchCount(row - 1, col, player) +
        this._searchCount(row, col + 1, player) + this._searchCount(row + 1, col, player);
  }

  /****** RENDERS ******/
  /*
   * scoreHeader
   */
  scoreHeader() {
    // If game is over, show GAME OVER
    let over = this.state.turn >= this.maxTurn;
    return (
        <div className="game-score-header" onClick={(over ? this.resetState : null)}>
          <div className="game-win-winner-container" style={{marginRight: "1em"}}>
            <p id="game-win-winner"
               style={{visibility: (over ? "visible" : "hidden"),
                 color: "var(--primary)"}}>
              {this.winningPlayer() === 1 ? "Winner" : "Play again!"}
            </p>
            <p className={"game-score " + (this.currentPlayer() === 1 && !over ? "game-score-current" : "")}
               id="game-score-1">
              {this.state.score[0]}
            </p>
          </div>

          <div className="game-win-winner-container">
            <p id="game-win-winner"
               style={{visibility: (over ? "visible" : "hidden"),
                 color: "var(--secondary)"}}>
              {this.winningPlayer() === 2 ? "Winner" : "Play again!"}
            </p>
            <p className={"game-score " + (this.currentPlayer() === 2 && !over ? "game-score-current" : "")}
               id="game-score-2">
              {this.state.score[1]}
            </p>
          </div>
        </div>
    );
  }

  /*
   * createBoardPieces
   * Generate a list of Piece components matching state.board's config
   */
  createBoardPieces() {
    let list = [];
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        list.push(
            <Piece status={this.state.board[i][j]} key={(i * this.size) + j}
                   largest={this.state.largest[i][j]}
                   handleClick={() => this.handlePieceClick(i, j)}
            />
        );
      }
    }
    return list;
  }

  render() {
    if (!this.state.showHelp) {
      return (
          <div id="game-container">
            <Hidden mdDown>
              <Button id="game-help-button" onClick={() => this.setState({showHelp: true})}>Help</Button>
            </Hidden>
            <h1 id="game-main-title">Permaximize</h1>
            <h4 id="game-main-title-author">Abraham Oliver</h4>

            <div className="game">
              {this.scoreHeader()}

              <div className="game-board-grid"
                   style={{gridTemplateColumns: "repeat(" + this.size + ", auto)"}}>
                {this.createBoardPieces()}
              </div>

              <ThemeProvider theme={getTheme(this.currentPlayer())}>
                <LinearProgress variant="determinate" value={(this.state.turn / this.maxTurn) * 100}
                                className="game-progress-bar"/>
              </ThemeProvider>
            </div>
          </div>
      );
    }
    // Show Help Screen
    return (<HelpScreen onClick={() => this.setState({showHelp: false})}/>);
  }
}