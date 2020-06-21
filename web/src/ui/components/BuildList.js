import React, { useMemo, Fragment } from 'react'
import {
  buildBranchIsMaster,
  buildsStateIsRunning, oneBuildResultHasBranchMaster,
} from '../../api/apiResponseGetters'
import {
  flagBuildsFirstOfDay,
  getLatestMasterBuildsForProjects, groupBuildsByMr,
} from '../../api/apiResponseTransforms'
import { getDayFormat } from '../../util/date'
import { getIsArrayWithN } from '../../util/getters'
import BuildContainer from './Build/BuildContainer'
import Divider from './Divider/Divider'

const BuildList = React.memo(({ builds = [], loaded }) => {
  const oneBuildInResultsHasMaster = useMemo(() => oneBuildResultHasBranchMaster(builds), [builds])
  const buildsByMr = useMemo(() => flagBuildsFirstOfDay(groupBuildsByMr(builds)), [builds])
  const latestMasterBuildsForProjects = !getIsArrayWithN(buildsByMr, 2) || !oneBuildInResultsHasMaster ? [] : getLatestMasterBuildsForProjects(buildsByMr)
  const NoBuilds = () => <div>No results match your query.</div>

  return !builds.length && loaded ? (
    <NoBuilds />
  ) : (
    <div className="container">
      {latestMasterBuildsForProjects.length > 0 && buildsByMr
        .filter((_, i) => latestMasterBuildsForProjects.includes(i))
        .map((build, i) => (
          <BuildContainer
            key={`${build.id}-${i}`}
            build={build}
            toCollapse={false}
            isLatestMaster
            hasRunningBuilds={buildsStateIsRunning(build.allBuildsForMr, builds)}
          />
        ))}
      {buildsByMr.map((build, i) => ( // The i is important to get day dividers, so don't change length of this array
        (
          <Fragment key={`${build.id}-${i}`}>
            {build.buildIsFirstOfDay && (
            // <h4>{getDayFormat(build.created_at)}</h4>
            <Divider dividerText={getDayFormat(build.created_at)} />
            )}
            {!latestMasterBuildsForProjects.includes(i)
                && (
                  <BuildContainer
                    build={build}
                    toCollapse={(oneBuildInResultsHasMaster && !buildBranchIsMaster(build))}
                    hasRunningBuilds={buildsStateIsRunning(build.allBuildsForMr, builds)}
                  />
                )}
          </Fragment>
        )
      ))}
    </div>
  )
})

BuildList.whyDidYouRender = true

export default BuildList
