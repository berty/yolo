import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { uniq } from 'lodash'
import React from 'react'
import {
  ARTIFACT_KIND_TO_PLATFORM, BRANCH_TO_DISPLAY_NAME, BUILD_DRIVER_TO_NAME, BUILD_STATE_VALUE_TO_NAME, PROJECT, PROJECT_ARTIFACT_KINDS, PROJECT_BUILD_DRIVER,
} from '../../../constants'
import { addOrRemoveFromArray } from '../../../util/getters'
import { getArtifactKindIcon } from '../../styleTools/brandIcons'
import { getProjectIcon } from '../../styleTools/projectIcons'
import { getVcsIcon } from '../../styleTools/vcsIcons'
import OutlineWidget from '../OutlineWidget/OutlineWidget'

export const ArtifactFilter = ({ artifact_kind: artifactKind, selectedArtifactKinds, setSelectedArtifactKinds }) => {
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

export const ProjectFilter = ({
  project,
  selectedProjects,
  setSelectedProjects,
  selectedDrivers,
  setSelectedDrivers,
  selectedArtifactKinds,
  setSelectedArtifactKinds,
}) => {
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

export const BuildDriverFilter = ({ buildDriverValue, selectedDrivers, setSelectedDrivers }) => {
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

export const BuildStateFilter = ({ buildStateValue, selectedBuildStates, setSelectedBuildStates }) => {
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

export const BranchFilter = ({ branchName, selectedBranches }) => {
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
