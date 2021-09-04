# Todo
 - Deploy (maybe permaximize.com)
 - Animations
 - Chat
 - Computer player
 - Nav bar and title bar
 - Player is active/deactive indicator
 - Socket info in memcache
 - Increase security
 - Resolve util files (executeMove in particular)
 
# Deployment
```bash

```
# Socket Server API
`
GameSend {id, board, turn}
`

Client Sent Events:
 - `{"action": "new"}` Sent from the client to the server to request a new game. The server acknowledges
 the request with a `GameSend`. Always sent from the player 1 client. No parameters.
 - `{"action": "join", "id": <id>, "player": <p>}` Sent from the client to request a connection to a given game by its ID. The
 server acknowledges the request with a `GameSend`.
 - `{"action": "update","id": <id>,"selected": [0, 0], "second": [0, 1]}` Sent from the client to the server when the player has made a change to the
 game. 
 - `{"action": "update","id": <id>}` Restart a multiplayer game and send a new state to both players
 
Server Sent Events:
- `update` Sent from the server to the client when the state of the game has changed,
  likely because the other player made a move. Formatted as `GameSend`.

 # Database Schema
 ```$xslt
Game {
    id: ObjectId
    board: String // Defaults to initial board
    turn: Number  // Defaults to 0
    p1: String    // ConnectionId for player 1
    p2: String    // ConnectionId for player 2
}
```
 
 ## Available Scripts
 
 In the project directory, you can run:
 
 - `npm start` Runs development server
 - `npm run build` Build a production-ready app
 - `npm run build:w` Put Webpack into "watch build" mode (don't know if works right now)
 - `npm run lint` Run ESLint

# Removed from package
"proxy": "http://localhost:3001",