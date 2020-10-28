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

import cloneDeep from "lodash/cloneDeep";
import React, { useReducer } from "react";
import { ARTIFACT_KIND_VALUE, PROJECT } from "../constants";
import { getMobileOperatingSystem } from "../util/browser";
import Cookies from "js-cookie";

const actions = {
  UPDATE_STATE: "UPDATE_STATE",
  LOGOUT: "LOGOUT",
};

export const GlobalContext = React.createContext();

export const userAgent = getMobileOperatingSystem();

const defaultArtifactKinds =
  userAgent === "iOS" || userAgent === "Unknown OS"
    ? [ARTIFACT_KIND_VALUE.IPA]
    : userAgent === "Android"
    ? [ARTIFACT_KIND_VALUE.APK]
    : [];

export const INITIAL_STATE = {
  authIsPending: false,
  builds: [],
  error: null,
  isAuthed: false,
  isLoaded: false,
  needsRefresh: true,
  userAgent,
  uiFilters: {
    artifact_kinds: defaultArtifactKinds,
    build_driver: [],
    build_state: [],
    project_id: [PROJECT.messenger],
    branch: [],
  },
  showingFilterModal: false,
  resultSource: "Undetermined",
};

function reducer(state, action) {
  const stateCopy = cloneDeep(state);
  switch (action.type) {
    case actions.UPDATE_STATE:
      return { ...stateCopy, ...action.payload };
    case actions.LOGOUT:
      return {
        ...stateCopy,
        autoRefreshOn: false,
        isAuthed: false,
        builds: [],
        needsRefresh: true,
      };
    default:
      return state;
  }
}

export const GlobalStore = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // custom actions can go here; for now we just have one
  // 🚧 not cool, we need to split this so we don't get redundant re-renders
  //     or have to do a slow deep equality check to prevent it
  const updateState = (payload) => {
    dispatch({ type: actions.UPDATE_STATE, payload });
  };

  const logoutAction = () => {
    Cookies.remove("apiKey");
    window.localStorage.removeItem("uiFilters");
    window.localStorage.removeItem("branchNames");
    window.localStorage.removeItem("displayFeed");
    window.localStorage.removeItem("builds");
    dispatch({ type: actions.LOGOUT });
  };

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
  );
};
