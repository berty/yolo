import React from 'react'
import BuildContainer from './Build/BuildContainer'
import {
  oneBuildResultHasBranchMaster,
  buildBranchIsMaster,
} from '../../api/dataGetters'
import {
  groupBuildsByMr,
  flagBuildsFirstOfDay,
} from '../../api/dataTransforms'
import Divider from './Divider'
import { getDayFormat } from '../../util/date'

const BuildList = ({ builds = [] }) => {
  const useCollapseCondition = oneBuildResultHasBranchMaster(builds)
  const buildsByMr = groupBuildsByMr(builds)
  const buildsFlaggedWithFirstDay = flagBuildsFirstOfDay(buildsByMr)
  const NoBuilds = () => <div>No results match your query.</div>

  return !builds.length ? (
    <NoBuilds />
  ) : (
    <div className="container">
      {buildsFlaggedWithFirstDay.map((build, i) => (
        <BuildContainer
          key={`${build.id}-${i}`}
          build={build}
          toCollapse={useCollapseCondition && !buildBranchIsMaster(build)}
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
