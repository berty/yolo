import React, {
  useContext, useState, useRef, useEffect,
} from 'react'
import {
  GitCommit, GitPullRequest, AlertCircle, Calendar, Link as LinkIcon,
} from 'react-feather'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import {
  faAlignLeft,
  faHammer,
  faPencilAlt,
  faFile,
} from '@fortawesome/free-solid-svg-icons'
import classNames from 'classnames'

import { ThemeContext } from '../../../store/ThemeStore'

import { tagStyle } from '../../styleTools/buttonStyler'
import ArtifactCard from './ArtifactCard'

import { MR_STATE, BUILD_STATE } from '../../../constants'
import { getRelativeTime, getTimeLabel } from '../../../util/date'

import './Build.scss'
import AnchorLink from '../AnchorLink'

const BuildAndMergeRequest = ({ build, mr, isDetailed }) => {
  const [messageExpanded, toggleMessageExpanded] = useState(true)
  const [tooltipMessage, setTooltipMessage] = useState('')

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
    completed_at: buildCompletedAt = '',
    updated_at: buildUpdatedAt = '',
    driver: buildDriver = '',
    has_mergerequest: buildHasMr = null,
    has_project: buildHasProject = null,
    has_project: { id: buildProjectUrl = '' } = {},
    has_artifacts: buildHasArtifacts = null,
  } = build

  const {
    commit_url: mrCommitUrl = '',
    updated_at: buildMergeUpdatedAt = '',
    driver: mrDriver = '',
    state: mrState = '',
  } = mr || {}

  const COMMIT_LEN = 7
  const MESSAGE_LEN = 280
  const timeSinceUpdated = getRelativeTime(buildUpdatedAt)
  const timeSinceCreated = getRelativeTime(buildCreatedAt)

  const colorInteractiveText = {
    color: blockTitle,
  }

  const colorPlainText = {
    color: sectionText,
  }

  const iconLeftClass = (rotate = false) => classNames('card-left-icon', 'icon-top', { 'rotate-merge': !!rotate })

  const CommitIcon = mrCommitUrl ? (
    <a
      href={mrCommitUrl}
    >
      <GitCommit color={blockTitle} title={buildCommitId || ''} />
    </a>
  ) : !buildHasMr ? (
    <GitCommit color={sectionText} style={{ transform: 'rotate(90deg)' }} />
  ) : (
    <GitCommit color={sectionText} title={buildCommitId || ''} />
  )

  const SplitMessage = (text) => text
    .split('\n')
    .filter((x) => !!x)
    .map((x, i) => (<p className="build-message-line" key={i}>{x}</p>))

  const BuildMessage = !buildMessage ? (
    ''
  ) : buildMessage.length < MESSAGE_LEN
    ? SplitMessage(buildMessage)
    : messageExpanded ? (
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

  const BuildState = !buildState ? (
    ''
  ) : buildState === BUILD_STATE.Passed ? (
    <div
      title={buildId || 'Build state'}
      className="btn btn-primary btn-sm state-tag"
      style={tagStyle({
        name: theme.name,
        state: BUILD_STATE[buildState],
        cursor: 'pointer',
      })}
      onClick={buildId ? () => (window.location = buildId) : () => { }}
    >
      {buildState}
    </div>
  ) : (
    <div
      title="Build state"
      className="btn btn-primary btn-sm state-tag"
      style={tagStyle({ name: theme.name, state: BUILD_STATE[buildState] })}
    >
      {buildState}
    </div>
  )

  const BuildLogs = (
    <a href={buildId}>
      <FontAwesomeIcon
        icon={faAlignLeft}
        color={sectionText}
        size="2x"
        title={buildId}
      />
    </a>
  )

  const GithubLink = buildHasProject && buildProjectUrl && (
    <a href={buildProjectUrl}>
      <FontAwesomeIcon
        icon={faGithub}
        color={sectionText}
        size="2x"
        title={buildProjectUrl}
      />
    </a>
  )

  const BuildCommit = buildCommitId && (
    <div title={buildCommitId}>
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
    <div
      className="btn btn-sm normal-caps details"
      title={`Build driver: ${buildDriver}`}
    >
      <FontAwesomeIcon icon={faHammer} color={sectionText} />
      {`Build driver: ${buildDriver}`}
    </div>
  )

  const MrDriver = mrDriver && (
    <div
      className="btn btn-sm normal-caps details"
      title={`Merge request driver: ${mrDriver}`}
    >
      <FontAwesomeIcon icon={faHammer} color={sectionText} />
      {mrDriver}
    </div>
  )

  const MrState = mrState && (
    <div
      title="Merge request state"
      className="btn btn-primary btn-sm state-tag"
      style={tagStyle({ name: theme.name, state: MR_STATE[mrState] })}
    >
      {mrState === MR_STATE.Opened ? <AlertCircle /> : <GitPullRequest />}
      {mrState}
    </div>
  )

  const BuildUpdatedAt = timeSinceUpdated && (
    <div
      className="btn btn-sm normal-caps details"
      title={getTimeLabel('Build updated', buildUpdatedAt)}
    >
      <FontAwesomeIcon icon={faPencilAlt} color={sectionText} />
      {timeSinceUpdated}
    </div>
  )

  const BuildCreatedAt = timeSinceCreated && (
    <div
      className="btn btn-sm normal-caps details"
      title={getTimeLabel('Build created', buildCreatedAt)}
    >
      <Calendar />
      {timeSinceCreated}
    </div>
  )

  const SharableBuildLink = (
    <AnchorLink
      tooltipMessage={tooltipMessage}
      setTooltipMessage={setTooltipMessage}
      target={`?build_id=${buildId}`}
    >
      <LinkIcon size={16} />
    </AnchorLink>
  )

  return (
    <>
      <div className="card-row expanded" style={{ color: sectionText }}>
        <div className="card-left-icon icon-top">
          {CommitIcon}
          {SharableBuildLink}
        </div>
        <div className="card-details">
          {isDetailed && (buildCommitId || mrState || mrDriver) && (
            <div className="card-details-row">
              {BuildCommit}

              {MrState}
              {MrDriver}
            </div>
          )}
          {isDetailed && buildBranch && (
            <div className="card-details-row">{BranchName}</div>
          )}
          {isDetailed && buildMessage && (
            <div className="card-details-row">{BuildMessage}</div>
          )}

          <div className="card-details-row" style={{ alignSelf: 'flex-start' }}>
            {!isDetailed && <div>{`Build ${buildShortId || buildId}`}</div>}
            {BuildState}
            {BuildDriver}
            {BuildUpdatedAt}
            {BuildCreatedAt}
          </div>
        </div>
        {isDetailed && (
          <div className="card-build-actions">
            {BuildLogs}
            {GithubLink}
          </div>
        )}
      </div>
      {buildHasArtifacts
        && buildHasArtifacts.map((artifact) => (
          <ArtifactCard
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

export default BuildAndMergeRequest
