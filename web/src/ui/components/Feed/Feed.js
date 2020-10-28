import cn from "classnames";
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "react-feather";
import { useLocation } from "react-router-dom";
import {
  buildsStateIsRunning,
  oneBuildResultHasBranchMaster,
} from "../../../api/apiResponseGetters";
import {
  flagBuildsFirstOfDay,
  getLatestMasterBuildsForProjects,
  groupBuildsByMr,
} from "../../../api/apiResponseTransforms";
import { btnLg, primary } from "../../../assets/widget-snippets.module.css";
import { getDateDividerFormat } from "../../../util/date";
import { getIsEmpty, isArrayWithMin } from "../../../util/getters";
import { usePrevious } from "../../../util/misc";
import DateDivider from "../DateDivider/DateDivider";
import FeedItem from "../FeedItem/FeedItem";
import { FeedDisplayToggler } from "../FeedItem/FeedItemWidgets";
import styles from "./Feed.module.css";

const ExtendedFeed = ({
  displayFeed,
  indexOfLatestMasterBuildsForProjects,
  buildsByMrWithDateFlags,
  builds,
}) => {
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    scrollTop();
  }, []);

  return (
    <>
      {(displayFeed === true ||
        getIsEmpty(indexOfLatestMasterBuildsForProjects)) &&
        buildsByMrWithDateFlags.map((
          build,
          i // The i is important to get day dividers, so don't change length of this array
        ) => (
          <Fragment key={`${build.id}-${i}`}>
            {build.buildIsFirstOfDay &&
              !indexOfLatestMasterBuildsForProjects.includes(i) && (
                <DateDivider
                  dividerText={getDateDividerFormat(build.created_at)}
                />
              )}
            {!indexOfLatestMasterBuildsForProjects.includes(i) && (
              <FeedItem
                build={build}
                hasRunningBuilds={buildsStateIsRunning(
                  build.allBuildsForMr,
                  builds
                )}
              />
            )}
          </Fragment>
        ))}
      {isArrayWithMin(buildsByMrWithDateFlags, 5) && displayFeed && (
        <button className={cn(btnLg, primary)} onClick={scrollTop}>
          <ArrowUp />
          <span>Scroll to top</span>
        </button>
      )}
    </>
  );
};

const Feed = ({ builds = [], loaded }) => {
  const { search: locationSearch } = useLocation();
  const [displayFeed, setDisplayFeed] = useState(
    window.localStorage.getItem("displayFeed") === "true"
  );

  const ref = useRef();
  const oneBuildInResultsHasMaster = useMemo(
    () => oneBuildResultHasBranchMaster(builds),
    [builds]
  );
  const prevDisplayFeed = usePrevious(displayFeed);
  const buildsByMr = useMemo(() => groupBuildsByMr(builds), [builds]);
  const buildsByMrWithDateFlags = useMemo(
    () => flagBuildsFirstOfDay(buildsByMr),
    [buildsByMr]
  );

  const indexOfLatestMasterBuildsForProjects =
    !isArrayWithMin(buildsByMrWithDateFlags, 2) || !oneBuildInResultsHasMaster
      ? []
      : getLatestMasterBuildsForProjects(buildsByMrWithDateFlags);
  const NoBuilds = () => (
    <div className={styles.noResults}>
      <p>No results match your query:</p>
      <p>{locationSearch}</p>
    </div>
  );

  const onSetDisplayFeed = () => {
    window.localStorage.setItem("displayFeed", !displayFeed ? "true" : "false");
    setDisplayFeed(!displayFeed);
  };

  useEffect(() => {
    // Scroll effects when hiding/showing feed
    if (
      displayFeed !== prevDisplayFeed &&
      typeof prevDisplayFeed !== "undefined" &&
      ref?.current
    ) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: displayFeed ? "start" : "end",
      });
    }
  }, [displayFeed, ref, prevDisplayFeed]);

  return !builds.length > 0 && loaded ? (
    <NoBuilds />
  ) : (
    <div className={styles.container}>
      {/* TODO: Refactor */}
      {indexOfLatestMasterBuildsForProjects.length > 0 &&
        buildsByMrWithDateFlags
          .filter((_, i) => indexOfLatestMasterBuildsForProjects.includes(i))
          .map((build, i) => (
            <FeedItem
              key={`${build.id}-${i}`}
              build={build}
              isLatestMaster
              hasRunningBuilds={buildsStateIsRunning(
                build.allBuildsForMr,
                builds
              )}
            />
          ))}

      {indexOfLatestMasterBuildsForProjects.length > 0 && (
        <div className={styles.togglerContainer} ref={ref}>
          <FeedDisplayToggler
            {...{
              onSetDisplayFeed,
              displayFeed,
              loaded,
              builds,
            }}
          />
        </div>
      )}
      {/* TODO: Refactor */}
      <ExtendedFeed
        {...{
          indexOfLatestMasterBuildsForProjects,
          buildsByMrWithDateFlags,
          builds,
          displayFeed,
        }}
      />
    </div>
  );
};

export default Feed;
