/*
 * SocketServer.js - Permaximize Online
 * Abraham Oliver, 2020
 */
const mongoose = require("mongoose");
const sio = require("socket.io");

const GameRecord = require("../../../schema/game");

const mongoURL = "mongodb://localhost/PermaximizeGames";
//const mongoURL = "mongodb+srv://permaximize:Tr%40bajabaDur0@permaximize-vomg0.mongodb.net/Permaximize?retryWrites=true&w=majority"

class SocketServer {
  constructor(server) {
    this.io = sio(server);
    this.games = {}

    // Start mongoose
    mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log("CONNECTED TO MONGO"))
        .catch((err) => console.error(err));

    // Attach socket handlers
    this.io.on('connection', (socket) => {
      console.log("Socket connection successful");
      socket.on("message", this.onMessage.bind(this));
      socket.on('disconnect', this.onDisconnect.bind(this));
      socket.on('new-game', (d, a) => this.onNewGame.bind(this)(d, a, socket));
      socket.on("game-update", (d, a) => this.onGameUpdate.bind(this)(d, a, socket));
      socket.on("join-game", (d, a) => this.onJoinGame.bind(this)(d, a, socket));
    });
  }

  async getGame(id) {
    // Get a game promise from the database of the desired game
    return GameRecord.findOne({_id: id});
  }

  onMessage(data) {
    console.log(data);
  }

  onDisconnect() {
    console.log("Socket disconnection");
  }

  onJoinGame(data, acknowledgment, socket) {
    // Parse data
    data = JSON.parse(data);
    // Once game is retrieved, add socket to game and send game data to client
    this.getGame(data.id).then((game) => {
      // Error handle
      if (!game || this.games[data.id] === undefined) {
        console.log("COULDN'T FIND A GAME");
        //socket.emit("error", "Couldn't find game");
        return;
      }

      // Set socket to game player
      if (data.player === 1) {
        this.games[data.id].p1 = socket;
      } else if (data.player === 2) {
        this.games[data.id].p2 = socket;
      }

      // Return data
      acknowledgment(game.toSend());
    });
  }

  onNewGame(data, acknowledgment, socket) {
    // Get a new game
    let newGameRecord = new GameRecord();
    // Add it to the database, add it to live games, send game state to client
    newGameRecord.save((err, game) => {
      if (err) {
        throw err;
      }

      // Add to server records
      this.games[game._id] = {
        id: game._id,
        p1: socket,
        p2: null
      };

      // Acknowledge message with a game state
      acknowledgment(game.toSend());
    });
  }

  result(score) {
    if (score[0] === score[1]) return 0;
    else if (score[0] > score[1]) return 1;
    else return 2;
  }

  onGameUpdate(data, acknowledgement, socket) {
    data = JSON.parse(data);
    // Get game record
    this.getGame(data.id).then((game) => {
      if (game === null) {
        console.log("AN ID COULD NOT BE FOUND");
        socket.emit('error', "AN ID COULD NOT BE FOUND");
        return;
      }

      // Update game in database
      game.board = JSON.stringify(data.board);
      game.turn = data.turn;
      game.recordMove(data.move, data.selected);
      // Save current winning player for report score
      game.result = this.result(data.score);
      game.save();

      // Send to other player
      let sendSocket = ((game.turn % 2) === 0 ? this.games[game._id].p1 : this.games[game._id].p2);
      if (sendSocket !== null && sendSocket.connected) {
        sendSocket.emit("game-state", game.toSend());
      }
      // Call acknowledgement
      acknowledgement();
    });
  }
}

module.exports = SocketServer;