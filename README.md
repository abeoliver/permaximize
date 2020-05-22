# Todo
 - Write documentation
 - Deploy (maybe www.abeoliver.com)
 - Create multiplayer screen
 - Bundle screens with main components
 - Edit main screen for more buttons
    - Maybe multiplayer disappears?
 - Animations
 - UI message display
 - Always include score labels with "You" vs "Opponent"
 - Computer player
 - Nav bar and title bar
 - Help button should be a question mark

# Socket Server API
`
GameSend {id, board, turn}
`

Events:
 - `new-game` Sent from the client to the server to request a new game. The server acknowledges
 the request with a `GameSend`. Always sent from the player 1 client.
 - `join-game` Sent from the client to request a connection to a given game by its ID. The
 server acknowledges the request with a `GameSend`.
 - `game-state` Sent from the server to the client when the state of the game has changed,
 likely because the other player made a move. Formatted as `GameSend`.
 - `update-game` Sent from the client to the server when the player has made a change to the
 game. Sent as a `GameSend`.
 
 # Database Schema
 ```$xslt
Game {
    _id: ObjectId
    board: String // Defaults to initial board
    turn: Number  // Defaults to 0
}
```
 
 ## Available Scripts
 
 In the project directory, you can run:
 
 - `npm start` Runs development server
 - `npm run build` Build a production-ready app
 - `npm run build:w` Put Webpack into "watch build" mode (don't know if works right now)
 - `npm run deploy` Sync build folder with AWS site
 - `npm run lint` Run ESLint