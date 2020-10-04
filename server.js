/*
 * server.js - abeoliver.com
 * Abraham Oliver, 2020
 */
const express = require("express");
const http = require("http");
const path = require("path");
const compression = require('compression');

const Permaximize = require('./src/components/permaximize/SocketServer');

let App = express();
let server = http.createServer(App);

/***  SEND MAIN APP ***/
App.use(compression());
App.use(express.static(path.join(__dirname, "/build")));

App.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
})

App.get('/ping', function (req, res) {
  return res.send('pong');
});

// Run permaximize socket server
new Permaximize(server);

// Run the server
//process.argv[2]
server.listen(80, () => console.log("Server listening..."));