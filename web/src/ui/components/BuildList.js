import React, { useMemo } from 'react'
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
            hasRunningBuilds={buildsStateIsRunning(build.allBuildsForMr, builds)}
          >
            {i === 0 && (
            <Divider dividerText="Latest build on Master" /> // can be multiple builds if grouped by MR or multiple projects are in feed
            )}
          </BuildContainer>
        ))}
      {latestMasterBuildsForProjects.length > 0
          && <Divider dividerText="All other builds by date" />}
      {buildsByMr.map((build, i) => ( // The i is important, don't change the positions of items in this arr
        (
          !latestMasterBuildsForProjects.includes(i)
            && (
              <BuildContainer
                key={`${build.id}-${i}`}
                build={build}
                toCollapse={(oneBuildInResultsHasMaster && !buildBranchIsMaster(build))}
                hasRunningBuilds={buildsStateIsRunning(build.allBuildsForMr, builds)}
              >
                {build.buildIsFirstOfDay && (
                  <h4>{getDayFormat(build.created_at)}</h4>
                )}

              </BuildContainer>
            ))
      ))}
    </div>
  )
})

BuildList.whyDidYouRender = true

export default BuildList
