import React, { useContext, useState } from 'react'
import { Clock, Calendar, Link as LinkIcon } from 'react-feather'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile, faHammer, faQrcode } from '@fortawesome/free-solid-svg-icons'
import QRCode from 'qrcode.react'

import { ThemeContext } from '../../../store/ThemeStore'

import { tagStyle } from '../../styleTools/buttonStyler'
import { getArtifactKindIcon } from '../../styleTools/brandIcons'

import { KIND_TO_PLATFORM } from '../../../constants'
import { getTimeDuration, getRelativeTime } from '../../../util/date'

import './Build.scss'
import AnchorLink from '../AnchorLink/AnchorLink'
import Tag from '../Tag/Tag'
import ArtifactActionButton from './ArtifactActionButton'
import QRCodeModal from '../QRCodeModal'

const ArtifactCard = ({
  artifact,
  buildMergeUpdatedAt,
  buildStartedAt,
  buildFinishedAt,
  buildShortId,
}) => {
  const { theme } = useContext(ThemeContext)
  const [showingQrModal, toggleShowQrModal] = useState(false)
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

  const ArtifactKindName = () => <div>{KIND_TO_PLATFORM[artifactKind] || 'Unknown OS'}</div>

  const artifactTagStyle = tagStyle({ name: theme.name, state: artifactState })
  const ArtifactStateTag = () => artifactState && (
    <Tag
      classes={['artifact-tag', 'state-tag']}
      styles={artifactTagStyle}
      text={artifactState}
    />
  )

  const ArtifactMainButton = () => (
    <ArtifactActionButton
      {...{
        artifactState,
        artifactPlistSignedUrl,
        artifactDlArtifactSignedUrl,
      }}
    />
  )

  const PlatformIcon = () => (
    <FontAwesomeIcon
      icon={getArtifactKindIcon(artifactKind.toString())}
      size="lg"
      color={theme.text.sectionText}
    />
  )

  const BuildIdentifier = () => <div>{buildShortId || ''}</div>

  const TimeSinceBuildUpdated = timeSinceBuildUpdated && (
    <Tag
      classes={['normal-caps', 'details']}
      title={timeSinceBuildUpdatedString}
      icon={<Calendar />}
      text={timeSinceBuildUpdated}
    />
  )

  const BuildDuration = buildDurationShort && (
    <Tag
      classes={['normal-caps', 'details']}
      title={buildDurationDetails || ''}
      icon={<Clock />}
      text={buildDurationShort}
    />
  )

  const ArtifactFileSize = artifactFileSize
    && !Number.isNaN(parseInt(artifactFileSize, 10)) && (
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

  const SharableArtifactLink = ({ implemented = false }) => implemented && (
    <AnchorLink target={`?artifact_id=${artifactId}`}>
      <LinkIcon size={16} />
    </AnchorLink>
  )

  const QrCode = () => (
    <QRCodeModal closeAction={() => toggleShowQrModal(false)}>
      <QRCode
        value={`itms-services://?action=download-manifest&url=${process.env.API_SERVER}${artifactPlistSignedUrl}`}
        renderAs="svg"
      />
    </QRCodeModal>
  )

  const ArtifactQrButton = () => (
    <div
      onClick={() => toggleShowQrModal(true)}
      className="btn btn-large-icon"
      title="Show QR code"
    >
      <FontAwesomeIcon icon={faQrcode} size="2x" color={theme.text.blockTitle} />
    </div>
  )

  return (
    <React.Fragment key={artifactId}>
      {showingQrModal && artifactPlistSignedUrl && (
        <QrCode />
      )}

      <div
        className="card-row expanded"
        style={{ color: theme.text.sectionText }}
      >
        <div className="card-left-icon icon-top">
          <SharableArtifactLink implemented={false} />
        </div>
        <div className="card-details">
          <div className="card-details-row">
            <PlatformIcon />
            <ArtifactKindName />
            <BuildIdentifier />
            <ArtifactStateTag />
          </div>
          {ArtifactLocalPathRow}
          <div className="card-details-row">
            {TimeSinceBuildUpdated}
            {BuildDuration}
            {ArtifactFileSize}
            {ArtifactDriver}
          </div>
        </div>
        <div className="card-right-container">
          {/* TODO: Factor out */}
          <ArtifactMainButton />
          {artifactPlistSignedUrl && <ArtifactQrButton />}
        </div>
      </div>
    </React.Fragment>
  )
}

export default ArtifactCard
