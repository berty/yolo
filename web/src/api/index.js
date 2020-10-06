import queryString from 'query-string'
import { mockBuildListRequest } from './mock'
import { buildListRequest } from './requests'
import { validateError } from './apiResponseTransforms'

export const getBuildList = ({ apiKey = '', queryObject }) => process.env.YOLO_UI_TEST === 'true'
  ? mockBuildListRequest()
  : buildListRequest({ apiKey, queryObject })

export const requestBuilds = ({
  updateState = () => {},
  locationSearch = '',
  apiKey = '',
}) => {
  if (!locationSearch) {
    return null
  }
  updateState({
    error: null,
    isLoaded: false,
    needsRefresh: false,
  })
  return getBuildList({
    apiKey,
    queryObject: queryString.parse(locationSearch),
  })
    .then(
      (result) => {
        const { data: { builds = [] } = { builds: [] } } = result
        updateState({
          builds,
          error: null,
          isAuthed: true,
          isLoaded: true,
          authIsPending: false,
        })
      },
      (error) => {
        const validatedError = validateError({ error })
        const { status } = validatedError
        updateState({
          error: validatedError,
          isAuthed: status !== 401,
          autoRefreshOn: false,
          isLoaded: true,
          authIsPending: false,
        })
      },
    )
    .finally(() => {
      updateState({
        isLoaded: true,
        authIsPending: false,
      })
    })
}
