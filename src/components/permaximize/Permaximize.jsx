/*
 * PermaximizeGame.js - Permaximize Online
 * Abraham Oliver, 2020
 *
 * Board status key:
 * 1 : Player 1 normal
 * 2 : Player 2 normal
 * 3 : Player 1 solid
 * 4 : Player 2 solid
 * 5 : Player 1 selected
 * 6 : Player 2 selected
 */

import React from 'react';
import {HashRouter, Route} from "react-router-dom";
import { TitleScreen } from './Screens';
import { Game } from './Game';
import { MultiplayerGame } from "./Multiplayer";
import './Permaximize.css';
import { themes } from "./themes";

/* Main App Container with Title, Game, and Help dialogues */
export class Permaximize extends React.Component {
  constructor(props) {
    super(props);
    this.state = { theme: 0 };
  }

  componentDidMount() {
    // Set theme colors
    let doc = document.getElementById("permaximize-main");
    for (let [color, val] of Object.entries(themes[this.state.theme])) {
      doc.style.setProperty(color, val);
    }
  }

  render() {
    return (
        <HashRouter>
        <div id="permaximize-main">
          <Route exact path="/">
            <TitleScreen/>
          </Route>
          <Route exact path="/permaximize/game">
            <Game/>
          </Route>
          <Route path="/permaximize/game/multiplayer">
            <MultiplayerGame/>
          </Route>
        </div>
        </HashRouter>
    );
  }
}