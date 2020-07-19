/* eslint-disable import/no-named-as-default */
import React, { useContext, useEffect } from 'react'
import { hot } from 'react-hot-loader'
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom'
import 'tabler-react/dist/Tabler.css'
import './assets/main.scss'
import { GlobalStore } from './store/GlobalStore'
import { ThemeContext, ThemeStore } from './store/ThemeStore'
import Error404 from './ui/pages/Error404/Error404'
import Home from './ui/pages/Home/Home'

const AppRouter = () => {
  const {
    theme: {
      bg: { page: pageBgColor },
    },
  } = useContext(ThemeContext)
  useEffect(() => {
    document.body.style.backgroundColor = pageBgColor
  }, [pageBgColor])

  return (
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
  )
}

const App = () => (
  <ThemeStore>
    <GlobalStore>
      <AppRouter />
    </GlobalStore>
  </ThemeStore>
)

export default hot(module)(App)
