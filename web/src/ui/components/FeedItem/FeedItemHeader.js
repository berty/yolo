import React, { useContext } from "react";
import { ThemeContext } from "../../../store/ThemeStore";
import Author from "../Author/Author";
import bodyStyles from "./FeedItemBody.module.css";
import feedItemHeaderStyles from "./FeedItemHeader.module.css";
import {
  HeaderBlockIcon,
  HeaderChevronIcon,
  HeaderProjectIcon,
  LatestMasterIndicator,
} from "./FeedItemWidgets";

const FeedItemHeader = ({
  buildAuthorName,
  buildAuthorAvatarUrl,
  buildAuthorId,
  buildHasMr,
  buildId,
  buildShortId,
  mrShortId,
  mrId,
  mrTitle,
  collapsed,
  isMasterBuildBranch,
  isLatestMaster,
  mrState,
  toggleCollapsed,
  projectName,
  projectId,
  children,
}) => {
  const { theme } = useContext(ThemeContext);

  // eslint-disable-next-line no-nested-ternary
  const titleText = isMasterBuildBranch
    ? "Master"
    : mrShortId
    ? `Pull #${mrShortId}`
    : buildShortId
    ? `Build #${buildShortId}`
    : "Build";

  const Title = () => (
    <a
      href={mrId || buildId}
      className={feedItemHeaderStyles.textTitle}
      onClick={(e) => e.stopPropagation()}
    >
      {titleText}
    </a>
  );

  const SubtitleMergeId = () => (
    <>
      {"Merge "}
      <a href={mrId} onClick={(e) => e.stopPropagation()}>
        #{mrShortId}
      </a>
      {mrTitle && `: ${mrTitle}`}
    </>
  );

  const Subtitle = () => (
    <span className={feedItemHeaderStyles.textSubtitle}>
      {isMasterBuildBranch ? <SubtitleMergeId /> : mrTitle}
    </span>
  );

  return (
    <div
      className={feedItemHeaderStyles.container}
      onClick={(e) => {
        e.stopPropagation();
        toggleCollapsed();
      }}
    >
      <div className={feedItemHeaderStyles.titleRow}>
        <div className={feedItemHeaderStyles.titleLeftArea}>
          <HeaderBlockIcon {...{ theme, mrState, buildHasMr }} />
          <Title />
          <LatestMasterIndicator {...{ isLatestMaster }} />
        </div>
        <div className={feedItemHeaderStyles.titleRightArea}>
          <HeaderProjectIcon {...{ projectId, projectName }} />
          <Author
            {...{ buildAuthorAvatarUrl, buildAuthorName, buildAuthorId }}
          />
        </div>
      </div>
      <div className={feedItemHeaderStyles.subtitleRow}>
        <Subtitle />
      </div>
      {collapsed && (
        <div className={bodyStyles.buildInfoTags}>
          <div className={bodyStyles.buildInfoTagsInner1}>{children}</div>

          <div className={bodyStyles.buildInfoTagsInner2}>
            <HeaderChevronIcon {...{ collapsed, toggleCollapsed }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedItemHeader;
