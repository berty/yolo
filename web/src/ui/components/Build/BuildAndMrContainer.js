import React, { useContext, useState } from 'react'
import { Link as LinkIcon } from 'react-feather'

import { ThemeContext } from '../../../store/ThemeStore'

import { tagColorStyles } from '../../styleTools/buttonStyler'
import ArtifactRow from './ArtifactRow'
import AnchorLink from '../AnchorLink/AnchorLink'
import Tag from '../Tag/Tag'

import { BUILD_STATE } from '../../../constants'
import { getIsArray } from '../../../util/getters'

import './Build.scss'
import ShowingOlderBuildsTag from '../ShowingOlderBuildsTag'
import BuildMessage from './BuildMessage'
import {
  CommitIcon, BuildCommit, MrState, MrDriver, BuildDriver, BuildUpdatedAt, BuildCreatedAt, BuildLogs, GithubLink,
} from './BuildAndMrContainerWidgets'

const BuildAndMrContainer = ({
  build,
  buildHasMr,
  isLatestBuild,
  nOlderBuilds,
  showingAllBuilds,
  toggleShowingAllBuilds,
  hasRunningBuilds,
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


  const colorInteractiveText = {
    color: blockTitle,
  }


  const BranchName = buildBranch && (
    <div
      className="btn btn-branch-name"
      style={{
        backgroundColor: filterUnselected,
      }}
    >
      {buildBranch}
    </div>
  )

  const BuildStateTagPassed = buildState === BUILD_STATE.Passed && (
    <Tag
      title={buildId}
      classes={['state-tag']}
      styles={{
        ...tagColorStyles({
          theme,
          state: BUILD_STATE[buildState],

        }),
        cursor: 'pointer',
      }}
      href={buildId}
      text={buildState}
    />
  )

  const BuildStateTagIsNotPassed = buildState && (
    <Tag
      text={buildState}
      title="Build state"
      classes={['state-tag']}
      styles={tagColorStyles({ theme, state: BUILD_STATE[buildState] })}
    />
  )

  const BuildStateTag = BuildStateTagPassed || BuildStateTagIsNotPassed || ''


  const SharableBuildLink = ({ isBlock }) => (
    <AnchorLink target={`?build_id=${buildId}`} isBlock={isBlock}>
      <LinkIcon size={16} />
    </AnchorLink>
  )

  return (
    <>
      <div className="block-row expanded" style={{ color: sectionText }}>
        <div className="block-left-icon icon-top">
          <CommitIcon {...{
            colorInteractiveText, buildCommitId, mrCommitUrl, buildHasMr,
          }}
          />
          {isLatestBuild && <SharableBuildLink isBlock />}
        </div>
        <div className="block-details">
          {isLatestBuild && (buildCommitId || mrState || mrDriver) && (
            <div className="block-details-row">
              <BuildCommit {...{ buildCommitId, mrCommitUrl, colorInteractiveText }} />
              <MrState {...{ theme, mrState }} />
              <MrDriver {...{ sectionText, mrDriver }} />
            </div>
          )}
          {isLatestBuild && buildBranch && (
            <div className="block-details-row">{BranchName}</div>
          )}
          {isLatestBuild && buildMessage && (
            <div className="block-details-row">
              <BuildMessage {...{
                buildMessage, colorInteractiveText, messageExpanded, toggleMessageExpanded,
              }}
              />
            </div>
          )}

          <div className="block-details-row" style={{ alignSelf: 'flex-start' }}>
            {!isLatestBuild && <SharableBuildLink isBlock={false} />}
            <div>{`Build ${buildShortId || buildId}`}</div>

            {BuildStateTag}
            <BuildDriver {...{ buildDriver, sectionText }} />
            <BuildUpdatedAt {...{ buildUpdatedAt, sectionText }} />
            <BuildCreatedAt {...{ buildCreatedAt, sectionText }} />
            {isLatestBuild && nOlderBuilds > 0 && <ShowingOlderBuildsTag showingAllBuilds={showingAllBuilds} toggleShowingAllBuilds={toggleShowingAllBuilds} nOlderBuilds={nOlderBuilds} />}
          </div>
        </div>
        {isLatestBuild && (
          <div className="block-right-container">
            <BuildLogs {...{ buildId, blockTitle }} />
            <GithubLink {...{ buildProjectUrl, blockTitle }} />
          </div>
        )}
      </div>
      {showingArtifacts
        && getIsArray(buildHasArtifacts)
        && buildHasArtifacts.map((artifact) => (
          <ArtifactRow
            artifact={artifact}
            buildMergeUpdatedAt={buildMergeUpdatedAt}
            buildStartedAt={buildStartedAt}
            buildFinishedAt={buildFinishedAt}
            buildShortId={buildShortId}
            key={artifact.id}
          />
        ))}
    </>
  )
}

export default BuildAndMrContainer
