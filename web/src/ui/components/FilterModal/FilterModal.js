import _ from 'lodash'
import queryString from 'query-string'
import React, { useContext, useState } from 'react'
import { Check, LogOut } from 'react-feather'
import { useHistory } from 'react-router-dom'
import { removeAuthCookie } from '../../../api/cookies'
import {
  ARTIFACT_KINDS,
  BUILD_DRIVERS,
  BUILD_STATES,
  PROJECT,
  PROJECTS,
  actions,
} from '../../../constants'
import { GlobalContext } from '../../../store/GlobalStore'
import { ThemeContext } from '../../../store/ThemeStore'
import { getIsArrayWithN } from '../../../util/getters'
import Tag from '../Tag/Tag'
import ThemeToggler from '../ThemeToggler'
import styles from './FilterModal.module.scss'
import {
  ArtifactFilter,
  BranchFilter,
  BuildDriverFilter,
  BuildStateFilter,
  ProjectFilter,
} from './FilterModalWidgets'
import FilterModalWrapper from './FilterModalWrapper'
import { useRedirectHome } from '../../../hooks/queryHooks'

const ProjectWidgets = ({
  selectedArtifactKinds,
  setSelectedArtifactKinds,
  selectedProjects,
  setSelectedProjects,
}) => (
  <>
    {PROJECTS.filter((p) => p !== PROJECTS.UnknownProject).map((p, i) => (
      <ProjectFilter
        key={i}
        project={PROJECT[p]}
        {...{
          selectedArtifactKinds,
          setSelectedArtifactKinds,
          selectedProjects,
          setSelectedProjects,
        }}
      />
    ))}
  </>
)

const ArtifactKindWidgets = ({
  setSelectedArtifactKinds,
  selectedArtifactKinds,
}) => (
  <>
    {ARTIFACT_KINDS.map((k, i) => (
      <ArtifactFilter
        artifact_kind={k}
        key={i}
        {...{ setSelectedArtifactKinds, selectedArtifactKinds }}
      />
    ))}
  </>
)

const BuildDriverWidgets = ({ selectedDrivers, setSelectedDrivers }) => (
  <>
    {BUILD_DRIVERS.map((buildDriverValue, i) => (
      <BuildDriverFilter
        buildDriverValue={buildDriverValue}
        key={i}
        {...{ selectedDrivers, setSelectedDrivers }}
      />
    ))}
  </>
)

const BuildStateWidgets = ({ selectedBuildStates, setSelectedBuildStates }) => (
  <>
    {BUILD_STATES.map((buildStateValue, i) => (
      <BuildStateFilter
        key={i}
        buildStateValue={buildStateValue}
        {...{ selectedBuildStates, setSelectedBuildStates }}
      />
    ))}
  </>
)

const FilterModal = ({ closeAction }) => {
  const { theme, themeStyles } = useContext(ThemeContext)
  const { state, updateState, dispatch } = useContext(GlobalContext)
  const { redirectHome } = useRedirectHome()
  const [selectedDrivers, setSelectedDrivers] = useState([
    ...state.uiFilters.build_driver,
  ])
  const [selectedProjects, setSelectedProjects] = useState([
    ...state.calculatedFilters.projects,
  ])
  const [selectedArtifactKinds, setSelectedArtifactKinds] = useState([
    ...state.uiFilters.artifact_kinds,
  ])
  const [selectedBuildStates, setSelectedBuildStates] = useState([
    ...state.uiFilters.build_state,
  ])
  const [selectedBranches] = useState(['all'])
  const history = useHistory()

  const tablerOverrides = {
    modalFooterStyle: { borderTop: 'none', justifyContent: 'center' },
    modalFooterSettingsStyle: {
      borderTop: 'none',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
    },
  }

  return (
    <FilterModalWrapper {...{ closeAction }}>
      <div className="modal-body">
        <div
          style={{ color: theme.text.sectionTitle }}
          className={styles.subtitle}
        >
          Projects
        </div>
        <div className={styles.row}>
          <ProjectWidgets
            {...{
              selectedDrivers,
              setSelectedDrivers,
              selectedArtifactKinds,
              setSelectedArtifactKinds,
              selectedProjects,
              setSelectedProjects,
            }}
          />
        </div>
        <div
          style={{ color: theme.text.sectionTitle }}
          className={styles.subtitle}
        >
          Artifact Kinds
        </div>
        <div className={styles.row}>
          <ArtifactKindWidgets
            {...{ selectedArtifactKinds, setSelectedArtifactKinds }}
          />
        </div>
        <div
          style={{ color: theme.text.sectionTitle }}
          className={styles.subtitle}
        >
          Build Drivers
        </div>
        <div className={styles.row}>
          <BuildDriverWidgets {...{ selectedDrivers, setSelectedDrivers }} />
        </div>
        <div
          style={{ color: theme.text.sectionTitle }}
          className={styles.subtitle}
        >
          Branches
        </div>
        <div className={styles.row}>
          <BranchFilter branchName="all" {...{ selectedBranches }} />
          <BranchFilter branchName="master" {...{ selectedBranches }} />
          <BranchFilter branchName="develop" {...{ selectedBranches }} />
        </div>
        <div
          style={{ color: theme.text.sectionTitle }}
          className={styles.subtitle}
        >
          Build State
        </div>
        <div className={styles.row}>
          <BuildStateWidgets
            {...{ selectedBuildStates, setSelectedBuildStates }}
          />
        </div>
      </div>
      <div className="modal-footer" style={tablerOverrides.modalFooterStyle}>
        <div
          roll="button"
          className="btn btn-primary"
          data-dismiss="modal"
          onClick={() => {
            window.localStorage.setItem(
              'projects',
              JSON.stringify([...selectedProjects]),
            )
            updateState({
              isLoaded: false,
              needsRefresh: true,
              calculatedFilters: {
                projects: [...selectedProjects],
              },
            })
            closeAction()
            const uiFilters = {
              build_driver: selectedDrivers,
              build_state: selectedBuildStates,
              artifact_kinds: selectedArtifactKinds,
            }
            window.localStorage.setItem('uiFilters', JSON.stringify(uiFilters))
            history.push({
              path: '/',
              search: queryString.stringify(
                _.pickBy(uiFilters, (val) => getIsArrayWithN(val, 1)),
              ),
            })
          }}
          style={themeStyles.primaryButtonColors}
        >
          <Check style={{ height: '1rem', verticalAlign: 'sub' }} />
          Apply Filters
        </div>
      </div>
      <div
        className="modal-footer settings"
        style={tablerOverrides.modalFooterSettingsStyle}
      >
        <ThemeToggler />
        <Tag
          onClick={() => {
            removeAuthCookie()
            dispatch({ type: actions.UPDATE_UI_FILTERS, payload: {} })
            dispatch({ type: actions.LOGOUT })
            closeAction()
            redirectHome()
          }}
        >
          <LogOut height="14" color={theme.icon.filterSelected} />
          <div>Logout</div>
        </Tag>
      </div>
    </FilterModalWrapper>
  )
}

export default FilterModal
