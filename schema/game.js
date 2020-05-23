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

let Game = new mongoose.model("Game", gameSchema);

module.exports = Game;