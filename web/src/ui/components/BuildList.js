import React from 'react'
import BuildContainer from './Build/BuildContainer'
import {
  oneBuildResultHasBranchMaster,
  buildBranchIsMaster,
  buildsStateIsRunning,
} from '../../api/apiResponseGetters'
import {
  groupBuildsByMr,
  flagBuildsFirstOfDay,
} from '../../api/apiResponseTransforms'
import Divider from './Divider/Divider'
import { getDayFormat } from '../../util/date'

const BuildList = ({ builds = [] }) => {
  const oneBuildInResultsHasMaster = oneBuildResultHasBranchMaster(builds)
  const buildsByMr = groupBuildsByMr(builds)
  const buildsByMrWithDateFlag = flagBuildsFirstOfDay(buildsByMr)
  const NoBuilds = () => <div>No results match your query.</div>

  return !builds.length ? (
    <NoBuilds />
  ) : (
    <div className="container">
      {buildsByMrWithDateFlag.map((build, i) => (
        <BuildContainer
          key={`${build.id}-${i}`}
          build={build}
          toCollapse={oneBuildInResultsHasMaster && !buildBranchIsMaster(build)}
          hasRunningBuilds={buildsStateIsRunning(build.allBuildsForMr, builds)}
        >
          {build.buildIsFirstOfDay && (
          <Divider dividerText={getDayFormat(build.created_at)} />
          )}

        </BuildContainer>
      ))}
    </div>
  )
}

export default BuildList
