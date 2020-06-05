/* eslint-disable import/no-named-as-default */
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * BEWARE ⚠️
 *
 * A container for many side effects
 * - URL query param changes
 * - authentication handling
 * - triggering and handling API requests
 * - ... other stuff
 *
 * Tell ekelen to refactor me
 */

import Cookies from 'js-cookie'
import queryString from 'query-string'
import React, {
  useContext, useEffect, useState,
} from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { getBuildList } from '../../../api'
import { validateError } from '../../../api/apiResponseTransforms'
import {
  ARTIFACT_KINDS, BUILD_DRIVERS, BUILD_STATES, DEFAULT_RESULT_REQUEST_LIMIT, PLATFORM_TO_ARTIFACT_KIND, KIND_TO_PLATFORM,
} from '../../../constants'
import { INITIAL_STATE, ResultContext } from '../../../store/ResultStore'
import { ThemeContext } from '../../../store/ThemeStore'
import { getMobileOperatingSystem } from '../../../util/browser'
import { singleItemToArray } from '../../../util/getters'
import ApiKeyPrompt from '../../components/ApiKeyPrompt'
import BuildListContainer from '../../components/BuildListContainer'
import ErrorDisplay from '../../components/ErrorDisplay/ErrorDisplay'
import FilterModal from '../../components/FilterModal/FilterModal'
import Header from '../../components/Header/Header'
import ProtocolDisclaimer from '../../components/ProtocolDisclaimer'
import ShowFiltersButton from '../../components/ShowFiltersButton'
import styles from './Home.module.scss'

