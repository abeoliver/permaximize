/*
 * Schema: Game - Permaximize Online
 * Abraham Oliver, 2020
 */
const mongoose = require("mongoose");

const gameUtil = require("../src/components/permaximize/game_util");

// _id is defined by the object ID
let gameSchema = new mongoose.Schema({
  board: {
    type: String,
    default: JSON.stringify(gameUtil.initialBoard(7))
  },
  turn: {
    type: Number,
    default: 0,
    min: 0
  },
  historyPiece1: {
    type: [Number],
    min: 0,
    max: 48
  },
  historyPiece2 : {
    type: [Number],
    min: 0,
    max: 48
  },
  result: {
    type: Number,
    default: 0
  },
  created: {
    type: Date,
    default: Date.now,
  }
});

// Add toSend method (for sending game data across sockets)
gameSchema.methods.toSend = function () {
  return JSON.stringify({
    id: this._id,
    board: JSON.parse(this.board),
    turn: this.turn
  });
};

// Add a method to save game history moves
gameSchema.methods.recordMove = function (move, selected) {
  this.historyPiece1.push(selected[0] * 7 + selected[1]);
  this.historyPiece2.push(move[0] * 7 + move[1]);
}

let Game = new mongoose.model("Game", gameSchema);

module.exports = Game;