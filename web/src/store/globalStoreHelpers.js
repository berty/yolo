import queryString from "query-string";
import {
  ARTIFACT_KINDS,
  BUILD_DRIVERS,
  BUILD_STATES,
  PROJECTS,
} from "../constants";
import { isNonEmptyString, upsertToArray } from "../util/getters";

export const getUiFiltersFromUrlQuery = ({ locationSearch = "" }) => {
  const {
    artifact_kinds: queryArtifactKinds = [],
    build_driver: queryBuildDrivers = [],
    build_state: queryBuildState = [],
    project_id: queryProjects = [],
    branch: queryBranches = [],
  } = queryString.parse(locationSearch) || {};

  const artifactKinds = upsertToArray(queryArtifactKinds).filter((val) =>
    ARTIFACT_KINDS.includes(val)
  );

  const buildDrivers = upsertToArray(queryBuildDrivers).filter((val) =>
    BUILD_DRIVERS.includes(val)
  );

  const buildStates = upsertToArray(queryBuildState).filter((val) =>
    BUILD_STATES.includes(val)
  );

  const projects = upsertToArray(queryProjects).filter((val) =>
    PROJECTS.includes(val)
  );

  const branch = upsertToArray(queryBranches).filter(isNonEmptyString);

  return {
    artifact_kinds: artifactKinds,
    build_driver: buildDrivers,
    build_state: buildStates,
    project_id: projects,
    branch,
  };
};
