/*
 * Multiplayer.jsx - Permaximize Online
 * Abraham Oliver, 2020
 */

import React from "react";
import { BasicGame } from "./BasicGame";
import io from "socket.io-client";
import "./BasicGame.css";

const protocol = "http://";
const domainBase = "abeoliver.com";
const hashBase = "/permaximize/game/multiplayer/";
const apiServer = "wss://lm48hjnz77.execute-api.us-west-1.amazonaws.com/Prod/";

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
    // Create WebSocket connection.
    this.socket = new WebSocket(apiServer);
    this.socket.addEventListener('open', this.onConnect.bind(this));
    this.socket.addEventListener('message', this.onGameState.bind(this));


    super.componentDidMount();

    // Set ID in state
    if (this.idProp !== null) this.setState({id: this.idProp});
  }

  componentWillUnmount() {
    this.socket.close();
  }

  resetState() {
    // Request a new game
    this.socket.send(JSON.stringify({"action": "reset", "id": this.state.id}));
    // Set new game to state? or auto updated on message?
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
    // Play the move on the board (will override on nextGameState if issue)
    super.executeMove(move, selected);
    // Send move to server
    this.socket.send(JSON.stringify({
      "action": "update", "id": this.state.id,
      "selected": selected, "second": move
    }));
  }

  onConnect() {
    console.log("CONNECTED TO SOCKET SERVER");
    // Find already built game if client provided ID
    if (this.state.id !== null && this.state.id !== "new") {
      // Send a join game event
      this.socket.send(JSON.stringify({
        "action": "join", "id": this.state.id, "player": this.player
      }));
      //this.onGameState(data);
      return;
    }
    // Otherwise, request a new game
    this.socket.send(JSON.stringify({"action": "new"}));
  }

  onGameState(data) {
    console.log("NEW MESSAGE :: ", data);
    data = JSON.parse(data.data);
    // Get ID from new game and put it into URL fragment in case user reloads
    if (data.id !== this.state.id) {
      window.location.hash = hashBase + this.player + "/" + data.id;
      this.setState({id: data.id});
    }
    this.setState({board: data.board, turn: data.turn, selected: null});
    if (data.board) this.updateScore(data.board);
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
                          {protocol + domainBase + "/#" + hashBase + "2/" + this.state.id}
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

  userMessage() {
    return null;
    return [
      <p id="game-main-msg">Player 2 is active</p>,
      <status-indicator positive pulse id="permaximize-status-indicator"/>
    ];
  }

  render() {
    if (this.state.id === null || this.state.id === "new" || this.player === null) {
      return this.helpScreen();
    } else {
      return super.render();
    }
  }
}