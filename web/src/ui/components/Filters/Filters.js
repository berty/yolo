import React, { useContext } from 'react'
import { GitBranch, LogOut } from 'react-feather'
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
  PROJECT,
} from '../../../constants'

const Filters = ({ onFilterClick }) => {
  const { state, updateState } = useContext(ResultContext)
  const { theme } = useContext(ThemeContext)
  const widgetAccentColor = theme.icon.filterSelected

  const headerWidgetWrapperColors = {
    color: widgetAccentColor,
    borderColor: widgetAccentColor,
    backgroundColor: theme.bg.filter,
  }

  const isArrayWithStuff = (val) => !!val && Array.isArray(val) && val.length > 0

  const FiltersAppWidget = () => (
    <>
      {isArrayWithStuff(state.calculatedFilters.projects)
        && state.calculatedFilters.projects.includes(PROJECT.chat) && (
          <div className="widget-wrapper is-interactive" style={headerWidgetWrapperColors} onClick={onFilterClick} onKeyDown={onFilterClick} role="button" tabIndex={0}>
            <IconChat stroke={widgetAccentColor} />
            <p className="widget-text">{PROJECT.chat}</p>
          </div>
      )}
      {isArrayWithStuff(state.calculatedFilters.projects)
        && state.calculatedFilters.projects.includes(
          PROJECT['gomobile-ipfs-demo'],
        ) && (
          <div className="widget-wrapper is-interactive" style={headerWidgetWrapperColors} onClick={onFilterClick} onKeyDown={onFilterClick} role="button" tabIndex={0}>
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

  const ArtifactKindsFilter = () => (
    isArrayWithStuff(state.uiFilters.artifact_kinds) && (
      <div className="widget-wrapper is-interactive" style={headerWidgetWrapperColors} onClick={onFilterClick} onKeyDown={onFilterClick} role="button" tabIndex={0}>
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
  )

  const FiltersBranchWidget = () => {
    const BranchFilter = <GitBranch color={widgetAccentColor} />
    return (
      <div className="widget-wrapper is-interactive" style={headerWidgetWrapperColors} onClick={onFilterClick} onKeyDown={onFilterClick} role="button" tabIndex={0}>
        {BranchFilter}
        <p className="widget-text">All</p>
      </div>
    )
  }

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
      <div className="widget-text no-svg is-interactive">F5</div>
    </div>
  )

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
      {RefreshActionButton}
      {Logout}
    </div>
  )
}

export default Filters
