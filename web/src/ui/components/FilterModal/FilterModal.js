import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { uniq } from 'lodash'
import React, { useContext, useState } from 'react'
import { Check, LogOut, X } from 'react-feather'
import { removeAuthCookie } from '../../../api/cookies'
import {
  ARTIFACT_KIND_TO_PLATFORM, BRANCH_TO_DISPLAY_NAME, BUILD_DRIVERS, BUILD_DRIVER_TO_NAME, BUILD_STATES, BUILD_STATE_VALUE_TO_NAME, PROJECT, PROJECT_ARTIFACT_KINDS, PROJECT_BUILD_DRIVER,
} from '../../../constants'
import { INITIAL_STATE, ResultContext } from '../../../store/ResultStore'
import { addOrRemoveFromArray } from '../../../util/getters'
import withButtonStyles from '../../helpers/withButtonStyles'
import withTheme from '../../helpers/withTheme'
import { getArtifactKindIcon } from '../../styleTools/brandIcons'
import { getProjectIcon } from '../../styleTools/projectIcons'
import { getVcsIcon } from '../../styleTools/vcsIcons'
import OutlineWidget from '../OutlineWidget/OutlineWidget'
import ThemeToggler from '../ThemeToggler'
import './FilterModal.scss'
import Tag from '../Tag/Tag'

const FilterModal = ({
  closeAction, ...injectedProps
}) => {
  const { theme, themeStyles } = injectedProps
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
  const filterSelectedAccent = theme.icon.filterSelected

  const ArtifactFilter = ({ artifact_kind: artifactKind }) => {
    const selected = (selectedArtifactKinds.includes(artifactKind))
    return (
      <OutlineWidget
        onClick={() => setSelectedArtifactKinds(addOrRemoveFromArray(artifactKind, selectedArtifactKinds))}
        selected={selected}
        textUnderneath
        interactive
        iconComponent={<FontAwesomeIcon icon={getArtifactKindIcon(artifactKind)} size="lg" />}
        text={ARTIFACT_KIND_TO_PLATFORM[artifactKind]}
      />
    )
  }

  const ProjectFilter = ({ project }) => {
    const selected = (selectedProjects.includes(project))
    const artifactKindsForProject = (!!PROJECT_ARTIFACT_KINDS[project])
    const buildDriverForProject = PROJECT_BUILD_DRIVER[project]
    const projectValue = PROJECT[project] || 'Unknown Project'
    const projectIcon = getProjectIcon(projectValue)

    const addProjectFilter = () => {
      artifactKindsForProject
        && setSelectedArtifactKinds(
          uniq([...selectedArtifactKinds, ...PROJECT_ARTIFACT_KINDS[projectValue]]),
        )
      buildDriverForProject
        && setSelectedDrivers(uniq([...selectedDrivers, buildDriverForProject]))
      setSelectedProjects(uniq([...selectedProjects, projectValue]))
    }

    const removeProjectFilter = () => {
      setSelectedProjects(selectedProjects.filter((p) => p !== projectValue))
    }

    return (
      <OutlineWidget
        text={projectValue}
        iconComponent={projectIcon()}
        onClick={selected ? removeProjectFilter : addProjectFilter}
        selected={selected}
        interactive
        textUnderneath
      />
    )
  }

  const BranchFilter = ({ branchName }) => {
    const selected = (selectedBranches.includes(branchName))
    const implemented = (branchName.toUpperCase() === 'ALL')
    const branchIcon = getVcsIcon(branchName)

    return (
      <OutlineWidget
        iconComponent={branchIcon()}
        text={BRANCH_TO_DISPLAY_NAME[branchName.toUpperCase()] || 'Unknown Branch'}
        selected={selected}
        notImplemented={!implemented}
        textUnderneath
        interactive={false}
      />
    )
  }

  const BuildDriverFilter = ({ buildDriverValue }) => {
    const selected = (selectedDrivers.includes(buildDriverValue))
    return (
      <OutlineWidget
        textUnderneath
        selected={selected}
        text={BUILD_DRIVER_TO_NAME[buildDriverValue] || `Unknown Driver :${buildDriverValue}`}
        onClick={() => setSelectedDrivers(addOrRemoveFromArray(buildDriverValue, selectedDrivers))}
      />
    )
  }

  const BuildStateFilter = ({ buildStateValue }) => {
    const selected = (selectedBuildStates.includes(buildStateValue))
    return (
      <OutlineWidget
        textUnderneath
        selected={selected}
        text={BUILD_STATE_VALUE_TO_NAME[buildStateValue] || `Unknown Driver :${buildStateValue}`}
        onClick={() => setSelectedBuildStates(addOrRemoveFromArray(buildStateValue, selectedBuildStates))}
      />
    )
  }

  return (
    <>
      <div className="faded" />
      <span className="FilterModal">
        <div
          className="modal modal-blur fade show modal-open"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            role="document"
          >
            <div className="modal-content" style={{ ...themeStyles.pageBg, ...themeStyles.textPlain }}>
              <div className="modal-header">
                <h5 className="modal-title" style={themeStyles.textSectionTitle}>
                  Filter the builds
                </h5>
                <div
                  className="btn-close"
                  data-dismiss="modal"
                  aria-label="Close"
                  onClick={closeAction}
                  style={themeStyles.widgetBg}
                >
                  <X
                    size={14}
                    strokeWidth={3}
                    color={filterSelectedAccent}
                  />
                </div>
              </div>
              <div className="modal-body">
                <div style={themeStyles.textSectionTitle} className="subtitle">
                  Projects
                </div>
                <div className="filter-row">
                  {ProjectFilter({ project: PROJECT.chat })}
                  {ProjectFilter({ project: PROJECT['gomobile-ipfs-demo'] })}
                </div>
                <div style={themeStyles.textSectionTitle} className="subtitle">
                  Artifact Kinds
                </div>
                <div className="filter-row">
                  {ArtifactFilter({ artifact_kind: '0' })}
                  {ArtifactFilter({ artifact_kind: '1' })}
                  {ArtifactFilter({ artifact_kind: '2' })}
                  {ArtifactFilter({ artifact_kind: '3' })}
                </div>
                <div style={themeStyles.textSectionTitle} className="subtitle">
                  Build Drivers
                </div>
                <div className="filter-row">
                  {BUILD_DRIVERS.map((buildDriverValue, i) => (
                    <BuildDriverFilter
                      buildDriverValue={buildDriverValue}
                      key={i}
                    />
                  ))}
                </div>
                <div style={themeStyles.textSectionTitle} className="subtitle">
                  Branches
                </div>
                <div className="filter-row">
                  <BranchFilter branchName="all" />
                  <BranchFilter branchName="master" />
                  <BranchFilter branchName="develop" />
                </div>

                <div style={themeStyles.textSectionTitle} className="subtitle">
                  Build State
                </div>
                <div className="filter-row">
                  {BUILD_STATES.map((buildStateValue, i) => (
                    <BuildStateFilter
                      key={i}
                      buildStateValue={buildStateValue}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <div
                  type="button"
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
                  style={injectedProps.themedBtnStyles.primaryButtonColors}
                >
                  <Check />
                  Apply Filters
                </div>
              </div>
              <div className="modal-footer settings">
                <ThemeToggler />
                {state.apiKey && state.isAuthed && (
                  <Tag
                    styles={{ display: 'flex', alignItems: 'center' }}
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
                )}
              </div>
            </div>
          </div>
        </div>
      </span>
    </>
  )
}

export default withButtonStyles(withTheme(FilterModal))
