/*
 * Multiplayer.js - Permaximize Online
 * Abraham Oliver, 2020
 */

import React from 'react';
import { Game } from "./Game";

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