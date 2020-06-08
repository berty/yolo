import React, { useMemo } from 'react'
import BuildContainer from './Build/BuildContainer'
import {
  oneBuildResultHasBranchMaster,
  buildBranchIsMaster,
  buildsStateIsRunning,
} from '../../api/apiResponseGetters'
import {
  groupBuildsByMr,
  flagBuildsFirstOfDay,
  getLatestMasterBuildsForProjects,
} from '../../api/apiResponseTransforms'
import Divider from './Divider/Divider'
import { getDayFormat } from '../../util/date'
import { getIsArrayWithN } from '../../util/getters'

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
            <Divider dividerText="Latest builds on Master" />
            )}
          </BuildContainer>
        ))}
      {latestMasterBuildsForProjects.length > 0
          && <Divider dividerText="All builds by date" />}
      {buildsByMr.map((build, i) => (
        <BuildContainer
          key={`${build.id}-${i}`}
          build={build}
          toCollapse={latestMasterBuildsForProjects.includes(i) || (oneBuildInResultsHasMaster && !buildBranchIsMaster(build))}
          hasRunningBuilds={buildsStateIsRunning(build.allBuildsForMr, builds)}
        >
          {build.buildIsFirstOfDay && (
          <h4>{getDayFormat(build.created_at)}</h4>
          )}

        </BuildContainer>
      ))}
    </div>
  )
})

BuildList.whyDidYouRender = true

export default BuildList
