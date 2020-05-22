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
import { Link } from "react-router-dom";
import { LinearProgress, Button, Hidden } from "@material-ui/core";
import {createMuiTheme, ThemeProvider} from '@material-ui/core/styles';
import './BasicGame.css';

const gameUtil = require("./game_util");

function getTheme(player) {
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
  });
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
export class BasicGame extends React.Component {
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
      showHelp: true,
      msg: ""
    };
    this.searched = null;
    this._searchCount = this._searchCount.bind(this);
  }

  componentDidMount() {
    this.setState(this.initialState(true));
  }

  initialState(showHelp) {
    return {
      board: gameUtil.initialBoard(this.size),
      largest: gameUtil.zeros(this.size),
      selected: null,
      score: [1, 1],
      turn: 0,
      showHelp: showHelp,
      msg: ""
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
   * handlePieceClick
   * Handler for selecting and switching pieces
   */
  handlePieceClick(row, col) {
    if (!this.allowClick(row, col)) return;
    let newBoard = this.state.board;
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
    // If a valid move has been chosen
    this.executeMove([row, col], this.state.selected);
  }

  allowClick(row, col) {
    // Do not allow clicking if game is over
    if (this.state.turn >= this.maxTurn) return false;
    // Do not choose a solid piece (return true default)
    return !(this.state.board[row][col] === 3 || this.state.board[row][col] === 4);

  }

  executeMove(move, selected) {
    // Flip board pieces
    let newBoard = gameUtil.flipPieces(this.state.board, selected, move);
    // Make solid status
    newBoard[move[0]][move[1]] -= 2;
    // Save updated game state
    this.setState({selected: null, board: newBoard, turn: this.state.turn + 1});
    // Update score
    this.updateScore();
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
    this.searched = gameUtil.zeros(this.size);
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
    if (maxSize > 1) {
      this.recordLargestBlob(largest[0], largest[1], player);
    }
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

  playerText(player, over) {
    let pText = "Player " + player;
    if (over) {
      pText = (this.winningPlayer() === player ? "Winner" : "Play again!");
    }
    return pText;
  }

  /*
   * scoreHeader
   */
  scoreHeader() {
    // If game is over, show GAME OVER
    let over = this.state.turn >= this.maxTurn;
    let p1Text = this.playerText(1, over);
    let p2Text = this.playerText(2, over);
    return (
        <div className="game-score-header" onClick={(over ? this.resetState : null)}>
          <div className="game-win-winner-container" style={{marginRight: "1em"}}>
            <div className={"game-score " + (this.currentPlayer() === 1 && !over ? "game-score-current" : "")}
               id="game-score-1">
              <p id="game-score-overtext"
                 style={{color: "var(--primary)"}}>
                {p1Text}
              </p>
              <p className="game-score-text">
                {this.state.score[0]}
              </p>
            </div>
          </div>

          <div className="game-win-winner-container">
            <div className={"game-score " + (this.currentPlayer() === 2 && !over ? "game-score-current" : "")}
               id="game-score-2">
              <p id="game-score-overtext"
                 style={{color: "var(--secondary)"}}>
                {p2Text}
              </p>
              <p className="game-score-text">
                {this.state.score[1]}
              </p>
            </div>
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

  helpScreen() {
    const helpText = `
      Welcome to Permaximize! To start, grab a friend and choose who will be blue (plays first)
      and who will be pink. Each player has 7 turns to build the largest continuous blob of their
      color, without diagonals, which is displayed in a darker color. On a given player's turn, they choose one of their own pieces and choose one of their
      opponent's pieces to swap. Once they have swapped the two, the piece of their own is now
      "solidified" and cannot be moved for the rest of the game; these pieces are marked with a hollow center.
       Use solidified pieces to cut your opponents blob and fortify your own!
    `;
    return (
        <div id="game-help-main">
          <h2 id="game-help-title">Permaximize</h2>
          <p>{helpText}</p>
          <h3 id="game-help-done" onClick={() => this.setState({showHelp: false})}> Got it </h3>
        </div>
    );
  }

  render() {
    if (!this.state.showHelp) {
      return (
          <div id="game-container">
            <Hidden mdDown>
              <Button id="game-help-button" onClick={() => this.setState({showHelp: true})}>?</Button>
            </Hidden>
            <Link to="/" style={{textDecoration: "none"}}>
              <p id="game-main-title">Permaximize</p>
            </Link>

            <p id="game-main-msg">
              {this.state.msg !== "" ? this.state.msg : " "}
            </p>

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
    return this.helpScreen();
  }
}