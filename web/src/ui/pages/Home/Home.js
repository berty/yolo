/* eslint-disable import/no-named-as-default */
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * BEWARE ⚠️
 *
 * A container for many side effects
 *
 * The most important "feature" here:
 *     Query params in the URL bar
 *     are parsed and stored in global state,
 *     AND are used directly to make an API request.
 *
 * Tell ekelen to refactor me
 */

import Cookies from 'js-cookie'
// import _ from "lodash";
import React, { useContext, useEffect, useState } from 'react'
import {
  useRedirectOnEmptyQuery,
  useRequestOnQueryChange,
  useSetFiltersOnQueryChange,
} from '../../../hooks/queryHooks'
import { useRecursiveTimeout } from '../../../hooks/useRecursiveTimeout'
import { GlobalContext } from '../../../store/GlobalStore'
import { ThemeContext } from '../../../store/ThemeStore'
import ApiKeyPrompt from '../../components/ApiKeyPrompt'
import BuildList from '../../components/BuildList'
import ErrorDisplay from '../../components/ErrorDisplay/ErrorDisplay'
import FilterModal from '../../components/FilterModal/FilterModal'
import Header from '../../components/Header/Header'
import ProtocolDisclaimer from '../../components/ProtocolDisclaimer'
import { PullToRefreshWrapper } from '../../components/PullToRefresh'
import ShowFiltersButton from '../../components/ShowFiltersButton'
import Spinner from '../../components/Spinner/Spinner'
import styles from './Home.module.scss'
import { USERAGENT } from '../../../constants'

const Home = () => {
  const { theme } = useContext(ThemeContext)
  const {
    state,
    state: { isLoaded },
    updateState,
  } = useContext(GlobalContext)
  const [showingFilterModal, toggleShowFilters] = useState(false)
  const [showingDisclaimerModal, toggleShowDisclaimer] = useState(false)
  const onPull = () => Promise.resolve(updateState({ needsRefresh: true }))

  // Hide protocol warning popup
  const setDisclaimerAccepted = (accepted) => {
    Cookies.set('disclaimerAccepted', 1, { expires: 7 })
    toggleShowDisclaimer(!accepted)
  }

  useRedirectOnEmptyQuery()
  useSetFiltersOnQueryChange()
  useRequestOnQueryChange()

  // Fetch data every 10 sec if state.autoRefeshOn is true
  useRecursiveTimeout(() => {
    if (state.autoRefreshOn && !showingFilterModal && !showingDisclaimerModal) {
      updateState({
        needsRefresh: true,
      })
    }
  }, 10 * 1000)

  // Show protocol warning modal + agreement on component render
  useEffect(() => {
    const disclaimerAccepted = Cookies.get('disclaimerAccepted')
    toggleShowDisclaimer(!disclaimerAccepted)
  }, [])

  const Page = () => (
    <>
      <Header
        onFilterClick={() => {
          toggleShowFilters(true)
        }}
      />
      {state.error && <ErrorDisplay error={state.error} />}
      {state.error && state.error.status === 401 && (
        <ApiKeyPrompt
          failedKey={state.apiKey}
          updateState={updateState}
          authIsPending={state.authIsPending}
        />
      )}
      {!state.error && (
        <BuildList builds={state.builds} loaded={state.isLoaded} />
      )}
      <div
        className={styles.footer}
        style={{ backgroundColor: theme.bg.block }}
      />
    </>
  )

  return (
    <div className={styles.homeContainer}>
      <div
        className={styles.homepageWrapper}
        style={{ backgroundColor: theme.bg.page }}
      >
        <PullToRefreshWrapper
          onRefresh={() => onPull()}
          isAuthed={state.isAuthed && !state.authIsPending}
          isMobile={
            state.userAgent === USERAGENT.Android
            || state.userAgent === USERAGENT.iOS
          }
        >
          <Page />
        </PullToRefreshWrapper>
      </div>
      {showingDisclaimerModal && (
        <ProtocolDisclaimer closeAction={() => setDisclaimerAccepted(true)} />
      )}
      {!showingFilterModal && state.isAuthed && (
        <ShowFiltersButton clickAction={() => toggleShowFilters(true)} />
      )}
      {showingFilterModal && state.isAuthed && (
        <FilterModal
          closeAction={() => toggleShowFilters(false)}
          needsFilterColors
        />
      )}
      {!isLoaded && (
        <>
          <div className="faded" />
          <Spinner />
        </>
      )}
      {/* <div>{JSON.stringify(_.omit(state, "builds"), null, 2)}</div> */}
    </div>
  )
}

// Home.whyDidYouRender = true

export default Home
