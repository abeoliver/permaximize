/*
 * Permaximize Socket Server
 * Abraham Oliver, 2021
 * Designed to be run serverless on AWS
 */

// Create a DocumentClient that represents the query to add an item
const AWS = require("aws-sdk");
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
const jwt = require('jsonwebtoken');
const util = require("./game_util");
const permaximize = require("./permaximize_game");

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

  let response = {
    "statusCode": 200,
    "headers": {},
    "body": data,
    "isBase64Encoded": false
  };

  try {
    await apig.postToConnection({
      ConnectionId: connection,
      Data: data
    }).promise();
  } catch (e) {
    // https://github.com/aws-samples/simple-websockets-chat-app/blob/master/sendmessage/app.js
    /*   FOR A SOCKET TABLE
    if (e.statusCode === 410) {
      console.log(`Found stale connection, deleting ${connection}`);
      await docClient.delete({ TableName: tableName, Key: { connection } }).promise();
    } else {
      throw e;
    }
     */
    response.statusCode = 500;
  }
  callback(null, response);
}

async function sendBoth(c1, c2, data, event, callback) {
  // https://hackernoon.com/websockets-api-gateway-9d4aca493d39
  const apig = new AWS.ApiGatewayManagementApi({
    endpoint: event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  let error = false;

  let conn_error = (er) => {
    error = true;
    console.log("Player is not available");
  }

  let promises = [
      apig.postToConnection({ConnectionId: c1, Data: data}).promise().catch(conn_error),
      apig.postToConnection({ConnectionId: c2, Data: data}).promise().catch(conn_error)
  ];

  await Promise.all(promises);

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
  if (!game) {
    await send(event.requestContext.connectionId, "HELP UPDATE", event, callback);
    return;
  }

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
    callback("BIG ERROR");
    return;
  }
  // MORE VALIDATION NEEDED

  // Make board from event's move
  game.board = util.executeMove(game.board, selected, second);
  game.turn = game.turn + 1;

  // Update db record for game
  let params = {
    TableName : tableName,
    Item: game
  };
  // ERROR IF NEEDED

  // Send new game info to other player
  console.log(game);
  await sendBoth(game.p1, game.p2, gameSend(game), event, callback);
  await docClient.put(params);
}

exports.newGameHandler = async (event, context, callback) => {
  // GET NEW ID?
  const id = Math.floor(Math.random() * 1000);
  let game = newGame(id, event.requestContext.connectionId);

  let params = {
    TableName : tableName,
    Item: game
  };
  // ERROR IF NEEDED
  await send(game.p1, gameSend(game), event, callback);
  await docClient.put(params).promise();
}

exports.joinGameHandler = async (event, context, callback) => {
  // Get current game data from db
  let game = await loadGame(event);
  if (!game) {
    await send(event.requestContext.connectionId, "HELP JOIN", event, callback);
    return;
  }

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

  await send(event.requestContext.connectionId, gameSend(game), event, callback);
  await docClient.put(params).promise();
}

exports.resetGameHandler = async (event, context, callback) => {
  // Get current game data from db
  let old_game = await loadGame(event);
  if (!old_game) {
    await send(event.requestContext.connectionId, "HELP RESET", event, callback);
    return;
  }
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

  // ERROR IF NEEDED
  // CHECK TO SEE IF PLAYERS ARE ALIVE

  // Send new game to both players
  await sendBoth(game.p1, game.p2, gameSend(game), event, callback);

  // Upload new game to db
  docClient.put({
    TableName : tableName,
    Item: game
  });
}