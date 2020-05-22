const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const sio = require("socket.io");
const path = require("path");
const async = require("async");

const gameUtil = require("./src/components/permaximize/game_util");
const GameRecord = require("./schema/game");

const mongoURL = "mongodb://localhost/PermaximizeGames";
//const mongoURL = "mongodb+srv://permaximize:Tr%40bajabaDur0@permaximize-vomg0.mongodb.net/Permaximize?retryWrites=true&w=majority"
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("CONNECTED TO MONGO"))
    .catch((err) => console.error(err));

let App = express();
let server = http.createServer(App);
let io = sio(server);

/***  SEND MAIN APP ***/
App.use(express.static(path.join(__dirname, "/build")));

App.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
})

let ServerRecords = {};

async function getGame(id) {
  // Mongoose
  return GameRecord.findOne({_id: id});
}

/*** RUN SOCKET SERVER ***/
io.on('connection', (socket) => {
  console.log("Socket connection successful");
  // Set socket handlers
  // Handle message event
  socket.on("message", (data) => console.log(data));

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log("Socket disconnection");
  });

  // Handle new game request
  socket.on('new-game', (data, acknowledgment) => {
    let newGameRecord = new GameRecord();
    newGameRecord.save((err, game) => {
      if (err) {
        throw err;
      }
      // Add to server records
      ServerRecords[game._id] = {
        id: game._id,
        p1: socket,
        p2: null
      };
      // Acknowledge message with a game state
      acknowledgment(game.toSend());
    });
  });

  // Handle game update
  socket.on("game-update", (data, acknowledgement) => {
    data = JSON.parse(data);
    // Get game record
    getGame(data.id).then((game) => {
      if (game === null) {
        console.log("AN ID COULD NOT BE FOUND");
        socket.emit('error', "AN ID COULD NOT BE FOUND");
        return;
      }

      // Update saved game
      game.board = JSON.stringify(data.board);
      game.turn = data.turn;
      game.save();

      // Send to other player
      let sendSocket = ((game.turn % 2) === 0 ? ServerRecords[game._id].p1 : ServerRecords[game._id].p2);
      if (sendSocket !== null && sendSocket.connected) {
        sendSocket.emit("game-state", game.toSend());
      }
      // Call acknowledgement
      acknowledgement();
    })
  });

  // Handle game join
  socket.on("join-game", (data, acknowledgment) => {
    data = JSON.parse(data);
    getGame(data.id).then((game) => {
      if (!game) {
        console.log("COULDN'T FIND A GAME");
        //socket.emit("error", "Couldn't find game");
        return;
      }
      // Set socket to game player
      if (data.player === 1) {
        ServerRecords[data.id].p1 = socket;
      } else if (data.player === 2) {
        ServerRecords[data.id].p2 = socket;
      }
      // Return data
      //socket.emit("game-state", game.toSend());
      acknowledgment(game.toSend());
    });
  });
});

server.listen(3001, () => console.log("Listening !"));