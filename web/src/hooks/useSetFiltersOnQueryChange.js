import { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { actions } from '../constants'
import { GlobalContext } from '../store/GlobalStore'
import { getFiltersFromUrlQuery } from '../store/globalStoreHelpers'

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
