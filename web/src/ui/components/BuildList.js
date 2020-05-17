import React from 'react'
import BuildContainer from './Build/BuildContainer'

const BuildList = ({ buildsByMr, builds = [], collapseCondition }) => {
  const useCollapseCondition = collapseCondition.condition(builds)
  const NoBuilds = () => <div>No results match your query.</div>
  return !builds.length ? (
    <NoBuilds />
  ) : (
    <div className="container">
      {buildsByMr.map((build, i) => (
        <BuildContainer
          key={`${build.id}-${i}`}
          build={build}
          toCollapse={
            !!(useCollapseCondition && collapseCondition.toCollapse(build))
          }
        />
      ))}
    </div>
  )
}

export default BuildList
