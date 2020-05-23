/* eslint-disable import/no-named-as-default */
import React, {
  useContext, useState, useEffect, useCallback,
} from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import queryString from 'query-string'
import Cookies from 'js-cookie'

import Header from '../../components/Header/Header'
import ErrorDisplay from '../../components/ErrorDisplay/ErrorDisplay'
import ApiKeyPrompt from '../../components/ApiKeyPrompt'
import ShowFiltersButton from '../../components/ShowFiltersButton'
import FilterModal from '../../components/FilterModal/FilterModal'

import { ThemeContext } from '../../../store/ThemeStore'
import { ResultContext, INITIAL_STATE } from '../../../store/ResultStore'

import {
  ARTIFACT_KINDS, BUILD_DRIVERS, BUILD_STATES, PLATFORM_TO_ARTIFACT_KIND,
} from '../../../constants'
import { getBuildList, validateError } from '../../../api'

import BuildListContainer from '../../components/BuildListContainer'

import './Home.scss'
import ProtocolDisclaimer from '../../components/ProtocolDisclaimer'
import { singleItemToArray } from '../../../util/getters'
import { getMobileOperatingSystem } from '../../../util/browser'

const Home = () => {
  const { theme } = useContext(ThemeContext)
  const { state, updateState } = useContext(ResultContext)
  const [showingFiltersModal, toggleShowFilters] = useState(false)
  const [showingDisclaimerModal, toggleShowDisclaimer] = useState(false)
  const [needsNewFetch, setNeedsNewFetch] = useState(true)
  const [autoRefreshOn, setAutoRefreshOn] = useState(false)
  const { search: locationSearch } = useLocation()
  const history = useHistory()

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg.page
  }, [theme.name])

  useEffect(() => {
    const disclaimerAccepted = Cookies.get('disclaimerAccepted')
    toggleShowDisclaimer(!disclaimerAccepted)
  }, [])

  const setDefaultArtifactKinds = useCallback(() => {
    const userAgent = getMobileOperatingSystem()
    const defaultKind = PLATFORM_TO_ARTIFACT_KIND[userAgent]
    const { uiFilters: { artifact_kinds: initialArtifactKinds } } = INITIAL_STATE
    updateState({
      userAgent,
      uiFilters: {
        ...state.uiFilters,
        artifact_kinds: userAgent === 'Unknown OS'
          ? initialArtifactKinds
          : [defaultKind],
      },
    })
  }, [state.uiFilters, updateState])

  useEffect(() => {
    if (!locationSearch) {
      setDefaultArtifactKinds()
      const { artifact_kinds: artifactKinds = '', build_driver: buildDriver = '' } = state.uiFilters
      // TODO: qS 'options' field doesn't seem to work
      // (e.g. if artifact_kinds === null)
      const initialLocationSearch = queryString.stringify({
        artifact_kinds: singleItemToArray(artifactKinds),
        build_driver: singleItemToArray(buildDriver),
      }, { skipNull: true, skipEmptyString: true })
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

      updateState({
        uiFilters: {
          ...state.uiFilters, artifact_kinds: artifactKinds, build_driver: buildDriver, build_state: buildState,
        },
      })
    }
  }, [])

  useEffect(() => {
    const getNewFetch = () => {
      updateState({
        error: null,
        isLoaded: false,
        builds: [],
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
            needsQuietRefresh: false,
          })
        })
    }
    if (needsNewFetch && locationSearch) {
      getNewFetch()
    }
  }, [locationSearch, needsNewFetch])

  useEffect(() => {
    const triggerNewQuery = () => {
      updateState({
        needsProgrammaticQuery: false,
      })
      history.push({
        path: '/',
        search: queryString.stringify(state.uiFilters) || 'limit=50',
      })
      setNeedsNewFetch(true)
    }
    if (state.needsProgrammaticQuery === true) triggerNewQuery()
  }, [state.needsProgrammaticQuery])

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
          needsQuietRefresh: true,
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

  const setDisclaimerAccepted = (accepted) => {
    Cookies.set('disclaimerAccepted', 1, { expires: 7 })
    toggleShowDisclaimer(!accepted)
  }

  return (
    <div className="Home">
      <div className="page" style={{ backgroundColor: theme.bg.page }}>
        <Header autoRefreshOn={autoRefreshOn} setAutoRefreshOn={setAutoRefreshOn} onFilterClick={() => toggleShowFilters(true)} />
        {state.error && <ErrorDisplay error={state.error} />}
        {state.error && state.error.status === 401 && (
          <ApiKeyPrompt failedKey={state.apiKey} updateState={updateState} />
        )}
        {!state.error && (
          <BuildListContainer builds={state.builds} loaded={state.isLoaded} />
        )}
        <div
          className="footer p-4"
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
        <FilterModal closeAction={() => toggleShowFilters(false)} />
      )}
    </div>
  )
}

export default Home
