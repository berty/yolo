import React, { useContext, useState } from 'react'
import { Check, LogOut } from 'react-feather'
import { removeAuthCookie } from '../../../api/cookies'
import {
  ARTIFACT_KINDS, BUILD_DRIVERS, BUILD_STATES, PROJECT, PROJECTS,
} from '../../../constants'
import { INITIAL_STATE, ResultContext } from '../../../store/ResultStore'
import { ThemeContext } from '../../../store/ThemeStore'
import Tag from '../Tag/Tag'
import ThemeToggler from '../ThemeToggler'
import styles from './FilterModal.module.scss'
import {
  ArtifactFilter, BranchFilter, BuildDriverFilter, BuildStateFilter, ProjectFilter,
} from './FilterModalWidgets'
import FilterModalWrapper from './FilterModalWrapper'

const ProjectWidgets = ({
  selectedDrivers, setSelectedDrivers, selectedArtifactKinds, setSelectedArtifactKinds, selectedProjects, setSelectedProjects,
}) => (
  <>
    {PROJECTS.filter((p) => p !== PROJECTS.UnknownProject).map((p, i) => (
      <ProjectFilter
        key={i}
        project={PROJECT[p]}
        {...{
          selectedDrivers, setSelectedDrivers, selectedArtifactKinds, setSelectedArtifactKinds, selectedProjects, setSelectedProjects,
        }}
      />
    ))}
  </>
)

const ArtifactKindWidgets = ({ setSelectedArtifactKinds, selectedArtifactKinds }) => (
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
  const { state, updateState } = useContext(ResultContext)
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


  const tablerOverrides = {
    modalFooterStyle: { borderTop: 'none', justifyContent: 'center' },
    modalFooterSettingsStyle: { borderTop: 'none', flexWrap: 'wrap', justifyContent: 'flex-end' },
  }

  return (
    <FilterModalWrapper {...{ closeAction }}>
      <div className="modal-body">
        <div style={{ color: theme.text.sectionTitle }} className={styles.subtitle}>Projects</div>
        <div className={styles.row}>
          <ProjectWidgets {...{
            selectedDrivers, setSelectedDrivers, selectedArtifactKinds, setSelectedArtifactKinds, selectedProjects, setSelectedProjects,
          }}
          />
        </div>
        <div style={{ color: theme.text.sectionTitle }} className={styles.subtitle}>Artifact Kinds</div>
        <div className={styles.row}>
          <ArtifactKindWidgets {...{ selectedArtifactKinds, setSelectedArtifactKinds }} />
        </div>
        <div style={{ color: theme.text.sectionTitle }} className={styles.subtitle}>Build Drivers</div>
        <div className={styles.row}>
          <BuildDriverWidgets {...{ selectedDrivers, setSelectedDrivers }} />
        </div>
        <div style={{ color: theme.text.sectionTitle }} className={styles.subtitle}>Branches</div>
        <div className={styles.row}>
          <BranchFilter branchName="all" {...{ selectedBranches }} />
          <BranchFilter branchName="master" {...{ selectedBranches }} />
          <BranchFilter branchName="develop" {...{ selectedBranches }} />
        </div>
        <div style={{ color: theme.text.sectionTitle }} className={styles.subtitle}>Build State</div>
        <div className={styles.row}>
          <BuildStateWidgets {...{ selectedBuildStates, setSelectedBuildStates }} />
        </div>
      </div>
      <div className="modal-footer" style={tablerOverrides.modalFooterStyle}>
        <div
          roll="button"
          className="btn btn-primary"
          data-dismiss="modal"
          onClick={() => {
            updateState({
              needsProgrammaticQuery: true,
              isLoaded: false,
              builds: [],
              uiFilters: {
                build_driver: [...selectedDrivers],
                artifact_kinds: [...selectedArtifactKinds],
                build_state: [...selectedBuildStates],
              },
              calculatedFilters: {
                projects: [...selectedProjects],
              },
            })
            closeAction()
          }}
          style={themeStyles.primaryButtonColors}
        >
          <Check style={{ height: '1rem', verticalAlign: 'sub' }} />
          Apply Filters
        </div>
      </div>
      <div className="modal-footer settings" style={tablerOverrides.modalFooterSettingsStyle}>
        <ThemeToggler />
        <Tag
          onClick={() => {
            removeAuthCookie()
            updateState({
              isAuthed: false,
              apiKey: '',
              needsProgrammaticQuery: true,
              uiFilters: INITIAL_STATE.uiFilters,
              calculatedFilters: INITIAL_STATE.calculatedFilters,
            })
            closeAction()
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
