import { BUILD_STATE } from "../constants";
import { isArray, isNonEmptyArray } from "../util/getters";

export const oneBuildResultHasBranchMaster = (builds) =>
  isArray(builds) && builds.find((build) => build.branch === "master");

export const buildStateIsRunning = (build) =>
  build &&
  build.state &&
  build.state.toString() === BUILD_STATE.Running.toString();

export const buildsStateIsRunning = (allBuildsForMr, originalBuildList) =>
  isArray(allBuildsForMr) && isNonEmptyArray(originalBuildList)
    ? allBuildsForMr
        .filter(
          (buildIndex) =>
            typeof buildIndex === "number" && !!originalBuildList[buildIndex]
        )
        .filter((buildIndex) =>
          buildStateIsRunning(originalBuildList[buildIndex])
        )
    : [];
