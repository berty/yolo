/* eslint-disable import/no-named-as-default */
import React from 'react';
import {hot} from 'react-hot-loader';
import Home from './ui/pages/Home';

// Import Tabler styles
import 'tabler/scss/tabler.scss';

import './App.scss';

const App = () => {
  return (
    <div className="page">
      <Home />
    </div>
  );
};

export default hot(module)(App);
