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

let App = express();
let server = http.createServer(App);

// Security middleware
App.use(helmet());

// set up a route to redirect http to https
App.get('*', function(req, res) {
  res.redirect('https://abeoliver.com' + req.url);
})

server.listen(80);