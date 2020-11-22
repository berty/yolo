import React from "react";
import {
  ARTIFACT_KIND_TO_PLATFORM,
  BRANCH_TO_DISPLAY_NAME,
  BUILD_DRIVER_TO_NAME,
  BUILD_STATE_VALUE_TO_NAME,
  PROJECT_ID_TO_NAME,
} from "../../../constants";
import { addOrRemoveFromArray } from "../../../util/getters";
import {
  ArtifactKindComponent,
  VcsIcon,
  ProjectIcon,
} from "../../styleTools/iconTools";
import OutlineWidget from "../OutlineWidget/OutlineWidget";

export const ArtifactFilter = ({
  artifact_kind: artifactKind,
  selectedArtifactKinds,
  setSelectedArtifactKinds,
}) => {
  const selected = selectedArtifactKinds.includes(artifactKind);
  return (
    <OutlineWidget
      onClick={() =>
        setSelectedArtifactKinds(
          addOrRemoveFromArray(artifactKind, selectedArtifactKinds)
        )
      }
      selected={selected}
      textIsUnderneath
      interactive
      iconComponent={<ArtifactKindComponent {...{ artifactKind }} />}
      text={ARTIFACT_KIND_TO_PLATFORM[artifactKind]}
    />
  );
};

export const ProjectFilter = ({
  project,
  selectedProjects,
  setSelectedProjects,
}) => {
  const selected = selectedProjects.includes(project);
  const projectValue = project;

  return (
    <OutlineWidget
      text={PROJECT_ID_TO_NAME[projectValue]}
      iconComponent={<ProjectIcon projectId={projectValue} />}
      onClick={() =>
        setSelectedProjects(addOrRemoveFromArray(project, selectedProjects))
      }
      selected={selected}
      interactive
      textIsUnderneath
    />
  );
};

export const BuildDriverFilter = ({
  buildDriverValue,
  selectedDrivers,
  setSelectedDrivers,
}) => {
  const selected = selectedDrivers.includes(buildDriverValue);
  return (
    <OutlineWidget
      textIsUnderneath
      selected={selected}
      text={
        BUILD_DRIVER_TO_NAME[buildDriverValue] ||
        `Unknown Driver :${buildDriverValue}`
      }
      onClick={() =>
        setSelectedDrivers(
          addOrRemoveFromArray(buildDriverValue, selectedDrivers)
        )
      }
    />
  );
};

export const BuildStateFilter = ({
  buildStateValue,
  selectedBuildStates,
  setSelectedBuildStates,
}) => {
  const selected = selectedBuildStates.includes(buildStateValue);
  return (
    <OutlineWidget
      textIsUnderneath
      selected={selected}
      text={
        BUILD_STATE_VALUE_TO_NAME[buildStateValue] ||
        `Unknown Driver :${buildStateValue}`
      }
      onClick={() =>
        setSelectedBuildStates(
          addOrRemoveFromArray(buildStateValue, selectedBuildStates)
        )
      }
    />
  );
};

export const BranchFilter = ({
  branchName,
  selectedBranches = [],
  setSelectedBranches = () => {},
}) => {
  const selected =
    selectedBranches.includes(branchName) ||
    (!selectedBranches.length && branchName === "All");
  const interactive = !(branchName === "All" && selected);

  const onToggleBranch = () => {
    if (branchName === "All" && !selected) {
      setSelectedBranches([]);
    } else {
      setSelectedBranches(addOrRemoveFromArray(branchName, selectedBranches));
    }
  };

  return (
    <OutlineWidget
      iconComponent={<VcsIcon {...{ branchName }} />}
      text={BRANCH_TO_DISPLAY_NAME[branchName] || branchName}
      selected={selected}
      textIsUnderneath
      interactive={interactive}
      onClick={!interactive ? undefined : onToggleBranch}
    />
  );
};
