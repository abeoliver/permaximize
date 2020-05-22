/*
 * Multiplayer.js - Permaximize Online
 * Abraham Oliver, 2020
 */

//import React from 'react';
import { BasicGame } from "./BasicGame";
import io from "socket.io-client";

const urlBase = "http://localhost";
const hashBase = "/permaximize/game/multiplayer/";

export class MultiplayerGame extends BasicGame {
  constructor(props) {
    super(props);
    this.player = parseInt(props.match.params.player);
    //
    this.id = null;
    if (props.match.params.id !== undefined) {
      this.id = props.match.params.id;
    }
    this.onConnect = this.onConnect.bind(this);
    this.onGameState = this.onGameState.bind(this);
  }

  componentDidMount() {
    // Create socket connection
    this.socket = io.connect(urlBase + ":3001", {transports: ['websocket']});
    // Set event handlers
    this.socket.on("connect", this.onConnect);
    this.socket.on("game-state", this.onGameState);

    super.componentDidMount();
  }

  componentWillUnmount() {
    this.socket.close();
  }

  allowClick(row, col) {
    // Do not allow clicking if game is over
    if (this.state.turn >= this.maxTurn) return false;
    // Do not choose a piece if not your turn
    if (((this.state.turn % 2) + 1) !== this.player) return false;
    // Do not choose a solid piece (return true otherwise)
    return !(this.state.board[row][col] === 3 || this.state.board[row][col] === 4);

  }

  executeMove(move, selected) {
    super.executeMove(move, selected);
    // Send move to server
    this.socket.emit("game-update", JSON.stringify({
      id: this.id,
      board: this.state.board,
      turn: this.state.turn + 1
    }), () => null); // Add acknowledgment as third argument
  }

  onConnect(event) {
    console.log("CONNECTED TO SOCKET SERVER");
    // Find already built game
    if (this.id !== "new") {
      this.socket.emit("join-game", JSON.stringify({
        id: this.id,
        player: this.player
      }), (data) => {
        this.onGameState(data);
      });
      return;
    }
    // Otherwise, request a new game
    this.socket.emit('new-game', "", (data) => {
      this.id = JSON.parse(data).id;
      window.location.hash = hashBase + this.player + "/" + this.id;
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