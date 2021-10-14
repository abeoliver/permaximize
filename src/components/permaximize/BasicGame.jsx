/*
 * PermaximizeGame.js - Permaximize Online
 * Abraham Oliver, 2020
 *
 * Board status key:
 * 1 : Player 1 normal
 * 2 : Player 2 normal
 * 3 : Player 1 solid
 * 4 : Player 2 solid
 */

import React from 'react';
import { LinearProgress, Button, Hidden } from "@material-ui/core";
import {createMuiTheme, ThemeProvider} from '@material-ui/core/styles';
import './BasicGame.css';
import 'status-indicator/styles.css';

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
      msg: "",
      id: null,
      opponent_active: true
    };
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
      msg: "",
      id: null,
      opponent_active: false
    };
  };

  resetState() {
    this.setState(this.initialState(false));
  }

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
    // Set the main selected piece if not chosen yet
    if (this.state.selected === null) {
      // Do not choose a piece of the other color
      if (this.state.board[row][col] === this.opposingPlayer()) return;
      // Make selected status
      //newBoard[row][col] = newBoard[row][col] + 4;
      this.setState({selected: [row, col]});
      return;
    // Un-choose if already selected
    } else if (this.state.selected[0] === row && this.state.selected[1] === col) {
      //newBoard[row][col] = newBoard[row][col] - 4;
      this.setState({selected: null});
      return;
    }
    // Do not choose a piece of the player's own color
    if (this.state.board[row][col] === this.currentPlayer()) return;
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
    console.log("BASIC EXECUTE MOVE");
    // Flip board pieces
    let newBoard = gameUtil.executeMove(this.state.board, selected, move);
    // Save updated game state
    this.setState({selected: null, board: newBoard, turn: this.state.turn + 1});
    // Update score
    return this.updateScore(newBoard);
  }

  /*
   * updateScore
   */
  updateScore(board) {
    let [blobs, score] = gameUtil.analyzeBoard(board);
    this.setState({score: score, largest: blobs});
    return [blobs, score];
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
        <div className="game-score-header" onClick={(over ? this.resetState.bind(this) : null)}>
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
        let status = this.state.board[i][j];
        // Highlight selected piece
        if (this.state.selected && this.state.selected[0] == i
            && this.state.selected[1] == j) {
          status += 4;
        }
        list.push(
            <Piece status={status} key={(i * this.size) + j}
                   largest={this.state.largest[i][j]}
                   handleClick={() => this.handlePieceClick(i, j)}
            />
        );
      }
    }
    return list;
  }

  helpScreen() {
    return (
        <div id="game-help-main">
          <h2 id="game-help-title">Instructions</h2>
          <p>Welcome to Permaximize! To start, grab a friend and choose who will be blue (plays first)
            and who will be pink. Each player has 7 turns to build the largest continuous blob of their
            color, without diagonals, which is displayed in a darker color. On a given player's turn, they choose one of their own pieces and choose one of their
            opponent's pieces and swap them. Once they have swapped the two, the piece of their own color is now
            "solidified" and cannot be moved for the rest of the game; these pieces are marked with a hollow center.
            Use solidified pieces to cut your opponents' blob and fortify your own!</p>
          <h3 id="game-help-done" onClick={() => this.setState({showHelp: false})}> Play </h3>
        </div>
    );
  }

  userMessage() {
    return this.state.msg !== "" ? this.state.msg : " ";
  }

  render() {
    if (!this.state.showHelp) {
      return (
          <div id="game-container">
            <Hidden mdDown>
              <Button id="game-help-button" onClick={() => this.setState({showHelp: true})}>?</Button>
            </Hidden>
            <div onClick={() => window.location.hash = ""}>
              <p id="game-main-title">Permaximize</p>
            </div>

            <div id="permaximize-message-block">
              {this.userMessage()}
            </div>

            <div className="game">
              {this.scoreHeader()}

              <div className="game-board-grid"
                   style={{gridTemplateColumns: "repeat(" + this.size + ", auto)"}}>
                {this.createBoardPieces()}
              </div>
              {(() => {
                  if (this.state.turn === this.maxTurn - 2) {
                    return <p id="game-progress-final-1">Player 1's final turn</p>;
                  } else if (this.state.turn === this.maxTurn - 1) {
                    return <p id="game-progress-final-2">Player 2's final turn</p>;
                  } else if (this.state.turn < this.maxTurn - 2) {
                    return (
                        <ThemeProvider theme={getTheme(this.currentPlayer())}>
                          <LinearProgress variant="determinate" value={(this.state.turn / this.maxTurn) * 100}
                                          className="game-progress-bar"/>
                        </ThemeProvider>
                    );
                  }
                })()}
            </div>
          </div>
      );
    }
    // Show Help Screen
    return this.helpScreen();
  }
}
