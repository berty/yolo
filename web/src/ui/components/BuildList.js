import React, { useMemo, Fragment } from 'react'
// eslint-disable-next-line no-unused-vars
import { uniq } from 'lodash'
import {
  buildsStateIsRunning,
  oneBuildResultHasBranchMaster,
} from '../../api/apiResponseGetters'
import {
  flagBuildsFirstOfDay,
  getLatestMasterBuildsForProjects,
  groupBuildsByMr,
} from '../../api/apiResponseTransforms'
import { getDayFormat } from '../../util/date'
import { getIsArrayWithN } from '../../util/getters'
import BuildContainer from './Build/BuildContainer'
import Divider from './Divider/Divider'

const BuildList = React.memo(({ builds = [], loaded }) => {
  const oneBuildInResultsHasMaster = useMemo(
    () => oneBuildResultHasBranchMaster(builds),
    [builds],
  )
  const buildsByMr = useMemo(() => groupBuildsByMr(builds), [builds])
  const buildsByMrWithDateFlags = useMemo(
    () => flagBuildsFirstOfDay(buildsByMr),
    [buildsByMr],
  )
  const latestMasterBuildsForProjects = !getIsArrayWithN(buildsByMrWithDateFlags, 2) || !oneBuildInResultsHasMaster
    ? []
    : getLatestMasterBuildsForProjects(buildsByMrWithDateFlags)
  const NoBuilds = () => <div>No results match your query.</div>

  return !builds.length && loaded ? (
    <NoBuilds />
  ) : (
    <div className="container">
      {latestMasterBuildsForProjects.length > 0
        && buildsByMrWithDateFlags
          .filter((_, i) => latestMasterBuildsForProjects.includes(i))
          .map((build, i) => (
            <BuildContainer
              key={`${build.id}-${i}`}
              build={build}
              toCollapse={false}
              isLatestMaster
              hasRunningBuilds={buildsStateIsRunning(
                build.allBuildsForMr,
                builds,
              )}
            />
          ))}
      {buildsByMrWithDateFlags.map((
        build,
        i, // The i is important to get day dividers, so don't change length of this array
      ) => (
        <Fragment key={`${build.id}-${i}`}>
          {build.buildIsFirstOfDay && (
            // <h4>{getDayFormat(build.created_at)}</h4>
            <Divider dividerText={getDayFormat(build.created_at)} />
          )}
          {!latestMasterBuildsForProjects.includes(i) && (
            <BuildContainer
              build={build}
              toCollapse={latestMasterBuildsForProjects.length > 0}
              hasRunningBuilds={buildsStateIsRunning(
                build.allBuildsForMr,
                builds,
              )}
            />
          )}
        </Fragment>
      ))}
    </div>
  )
})

// BuildList.whyDidYouRender = true

export default BuildList
