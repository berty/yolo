import React, { useContext, useState } from "react";
import { ARTIFACT_KIND_NAMES, BRANCH } from "../../../constants";
import { GlobalContext } from "../../../store/GlobalStore";
import { ThemeContext } from "../../../store/ThemeStore";
import { equalsIgnoreCase, isArrayWithMin } from "../../../util/getters";
import ShowingOlderBuildsTag from "../ShowingOlderBuildsTag";
import {
  AnyRunningBuildTags,
  BuildStateTag,
  BuildUpdatedAt,
  DlButtonSmall,
  LatestBuildArtifactsIcons,
  LatestBuildQrButton,
  QrCode,
} from "./FeedItemWidgets";
import feedItemStyles from "./FeedItem.module.css";
import FeedItemBody from "./FeedItemBody";
import FeedItemHeader from "./FeedItemHeader";

const LatestBuildStateTags = ({
  collapsed,
  theme,
  buildState,
  buildId,
  buildHasArtifacts,
  allBuildsForMr,
  hasRunningBuilds,
  buildUpdatedAt,
}) => {
  const [showingQrModal, toggleShowQrModal] = useState(false);
  const firstArtifactPlistSignedUrl =
    buildHasArtifacts?.find((a) => a.kind === ARTIFACT_KIND_NAMES.IPA)
      ?.plist_signed_url || null;
  return (
    collapsed && (
      <>
        {showingQrModal && firstArtifactPlistSignedUrl && (
          <QrCode
            artifactPlistSignedUrl={firstArtifactPlistSignedUrl}
            closeAction={() => toggleShowQrModal(false)}
          />
        )}
        <BuildStateTag {...{ theme, buildState, buildId }} />
        <LatestBuildArtifactsIcons {...{ theme, buildHasArtifacts }} />
        <AnyRunningBuildTags {...{ hasRunningBuilds, allBuildsForMr, theme }} />
        <DlButtonSmall {...{ buildHasArtifacts, theme }} />
        <LatestBuildQrButton
          onClick={() => toggleShowQrModal(true)}
          theme={theme}
          artifactPlistSignedUrl={firstArtifactPlistSignedUrl}
        />
        <BuildUpdatedAt {...{ buildUpdatedAt }} />
        <ShowingOlderBuildsTag nOlderBuilds={allBuildsForMr.length - 1} />
      </>
    )
  );
};

const FeedItem = React.memo(
  ({ build, hasRunningBuilds, isLatestMaster = false }) => {
    const { state } = useContext(GlobalContext);
    const [collapsed, setCollapsed] = useState(true);
    const [showingAllBuilds, toggleShowingAllBuilds] = useState(false);

    const { theme } = useContext(ThemeContext);

    const toggleCollapsed = () => setCollapsed(!collapsed);

    const {
      short_id: buildShortId = "",
      id: buildId = "",
      branch: buildBranch = "",
      state: buildState = "",
      has_mergerequest: buildHasMr = null,
      has_artifacts: buildHasArtifacts = null,
      has_project: buildHasProject = null,
      updated_at: buildUpdatedAt = "",
      has_mergerequest: {
        short_id: mrShortId = "",
        id: mrId = "",
        title: mrTitle = "",
        state: mrState = "",
        has_author: {
          name: buildAuthorName = "",
          id: buildAuthorId = "",
          avatar_url: buildAuthorAvatarUrl = "",
        } = {},
      } = {},
      allBuildsForMr = [],
    } = build || {};

    const {
      id: projectId,
      name: projectName,
      has_owner: {
        id: projectOwnerId = "",
        avatar_url: projectOwnerAvatarUrl = "",
      } = {},
    } = buildHasProject || {};

    const isMasterBuildBranch = equalsIgnoreCase(buildBranch, BRANCH.MASTER);

    return (
      <section
        className={feedItemStyles.container}
        key={buildId}
        onClick={() => {
          if (collapsed) {
            toggleCollapsed();
          }
        }}
      >
        <FeedItemHeader
          {...{
            buildAuthorName,
            buildAuthorAvatarUrl,
            buildAuthorId,
            buildHasMr,
            buildId,
            buildShortId,
            collapsed,
            isMasterBuildBranch,
            isLatestMaster,
            mrId,
            mrTitle,
            mrShortId,
            mrState,
            toggleCollapsed,
            projectOwnerId,
            projectOwnerAvatarUrl,
            projectName,
            projectId,
          }}
        >
          {collapsed && (
            <>
              <LatestBuildStateTags
                {...{
                  collapsed,
                  theme,
                  buildState,
                  buildId,
                  buildHasArtifacts,
                  allBuildsForMr,
                  hasRunningBuilds,
                  buildUpdatedAt,
                }}
              />
            </>
          )}
        </FeedItemHeader>
        {!collapsed &&
          allBuildsForMr
            .filter((bIdx, i) =>
              showingAllBuilds ? Number.isInteger(bIdx) : i === 0
            )
            .map((buildidx, i) => (
              <FeedItemBody
                build={state.builds[buildidx]}
                buildHasMr={buildHasMr}
                hasRunningBuilds={hasRunningBuilds}
                isLatestBuild={i === 0}
                key={i}
                nOlderBuilds={
                  i === 0 && isArrayWithMin(allBuildsForMr, 2)
                    ? allBuildsForMr.length - 1
                    : 0
                }
                showingAllBuilds={showingAllBuilds}
                toggleShowingAllBuilds={toggleShowingAllBuilds}
                {...{ toggleCollapsed, collapsed }}
              />
            ))}
      </section>
    );
  }
);

// BuildContainer.whyDidYouRender = true

export default FeedItem;
