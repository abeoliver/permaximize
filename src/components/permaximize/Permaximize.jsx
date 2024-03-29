/*
 * Permaximize.jsx - Permaximize Online
 * Abraham Oliver, 2020
 */

import React from 'react';
import {HashRouter, Link, Route} from "react-router-dom";
import { BasicGame } from './BasicGame';
import { MultiplayerGame } from "./Multiplayer";
import './Permaximize.css';
import { themes } from "./themes";

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
            <BasicGame/>
          </Route>
          {/* NEED ROUTE TO MULTIPLAYER CREATION*/}
          <Route path="/permaximize/game/multiplayer/:player/:id"
                render={props => <MultiplayerGame {...props}/>}/>
        </div>
        </HashRouter>
    );
  }
}


class TitleScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hovered: false};
    this.hover = () => this.setState({hovered: true});
    this.unHover = () => this.setState({hovered: false});
  }


  render() {
    return (
        <div className={"permaximize-title-screen" + (this.state.hovered ? " permaximize-title-screen-hover" : "")}>
          <h1 id="permaximize-title-main">Permaximize</h1>
          <h3 id="permaximize-title-author">
            <a href="https://abeoliver.github.io/" id="permaximize-title-link">by Abraham Oliver</a>
          </h3>
          <div id="permaximize-title-buttons">
            <Link to="/permaximize/game" style={{textDecoration: "none"}}>
              <h3 className="permaximize-title-play"
                  id="permaximize-title-play-1"
                  onMouseEnter={this.hover}
                  onMouseLeave={this.unHover}>
                Play Local
              </h3>
            </Link>
            <Link to="/permaximize/game/multiplayer/1/new" style={{textDecoration: "none"}}>
              <h3 className="permaximize-title-play"
                  onMouseEnter={this.hover}
                  onMouseLeave={this.unHover}>
                Play Online
              </h3>
            </Link>
          </div>
        </div>
    );
  }
}