const Home = () => {
  const { theme } = useContext(ThemeContext)
  const { state, updateState } = useContext(ResultContext)
  const [showingFiltersModal, toggleShowFilters] = useState(false)
  const [showingDisclaimerModal, toggleShowDisclaimer] = useState(false)
  const [needsNewFetch, setNeedsNewFetch] = useState(false)
  const [autoRefreshOn, setAutoRefreshOn] = useState(false)
  const { search: locationSearch } = useLocation()
  const history = useHistory()

  // 🚧 Hacky - On initial render, set/get query params based on URL bar or state.uiFilters
  useEffect(() => {
    if (!locationSearch) {
      const { uiFilters: { artifact_kinds: initialArtifactKinds, build_driver: initialBuildDriver } } = INITIAL_STATE
      const userAgent = state.userAgent || getMobileOperatingSystem()
      const isMobile = (userAgent === KIND_TO_PLATFORM.IPA || userAgent === KIND_TO_PLATFORM.APK)
      const defaultKind = isMobile ? [PLATFORM_TO_ARTIFACT_KIND[userAgent]] : [...initialArtifactKinds]
      const defaultDriver = [...initialBuildDriver]

      // TODO: This is hacky; pushing to history below + setNeedsNewFetch
      //    will trigger the next useEffect
      updateState({
        userAgent,
        uiFilters: {
          ...state.uiFilters,
          artifact_kinds: defaultKind,
        },
      })
      // qS 'options' field doesn't seem to work
      // (e.g. if artifact_kinds === null)
      const initialLocationSearch = queryString.stringify({
        artifact_kinds: defaultKind,
        build_driver: defaultDriver,
      }, { skipNull: true, skipEmptyString: true })

      // Hacky continued
      setNeedsNewFetch(true)

      history.push({
        pathname: '/',
        search: initialLocationSearch,
      })
    } else {
      const locationObject = queryString.parse(locationSearch)
      const {
        artifact_kinds: queryArtifactKinds = [],
        build_driver: queryBuildDrivers = [],
        build_state: queryBuildState = [],
      } = locationObject
      const artifactKinds = (!Array.isArray(queryArtifactKinds)
        ? [queryArtifactKinds]
        : queryArtifactKinds
      ).filter((aK) => ARTIFACT_KINDS.includes(aK))
      const buildDriver = (!Array.isArray(queryBuildDrivers)
        ? [queryBuildDrivers]
        : queryBuildDrivers
      ).filter((bD) => BUILD_DRIVERS.includes(bD))

      const buildState = queryBuildState ? singleItemToArray(queryBuildState.toString())
        .filter((bS) => BUILD_STATES.includes(bS)) : []

      setNeedsNewFetch(true)
      updateState({
        uiFilters: {
          ...state.uiFilters, artifact_kinds: artifactKinds, build_driver: buildDriver, build_state: buildState,
        },
      })
    }
  }, [])

  // 🚧 If URL query or state uiFilters change, call/handle API request
  useEffect(() => {
    const getNewFetch = () => {
      updateState({
        error: null,
        isLoaded: false,
        // builds: [],
      })
      getBuildList({
        apiKey: state.apiKey,
        queryObject: queryString.parse(locationSearch),
        locationQuery: queryString.parse({ 'user-query': locationSearch }),
      })
        .then(
          (result) => {
            const { data: { builds = [] } = { builds: [] } } = result
            updateState({
              builds,
              error: null,
              isAuthed: true,
            })
          },
          (error) => {
            const validatedError = validateError({ error })
            const { status } = validatedError
            updateState({
              error: validatedError,
              isAuthed: status !== 401,

            })
            setAutoRefreshOn(false)
          },
        )
        .finally(() => {
          setNeedsNewFetch(false)
          updateState({
            isLoaded: true,
            authIsPending: false,
          })
        })
    }
    if (needsNewFetch && locationSearch) {
      getNewFetch()
    }
  }, [locationSearch, needsNewFetch])

  // 🚧 Trigger API call any time state.needsProgrammaticQuery is true
  useEffect(() => {
    const triggerNewQuery = () => {
      updateState({
        needsProgrammaticQuery: false,
      })
      history.push({
        path: '/',
        search: queryString.stringify(state.uiFilters) || `limit=${DEFAULT_RESULT_REQUEST_LIMIT}`,
      })
      setNeedsNewFetch(true)
    }
    if (state.needsProgrammaticQuery === true) triggerNewQuery()
  }, [state.needsProgrammaticQuery])

  // 🚧 Trigger API call using current URL bar params
  useEffect(() => {
    const triggerNewQuery = () => {
      updateState({
        needsRefresh: false,
      })
      history.push({
        path: '/',
        search: locationSearch,
      })
      setNeedsNewFetch(true)
    }
    if (state.needsRefresh === true) triggerNewQuery()
  }, [state.needsRefresh])

  // 🚧 If autoRefresh is enabled, trigger API call every 10 sec
  useEffect(() => {
    let timer
    if (
      !showingDisclaimerModal
      && !showingFiltersModal
      && autoRefreshOn
    ) {
      clearInterval(timer)
      timer = setInterval(() => {
        updateState({
          needsRefresh: true,
        })
      }, 10000)
    } else {
      clearInterval(timer)
    }
    return () => {
      clearInterval(timer)
    }
  }, [
    showingDisclaimerModal,
    showingFiltersModal,
    autoRefreshOn,
    updateState,
  ])

  // Show protocol warning modal + agreement on component render
  useEffect(() => {
    const disclaimerAccepted = Cookies.get('disclaimerAccepted')
    toggleShowDisclaimer(!disclaimerAccepted)
  }, [])

  // Hide protocol warning modal on Okay click
  const setDisclaimerAccepted = (accepted) => {
    Cookies.set('disclaimerAccepted', 1, { expires: 7 })
    toggleShowDisclaimer(!accepted)
  }

  return (
    <div className={styles.homeContainer}>
      <div className={styles.homepageWrapper} style={{ backgroundColor: theme.bg.page }}>
        <Header autoRefreshOn={autoRefreshOn} setAutoRefreshOn={setAutoRefreshOn} onFilterClick={toggleShowFilters} />
        {state.error && <ErrorDisplay error={state.error} />}
        {state.error && state.error.status === 401 && (
          <ApiKeyPrompt failedKey={state.apiKey} updateState={updateState} authIsPending={state.authIsPending} />
        )}
        {!state.error && (
          <BuildListContainer builds={state.builds} loaded={state.isLoaded} />
        )}
        <div
          className={styles.footer}
          // className="footer p-4"
          style={{ backgroundColor: theme.bg.block }}
        />
      </div>
      {showingDisclaimerModal && (
        <ProtocolDisclaimer closeAction={() => setDisclaimerAccepted(true)} />
      )}
      {!showingFiltersModal && state.isAuthed && (
        <ShowFiltersButton
          clickAction={() => toggleShowFilters(!showingFiltersModal)}
        />
      )}
      {showingFiltersModal && state.isAuthed && (
        <FilterModal closeAction={() => toggleShowFilters(false)} needsFilterColors />
      )}
    </div>
  )
}

export default Home
