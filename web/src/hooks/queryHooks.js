import { useCallback, useContext, useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { requestBuilds } from '../api'
import { actions } from '../constants'
import { GlobalContext } from '../store/GlobalStore'
import {
  getFallbackQueryString,
  getFiltersFromUrlQuery,
} from '../store/globalStoreHelpers'

export const useRedirectHome = () => {
  const history = useHistory()
  const redirectHome = useCallback(
    () => history.push({
      path: '/',
    }),
    [history],
  )
  return { redirectHome }
}

/**
 * Adds query params to URL bar if there are none
 * Hacky; also sets userAgent and stores to global state
 */
export const useRedirectOnEmptyQuery = () => {
  const { search: locationSearch } = useLocation()
  const {
    state: { userAgent },
    updateState,
  } = useContext(GlobalContext)
  const history = useHistory()
  useEffect(
    () => {
      if (!locationSearch) {
        const fallbackQueryString = getFallbackQueryString({
          userAgent,
          updateState,
        })
        history.push({
          pathname: '/',
          search: fallbackQueryString,
        })
      }
    },
    // TODO: Bad; refactor
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locationSearch],
  )
}

/**
 * Call API if query in URL bar changes and state.needsRefresh is true
 */
export const useRequestOnQueryChange = () => {
  const {
    state: { needsRefresh, apiKey },
    updateState,
  } = useContext(GlobalContext)
  const { search: locationSearch } = useLocation()

  useEffect(() => {
    if (locationSearch && needsRefresh) {
      requestBuilds({ updateState, locationSearch, apiKey })
    }
    // TODO: Bad; refactor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch, needsRefresh])
}

/**
 * Parse URL query params for filters so we can update the UI
 */
export const useSetFiltersOnQueryChange = () => {
  const { dispatch } = useContext(GlobalContext)
  const { search: locationSearch } = useLocation()
  useEffect(() => {
    const updateFilters = () => {
      const { artifact_kinds, build_driver, build_state } = JSON.parse(window.localStorage.getItem('uiFilters')) || getFiltersFromUrlQuery({ locationSearch }) || {}
      dispatch({
        type: actions.UPDATE_UI_FILTERS,
        payload: { artifact_kinds, build_driver, build_state },
      })
    }
    if (locationSearch) updateFilters()
    // TODO: Bad; refactor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch])
}
