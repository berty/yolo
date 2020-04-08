/* eslint-disable import/no-named-as-default */
import React, {useEffect, useState} from 'react';
import {hot} from 'react-hot-loader';
import Home from './ui/pages/Home';

// Import Tabler styles
import 'tabler/scss/tabler.scss';
import './App.scss';

const detectBrowserTheme = () => {
  const supportsPreference =
    window.matchMedia('(prefers-color-scheme)').media !== 'not all';
  const isDark =
    supportsPreference &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return {isDark};
};

// TODO: Inject theme from Context
const App = () => {
  const [themeIsDark, setIsDark] = useState(false);
  const themeName = () => (themeIsDark ? 'theme-dark' : 'theme-light');

  useEffect(() => {
    const {isDark} = detectBrowserTheme();
    if (isDark) setIsDark(true);
  }, []);

  const toggleTheme = () => {
    setIsDark(!themeIsDark);
  };

  return (
    <div className={'page ' + themeName()}>
      <Home />
      <div className="footer p-4">
        <p>Yolo Footer</p>
        <div className="btn btn-primary" onClick={toggleTheme}>
          Toggle Theme
        </div>
      </div>
    </div>
  );
};

export default hot(module)(App);
