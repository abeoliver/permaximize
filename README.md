# Permaximize
## Abraham Oliver, 2022

### Description
Play "Permaximize" online and with friends! Permaximize frontend- and game-logic have been connected to a general purpose backend server to enable live multiplayer. Game data is sent by websocket from AWS Lambda functions created by a CloudFormation stack.

### Todo
 - Animations
 - CPU opponent
 - Player is active/deactive indicator
 - Socket table instead of raw connectionIds (possibly store in memcache)
 - Improve error messages / actions
 
### Deployment
```bash
# Deploy backend from backend/
sam build && sam deploy
# Deploy frontend from root
npm run deploy
```

### Socket Server API
Client Sent Events:
 - `{"action": "new"}` Sent from the client to the server to request a new game. The server acknowledges
 the request with an object containing the game-state. Always sent from the player 1 client. No parameters.
 - `{"action": "join", "id": <id>, "player": <p>}` Sent from the client to request a connection to a given game by its ID. The
 server acknowledges the request with a game-state object.
 - `{"action": "update","id": <id>,"selected": [0, 0], "second": [0, 1]}` Sent from the client to the server when the player has made a change to the
 game. "selected" and "second" are permaximize-specific. The game engine can handle any game-specific parameters.
 - `{"action": "reset"}` Restart a multiplayer game and send a new state to both players
 
Server Sent Events:
- `update` Sent from the server to the client when the state of the game has changed,
  likely because the other player made a move. Formatted as game-state object.

 ### Database Schema
 ```$xslt
Game {
    id: ObjectId
    board: String // Defaults to initial board
    turn: Number  // Defaults to 0
    p1: String    // ConnectionId for player 1
    p2: String    // ConnectionId for player 2
}
```
