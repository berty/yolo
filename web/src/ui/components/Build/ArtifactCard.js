import React, {
  useContext, useState, useRef, useEffect,
} from 'react'
import {
  Clock,
  Calendar,
  ArrowDownCircle,
  AlertTriangle,
  Link as LinkIcon,
} from 'react-feather'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons'
import {
  faQuestionCircle,
  faFile,
  faHammer,
} from '@fortawesome/free-solid-svg-icons'
import { ThemeContext } from '../../../store/ThemeStore'

import { tagStyle, actionButtonStyle } from '../../styleTools/buttonStyler'

import { KIND_TO_PLATFORM, ARTIFACT_STATE } from '../../../constants'
import { getTimeDuration, getRelativeTime } from '../../../util/date'

import './Build.scss'
import AnchorLink from '../AnchorLink'

const ArtifactCard = ({
  artifact,
  buildMergeUpdatedAt,
  buildStartedAt,
  buildFinishedAt,
  buildShortId,
}) => {
  const { theme } = useContext(ThemeContext)

  // TODO: Factor out, duplicated in Build
  const [tooltipMessage, setTooltipMessage] = useState('')
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
  const artifactActionButtonStyle = actionButtonStyle({
    name: theme.name,
    state: artifactState,
  })

  const getArtifactActionButton = () => {
    switch (artifactState) {
      case ARTIFACT_STATE.Finished:
        return (
          <a
            href={
              artifactPlistSignedUrl
                ? `itms-services://?action=download-manifest&url=${process.env.API_SERVER}${artifactPlistSignedUrl}`
                : `${process.env.API_SERVER}${artifactDlArtifactSignedUrl}`
            }
            className="btn"
            style={artifactActionButtonStyle}
          >
            <ArrowDownCircle />
          </a>
        )
      case ARTIFACT_STATE.Error:
        return (
          <div className="btn" style={artifactActionButtonStyle}>
            <AlertTriangle />
          </div>
        )
      default:
        return <></>
    }
  }

  const ArtifactActionButton = getArtifactActionButton()

  const PlatformIcon = (
    <FontAwesomeIcon
      icon={
        artifactKind === 'APK'
          ? faAndroid
          : artifactKind === 'DMG' || artifactKind === 'IPA'
            ? faApple
            : faQuestionCircle
      }
      size="lg"
      color={theme.text.sectionText}
    />
  )

  const ArtifactStateTag = !artifactState ? (
    <></>
  ) : (
    <div className="btn artifact-tag btn-sm state-tag" style={artifactTagStyle}>
      {artifactState}
    </div>
  )

  const TimeSinceBuildUpdated = timeSinceBuildUpdated && (
    <div
      className="btn normal-caps details"
      title={timeSinceBuildUpdatedString}
    >
      <Calendar />
      {timeSinceBuildUpdated}
    </div>
  )

  const BuildDuration = buildDurationShort && (
    <div className="btn normal-caps details" title={buildDurationDetails || ''}>
      <Clock />
      {buildDurationShort}
    </div>
  )

  const ArtifactFileSize = artifactFileSize
    && !isNaN(parseInt(artifactFileSize, 10)) && (
      <div className="btn normal-caps details" title="File size">
        <FontAwesomeIcon icon={faFile} size="lg" />
        {Math.round(artifactFileSize / 1000)}
        {' '}
        kB
      </div>
  )

  const ArtifactLocalPathRow = artifactLocalPath && (
    <div className="card-details-row artifact-local-path">
      {artifactLocalPath}
    </div>
  )

  const ArtifactDriver = artifactDriver && (
    <div
      className="btn normal-caps details"
      title={`Artifact driver: ${artifactDriver}`}
    >
      <FontAwesomeIcon icon={faHammer} color={theme.text.sectionText} />
      <div>{artifactDriver}</div>
    </div>
  )

  const SharableArtifactLink = (
    <AnchorLink
      tooltipMessage={tooltipMessage}
      setTooltipMessage={setTooltipMessage}
      target={`?artifact_id=${artifactId}`}
    >
      <LinkIcon size={16} />
    </AnchorLink>
  )

  return (
    <React.Fragment key={artifactId}>
      <div
        id={artifactId}
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
        <div className="card-build-actions">{ArtifactActionButton}</div>
      </div>
    </React.Fragment>
  )
}

export default ArtifactCard
