/* eslint-disable import/no-named-as-default */
import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import Error404 from "./ui/pages/Error404/Error404";
import { GlobalStore, GlobalContext } from "./store/GlobalStore";
import { ThemeStore } from "./store/ThemeStore";
import Home from "./ui/pages/Home/Home";
import Header from "./ui/components/Header/Header";
import AuthedHeaderContents from "./ui/components/AuthedHeaderContents/AuthedHeaderContents";
import { PullToRefreshWrapper } from "./ui/components/PullToRefresh";

const AppRouter = () => {
  const { state } = useContext(GlobalContext);

  return (
    <Router>
      <PullToRefreshWrapper>
        <Header>{state.isAuthed && <AuthedHeaderContents />}</Header>
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
      </PullToRefreshWrapper>
    </Router>
  );
};

const App = () => (
  <ThemeStore>
    <GlobalStore>
      <AppRouter />
    </GlobalStore>
  </ThemeStore>
);

export default App;
