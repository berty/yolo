import { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { requestBuilds } from '../api'
import { GlobalContext } from '../store/GlobalStore'

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
