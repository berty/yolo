import { getStrUpperCase, getIsArrayWithN, getIsArray } from '../util/getters'
import { BRANCH, BUILD_STATE } from '../constants'

export const buildBranchIsMaster = (build) => (getStrUpperCase(build.branch) === BRANCH.MASTER)

export const oneBuildResultHasBranchMaster = (builds) => (getIsArray(builds) && builds.find((build) => buildBranchIsMaster(build)))

export const buildStateIsRunning = (build) => (build && build.state && build.state.toString() === BUILD_STATE.Running.toString())

export const buildsStateIsRunning = (allBuildsForMr, originalBuildList) => getIsArray(allBuildsForMr) && getIsArrayWithN(originalBuildList)
  ? allBuildsForMr
    .filter((buildIndex) => (typeof buildIndex === 'number' && !!originalBuildList[buildIndex]))
    .filter((buildIndex) => (buildStateIsRunning(originalBuildList[buildIndex])))
  : []
