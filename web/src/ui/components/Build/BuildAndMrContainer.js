import React, { useContext, useState } from 'react'
import { ThemeContext } from '../../../store/ThemeStore'
import { getIsArray } from '../../../util/getters'
import ShowingOlderBuildsTag from '../ShowingOlderBuildsTag'
import ArtifactRow from './ArtifactRow'
import styles from './Build.module.scss'
import {
  BranchName, BuildCommit, BuildCreatedAt, BuildDriver, BuildLogs, BuildUpdatedAt, CommitIcon, GithubLink, MrDriver, MrState, SharableBuildLink,
} from './BuildAndMrContainerWidgets'
import BuildMessage from './BuildMessage'
import { BuildStateTag } from './BuildWidgetsShared'

const BuildAndMrContainer = ({
  build,
  buildHasMr,
  hasRunningBuilds,
  isLatestBuild,
  nOlderBuilds,
  showingAllBuilds,
  toggleShowingAllBuilds,
}) => {
  const [messageExpanded, toggleMessageExpanded] = useState(false)
  const showingArtifacts = isLatestBuild || showingAllBuilds || hasRunningBuilds

  const {
    theme,
    theme: {
      text: { sectionText, blockTitle },
      border: { filterUnselected },
    },
  } = useContext(ThemeContext)

  const {
    id: buildId = '',
    short_id: buildShortId = '',
    branch: buildBranch = '',
    state: buildState = '',
    has_commit_id: buildCommitId = '',
    message: buildMessage = '',
    started_at: buildStartedAt = '',
    finished_at: buildFinishedAt = '',
    created_at: buildCreatedAt = '',
    updated_at: buildUpdatedAt = '',
    driver: buildDriver = '',
    has_project: { id: buildProjectUrl = '' } = {},
    has_artifacts: buildHasArtifacts = null,
  } = build

  const {
    commit_url: mrCommitUrl = '',
    updated_at: buildMergeUpdatedAt = '',
    driver: mrDriver = '',
    state: mrState = '',
  } = buildHasMr || {}

  const paddingTop = isLatestBuild ? {} : { paddingTop: '1.25rem' }

  return (
    <>
      <div className={styles.blockSectionContainer} style={{ color: sectionText, ...paddingTop }}>
        <div className={styles.blockSectionLeftColumn}>
          <CommitIcon {...{
            theme, buildCommitId, mrCommitUrl,
          }}
          />
          {isLatestBuild && <SharableBuildLink isBlock {...{ buildId }} />}
        </div>
        <div className={styles.blockSectionDetailContainer}>
          {isLatestBuild && (buildCommitId || mrState || mrDriver) && (
            <div className={styles.blockSectionDetailRow}>
              <BuildCommit {...{ buildCommitId, mrCommitUrl, theme }} />
              <MrState {...{ theme, mrState }} />
              <MrDriver {...{ sectionText, mrDriver }} />
            </div>
          )}
          {isLatestBuild && buildBranch && (
            <div className={styles.blockSectionDetailRow}>
              <BranchName {...{ filterUnselected, buildBranch }} />
            </div>
          )}
          {isLatestBuild && buildMessage && (
            <div className={styles.blockSectionDetailRow}>
              <BuildMessage {...{
                buildMessage, theme, messageExpanded, toggleMessageExpanded,
              }}
              />
            </div>
          )}

          <div className={styles.blockSectionDetailRow} style={{ alignSelf: 'flex-start' }}>
            {!isLatestBuild && <SharableBuildLink isBlock={false} {...{ buildId }} />}
            <div>{`Build ${buildShortId || buildId}`}</div>

            <BuildStateTag {...{ buildState, theme, buildId }} />
            <BuildDriver {...{ buildDriver, sectionText }} />
            <BuildUpdatedAt {...{ buildUpdatedAt, sectionText }} />
            <BuildCreatedAt {...{ buildCreatedAt, sectionText }} />
          </div>
        </div>
        {isLatestBuild && (
          <div className={styles.blockRightContainer}>
            <BuildLogs {...{ buildId, blockTitle }} />
            <GithubLink {...{ buildProjectUrl, blockTitle }} />
          </div>
        )}
      </div>
      {
        showingArtifacts
        && getIsArray(buildHasArtifacts)
        && buildHasArtifacts.map((artifact, i) => (
          <ArtifactRow
            artifact={artifact}
            buildId={buildId}
            buildMergeUpdatedAt={buildMergeUpdatedAt}
            buildStartedAt={buildStartedAt}
            buildFinishedAt={buildFinishedAt}
            buildShortId={buildShortId}
            isLastArtifactOfLatestBuild={(!!isLatestBuild && i === buildHasArtifacts.length - 1)}
            key={artifact.id}
          />
        ))
      }
      {isLatestBuild && nOlderBuilds > 0 && (
        <section className={styles.showingOlderBuildsWrapper}>
          <ShowingOlderBuildsTag
            showingAllBuilds={showingAllBuilds}
            toggleShowingAllBuilds={toggleShowingAllBuilds}
            nOlderBuilds={nOlderBuilds}
          />
        </section>
      )}
    </>
  )
}

BuildAndMrContainer.whyDidYouRender = true

export default BuildAndMrContainer
