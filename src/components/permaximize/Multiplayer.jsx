/*
 * Multiplayer.jsx - Permaximize Online
 * Abraham Oliver, 2020
 */

import { BasicGame } from "./BasicGame";
import io from "socket.io-client";

const urlBase = "http://localhost";
const hashBase = "/permaximize/game/multiplayer/";

export class MultiplayerGame extends BasicGame {
  constructor(props) {
    super(props);
    // Read player from URL
    this.player = parseInt(props.match.params.player);
    // Match the game id if it is present in the URL
    this.id = null;
    if (props.match.params.id !== undefined) {
      this.id = props.match.params.id;
    }
  }

  componentDidMount() {
    // Create socket connection
    this.socket = io.connect(urlBase + ":3001", {transports: ['websocket']});
    // Set event handlers
    this.socket.on("connect", this.onConnect.bind(this));
    this.socket.on("game-state", this.onGameState.bind(this));
    this.socket.on("disconnect", () => console.log("DISCONNECTED FROM SOCKET SERVER"));

    super.componentDidMount();
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
      id: this.id,
      board: this.state.board,
      turn: this.state.turn + 1
    }), () => null); // Add acknowledgment as third argument
  }

  onConnect() {
    console.log("CONNECTED TO SOCKET SERVER");
    // Find already built game if client provided ID
    if (this.id !== null && this.id !== "new") {
      // Send a join game event
      this.socket.emit("join-game", JSON.stringify({
        id: this.id,
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
      this.id = JSON.parse(data).id;
      window.location.hash = hashBase + this.player + "/" + this.id;
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

  render() {
    if (this.id === null || this.player === null) {
      return this.helpScreen();
    } else {
      return super.render();
    }
  }
}