# Permaximize
## Abraham Oliver, 2022

# Todo
 - Animations
 - Computer player
 - Player is active/deactive indicator
 - Socket info in memcache / socket table
 - Generalize game server
 - Improve error messages / actions
 
# Deployment
```bash
# Deploy backend from backend/
sam build && sam deploy
# Deploy frontend from root
npm run deploy
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
