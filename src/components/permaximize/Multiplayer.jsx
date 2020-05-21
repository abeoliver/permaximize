/*
 * Multiplayer.js - Permaximize Online
 * Abraham Oliver, 2020
 */

import React from 'react';
import { Game } from "./Game";
import io from "socket.io-client";

export class NetTest extends React.Component {
  constructor(props) {
    super(props);
    this.state = { msg: ""};
    this.socket = null;
    this.sendMsg = this.sendMsg.bind(this);
  }

  componentDidMount() {
    this.socket = io("http://localhost:3001", {transports: ['websocket']});
    console.log("NEW WEBSOCKET");
    this.socket.on("connect", (e) => {
      console.log("CONNECTED");
      this.setState({msg: "Open | "});
    });

    this.socket.on("message", (message) => {
      //let message = JSON.parse(data);
      console.log(message);
      this.setState({msg: this.state.msg + " | " + message});
    });
  }

  sendMsg() {
    if (this.socket.connected) {
      let d = (new Date()).getMilliseconds();
      this.socket.send(JSON.stringify({
        type: "msg",
        data: "CLIENT MESSAGE : " + d
      }));
      console.log("SENT MESSAGE : " + d);
      this.setState({msg: this.state.msg + " | Sent: " + d});
    } else {
      console.log("CONNECTION DEAD");
    }
  }

  render() {
    return (
        <div>
          <p>{this.state.msg}</p>
          <button onClick={this.sendMsg}>Send</button>
        </div>);
  }
}

export class MultiplayerGame extends Game {
  componentDidMount() {
    // Create socket connection
    super.componentDidMount();
  }

  initialState(showHelp) {
    // Get state from server
    return super.initialState(showHelp);
  }

  handlePieceClick(row, col) {
    // Send move to server and wait for acceptance
    return super.handlePieceClick(row, col);
  }

}