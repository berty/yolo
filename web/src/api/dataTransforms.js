import { BRANCH } from '../constants'

export const queryHasMaster = {
  // Check if any builds in list have master branch
  condition: (builds) => (!(builds
    && Array.isArray(builds)
    && builds.find(
      (build) => build.branch
        && typeof build === 'string'
        && build.branch.toUpperCase() === BRANCH.MASTER,
    ))),
  // check if one build has branch master
  toCollapse: (build) => (
    build && build.branch && build.branch.toUpperCase() !== BRANCH.MASTER
  ),
}

/**
 * Breaks if build doesn't have build.id!
 */
export const groupBuildsByMr = (builds) => {
  const buildDict = builds.reduce((acc, build, i) => {
    const {
      has_mergerequest: hasMergeRequest,
      has_mergerequest_id: buildMrId,
      branch: buildBranch = '',
    } = build

    if (!Object.keys(build)?.length) return acc
    const isMaster = buildBranch.toUpperCase() === BRANCH.MASTER
    if (!hasMergeRequest || !buildMrId) {
      return {
        ...acc,
        [build.id]: {
          ...build,
          allBuilds: [i],
          topLevelMrId: '',
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
      acc[buildMrId].topLevelMrId = buildMrId
      acc[buildMrId].allBuilds = [i]
    }
    acc[buildMrId].hasMaster = acc[buildMrId].hasMaster || isMaster
    return acc
  }, {})
  const groupedBuildList = Object.entries(buildDict).map((b) => b[1])
  return groupedBuildList
}
