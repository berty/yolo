import { useLocation, useHistory } from 'react-router-dom'
import { useContext, useEffect } from 'react'
import { requestBuilds } from '../api'
import { getFallbackQueryString, getFiltersFromUrlQuery } from '../store/globalStoreHelpers'
import { GlobalContext } from '../store/GlobalStore'
import { actions } from '../constants'

/**
 * Adds query params to URL bar if there are none
 * Hacky; also sets userAgent and stores to global state
 */
export const useRedirectOnEmptyQuery = () => {
  const { search: locationSearch } = useLocation()
  const { state: { userAgent }, updateState } = useContext(GlobalContext)
  const history = useHistory()
  useEffect(() => {
    if (!locationSearch) {
      const fallbackQueryString = getFallbackQueryString({ userAgent, updateState })
      history.push({
        pathname: '/',
        search: fallbackQueryString,
      })
    }
  },
  // TODO: Bad; refactor
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [locationSearch])
}

/**
 * Call API if query in URL bar changes
 */
export const useRequestOnQueryChange = () => {
  const { state: { needsRefresh, apiKey }, updateState } = useContext(GlobalContext)
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
      const { artifact_kinds, build_driver, build_state } = getFiltersFromUrlQuery({ locationSearch }) || {}
      dispatch({
        type: actions.UPDATE_UI_FILTERS,
        payload:
          { artifact_kinds, build_driver, build_state },
      })
    }
    if (locationSearch) updateFilters()
    // TODO: Bad; refactor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch])
}
