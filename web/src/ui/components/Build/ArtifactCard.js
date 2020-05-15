import React, {
  useContext,
} from 'react'
import {
  Clock,
  Calendar,
  Link as LinkIcon,
} from 'react-feather'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFile,
  faHammer,
} from '@fortawesome/free-solid-svg-icons'
import { ThemeContext } from '../../../store/ThemeStore'

import { tagStyle } from '../../styleTools/buttonStyler'
import { getArtifactKindIcon } from '../../styleTools/brandIcons'

import { KIND_TO_PLATFORM } from '../../../constants'
import { getTimeDuration, getRelativeTime } from '../../../util/date'

import './Build.scss'
import AnchorLink from '../AnchorLink/AnchorLink'
import Tag from '../../Tag/Tag'
import ArtifactActionButton from './ArtifactActionButton'

const ArtifactCard = ({
  artifact,
  buildMergeUpdatedAt,
  buildStartedAt,
  buildFinishedAt,
  buildShortId,
}) => {
  const { theme } = useContext(ThemeContext)
  const {
    id: artifactId = '',
    state: artifactState = '',
    plist_signed_url: artifactPlistSignedUrl = '',
    dl_artifact_signed_url: artifactDlArtifactSignedUrl = '',
    kind: artifactKind = '',
    local_path: artifactLocalPath = '',
    file_size: artifactFileSize = '',
    driver: artifactDriver = '',
  } = artifact

  const timeSinceBuildUpdated = getRelativeTime(buildMergeUpdatedAt)
  const buildDurationSeconds = getTimeDuration(buildStartedAt, buildFinishedAt)
  const buildDurationShort = buildDurationSeconds
    ? `${parseInt(buildDurationSeconds / 60, 10)} minutes`
    : ''
  const buildDurationDetails = buildDurationSeconds > 0
    ? `duration: ${parseInt(buildDurationSeconds / 60, 10)}m${
      buildDurationSeconds % 60
    }s`
    : ''
  const timeSinceBuildUpdatedString = `updated: ${buildMergeUpdatedAt}`


  const ArtifactKindName = KIND_TO_PLATFORM[artifactKind] || 'Unknown OS'

  const artifactTagStyle = tagStyle({ name: theme.name, state: artifactState })
  const ArtifactStateTag = artifactState && (
    <Tag classes={['artifact-tag', 'state-tag']} styles={artifactTagStyle} text={artifactState} />
  )

  const ArtifactMainButton = (<ArtifactActionButton {...{ artifactState, artifactPlistSignedUrl, artifactDlArtifactSignedUrl }} />)

  const PlatformIcon = (
    <FontAwesomeIcon
      icon={getArtifactKindIcon(artifactKind.toString())}
      size="lg"
      color={theme.text.sectionText}
    />
  )

  const TimeSinceBuildUpdated = timeSinceBuildUpdated && (
    <Tag
      classes={['normal-caps', 'details']}
      title={timeSinceBuildUpdatedString}
      icon={(<Calendar />)}
      text={timeSinceBuildUpdated}
    />
  )

  const BuildDuration = buildDurationShort && (
    <Tag classes={['normal-caps', 'details']} title={buildDurationDetails || ''} icon={<Clock />} text={buildDurationShort} />
  )

  const ArtifactFileSize = artifactFileSize
    && !isNaN(parseInt(artifactFileSize, 10)) && (
      <Tag classes={['normal-caps', 'details']} title="File size">
        <FontAwesomeIcon icon={faFile} size="lg" />
        {Math.round(artifactFileSize / 1000)}
        {' '}
        kB
      </Tag>
  )

  const ArtifactLocalPathRow = artifactLocalPath && (
    <div className="card-details-row artifact-local-path">
      {artifactLocalPath}
    </div>
  )

  const ArtifactDriver = artifactDriver && (
    <Tag
      classes={['normal-caps', 'details']}
      title={`Artifact driver: ${artifactDriver}`}
    >
      <FontAwesomeIcon icon={faHammer} color={theme.text.sectionText} />
      <div>{artifactDriver}</div>
    </Tag>
  )

  const SharableArtifactLink = (
    <AnchorLink
      target={`?artifact_id=${artifactId}`}
    >
      <LinkIcon size={16} />
    </AnchorLink>
  )

  return (
    <React.Fragment key={artifactId}>
      <div
        className="card-row expanded"
        style={{ color: theme.text.sectionText }}
      >
        <div className="card-left-icon icon-top">
          {PlatformIcon}
          {/* {SharableArtifactLink} TODO: Add when API working for this */}
        </div>
        <div className="card-details">
          <div className="card-details-row">
            <div className="">
              {ArtifactKindName}
              {' '}
              {buildShortId || ''}
            </div>
            {ArtifactStateTag}
          </div>
          {ArtifactLocalPathRow}
          <div className="card-details-row">
            {TimeSinceBuildUpdated}
            {BuildDuration}
            {ArtifactFileSize}
            {ArtifactDriver}
          </div>
        </div>
        <div>{ArtifactMainButton}</div>
      </div>
    </React.Fragment>
  )
}

export default ArtifactCard
