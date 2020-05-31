import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignLeft, faPencilAlt, faHammer } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import {
  GitCommit, AlertCircle, GitPullRequest, Calendar,
} from 'react-feather'
import { getRelativeTime, getTimeLabel } from '../../../util/date'
import ConditionallyWrappedComponent from '../ConditionallyWrappedComponent'
import { tagColorStyles } from '../../styleTools/buttonStyler'
import Tag from '../Tag/Tag'
import { MR_STATE } from '../../../constants'

export const BuildUpdatedAt = ({ buildUpdatedAt, sectionText }) => {
  const timeSinceUpdated = getRelativeTime(buildUpdatedAt)
  return timeSinceUpdated && (
    <Tag
      classes={['normal-caps', 'details']}
      title={getTimeLabel('Build updated', buildUpdatedAt)}
      icon={<FontAwesomeIcon icon={faPencilAlt} color={sectionText} />}
      text={timeSinceUpdated}
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
    classes={['normal-caps', 'details']}
    title={`Build driver: ${buildDriver}`}
    icon={<FontAwesomeIcon icon={faHammer} color={sectionText} />}
    text={`Build driver: ${buildDriver}`}
  />
)

export const MrDriver = ({ mrDriver, sectionText }) => mrDriver && (
  <Tag
    classes={['normal-caps', 'details']}
    title={`Merge request driver: ${mrDriver}`}
    icon={<FontAwesomeIcon icon={faHammer} color={sectionText} />}
    text={mrDriver}
  />
)

export const BuildCommit = ({ buildCommitId, mrCommitUrl, colorInteractiveText }) => {
  const COMMIT_LEN = 7
  return buildCommitId && (
    <div title={buildCommitId}>
      Commit
      {' '}
      <ConditionallyWrappedComponent
        condition={!!mrCommitUrl}
        wrapper={(children) => (
          <a href={mrCommitUrl} style={colorInteractiveText} className="interactive-text">
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
      classes={['normal-caps', 'details']}
      title={getTimeLabel('Build created', buildCreatedAt)}
    />
  )
}

export const MrState = ({ mrState, theme }) => mrState && (
  <Tag
    title="Merge request state"
    classes={['btn-primary', 'state-tag']}
    styles={tagColorStyles({ theme, state: MR_STATE[mrState] })}
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

export const CommitIcon = ({
  colorInteractiveText, buildCommitId, mrCommitUrl, buildHasMr,
}) => (
  <ConditionallyWrappedComponent
    condition={!!mrCommitUrl}
    wrapper={
        (children) => (
          <a href={mrCommitUrl} style={colorInteractiveText}>
            {children}
          </a>
        )
      }
  >
    <GitCommit title={buildCommitId || ''} style={buildHasMr ? {} : { transform: 'rotate(90deg)' }} />
  </ConditionallyWrappedComponent>
)
