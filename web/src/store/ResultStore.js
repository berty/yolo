/**
 * BEWARE ⚠️
 *
 * This is a container for ALL (almost) the app state.
 * It is mutated uniquely via action updateState()
 * throughout the entire app
 *
 * Tell ekelen to refactor me
 */

import React, { useReducer } from 'react'
import { cloneDeep } from 'lodash'
import { retrieveAuthCookie } from '../api/cookies'
import {
  actions,
  ARTIFACT_KIND_VALUE,
  PROJECT,
  PROJECT_BUILD_DRIVER,
} from '../constants'

export const ResultContext = React.createContext()

export const INITIAL_STATE = {
  apiKey: retrieveAuthCookie() || null,
  authIsPending: false,
  autoRefreshOn: false,
  builds: [],
  error: null,
  isAuthed: false,
  isLoaded: false,
  needsProgrammaticQuery: false,
  needsQuietRefresh: false,
  needsRefresh: false,
  userAgent: '',
  uiFilters: {
    artifact_kinds: [ARTIFACT_KIND_VALUE.IPA],
    build_driver: [PROJECT_BUILD_DRIVER[PROJECT.chat]],
    build_state: [],
  },
  calculatedFilters: {
    projects: [PROJECT.chat],
    order: 'created_at',
  },
}

function reducer(state, action) {
  switch (action.type) {
    case actions.UPDATE_STATE:
      return { ...state, ...action.payload }
    default:
      return { ...state }
  }
}

export const ResultStore = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  // custom actions can go here; for now we just have one
  const updateState = (payload) => {
    dispatch({ type: actions.UPDATE_STATE, payload: cloneDeep(payload) })
  }

  return (
    <ResultContext.Provider
      value={{
        state,
        updateState,
      }}
    >
      {children}
    </ResultContext.Provider>
  )
}
