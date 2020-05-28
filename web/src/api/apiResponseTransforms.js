import { values } from 'lodash'
import { getSafeStr } from '../util/getters'
import { getIsNextDay } from '../util/date'

/**
 * Adds entry {buildIsFirstOfDay: boolean} to each build
 *   that has its own block in build list
 *
 * Assumes builds are sorted in descending order by build.created_at
 *
 * @param  {Array<BuildObject>} sortedTopLevelBuilds
 * @return {Array<BuildObject>}
 */
export const flagBuildsFirstOfDay = (sortedTopLevelBuilds) => Array.isArray(sortedTopLevelBuilds)
  && sortedTopLevelBuilds.reduce((acc, build, i) => {
    const isFirstBuild = i === 0
    const { created_at: buildCreatedAt = null } = build
    const { created_at: laterBuildCreatedAt = null } = acc[i - 1] || {}
    acc[i] = {
      ...build,
      buildIsFirstOfDay:
        isFirstBuild || !!getIsNextDay(buildCreatedAt, laterBuildCreatedAt),
    }
    return acc
  }, [])


/**
 * Adds entry {allBuildsForMr: Array<int>} to each build,
 * each int corresponds to builds indices in state.builds
 * with the same merge request ID
 */
const groupByMr = (acc = {}, build, i) => {
  const {
    has_mergerequest: hasMergeRequest,
    has_mergerequest_id: buildMrId,
  } = build || {}

  if (!hasMergeRequest || !buildMrId) {
    return {
      ...acc,
      [build.id]: {
        ...build,
        allBuildsForMr: [i],
      },
    }
  }

  const matchingBuild = acc[buildMrId] || null
  if (matchingBuild) {
    if (!matchingBuild.allBuildsForMr) {
      acc[buildMrId].allBuildsForMr = [i]
    } else {
      acc[buildMrId].allBuildsForMr = [...matchingBuild.allBuildsForMr, i]
    }
  } else {
    acc[buildMrId] = { ...build }
    acc[buildMrId].allBuildsForMr = [i]
  }
  return acc
}

/**
 * Returns a new copy of builds[],
 * keeping only the first build from each unique merge request.
 *
 * @param  {Array<BuildObject>} builds
 * @return {Array<BuildObject>}
 */
export const groupBuildsByMr = (builds) => values(builds.reduce(groupByMr, {}))

/**
 * Takes axios HTTP error and formats it
 * @param {axios-flavored HTTP error} error
 * @return {Object<{humanMessage: string, status: number, statusText: string}>}
 */
export const validateError = ({ error }) => {
  const { message: axiosMessage } = error.toJSON()
  const {
    response: { data: customTopLevelMessage = '', status, statusText } = {
      data: '',
      status: 0,
      statusText: '',
    },
  } = error || {}
  const {
    response: { data: { message: customNestedMessage } = { data: { message: '' } } },
  } = error || {}
  const humanMessage = getSafeStr(customTopLevelMessage) || getSafeStr(customNestedMessage) || axiosMessage
  return {
    humanMessage,
    status,
    statusText,
  }
}
