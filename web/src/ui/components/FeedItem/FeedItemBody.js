import React, { useState } from "react";
import { getIsArray } from "../../../util/getters";
import ShowingOlderBuildsTag from "../ShowingOlderBuildsTag";
import bodyStyles from "./FeedItemBody.module.css";
import {
  ArtifactCreatedAt,
  ArtifactDownloadButton,
  ArtifactDriver,
  ArtifactFileSize,
  ArtifactKindName,
  ArtifactLocalPathRow,
  ArtifactQrButton,
  ArtifactRowKindIcon,
  ArtifactState,
  BranchName,
  BuildCommit,
  BuildCreatedAt,
  BuildDriver,
  BuildDuration,
  BuildIdentifier,
  BuildLogs,
  BuildMessage,
  BuildStateTag,
  BuildUpdatedAt,
  CommitIcon,
  GithubLink,
  HeaderChevronIcon,
  MrDriver,
  MrState,
  QrCode,
  // SharableArtifactLink,
  // TimeSinceBuildUpdated,
} from "./FeedItemWidgets";

const Artifact = ({
  artifact,
  buildId,
  buildMergeUpdatedAt,
  buildStartedAt,
  buildFinishedAt,
  buildShortId,
}) => {
  const [showingQrModal, toggleShowQrModal] = useState(false);
  const {
    plist_signed_url: artifactPlistSignedUrl = "",
    dl_artifact_signed_url: artifactDlArtifactSignedUrl = "",
    kind: artifactKind = "",
    local_path: artifactLocalPath = "",
    file_size: artifactFileSize = "",
    driver: artifactDriver = "",
    state: artifactState = "",
    created_at: artifactCreatedAt = "",
  } = artifact;

  return (
    <>
      {showingQrModal && artifactPlistSignedUrl && (
        <QrCode
          artifactPlistSignedUrl={artifactPlistSignedUrl}
          closeAction={() => toggleShowQrModal(false)}
        />
      )}

      <div
        className={bodyStyles.artifactContainerOuter}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={bodyStyles.artifactInfoContainerOuter}>
          <div className={bodyStyles.artifactInfoInner}>
            <ArtifactRowKindIcon {...{ artifactKind, artifactState }} />
            <ArtifactKindName {...{ artifactKind }} />

            <ArtifactCreatedAt {...{ artifactCreatedAt }} />

            {/* <SharableArtifactLink
              {...{ artifactKind, buildId }}
              isBlock={false}
            /> */}
          </div>
          <div className={bodyStyles.artifactInfoInner}>
            <ArtifactLocalPathRow {...{ artifactLocalPath }} />
          </div>
          <div className={bodyStyles.artifactInfoInner}>
            <BuildIdentifier {...{ buildShortId }} />
            <ArtifactFileSize {...{ artifactFileSize }} />
            <ArtifactDriver {...{ artifactDriver }} />
            <ArtifactState {...{ artifactState }} />
          </div>
        </div>
        <div className={bodyStyles.artifactActionButtons}>
          <div>
            <ArtifactDownloadButton
              {...{ artifactPlistSignedUrl, artifactDlArtifactSignedUrl }}
            />
          </div>
          {artifactPlistSignedUrl && (
            <div>
              <ArtifactQrButton
                // theme={theme}
                onClick={() => toggleShowQrModal(true)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const FeedItemBody = ({
  build,
  buildHasMr,
  hasRunningBuilds,
  isLatestBuild,
  nOlderBuilds,
  showingAllBuilds,
  toggleShowingAllBuilds,
  toggleCollapsed,
  collapsed,
}) => {
  const showingArtifacts =
    isLatestBuild || showingAllBuilds || hasRunningBuilds;

  const {
    id: buildId = "",
    short_id: buildShortId = "",
    branch: buildBranch = "",
    state: buildState = "",
    has_commit_id: buildCommitId = "",
    commit_url: buildCommitUrl = "",
    message: buildMessage = "",
    started_at: buildStartedAt = "",
    finished_at: buildFinishedAt = "",
    created_at: buildCreatedAt = "",
    updated_at: buildUpdatedAt = "",
    driver: buildDriver = "",
    has_project: { id: buildProjectUrl = "" } = {},
    has_artifacts: buildHasArtifacts = null,
  } = build;

  const {
    commit_url: mrCommitUrl = "",
    updated_at: buildMergeUpdatedAt = "",
    driver: mrDriver = "",
    state: mrState = "",
  } = buildHasMr || {};

  return (
    <div className={bodyStyles.buildContainerOuter}>
      <div
        className={bodyStyles.buildInfoTags}
        onClick={(e) => {
          e.stopPropagation();
          toggleCollapsed();
        }}
      >
        <div className={bodyStyles.buildInfoTagsInner1}>
          <BuildIdentifier {...{ buildShortId }} />
          <BuildStateTag {...{ buildState: buildState.toString(), buildId }} />
          <BuildDriver {...{ buildDriver }} />
          <BuildUpdatedAt {...{ buildUpdatedAt }} />
          <BuildCreatedAt {...{ buildCreatedAt }} />
          <BuildDuration {...{ buildCreatedAt, buildFinishedAt }} />
        </div>

        {isLatestBuild && (
          <div className={bodyStyles.buildInfoTagsInner2}>
            <HeaderChevronIcon {...{ collapsed, toggleCollapsed }} />
          </div>
        )}
      </div>
      {isLatestBuild && (
        <div className={bodyStyles.latestBuildVcsInfoOuter}>
          <div className={bodyStyles.latestBuildVcsInfoInner}>
            {(buildCommitId || mrState || mrDriver) && (
              <div className={bodyStyles.latestBuildVcsTags}>
                <CommitIcon {...{ mrCommitUrl }} />
                <BuildCommit
                  {...{ buildCommitUrl, buildCommitId, mrCommitUrl }}
                />
                <MrState {...{ mrState }} />
                <MrDriver {...{ mrDriver }} />
                {buildBranch && <BranchName {...{ buildBranch }} />}
              </div>
            )}

            {buildMessage && (
              <div className={bodyStyles.latestBuildBranch}>
                <BuildMessage buildMessage={buildMessage} />
              </div>
            )}
          </div>
          <div className={bodyStyles.latestVcsLinkContainer}>
            <BuildLogs {...{ buildId }} />
            <GithubLink {...{ buildProjectUrl }} />
          </div>
        </div>
      )}
      {showingArtifacts &&
        getIsArray(buildHasArtifacts) &&
        buildHasArtifacts.map((artifact, i) => (
          <Artifact
            artifact={artifact}
            buildId={buildId}
            buildMergeUpdatedAt={buildMergeUpdatedAt}
            buildStartedAt={buildStartedAt}
            buildFinishedAt={buildFinishedAt}
            buildShortId={buildShortId}
            isLastArtifactOfLatestBuild={
              !!isLatestBuild && i === buildHasArtifacts.length - 1
            }
            key={artifact.id}
          />
        ))}
      {isLatestBuild && nOlderBuilds > 0 && (
        <section className={bodyStyles.containerShowingOlderBuilds}>
          <ShowingOlderBuildsTag
            showingAllBuilds={showingAllBuilds}
            toggleShowingAllBuilds={toggleShowingAllBuilds}
            nOlderBuilds={nOlderBuilds}
          />
        </section>
      )}
    </div>
  );
};

// FeedItemBody.whyDidYouRender = true

export default FeedItemBody;
