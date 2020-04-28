/* eslint-disable import/no-named-as-default */
import React from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import {hot} from 'react-hot-loader';
import Home from './ui/pages/Home/Home';
import {ThemeStore} from './store/ThemeStore';

import 'tabler-react/dist/Tabler.css';
import './assets/main.scss';
import {ResultStore} from './store/ResultStore';
import Error404 from './ui/pages/Error404';

const App = () => {
  return (
    <ThemeStore>
      <ResultStore>
        <Router>
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>
            <Route>
              <Error404 />
            </Route>
          </Switch>
        </Router>
      </ResultStore>
    </ThemeStore>
  );
};

export default hot(module)(App);
