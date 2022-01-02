/*
 * Permaximize Socket Server
 * Abraham Oliver, 2021
 * Designed to be run serverless on AWS
 *
 * Reqs:
 *  - Game must have unique id
 *  - Game must be two-player, turn-based (body.player == 1 or 2)
 *
 * Notes:
 *  - A `gameSend` function converts a DB game obj to a sendable
 *    string with data needed by a player (transform server record to
 *    client record)
 *
 * TODO:
 *  - Improve error responses (possibly through callback)
 */


// Create a DocumentClient that represents the query to add an item
const AWS = require("aws-sdk");
const dynamodb = require('aws-sdk/clients/dynamodb');
//const jwt = require('jsonwebtoken');

const docClient = new dynamodb.DocumentClient();
const apiEndpoint = "lm48hjnz77.execute-api.us-west-1.amazonaws.com/Prod/"; //event.requestContext.domainName + "/" + event.requestContext.stage
const gameTable = process.env.DB_TABLE_NAME;

/*
 * Parse a game id from a socket event
 */
function get_game_id(event) {
  return parseInt(JSON.parse(event.body).id)
}

/*
  Function: send
  Description: Send data through a socket to a connectionId
  Params: connections - list of websocket connectionIds to send to
          data - raw (string) data to send over socket
          event - AWS event
  Returns: bool - Was sending successful?
 */
async function send(connections, data) {
  // https://hackernoon.com/websockets-api-gateway-9d4aca493d39
  const api_gate = new AWS.ApiGatewayManagementApi({endpoint: apiEndpoint});

  let conn_error = (err) => {
    console.log("CONNECTION ID GIVEN BUT COULD NOT SEND MESSAGE");
  };

  try {
    let promises = [];
    for (let c of connections) {
      // Skip null connections (players will receive update on connect)
      if (c == null) continue;
      // Send message to ConnectionId
      promises.push(
          api_gate.postToConnection({ConnectionId: c, Data: data})
            .promise()
            .catch(conn_error))
      ;
    }
    // Wait for all messages to be sent
    await Promise.all(promises);
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
    // Return failure
    return false;
  }
  // Return success
  return true;
}
exports.send = send;

/*
  Function: loadId
  Description: Get a DB object by its table name and id
  Params: table - DynamoDB table name to read from
          id - id of item to load
  Returns: Object loaded from database or `false` if none
  Todo: Only players in game should be able to load it
 */
async function loadId(table, id) {
  let search_params = {
    TableName : table,
    Key: { id: id },
  };

  let obj = {};
  try {
    obj = (await docClient.get(search_params).promise()).Item;
  } catch (e) {
    return false;
  }
  return obj;
}
exports.loadId = loadId;

/*
  Function: writeId
  Description: Write to a DB entry by table name (object id inside object)
  Params: table - DynamoDB table name to write to
          obj - Object to write into DB (must have `id` as member)
  Returns: bool - Was writing successful?
  Todo: Only players in game should be able to write to it
 */
async function writeDB(table, obj) {
  let params = {
    TableName : table,
    Item: obj
  };
  try {
    await docClient.put(params).promise();
  } catch (e) {
    return false;
  }
  return true;
}
exports.writeDB = writeDB;

exports.buildConnectHandler = (connectFunc) => {
  return async (event, context, callback) => {
    let response = connectFunc(event);
    callback(null, response);
  };
}

// Must set status as disconnected on games
exports.buildDisconnectHandler = (disconnectFunc) => {
  return async (event, context, callback) => {
    let response = disconnectFunc(event);
    callback(null, response);
  };
}

/*
 * defaultFunc(event) => String data to return to requester
 */
exports.buildDefaultHandler = (defaultFunc) => {
  return async (event, context, callback) => {
    await send([event.requestContext.connectionId], defaultFunc(event));
    callback(null, {});
  };
}

/*
 * newGameFunc(event) => Fresh game object for DB
 */
exports.buildNewGameHandler = (newGameFunc, gameSend) => {
  return async (event, context, callback) => {
    // Build new game-state
    let game = newGameFunc(event);
    // Write new game to database
    await writeDB(gameTable, game);
    // Send new game-state to player 1
    await send([game.p1], gameSend(game));
    callback(null, {});
  };
}

/*
 * updateFunc(game, event) => New game-state from old game-state
 */
exports.buildUpdateHandler = (updateFunc, gameSend) => {
  return async (event, context, callback) => {
    // Get current game data from db
    const game_id = get_game_id(event);
    let old_game = await loadId(gameTable, game_id);

    // Alert updating user that game was not found
    if (!old_game) {
      await send([event.requestContext.connectionId], "GAME NOT FOUND");
      callback(null, {});
      return;
    }

    // Update the game-state with latest move
    let new_game = updateFunc(old_game, event);

    // Alert updating user that there was an update error
    if (!new_game) {
      await send([event.requestContext.connectionId], "GAME UPDATE ERROR");
      callback(null, {});
      return;
    }

    // Write to DB (wait to prevent race condition to DB)
    await writeDB(gameTable, new_game);

    // Broadcast new game info to players
    await send([new_game.p1, new_game.p2], gameSend(new_game));
    callback(null, {});
  };
}

/*
 * No game-specific function
 */
exports.buildJoinGameHandler = (gameSend) => {
  return async (event, context, callback) => {
    // Get current game data from db
    const game_id = get_game_id(event);
    let game = await loadId(gameTable, game_id);

    // Alert updating user that game was not found
    if (!game) {
      await send([event.requestContext.connectionId], "HELP JOIN");
      callback(null, {});
      return;
    }

    // Update player connectionId in game record
    if (JSON.parse(event.body).player == 1) {
      game.p1 = event.requestContext.connectionId;
    } else {
      game.p2 = event.requestContext.connectionId;
    }

    // Update db record for game
    await writeDB(gameTable, game);

    // Send game-state to requesting player
    await send([event.requestContext.connectionId], gameSend(game));
    callback(null, {});
  };
}

/*
 * resetFunc(old_game) => New game object with same players
 */
exports.buildResetGameHandler = (resetFunc, gameSend) => {
  return async (event, context, callback) => {
    // Get current game data from db
    const game_id = get_game_id(event);
    let old_game = await loadId(gameTable, game_id);

    // Alert updating user that game was not found
    if (!old_game) {
      await send([event.requestContext.connectionId], "HELP RESET");
      callback(null, {});
      return;
    }

    // Perform game-specific reset tasks
    let game = resetFunc(old_game);

    // Upload new game to db
    await writeDB(gameTable, game);

    // Send new game to both players
    await send([game.p1, game.p2], gameSend(game));
    callback(null, {});
  };
}