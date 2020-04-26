import React, {useState, useContext, useReducer, createContext} from 'react';
import {cloneDeep} from 'lodash';
import {PLATFORMS} from '../constants';

// TODO: Yes, this file needs a new name, and should maybe be split
export const ResultContext = React.createContext();

export const INITIAL_STATE = {
  platformId: PLATFORMS.iOS,
  apiKey: `${process.env.YOLO_APP_PW || ''}`,
  error: null,
  isLoaded: false,
  items: [],
  baseURL: `${process.env.API_SERVER}`,
  needsRequest: true,
  filtersPlatform: {
    iOS: true,
    android: false,
  },
  filtersBranch: {
    master: false,
    develop: false,
    all: true,
  },
  filtersApp: {
    chat: true,
    mini: false,
    maxi: false,
  },
  filtersImplemented: {
    apps: ['chat'],
    os: ['iOS', 'android'],
    branch: ['all'],
  },
};

function _reducer(state, action) {
  switch (action.type) {
    case 'updateState':
      return {...state, ...action.payload};
    default:
      return {...state};
  }
}

export const ResultStore = ({children}) => {
  const [state, dispatch] = useReducer(_reducer, INITIAL_STATE);
  const updateState = (newState) => {
    return dispatch({type: 'updateState', payload: cloneDeep(newState)});
  };

  return (
    <ResultContext.Provider value={{state, updateState}}>
      {children}
    </ResultContext.Provider>
  );
};
