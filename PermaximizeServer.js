const express = require("express");
const http = require("http");
const sio = require("socket.io");
const path = require("path");

let App = express();
let server = http.createServer(App);
let io = sio(server);

let sockets = [];

/***  SEND MAIN APP ***/
//App.use(express.static(path.join(__dirname, "/build")));
/*
App.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
})*/

/*** RUN SOCKETS ***/
io.on('connection', (socket) => {
  // Add socket to client list
  sockets.push(socket);
  console.log("Socket connection successful");
  // Set socket handlers
  // Handle message event
  socket.on("message", (data) => console.log(data));
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log("Socket disconnection");
    // Remove socket from list
    let index = sockets.indexOf(socket);
    if (index >= 0) sockets.splice(index, 1);
  });
});

server.listen(3001, () => console.log("Listening !"));