import React, { useContext } from 'react'
import {
  GitBranch, LogOut, Check, X,
} from 'react-feather'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons'
import { faQuestionCircle, faCube } from '@fortawesome/free-solid-svg-icons'

import { ResultContext } from '../../../store/ResultStore.js'
import { ThemeContext } from '../../../store/ThemeStore.js'

import IconChat from '../../../assets/svg/IconChat'

import './Filters.scss'
import { removeAuthCookie } from '../../../api/auth'
import {
  ARTIFACT_KIND_VALUE,
  ARTIFACT_VALUE_KIND,
  BUILD_DRIVERS,
  PROJECT,
  BUILD_DRIVER_TO_NAME,
  BUILD_STATES,
  BUILD_STATE_VALUE_TO_NAME,
} from '../../../constants'
import { getIsArrayWithN, getIsEmptyArr } from '../../../util/getters.js'

const Filters = ({ autoRefreshOn, onFilterClick, setAutoRefreshOn }) => {
  const { state, updateState } = useContext(ResultContext)
  const { theme } = useContext(ThemeContext)
  const widgetAccentColor = theme.icon.filterSelected

  const headerWidgetWrapperColors = {
    color: widgetAccentColor,
    borderColor: widgetAccentColor,
    backgroundColor: theme.bg.filter,
  }

  const colorsWidget = ({ selected = false }) => {
    const {
      text: { filterSelectedTitle, filterUnselectedTitle },
      bg: { filter: bgFilter },
      border: {
        filterSelected: selectedBorder,
        filterUnselected: unselectedBorder,
      },
    } = theme
    return selected
      ? {
        color: filterSelectedTitle,
        borderColor: selectedBorder,
        backgroundColor: bgFilter,
      }
      : {
        color: filterUnselectedTitle,
        borderColor: unselectedBorder,
        background: 'transparent',
      }
  }

  const FiltersAppWidget = () => (
    <>
      {getIsArrayWithN(state.calculatedFilters?.projects, 1)
        && state.calculatedFilters.projects.includes(PROJECT.chat) && (
          <div
            className="widget-wrapper is-interactive"
            style={headerWidgetWrapperColors}
            onClick={onFilterClick}
            onKeyDown={onFilterClick}
            role="button"
            tabIndex={0}
          >
            <IconChat stroke={widgetAccentColor} />
            <p className="widget-text">{PROJECT.chat}</p>
          </div>
      )}
      {getIsArrayWithN(state.calculatedFilters.projects, 1)
        && state.calculatedFilters.projects.includes(
          PROJECT['gomobile-ipfs-demo'],
        ) && (
          <div
            className="widget-wrapper is-interactive"
            style={headerWidgetWrapperColors}
            onClick={onFilterClick}
            onKeyDown={onFilterClick}
            role="button"
            tabIndex={0}
          >
            <FontAwesomeIcon
              icon={faCube}
              size="lg"
              color={widgetAccentColor}
            />
            <p className="widget-text">{PROJECT['gomobile-ipfs-demo']}</p>
          </div>
      )}
    </>
  )

  const ArtifactKindsFilter = () => getIsArrayWithN(state.uiFilters.artifact_kinds, 1) && (
    <div
      className="widget-wrapper is-interactive"
      style={headerWidgetWrapperColors}
      onClick={onFilterClick}
      onKeyDown={onFilterClick}
      role="button"
      tabIndex={0}
    >
      {state.uiFilters.artifact_kinds.map((kind, i) => (
        <FontAwesomeIcon
          key={i}
          size="lg"
          color={widgetAccentColor}
          icon={
            kind === ARTIFACT_KIND_VALUE.IPA
              || kind === ARTIFACT_KIND_VALUE.DMG
              ? faApple
              : kind === ARTIFACT_KIND_VALUE.APK
                ? faAndroid
                : faQuestionCircle
          }
          title={ARTIFACT_VALUE_KIND[kind.toString()] || ''}
        />
      ))}
    </div>
  )

  const FiltersBranchWidget = () => {
    const BranchFilter = <GitBranch color={widgetAccentColor} />
    return (
      <div
        className="widget-wrapper is-interactive"
        style={headerWidgetWrapperColors}
        onClick={onFilterClick}
        onKeyDown={onFilterClick}
        role="button"
        tabIndex={0}
      >
        {BranchFilter}
        <p className="widget-text">All</p>
      </div>
    )
  }

  const FiltersBuildDriver = () => (
    <>
      {BUILD_DRIVERS.filter((driver) => state.uiFilters.build_driver.includes(driver.toString())).map((build, i) => (
        <div
          className="widget-wrapper is-interactive"
          style={headerWidgetWrapperColors}
          onClick={onFilterClick}
          onKeyDown={onFilterClick}
          role="button"
          title={BUILD_DRIVER_TO_NAME[build]}
          tabIndex={0}
          key={i}
        >
          <p className="widget-text no-svg">{BUILD_DRIVER_TO_NAME[build]}</p>
        </div>
      ))}
    </>
  )

  const ShowRunningBuilds = () => (getIsEmptyArr(state.uiFilters.build_state) ? null
    : (
      <>
        {BUILD_STATES.filter((buildState) => state.uiFilters.build_state.includes(buildState.toString()))
          .map((buildsState, i) => (
            <div
              className="widget-wrapper is-interactive"
              style={headerWidgetWrapperColors}
              onClick={onFilterClick}
              onKeyDown={onFilterClick}
              role="button"
              title={BUILD_STATE_VALUE_TO_NAME[buildsState]}
              tabIndex={0}
              key={i}
            >
              <p className="widget-text no-svg">{BUILD_STATE_VALUE_TO_NAME[buildsState]}</p>
            </div>
          ))}
      </>
    )
  )

  const RefreshActionButton = (
    <div
      className="widget-wrapper is-interactive"
      style={{ color: theme.text.sectionTitle }}
      onClick={() => {
        updateState({
          needsRefresh: true,
        })
      }}
      onKeyDown={() => {
        updateState({
          needsRefresh: true,
        })
      }}
      role="button"
      tabIndex={0}
      title="Refresh the page"
    >
      <p className="widget-text no-svg is-interactive">F5</p>
    </div>
  )

  const SetAutoRefreshActionButton = () => {
    const selected = !!autoRefreshOn
    const colorWidget = colorsWidget({ selected })
    return (
      <div
        className="widget-wrapper is-interactive"
        style={colorWidget}
        onClick={() => {
          setAutoRefreshOn(!autoRefreshOn)
        }}
        onKeyDown={() => {
          setAutoRefreshOn(!autoRefreshOn)
        }}
        role="button"
        tabIndex={0}
        title="Toggle auto refresh every 10 sec"
      >
        {selected ? <Check /> : <X />}
        <p className="widget-text is-interactive">Auto Reload</p>
      </div>
    )
  }

  const Logout = (
    <div
      className="widget-wrapper"
      style={{ color: theme.text.sectionTitle }}
      onClick={() => {
        removeAuthCookie()
        updateState({
          isAuthed: false,
          apiKey: '',
          needsProgrammaticQuery: true,
        })
      }}
      onKeyDown={() => {
        removeAuthCookie()
        updateState({
          isAuthed: false,
          apiKey: '',
          needsProgrammaticQuery: true,
        })
      }}
      role="button"
      tabIndex={0}
    >
      <LogOut />
      <p className="widget-text is-interactive">Logout</p>
    </div>
  )

  return (
    <div className="Filters">
      {FiltersAppWidget()}
      {ArtifactKindsFilter()}
      {FiltersBranchWidget()}
      <FiltersBuildDriver />
      <SetAutoRefreshActionButton />
      <ShowRunningBuilds />
      {RefreshActionButton}
      {Logout}
    </div>
  )
}

export default Filters
