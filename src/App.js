import React from 'react';
import {Grid} from '@material-ui/core';
import {Permaximize} from './components/permaximize/Permaximize';
import './App.css';

function App() {
  return (
      <div className="App">
        <header className="App-header">
          <Grid container spacing={8} class="app-grid">
            <Grid item xs={12} class="app-grid-item">
              <Permaximize/>
            </Grid>
          </Grid>
        </header>
      </div>
  );
}
/*
<Grid item xs={12}>Topbar</Grid>
          <Grid item xs={12} md={4}>Navbar</Grid>
 */

export default App;
