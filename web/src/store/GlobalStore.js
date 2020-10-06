/* eslint-disable camelcase */

/**
 * BEWARE ⚠️
 *
 * This is a container for ALL (almost) the app state.
 * It is mutated uniquely via action updateState() and logoutAction()
 * throughout the entire app
 *
 * Tell ekelen to refactor me
 */

import React, { useReducer } from 'react'
import { retrieveAuthCookie } from '../api/cookies'
import { actions, PROJECT } from '../constants'
import { getMobileOperatingSystem } from '../util/browser'

export const GlobalContext = React.createContext()

export const INITIAL_STATE = {
  apiKey: retrieveAuthCookie() || null,
  authIsPending: false,
  builds: [],
  error: null,
  isAuthed: false,
  isLoaded: false,
  needsRefresh: true,
  userAgent: getMobileOperatingSystem(),
  uiFilters: {
    artifact_kinds: [],
    build_driver: [],
    build_state: [],
  },
  calculatedFilters: {
    projects: JSON.parse(window.localStorage.getItem('projects')) || [
      PROJECT.messenger,
    ],
    order: 'created_at',
  },
  showingFilterModal: false,
  testProperty: 'ignore me',
}

function reducer(state, action) {
  switch (action.type) {
    case actions.UPDATE_STATE:
      return { ...state, ...action.payload }
    case actions.UPDATE_UI_FILTERS: {
      const { artifact_kinds = [], build_driver = [], build_state = [] } = action.payload || {}
      return {
        ...state,
        uiFilters: {
          artifact_kinds,
          build_driver,
          build_state,
        },
      }
    }
    case actions.LOGOUT:
      return {
        ...state,
        autoRefreshOn: false,
        isAuthed: false,
        builds: [],
        apiKey: '',
        needsRefresh: true,
        calculatedFilters: INITIAL_STATE.calculatedFilters,
      }
    default:
      return { ...state }
  }
}

export const GlobalStore = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  // custom actions can go here; for now we just have one
  // 🚧 not cool, we need to split this so we don't get redundant re-renders
  //     or have to do a slow deep equality check to prevent it
  const updateState = (payload) => {
    dispatch({ type: actions.UPDATE_STATE, payload })
  }

  const logoutAction = () => {
    window.localStorage.removeItem('projects')
    window.localStorage.removeItem('uiFilters')
    window.localStorage.removeItem('displayFeed')
    dispatch({ type: actions.LOGOUT })
  }

  return (
    <GlobalContext.Provider
      value={{
        state,
        updateState,
        logoutAction,
        dispatch,
      }}
    >
      {children}
    </GlobalContext.Provider>
  )
}
