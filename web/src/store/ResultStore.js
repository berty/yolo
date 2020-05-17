import React, { useReducer, useMemo } from 'react'
import { cloneDeep } from 'lodash'
import { retrieveAuthCookie } from '../api/auth'
import { groupBuildsByMr } from '../api/dataTransforms'
import {
  actions,
  ARTIFACT_KIND_VALUE,
  PROJECT,
  PROJECT_BUILD_DRIVER,
} from '../constants'

// TODO: Yes, this file needs a new name, and should maybe be split
export const ResultContext = React.createContext()

export const INITIAL_STATE = {
  apiKey: retrieveAuthCookie() || null,
  isAuthed: false,
  error: null,
  isLoaded: false,
  builds: [],
  baseURL: `${process.env.API_SERVER}`,
  needsProgrammaticQuery: false,
  needsRefresh: false,
  uiFilters: {
    artifact_kinds: [ARTIFACT_KIND_VALUE.IPA],
    build_driver: [PROJECT_BUILD_DRIVER[PROJECT.chat]],
  },
  calculatedFilters: {
    projects: [PROJECT.chat],
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
  const buildsByMr = useMemo(() => groupBuildsByMr(state.builds), [
    state.builds,
  ])

  // custom actions can go here; for now we just have one
  const updateState = (payload) => {
    dispatch({ type: actions.UPDATE_STATE, payload: cloneDeep(payload) })
  }

  // pass dispatch if we want to trigger an action without an action creator
  return (
    <ResultContext.Provider
      value={{
        state, dispatch, buildsByMr, updateState,
      }}
    >
      {children}
    </ResultContext.Provider>
  )
}
