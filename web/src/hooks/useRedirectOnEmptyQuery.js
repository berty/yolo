import { useLocation, useHistory } from 'react-router-dom'
import { useContext, useEffect } from 'react'
import { getFallbackQueryString } from '../store/globalStoreHelpers'
import { GlobalContext } from '../store/GlobalStore'

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
