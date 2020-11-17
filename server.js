/*
 * server.js - abeoliver.com
 * Abraham Oliver, 2020
 */
const fs = require("fs");
const express = require("express");
const https = require("https");
const path = require("path");
const compression = require('compression');
const morgan = require("morgan");

const Permaximize = require('./src/components/permaximize/SocketServer');

let App = express();
const ssl_options = {
  key: fs.readFileSync("keys/privkey.pem"),
  cert: fs.readFileSync("keys/fullchain.pem")
};
let server = https.createServer(ssl_options, App);

/***  SEND MAIN APP ***/
// Logging middleware
// create a write stream (in append mode)
let logStream = fs.createWriteStream(path.join(__dirname, 'log', 'https.log'), { flags: 'a' });
App.use(morgan("combined", { stream: logStream }));
// Compress files for send
App.use(compression());
// Server all build files statically
App.use(express.static(path.join(__dirname, "/build")));
// Send main launching point
App.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
})
// Allow for connection check
App.get('/ping', function (req, res) {
  return res.send('pong');
});
// Run permaximize socket server
new Permaximize(server);

// Run the server
let port = 443;
server.listen(port, () => console.log(`Server listening on ${port}...`));