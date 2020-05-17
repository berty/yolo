import React from 'react'
import BuildContainer from './Build/BuildContainer'
import {
  groupBuildsByMr,
  oneBuildResultHasBranchMaster,
  buildBranchIsMaster,
} from '../../api/dataTransforms'

const BuildList = ({ builds = [] }) => {
  const useCollapseCondition = oneBuildResultHasBranchMaster(builds)
  const buildsByMr = groupBuildsByMr(builds)
  const NoBuilds = () => <div>No results match your query.</div>

  return !builds.length ? (
    <NoBuilds />
  ) : (
    <div className="container">
      {buildsByMr.map((build, i) => (
        <BuildContainer
          key={`${build.id}-${i}`}
          build={build}
          toCollapse={useCollapseCondition && !buildBranchIsMaster(build)}
        />
      ))}
    </div>
  )
}

export default BuildList
