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
import {HashRouter, Route} from "react-router-dom";
import { LinearProgress, Button } from "@material-ui/core";
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { HelpScreen, TitleScreen } from './Screens';
import './Permaximize.css';

function Piece(props) {
  return (
      <span className={"game-piece game-piece-status-" + props.status}
            onClick={props.handleClick}/>
  );
}

function getTheme(player) {
  const player1 = {
    light: '#6ec6ff',
    main: '#2196f3',
    dark: '#0069c0',
    contrastText: '#fff',
  };
  const player2 = {
    light: '#ff79b0',
    main: '#FF4081',
    dark: '#c60055',
    contrastText: '#fff',
  };
  return createMuiTheme({
    palette: {
      primary: player === 1 ? player1 : player2,
      secondary: player === 1 ? player2 : player1,
    },
  });
}

/* Main App Container with Title, Game, and Help dialogues */
export class Permaximize extends React.Component {
  render() {
    return (
        <HashRouter>
        <div className="permaximize-main">
          <Route exact path="/">
            <TitleScreen/>
          </Route>
          <Route path="/permaximize/game">
            <Game/>
          </Route>
        </div>
        </HashRouter>
    );
  }
}

/*
 * Game
 * Main game control component
 */
class Game extends React.Component {
  constructor(props) {
    super(props);
    this.size = 7;
    this.maxTurn = 14;
    this.state = this.initialState();
    this.searched = null;
    this.search = this.search.bind(this);
  }

  initialState() {
    return {
      board: this.initialBoard(),
      selected: null,
      score: [1, 1],
      turn: 0,
      showHelp: true
    };
  };
  resetState = () => this.setState(this.initialState());

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
   * createBoardPieces
   * Generate a list of Piece components matching state.board's config
   */
  createBoardPieces() {
    let list = [];
    for (let i = 0; i < this.state.board.length; i++) {
      for (let j = 0; j < this.state.board[0].length; j++) {
        list.push(
            <Piece status={this.state.board[i][j]} key={[i, j]}
                   handleClick={() => this.handlePieceClick(i, j)}/>
        );
      }
    }
    return list;
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
   * calculateScore
   * Calculate largest chain for a given player
   */
  calculateScore(player) {
    // Clear search array
    this.searched = new Array(this.size).fill(new Array(this.size).fill(0));
    let maxSize = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        maxSize = Math.max(this.search(r, c, player), maxSize);
      }
    }
    return maxSize;
  }

  /*
   * search
   * Recursive search to count chains
   */
  search(row, col, player) {
    // Base cases
    if (row < 0 || col < 0 || row > this.size - 1 || col > this.size - 1) {
      return 0;
    } else if ((this.state.board[row][col] % 2) !== 2 - player || this.searched[row][col]) {
      return 0;
    }
    // Mark searched
    let rowArray = [...this.searched[row]];
    rowArray[col] = 1;
    this.searched[row] = rowArray;
    // Search left, up, right, down
    return 1 + this.search(row, col - 1, player) + this.search(row - 1, col, player) +
        this.search(row, col + 1, player) + this.search(row + 1, col, player);
  }

  scoreHeader() {
    // If game is over, show GAME OVER
    if (this.state.turn >= this.maxTurn) {
      return (
          <div className="game-score-header game-score-header-win">
            <h3 className={"game-win-text game-win-text-" + this.winningPlayer()}>
              {this.winningPlayer() === 0 ? "A tie!" : "Player " + this.winningPlayer() + " wins!"}
            </h3>
            <p className={"game-win-link game-win-link-" + this.winningPlayer()}
               onClick={this.resetState}>
              Click here to start again
            </p>
          </div>
      );
    }
    return (
        <div className="game-score-header">
          <h3 className={"game-score " + (this.currentPlayer() === 1 ? "game-score-current" : "")}
              id="game-score-1">
            {this.state.score[0]}
          </h3>
          <h3 className={"game-score " + (this.currentPlayer() === 2 ? "game-score-current" : "")}
              id="game-score-2">
            {this.state.score[1]}
          </h3>
        </div>
    );
  }

  render() {
    if (!this.state.showHelp) {
      return (
          <div id="game-container">
            <Button id="game-help-button" onClick={() => this.setState({showHelp: true})}>Help</Button>
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
    return (<HelpScreen onClick={() => this.setState({showHelp: false})}/>);
  }
}