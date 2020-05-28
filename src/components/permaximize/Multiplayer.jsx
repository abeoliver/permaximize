/*
 * Multiplayer.jsx - Permaximize Online
 * Abraham Oliver, 2020
 */

import React from "react";
import { BasicGame } from "./BasicGame";
import io from "socket.io-client";
import "./BasicGame.css";

const urlBase = process.env.REACT_APP_URLBASE;
const socketUrl = process.env.REACT_APP_SOCKET_URL;
const hashBase = "/permaximize/game/multiplayer/";
const port = process.env.REACT_APP_PORT;

export class MultiplayerGame extends BasicGame {
  constructor(props) {
    super(props);
    // Read player from URL
    this.player = parseInt(props.match.params.player);
    // Match the game id if it is present in the URL
    this.idProp = null;
    if (props.match.params.id !== undefined) {
      this.idProp = props.match.params.id;
    }
  }

  componentDidMount() {
    // Create socket connection
    this.socket = io.connect();
    console.log(socketUrl);
    // Set event handlers
    this.socket.on("connect", this.onConnect.bind(this));
    this.socket.on("game-state", this.onGameState.bind(this));
    this.socket.on("disconnect", () => console.log("DISCONNECTED FROM SOCKET SERVER"));

    super.componentDidMount();

    // Set ID in state
    if (this.idProp !== null) this.setState({id: this.idProp});
  }

  componentWillUnmount() {
    this.socket.close();
  }

  // Override to prevent playing as other player
  allowClick(row, col) {
    // Do not allow clicking if game is over
    if (this.state.turn >= this.maxTurn) return false;
    // Do not choose a piece if not your turn
    if (((this.state.turn % 2) + 1) !== this.player) return false;
    // Do not choose a solid piece (return true otherwise)
    return !(this.state.board[row][col] === 3 || this.state.board[row][col] === 4);

  }

  executeMove(move, selected) {
    // Play the move on the board
    super.executeMove(move, selected);
    // Send move to server
    this.socket.emit("game-update", JSON.stringify({
      id: this.state.id,
      board: this.state.board,
      turn: this.state.turn + 1,
      move: move,
      selected: selected,
      score: this.state.score
    }), () => null); // Add acknowledgment as third argument
  }

  onConnect() {
    console.log("CONNECTED TO SOCKET SERVER");
    // Find already built game if client provided ID
    if (this.state.id !== null && this.state.id !== "new") {
      // Send a join game event
      this.socket.emit("join-game", JSON.stringify({
        id: this.state.id,
        player: this.player
      }), (data) => {
        // Set the state of the game based on the server's response
        this.onGameState(data);
      });
      return;
    }
    // Otherwise, request a new game
    this.socket.emit('new-game', "", (data) => {
      // Get ID from new game and put it into URL fragment in case user reloads
      this.setState({id: JSON.parse(data).id});
      window.location.hash = hashBase + this.player + "/" + this.state.id;
      // Set game state based on response
      this.onGameState(data);
    });
  }

  onGameState(gameStateMsg) {
    let gameState = JSON.parse(gameStateMsg);
    console.log(gameState);
    this.setState({board: gameState.board, turn: gameState.turn});
    this.updateScore();
  }

  playerText(player, over) {
    let pText = null;
    if (player === this.player) {
      pText = "You";
    } else {
      pText = "Opponent";
    }
    if (over) {
      pText = (this.winningPlayer() === player ? "Winner" : "Play again!");
    }
    return pText;
  }

  copyLinkToClipboard() {
    var range = document.createRange();
    var selection = window.getSelection();
    range.selectNodeContents(document.getElementById("multiplayer-link"));
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("copy");
  }

  helpScreen() {
    return (
        <div id="game-help-main">
          <h2 id="game-help-title">Instructions</h2>
          <p>{this.player === 1 ? <b>To start, send the link below to a friend. You are player one (blue) and you play first. </b> :
                <b> An opponent has challenged you to a game. You are player two (pink) and you play second. </b>}
            Each player has 7 turns to build the largest continuous blob of their color, without diagonals, which is displayed in a darker color.
            On a given player's turn, they choose one of their own pieces and choose one of their opponent's pieces and swap them. Once they have swapped
            the two, the piece of their own color is now "solidified" and cannot be moved for the rest of the game; these pieces are marked with a
            hollow center. Use solidified pieces to cut your opponents' blob and fortify your own!</p>
          {(() => {
            if (this.state.id !== null && this.state.id !== "new") {
              let showLink = this.player === 1;
              return (
                  <div>
                    {showLink ?
                        ([(<p id="multiplayer-link" onClick={this.copyLinkToClipboard}>
                          {urlBase + (port !== "0" ? ":" + port : "") + "/#/permaximize/game/multiplayer/2/" + this.state.id}
                        </p>),
                          (<p id="multiplayer-link-copy">(click link to copy)</p>)]) :
                        ""
                    }
                    <h3 id="game-help-done" onClick={() => this.setState({showHelp: false})}> Play </h3>
                  </div>
              );
            } else {
              return <p id="multiplayer-link">Connecting to server...</p>;
            }
          })()}
        </div>
    );
  }

  linkContextExt = "/#/permaximize/game/multiplayer/1/new";

  render() {
    if (this.state.id === null || this.state.id === "new" || this.player === null) {
      return this.helpScreen();
    } else {
      return super.render();
    }
  }
}