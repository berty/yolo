import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignLeft, faPencilAlt, faHammer } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import {
  GitCommit, AlertCircle, GitPullRequest, Calendar, Link as LinkIcon,
} from 'react-feather'
import { getRelativeTime, getTimeLabel } from '../../../util/date'
import ConditionallyWrappedComponent from '../ConditionallyWrappedComponent'
import { tagColorStyles } from '../../styleTools/buttonStyler'
import Tag from '../Tag/Tag'
import { MR_STATE } from '../../../constants'
import AnchorLink from '../AnchorLink/AnchorLink'
import styles from './Build.module.scss'

export const BranchName = ({ filterUnselected, buildBranch }) => buildBranch && (
  <div
    className={`btn ${styles.btnBranchName}`}
    style={{ backgroundColor: filterUnselected }}
  >
    {buildBranch}
  </div>
)

export const SharableBuildLink = ({ isBlock, buildId }) => (
  <AnchorLink target={`?build_id=${buildId}`} isBlock={isBlock}>
    <LinkIcon size={16} />
  </AnchorLink>
)

export const BuildUpdatedAt = ({ buildUpdatedAt, sectionText }) => {
  const timeSinceUpdated = getRelativeTime(buildUpdatedAt)
  return timeSinceUpdated && (
    <Tag
      title={getTimeLabel('Build updated', buildUpdatedAt)}
      icon={<FontAwesomeIcon icon={faPencilAlt} color={sectionText} />}
      text={timeSinceUpdated}
      plainDisplay
    />
  )
}

export const BuildLogs = ({ buildId, blockTitle }) => (
  <a href={buildId}>
    <FontAwesomeIcon
      icon={faAlignLeft}
      color={blockTitle}
      size="lg"
      title={buildId}
      style={{ marginBottom: '0.7rem' }}
    />
  </a>
)

export const GithubLink = ({ buildProjectUrl, blockTitle }) => buildProjectUrl && (
  <a href={buildProjectUrl}>
    <FontAwesomeIcon
      icon={faGithub}
      color={blockTitle}
      size="lg"
      title={buildProjectUrl}
    />
  </a>
)

export const BuildDriver = ({ buildDriver, sectionText }) => buildDriver && (
  <Tag
    title={`Build driver: ${buildDriver}`}
    icon={<FontAwesomeIcon icon={faHammer} color={sectionText} />}
    text={`${buildDriver}`}
    plainDisplay
  />
)

export const MrDriver = ({ mrDriver, sectionText }) => mrDriver && (
  <Tag
    title={`Merge request driver: ${mrDriver}`}
    icon={<FontAwesomeIcon icon={faHammer} color={sectionText} />}
    text={mrDriver}
    plainDisplay
  />
)

export const BuildCommit = ({ buildCommitId, mrCommitUrl, theme }) => {
  const COMMIT_LEN = 7
  return buildCommitId && (
    <div title={buildCommitId}>
      Commit
      {' '}
      <ConditionallyWrappedComponent
        condition={!!mrCommitUrl}
        wrapper={(children) => (
          <a
            href={mrCommitUrl}
            style={{ color: theme.text.blockTitle }}
          >
            {children}
          </a>
        )}
      >
        {buildCommitId.slice(0, COMMIT_LEN)}
      </ConditionallyWrappedComponent>
    </div>
  )
}

export const BuildCreatedAt = ({ buildCreatedAt }) => {
  const timeSinceCreated = getRelativeTime(buildCreatedAt)
  return timeSinceCreated && (
    <Tag
      text={timeSinceCreated}
      icon={<Calendar />}
      title={getTimeLabel('Build created', buildCreatedAt)}
      plainDisplay
    />
  )
}

export const MrState = ({ mrState, theme }) => mrState && (
  <Tag
    title="Merge request state"
    styles={tagColorStyles({ theme, state: MR_STATE[mrState] })}
  >
    {mrState === MR_STATE.Opened ? <AlertCircle /> : <GitPullRequest />}
    {mrState}
  </Tag>
)

export const CommitIcon = ({ theme, buildCommitId, mrCommitUrl }) => (
  <ConditionallyWrappedComponent
    condition={!!mrCommitUrl}
    wrapper={
      (children) => (
        <a href={mrCommitUrl} style={{ color: theme.text.blockTitle }}>
          {children}
        </a>
      )
    }
  >
    <GitCommit title={buildCommitId || ''} />
  </ConditionallyWrappedComponent>
)
