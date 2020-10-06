import queryString from 'query-string'
import { isEqual } from 'lodash'
import {
  ARTIFACT_KINDS,
  BUILD_DRIVERS,
  BUILD_STATES,
  KIND_TO_PLATFORM,
  PLATFORM_TO_ARTIFACT_KIND,
  PROJECT_ARTIFACT_KINDS,
} from '../constants'
import { singleItemToArray } from '../util/getters'
import { getMobileOperatingSystem } from '../util/browser'

export const getFiltersFromUrlQuery = ({ locationSearch = '', uiFilters }) => {
  if (!locationSearch) {
    return null
  }
  const locationObject = queryString.parse(locationSearch)
  if (isEqual(locationObject, uiFilters)) return null
  const {
    artifact_kinds: queryArtifactKinds = [],
    build_driver: queryBuildDrivers = [],
    build_state: queryBuildState = [],
  } = locationObject
  const artifactKinds = (!Array.isArray(queryArtifactKinds)
    ? [queryArtifactKinds]
    : queryArtifactKinds
  ).filter((artifactKind) => ARTIFACT_KINDS.includes(artifactKind))
  const buildDrivers = (!Array.isArray(queryBuildDrivers)
    ? [queryBuildDrivers]
    : queryBuildDrivers
  ).filter((buildDriver) => BUILD_DRIVERS.includes(buildDriver))

  const buildStates = queryBuildState
    ? singleItemToArray(queryBuildState.toString()).filter((buildState) => BUILD_STATES.includes(buildState))
    : []

  return {
    artifact_kinds: artifactKinds,
    build_driver: buildDrivers,
    build_state: buildStates,
  }
}

// Set default query string:
// project_id=__BERTY MESSENGER ID__
// artifact_kinds=__MOBILE USER AGENT APP KIND || IPA__
export const getFallbackQueryString = ({ userAgent = '', updateState }) => {
  const defaultArtifactKinds = [PROJECT_ARTIFACT_KINDS.messenger]
  const updatedUserAgent = userAgent || getMobileOperatingSystem()
  const isMobile = updatedUserAgent === KIND_TO_PLATFORM.IPA
    || updatedUserAgent === KIND_TO_PLATFORM.APK
  const defaultKind = isMobile
    ? [PLATFORM_TO_ARTIFACT_KIND[updatedUserAgent]]
    : defaultArtifactKinds

  updateState({
    userAgent,
  })
  const fallbackQueryString = queryString
    .stringify({ artifact_kinds: defaultKind })
    .concat('&project_id=https://github.com/berty/berty')
  return fallbackQueryString
}
