/**
 * http_server.js
 *
 * This server redirects HTTP requests to port 80 to
 * HTTPS request on port 443
 */

// set up plain http server
const http = require("http");
const helmet = require("helmet");
const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
var path = require('path');

let App = express();
let server = http.createServer(App);

// Security middleware
App.use(helmet());

// Logging Middleware
// create a write stream (in append mode)
let logStream = fs.createWriteStream(path.join(__dirname, 'log', 'http.log'), { flags: 'a' });
App.use(morgan("combined", { stream: logStream }));


// set up a route to redirect http to https
App.get('*', function(req, res) {
  res.redirect('https://' + req.get('host') + req.originalUrl);
})

server.listen(80);