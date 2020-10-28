import queryString from "query-string";
import { useContext } from "react";
import {
  ARTIFACT_KINDS,
  BUILD_DRIVERS,
  BUILD_STATES,
  KIND_TO_PLATFORM,
  PROJECTS,
} from "../constants";
import { singleItemToArray } from "../util/getters";
import { GlobalContext } from "./GlobalStore";

export const useIsMobile = () => {
  const {
    state: { userAgent },
  } = useContext(GlobalContext);
  return (
    userAgent === KIND_TO_PLATFORM.IPA || userAgent === KIND_TO_PLATFORM.APK
  );
};

export const getFiltersFromUrlQuery = ({ locationSearch = "" }) => {
  const locationObject = queryString.parse(locationSearch);

  if (!locationSearch || !locationObject) {
    return {};
  }

  const {
    artifact_kinds: queryArtifactKinds = [],
    build_driver: queryBuildDrivers = [],
    build_state: queryBuildState = [],
    project_id: queryProjects = [],
    branch: queryBranches = [],
  } = locationObject;

  const artifactKinds = singleItemToArray(
    queryArtifactKinds
  ).filter((artifactKind) => ARTIFACT_KINDS.includes(artifactKind));

  const buildDrivers = singleItemToArray(
    queryBuildDrivers
  ).filter((buildDriver) => BUILD_DRIVERS.includes(buildDriver));

  const buildStates = singleItemToArray(
    queryBuildState.toString()
  ).filter((buildState) => BUILD_STATES.includes(buildState));

  const projects = singleItemToArray(queryProjects).filter((p) =>
    PROJECTS.includes(p)
  );

  const branch = singleItemToArray(queryBranches);

  return {
    artifact_kinds: artifactKinds,
    build_driver: buildDrivers,
    build_state: buildStates,
    project_id: projects,
    branch,
  };
};
