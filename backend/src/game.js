/*
 * Permaximize Socket Server
 * Abraham Oliver, 2021
 * Designed to be run serverless on AWS
 */

// Create a DocumentClient that represents the query to add an item
const AWS = require("aws-sdk");
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
const util = require("./game_util");

const tableName = process.env.DB_TABLE_NAME;

function newGame(id, connection) {
  return {
    id: id,
    board: util.initialBoard(util.DEFAULT_SIZE),
    turn: 0,
    p1: connection,
    p2: null
  };
}

function gameSend(game) {
  return JSON.stringify({
    id: game.id,
    board: game.board,
    turn: game.turn
  });
}

async function send(connection, data, event, callback) {
  // https://hackernoon.com/websockets-api-gateway-9d4aca493d39
  const apig = new AWS.ApiGatewayManagementApi({
    endpoint: event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  await apig.postToConnection({
        ConnectionId: connection,
        Data: data
      }).promise();
  let response = {
    "statusCode": 200,
    "headers": {},
    "body": data,
    "isBase64Encoded": false
  };
  callback(null, response);
}

async function send_both(c1, c2, data, event, callback) {
  // https://hackernoon.com/websockets-api-gateway-9d4aca493d39
  const apig = new AWS.ApiGatewayManagementApi({
    endpoint: event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  await apig.postToConnection({
    ConnectionId: c1,
    Data: data
  }).promise();
  await apig.postToConnection({
    ConnectionId: c2,
    Data: data
  }).promise();

  let response = {
    "statusCode": 200,
    "headers": {},
    "body": data,
    "isBase64Encoded": false
  };
  callback(null, response);
}

async function loadGame(event) {
  // event.pathParameters.id
  const id = parseInt(JSON.parse(event.body).id);
  let search_params = {
    TableName : tableName,
    Key: { id: id },
  };
  return (await docClient.get(search_params).promise()).Item;
}

exports.connectHandler = async (event, context, callback) => callback(null, {});

// Must set status as disconnected on games
exports.disconnectHandler = async (event, context, callback) => callback(null, {});

exports.defaultHandler = async (event, context, callback) => {
  await send(event.requestContext.connectionId,"DEFAULT", event, callback);
}

exports.updateHandler = async (event, context, callback) => {
  // Get current game data from db
  let game = await loadGame(event);

  game.p1 = event.requestContext.connectionId;

  let selected = JSON.parse(event.body).selected;
  let second = JSON.parse(event.body).second;

  // Validate move
  let firstPlayer = false;
  if (event.requestContext.connectionId == game.p1) {
    firstPlayer = true;
  } else if (game.p2 && event.requestContext.connectionId == game.p2) {
    firstPlayer = false;
  } else {
    // BIG ERROR
    callback("P2 ERROR");
    return;
  }
  // MORE VALIDATION NEEDED

  // Make board from event's move
  game.board = util.flipPieces(game.board, selected, second);

  // Update db record for game
  let params = {
    TableName : tableName,
    Item: game
  };
  const result = await docClient.put(params).promise();
  // ERROR IF NEEDED

  // Send new game info to other player
  /*
  if (firstPlayer && game.p2) await send(game.p2, gameSend(game), event, callback);
  else await send(game.p1, gameSend(game), event, callback);
   */
  await send(game.p1, gameSend(game), event, callback);
}

exports.newGameHandler = async (event, context, callback) => {
  // GET NEW ID?
  const id = Math.floor(Math.random() * 1000);
  let game = newGame(id, event.requestContext.connectionId);

  let params = {
    TableName : tableName,
    Item: game
  };
  const result = await docClient.put(params).promise();
  // ERROR IF NEEDED
  await send(game.p1, gameSend(game), event, callback);
}

exports.joinGameHandler = async (event, context, callback) => {
  // Get current game data from db
  let game = await loadGame(event);

  if (JSON.parse(event.body).player == 1) {
    game.p1 = event.requestContext.connectionId
  } else {
    game.p2 = event.requestContext.connectionId
  }

  // Update db record for game
  let params = {
    TableName : tableName,
    Item: game
  };
  const result = await docClient.put(params).promise();

  await send(event.requestContext.connectionId, gameSend(game), event, callback);
}

exports.resetGameHandler = async (event, context, callback) => {
  // Get current game data from db
  let old_game = await loadGame(event);
  // GET NEW ID?
  const id = Math.floor(Math.random() * 1000);

  // Randomize player order
  let keepPlayerOrder = Math.random() > .5;
  let game;
  if (keepPlayerOrder) {
    game = newGame(id, old_game.p1);
    game.p2 = old_game.p2;
  } else {
    game = newGame(id, old_game.p2);
    game.p2 = old_game.p1;
  }

  // Upload new game to db
  const result = await docClient.put({
    TableName : tableName,
    Item: game
  }).promise();

  // ERROR IF NEEDED
  // CHECK TO SEE IF PLAYERS ARE ALIVE

  // Send new game to both players
  await send_both(game.p1, game.p2, gameSend(game), event, callback);
}