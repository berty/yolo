import React, { useContext, useState } from 'react'
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Calendar,
  Link as LinkIcon,
} from 'react-feather'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import {
  faAlignLeft,
  faHammer,
  faPencilAlt,
} from '@fortawesome/free-solid-svg-icons'

import { ThemeContext } from '../../../store/ThemeStore'

import { tagStyle } from '../../styleTools/buttonStyler'
import ArtifactRow from './ArtifactRow'
import AnchorLink from '../AnchorLink/AnchorLink'
import Tag from '../Tag/Tag'

import { MR_STATE, BUILD_STATE } from '../../../constants'
import { getRelativeTime, getTimeLabel } from '../../../util/date'
import { getIsArr } from '../../../util/getters'

import './Build.scss'
import ShownBuildsButton from '../ShownBuildsButton'

const BuildAndMrContainer = ({
  build, buildHasMr, isLatestBuild, nOlderBuilds, showingAllBuilds, toggleShowingAllBuilds,
}) => {
  const [messageExpanded, toggleMessageExpanded] = useState(false)
  const showingArtifacts = isLatestBuild || showingAllBuilds

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
    has_project: buildHasProject = null,
    has_project: { id: buildProjectUrl = '' } = {},
    has_artifacts: buildHasArtifacts = null,
  } = build

  const {
    commit_url: mrCommitUrl = '',
    updated_at: buildMergeUpdatedAt = '',
    driver: mrDriver = '',
    state: mrState = '',
  } = buildHasMr || {}

  const COMMIT_LEN = 7
  const MESSAGE_LEN = 140
  const timeSinceUpdated = getRelativeTime(buildUpdatedAt)
  const timeSinceCreated = getRelativeTime(buildCreatedAt)

  const colorInteractiveText = {
    color: blockTitle,
  }

  const colorPlainText = {
    color: sectionText,
  }

  const CommitIconWithMrUrl = () => (
    <a href={mrCommitUrl}>
      <GitCommit color={blockTitle} title={buildCommitId || ''} />
    </a>
  )

  const CommitIconWithNoMrUrl = () => (
    <GitCommit color={sectionText} title={buildCommitId || ''} style={buildHasMr ? {} : { transform: 'rotate(90deg)' }} />)

  const CommitIcon = () => (mrCommitUrl ? <CommitIconWithMrUrl /> : <CommitIconWithNoMrUrl />)

  const SplitMessage = (text) => text
    .split('\n')
    .filter((x) => !!x)
    .map((x, i) => (
      <p className="build-message-line" key={i}>
        {x}
      </p>
    ))

  const BuildMessage = !buildMessage ? (
    ''
  ) : buildMessage.length < MESSAGE_LEN ? (
    SplitMessage(buildMessage)
  ) : messageExpanded ? (
    <div
      className="interactive-text build-message"
      onClick={() => toggleMessageExpanded(false)}
    >
      {SplitMessage(buildMessage)}
      <span style={colorInteractiveText}>&nbsp;[show less]</span>
    </div>
  ) : (
    <div
      className="interactive-text build-message"
      onClick={() => toggleMessageExpanded(true)}
    >
      {SplitMessage(buildMessage.slice(0, MESSAGE_LEN))}
      ...
      <span style={colorInteractiveText}>&nbsp;[show more]</span>
    </div>
  )

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
      styles={tagStyle({
        name: theme.name,
        state: BUILD_STATE[buildState],
        cursor: 'pointer',
      })}
      href={buildId}
      text={buildState}
    />
  )

  const BuildStateTagIsNotPassed = buildState && (
    <Tag
      text={buildState}
      title="Build state"
      classes={['state-tag']}
      styles={tagStyle({ name: theme.name, state: BUILD_STATE[buildState] })}
    />
  )

  const BuildStateTag = BuildStateTagPassed || BuildStateTagIsNotPassed || ''

  const BuildLogs = (
    <a href={buildId}>
      <FontAwesomeIcon
        icon={faAlignLeft}
        color={blockTitle}
        size="lg"
        title={buildId}
      />
    </a>
  )

  const GithubLink = buildHasProject && buildProjectUrl && (
    <a href={buildProjectUrl}>
      <FontAwesomeIcon
        icon={faGithub}
        color={blockTitle}
        size="lg"
        title={buildProjectUrl}
      />
    </a>
  )

  const BuildCommit = buildCommitId && (
    <div title={buildCommitId}>
      Commit
      {' '}
      {mrCommitUrl ? (
        <a
          href={mrCommitUrl}
          style={colorPlainText}
          className="interactive-text"
        >
          {buildCommitId.slice(0, COMMIT_LEN)}
        </a>
      ) : (
        buildCommitId.slice(0, COMMIT_LEN)
      )}
    </div>
  )

  const BuildDriver = buildDriver && (
    <Tag
      classes={['normal-caps', 'details']}
      title={`Build driver: ${buildDriver}`}
      icon={<FontAwesomeIcon icon={faHammer} color={sectionText} />}
      text={`Build driver: ${buildDriver}`}
    />
  )

  const MrDriver = mrDriver && (
    <Tag
      classes={['normal-caps', 'details']}
      title={`Merge request driver: ${mrDriver}`}
      icon={<FontAwesomeIcon icon={faHammer} color={sectionText} />}
      text={mrDriver}
    />
  )

  const MrState = mrState && (
    <Tag
      title="Merge request state"
      classes={['btn-primary', 'state-tag']}
      styles={tagStyle({ name: theme.name, state: MR_STATE[mrState] })}
      icon={
        mrState === MR_STATE.Opened ? (
          <AlertCircle style={{ marginRight: '0.2rem' }} />
        ) : (
          <GitPullRequest style={{ marginRight: '0.2rem' }} />
        )
      }
      text={mrState}
    />
  )

  const BuildUpdatedAt = timeSinceUpdated && (
    <Tag
      classes={['normal-caps', 'details']}
      title={getTimeLabel('Build updated', buildUpdatedAt)}
      icon={<FontAwesomeIcon icon={faPencilAlt} color={sectionText} />}
      text={timeSinceUpdated}
    />
  )

  const BuildCreatedAt = timeSinceCreated && (
    <Tag
      text={timeSinceCreated}
      icon={<Calendar />}
      classes={['normal-caps', 'details']}
      title={getTimeLabel('Build created', buildCreatedAt)}
    />
  )

  const SharableBuildLink = ({ isBlock }) => (
    <AnchorLink target={`?build_id=${buildId}`} isBlock={isBlock}>
      <LinkIcon size={16} />
    </AnchorLink>
  )

  return (
    <>
      <div className="card-row expanded" style={{ color: sectionText }}>
        <div className="card-left-icon icon-top">
          <CommitIcon />
          {isLatestBuild && <SharableBuildLink isBlock />}
        </div>
        <div className="card-details">
          {isLatestBuild && (buildCommitId || mrState || mrDriver) && (
            <div className="card-details-row">
              {BuildCommit}

              {MrState}
              {MrDriver}
            </div>
          )}
          {isLatestBuild && buildBranch && (
            <div className="card-details-row">{BranchName}</div>
          )}
          {isLatestBuild && buildMessage && (
            <div className="card-details-row">{BuildMessage}</div>
          )}

          <div className="card-details-row" style={{ alignSelf: 'flex-start' }}>
            {!isLatestBuild && <SharableBuildLink isBlock={false} />}
            <div>{`Build ${buildShortId || buildId}`}</div>

            {BuildStateTag}
            {BuildDriver}
            {BuildUpdatedAt}
            {BuildCreatedAt}
            {isLatestBuild && nOlderBuilds > 0 && <ShownBuildsButton showingAllBuilds={showingAllBuilds} toggleShowingAllBuilds={toggleShowingAllBuilds} nOlderBuilds={nOlderBuilds} />}
          </div>
        </div>
        {isLatestBuild && (
          <div className="card-right-container">
            {BuildLogs}
            {GithubLink}
          </div>
        )}
      </div>
      {/* TODO: Condition to show artifacts of older builds */}
      {showingArtifacts
        && getIsArr(buildHasArtifacts)
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
