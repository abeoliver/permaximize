const server = require("./game-server");

const apiEndpoint = "lm48hjnz77.execute-api.us-west-1.amazonaws.com/Prod/";
const DEFAULT_SIZE = 7;
const ID_SPACE_SIZE = 1e12;

// Translate DB object to client-send object
function gameSend(game) {
  return JSON.stringify({
    id: game.id,
    board: game.board,
    turn: game.turn
  });
}

// Generate game-state for new game
function newGameObj(connection) {
  return {
    id: Math.floor(Math.random() * ID_SPACE_SIZE),
    board: initialBoard(),
    turn: 0,
    p1: connection,
    p2: null
  };
}

// Generate starting board array
function initialBoard() {
  let board = [];
  for (let i = 0; i < DEFAULT_SIZE; i++) {
    let row = [];
    // Alternate row start color
    let status = (i % 2) + 1;
    for (let j = 0; j < DEFAULT_SIZE; j++) {
      row.push(status);
      // Flip color for next piece
      status = (status === 1 ? 2 : 1);
    }
    board.push(row);
  }
  return board;
}

//
function executeMove(board, selected, second) {
  let player = board[selected[0]][selected[1]] % 2 == 1 ? 1 : 2;
  // Make solid status
  board[selected[0]][selected[1]] = player + 2;
  // Flip pieces
  let tmp = board[second[0]][second[1]];
  board[second[0]][second[1]] = board[selected[0]][selected[1]];
  board[selected[0]][selected[1]] = tmp;
  return board;
}

function result(score) {
  if (score[0] === score[1]) return 0;
  else if (score[0] > score[1]) return 1;
  else return 2;
}


function defaultFunc(event) {
  return "DEFAULT";
}

function connectFunc(event) {
  return {};
}

function disconnectFunc(event) {
  return {};
}

function newGameFunc(event) {
  let game = newGameObj(event.requestContext.connectionId);
  console.log(game);
  return game;
}

function updateFunc(game, event) {
  // Get move from player
  let selected = JSON.parse(event.body).selected;
  let second = JSON.parse(event.body).second;

  // Validate move
  let firstPlayer = false;
  if (game.p1 && event.requestContext.connectionId == game.p1) {
    firstPlayer = true;
  } else if (game.p2 && event.requestContext.connectionId == game.p2) {
    firstPlayer = false;
  } else {
    // BIG ERROR
    console.log("UPDATE ERROR :: NO CONNECTION MATCH");
    return false;
  }
  // MORE VALIDATION NEEDED

  // Make board from event's move
  game.board = executeMove(game.board, selected, second);
  game.turn = game.turn + 1;

  return game;
}

function resetFunc(old_game) {
  // GET NEW ID?
  const id = Math.floor(Math.random() * 1000);

  // Randomize player order
  let keepPlayerOrder = Math.random() > .5;
  let game = {};
  if (keepPlayerOrder) {
    game = newGameObj(old_game.p1);
    game.p2 = old_game.p2;
  } else {
    game = newGameObj(old_game.p2);
    game.p2 = old_game.p1;
  }

  // ERROR IF NEEDED
  // CHECK TO SEE IF PLAYERS ARE ALIVE

  return game;
}


exports.connectHandler = server.buildConnectHandler(connectFunc);
exports.disconnectHandler = server.buildDisconnectHandler(disconnectFunc);
exports.defaultHandler = server.buildDefaultHandler(defaultFunc);
exports.newGameHandler = server.buildNewGameHandler(newGameFunc, gameSend, apiEndpoint);
exports.updateHandler = server.buildUpdateHandler(updateFunc, gameSend, apiEndpoint)
exports.joinGameHandler = server.buildJoinGameHandler(gameSend, apiEndpoint);
exports.resetGameHandler = server.buildResetGameHandler(resetFunc, gameSend, apiEndpoint);