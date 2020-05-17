import { BRANCH } from '../constants'
import {
  getHasKey,
  getStrUpperCase,
  getStrEquNormalized,
} from '../util/getters'

export const buildBranchIsMaster = (build) => getStrUpperCase(build.branch) === BRANCH.MASTER

export const oneBuildResultHasBranchMaster = (builds) => !!Array.isArray(builds) && builds.find((build) => buildBranchIsMaster(build))

/**
 * Returns a new copy of builds[],
 * keeping only the first build from each unique merge request.
 *
 * Appends key 'allbuilds'
 *
 * build.allBuilds is an array of ints,
 * each corresponds to other builds in state.builds
 *   with the same merge request ID
 */
export const groupBuildsByMr = (builds) => {
  const buildDict = builds
    .filter((build) => getHasKey(build, 'id'))
    .reduce((acc, build, i) => {
      const {
        has_mergerequest: hasMergeRequest,
        has_mergerequest_id: buildMrId,
        branch: buildBranch = '',
      } = build

      const isMaster = getStrEquNormalized(buildBranch, BRANCH.MASTER)
      if (!hasMergeRequest || !buildMrId) {
        return {
          ...acc,
          [build.id]: {
            ...build,
            allBuilds: [i],
            hasMaster: !!isMaster,
          },
        }
      }

      const matchingBuild = acc[buildMrId] || null
      if (matchingBuild) {
        if (!matchingBuild.allBuilds) {
          acc[buildMrId].allBuilds = [i]
        } else {
          acc[buildMrId].allBuilds = [...matchingBuild.allBuilds, i]
        }
      } else {
        acc[buildMrId] = { ...build }
        acc[buildMrId].allBuilds = [i]
      }
      acc[buildMrId].hasMaster = acc[buildMrId].hasMaster || isMaster
      return acc
    }, {})
  const groupedBuildList = Object.entries(buildDict).map((b) => b[1])
  return groupedBuildList
}
