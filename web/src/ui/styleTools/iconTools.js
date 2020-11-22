import React from "react";
import { faAndroid, faApple } from "@fortawesome/free-brands-svg-icons";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Code, GitBranch, GitCommit, GitMerge } from "react-feather";
import IconChat from "../../assets/svg/IconChat";
import IconOsx from "../../assets/svg/IconOsx";
import { ARTIFACT_KIND_VALUE, BRANCH, PROJECT } from "../../constants";

export const ProjectIcon = ({ projectId }) => {
  const icons = {
    [PROJECT.messenger]: <IconChat />,
  };
  return <>{icons[projectId] ? icons[projectId] : <Code />}</>;
};

export const VcsIcon = ({ branchName = "" }) => {
  const icons = {
    [BRANCH.MASTER]: <GitMerge />,
    [BRANCH.ALL]: <GitBranch />,
  };
  return <>{icons[branchName] ? icons[branchName] : <GitCommit />}</>;
};

const artifactKindComponents = {
  [ARTIFACT_KIND_VALUE.IPA]: <FontAwesomeIcon icon={faApple} />,
  [ARTIFACT_KIND_VALUE.APK]: <FontAwesomeIcon icon={faAndroid} />,
  [ARTIFACT_KIND_VALUE.DMG]: <IconOsx />,
  default: <FontAwesomeIcon icon={faQuestionCircle} />,
};

export const ArtifactKindComponent = ({ artifactKind = "" }) => {
  return (
    <>
      {artifactKindComponents[artifactKind] || artifactKindComponents.default}
    </>
  );
};
