/* eslint-disable import/no-named-as-default */
import React, {useEffect, useState} from 'react';
import {hot} from 'react-hot-loader';
import Home from './ui/pages/Home/Home';
import {ThemeStore} from './store/ThemeStore';

// Import Tabler styles
import 'tabler-react/dist/Tabler.css';
import './assets/main.scss';
import {ResultStore} from './store/ResultStore';

const App = () => {
  return (
    <ThemeStore>
      <ResultStore>
        <Home />
      </ResultStore>
    </ThemeStore>
  );
};

export default hot(module)(App);
