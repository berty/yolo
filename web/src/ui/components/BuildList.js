import React, {
  Fragment,
  useMemo,
  useContext,
  useState,
  useRef,
  useEffect,
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
import { usePrevious } from '../../util/misc'

const Feed = ({
  displayFeed,
  indexOfLatestMasterBuildsForProjects,
  buildsByMrWithDateFlags,
  builds,
}) => {
  const { theme } = useContext(ThemeContext)
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToTopStyle = {
    backgroundColor: theme.bg.btnPrimary,
    color: theme.text.btnPrimary,
    padding: '0.3rem 0.7rem',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  }

  return (
    <>
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
      {buildsByMrWithDateFlags?.length > 5 && displayFeed && (
        <button
          className="btn btn-primary"
          style={scrollToTopStyle}
          onClick={scrollTop}
        >
          Scroll to top
        </button>
      )}
    </>
  )
}

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
  const ref = useRef()
  const refOpen = useRef()
  const oneBuildInResultsHasMaster = useMemo(
    () => oneBuildResultHasBranchMaster(builds),
    [builds],
  )
  const prevDisplay = usePrevious(displayFeed)
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

  useEffect(() => {
    // On hide feed, scroll to view 'show feed' was clicked from
    if (
      ref?.current
      && displayFeed === false
      && prevDisplay === true
      && builds.length > 0
    ) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      })
    }
  }, [displayFeed, prevDisplay, builds.length])

  useEffect(() => {
    // On show feed, scroll to feed with 'hide feed' button at top of screen
    if (refOpen?.current && displayFeed === true && prevDisplay === false) {
      refOpen.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [displayFeed, refOpen, prevDisplay])

  return !builds.length > 0 && loaded ? (
    <NoBuilds />
  ) : (
    <div
      className="container"
      style={{ alignSelf: 'flex-start', minHeight: '100%' }}
    >
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
      <div
        ref={refOpen}
        style={{
          visibility: 'hidden',
          height: 0,
          transform: 'translateY(-10px)',
        }}
      />
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
      <div
        ref={ref}
        style={{
          visibility: 'hidden',
          height: 0,
          transform: 'translateY(10px)',
        }}
      />
      <Feed
        {...{
          indexOfLatestMasterBuildsForProjects,
          buildsByMrWithDateFlags,
          builds,
          displayFeed,
        }}
      />
    </div>
  )
}

// BuildList.whyDidYouRender = true

export default BuildList
