import React, {useState} from 'react';
import {cloneDeep} from 'lodash';

// TODO: Yes, this file needs a new name, and should maybe be split
export const ResultContext = React.createContext();

export const PLATFORMS = {
  iOS: '1',
  android: '2',
  none: '3',
};

const INITIAL_STATE = {
  platformId: '3',
  apiKey: `${process.env.YOLO_APP_PW || ''}`,
  error: null,
  isLoaded: true,
  items: [],
  baseURL: `${process.env.SERVER_URL}`,
};

export const ResultStore = ({children}) => {
  const [state, setState] = useState({...INITIAL_STATE});

  const updateState = (newState) => {
    const combinedState = cloneDeep({...state, ...newState});
    return setState(combinedState);
  };

  return (
    <ResultContext.Provider value={{state, updateState}}>
      {children}
    </ResultContext.Provider>
  );
};
