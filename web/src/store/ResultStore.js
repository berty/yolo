import React, {useReducer} from 'react';
import {cloneDeep} from 'lodash';
import {retrieveAuthCookie} from '../api/auth';
import {actions, PLATFORMS} from '../constants';

// TODO: Yes, this file needs a new name, and should maybe be split
export const ResultContext = React.createContext();

export const INITIAL_STATE = {
  platformId: PLATFORMS.iOS,
  apiKey: retrieveAuthCookie() || null,
  isAuthed: false,
  error: null,
  isLoaded: false,
  builds: [],
  baseURL: `${process.env.API_SERVER}`,
  needsProgrammaticQuery: false,
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
  },
  filtersImplemented: {
    apps: ['chat'],
    os: ['iOS', 'android'],
    branch: ['all'],
  },
};

function _reducer(state, action) {
  switch (action.type) {
    case actions.UPDATE_STATE:
      return {...state, ...action.payload};
    default:
      return {...state};
  }
}

export const ResultStore = ({children}) => {
  const [state, dispatch] = useReducer(_reducer, INITIAL_STATE);

  // custom actions can go here; for now we just have one
  const updateState = (payload) => {
    dispatch({type: actions.UPDATE_STATE, payload: cloneDeep(payload)});
  };

  // pass dispatch if we want to trigger an action without an action creator
  return (
    <ResultContext.Provider value={{state, dispatch, updateState}}>
      {children}
    </ResultContext.Provider>
  );
};
