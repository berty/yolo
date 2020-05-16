/* eslint-disable import/no-named-as-default */
import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { hot } from "react-hot-loader";
import Home from "./ui/pages/Home/Home";
import { ThemeStore } from "./store/ThemeStore";

import "tabler-react/dist/Tabler.css";
import "./assets/main.scss";
import { ResultStore } from "./store/ResultStore";
import Error404 from "./ui/pages/Error404";

const App = () => (
  <ThemeStore>
    <ResultStore>
      <Router>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/404.html">
            <Error404 />
          </Route>
          <Route>
            <Redirect to="/404.html" />
          </Route>
        </Switch>
      </Router>
    </ResultStore>
  </ThemeStore>
);

export default hot(module)(App);
