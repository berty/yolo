import React, {
  Fragment, useMemo, useContext, useState,
} from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
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

import { ThemeContext } from '../../store/ThemeStore'

const FeedDisplayToggler = ({
  loaded = false,
  displayFeed = false,
  onSetDisplayFeed = () => {},
}) => {
  const { theme } = useContext(ThemeContext)
  const containerStyle = {
    backgroundColor: theme.bg.btnPrimary,
    color: theme.text.btnPrimary,
    padding: '0.3rem 0.7rem',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  }

  return (
    <button
      disabled={!loaded}
      className="btn btn-primary"
      style={containerStyle}
      onClick={onSetDisplayFeed}
    >
      {`${displayFeed ? 'Hide' : 'Show'} feed`}
      {displayFeed ? (
        <ChevronUp
          size={16}
          style={{ marginLeft: '0.2rem' }}
          color={theme.text.btnPrimary}
        />
      ) : (
        <ChevronDown
          size={16}
          style={{ marginLeft: '0.2rem' }}
          color={theme.text.btnPrimary}
        />
      )}
    </button>
  )
}

const BuildList = ({ builds = [], loaded }) => {
  const [displayFeed, setDisplayFeed] = useState(false)
  const oneBuildInResultsHasMaster = useMemo(
    () => oneBuildResultHasBranchMaster(builds),
    [builds],
  )
  const buildsByMr = useMemo(() => groupBuildsByMr(builds), [builds])
  const buildsByMrWithDateFlags = useMemo(
    () => flagBuildsFirstOfDay(buildsByMr),
    [buildsByMr],
  )
  const indexOfLatestMasterBuildsForProjects = !getIsArrayWithN(buildsByMrWithDateFlags, 2) || !oneBuildInResultsHasMaster
    ? []
    : getLatestMasterBuildsForProjects(buildsByMrWithDateFlags)
  const NoBuilds = () => <div>No results match your query.</div>

  const onSetDisplayFeed = () => {
    setDisplayFeed(!displayFeed)
  }

  return !builds.length && loaded ? (
    <NoBuilds />
  ) : (
    <div className="container">
      {indexOfLatestMasterBuildsForProjects.length > 0
        && buildsByMrWithDateFlags
          .filter((_, i) => indexOfLatestMasterBuildsForProjects.includes(i))
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

      {loaded && indexOfLatestMasterBuildsForProjects.length > 0 && (
        <FeedDisplayToggler
          {...{
            onSetDisplayFeed,
            displayFeed,
            loaded,
            builds,
          }}
        />
      )}
      {(displayFeed === true || !indexOfLatestMasterBuildsForProjects.length)
        && buildsByMrWithDateFlags.map((
          build,
          i, // The i is important to get day dividers, so don't change length of this array
        ) => (
          <Fragment key={`${build.id}-${i}`}>
            {build.buildIsFirstOfDay
              && !indexOfLatestMasterBuildsForProjects.includes(i) && (
                <Divider dividerText={getDayFormat(build.created_at)} />
            )}
            {!indexOfLatestMasterBuildsForProjects.includes(i) && (
              <BuildContainer
                build={build}
                toCollapse={indexOfLatestMasterBuildsForProjects.length > 0}
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
}

// BuildList.whyDidYouRender = true

export default BuildList
