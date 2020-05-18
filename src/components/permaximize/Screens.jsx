/*
 * Dialogue.js - Permaximize Online
 * Abraham Oliver, 2020
 */

import React from 'react';
import { Link } from "react-router-dom";
import './Permaximize.css';

export function TitleScreen() {
  return (
      <div className="game-title-screen">
        <h1 id="game-title-main">Permaximize</h1>
        <h3 id="game-title-author">by Abraham Oliver</h3>
        <Link to="/permaximize/game" style={{textDecoration: "none"}}>
          <h3 id="game-title-play"> Play Now </h3>
        </Link>
      </div>
  );
}

export function HelpScreen(props) {
    return (
        <div id="game-help-main">
          <h2 id="game-help-title">Permaximize</h2>
          <p>{helpText}</p>
          <h3 id="game-help-done" onClick={props.onClick}> Got it </h3>
        </div>
    );
  }

const helpText = `
Welcome to Permaximize! To start, grab a friend and choose who will be blue (plays first)
and who will be pink. Each player has 7 turns to build the largest continuous blob of their
color, without diagonals, which is displayed in a darker color. On a given player's turn, they choose one of their own pieces and choose one of their
opponent's pieces to swap. Once they have swapped the two, the piece of their own is now
"solidified" and cannot be moved for the rest of the game; these pieces are marked with a hollow center.
 Use solidified pieces to cut your opponents blob and fortify your own!
`;