import { faFile, faHammer, faQrcode } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import QRCode from 'qrcode.react'
import React, { useContext, useState } from 'react'
import {
  Calendar, Clock, Link as LinkIcon, ArrowDownCircle,
} from 'react-feather'
import {
  ARTIFACT_KIND_NAMES, ARTIFACT_KIND_TO_PLATFORM, ARTIFACT_KIND_VALUE,
} from '../../../constants'
import { ThemeContext } from '../../../store/ThemeStore'
import { getRelativeTime, getTimeDuration } from '../../../util/date'
import { getArtifactKindIcon } from '../../styleTools/brandIcons'
import AnchorLink from '../AnchorLink/AnchorLink'
import QRCodeModal from '../QRCodeModal'
import Tag from '../Tag/Tag'
import './Build.scss'
import { primaryButtonColors } from '../../styleTools/buttonStyler'

const ArtifactRowKindIcon = ({ color, kind = '' }) => (
  <FontAwesomeIcon
    icon={getArtifactKindIcon(kind)}
    color={color}
    title={`Artifact kind: ${ARTIFACT_KIND_NAMES[kind]}`}
    size="lg"
    style={{ marginRight: '0.5rem', marginTop: kind === ARTIFACT_KIND_NAMES.APK && '0.1rem' }}
  />
)

const QrCode = ({ artifactPlistSignedUrl, closeAction }) => (
  <QRCodeModal closeAction={closeAction}>
    <QRCode
      value={`itms-services://?action=download-manifest&url=${process.env.API_SERVER}${artifactPlistSignedUrl}`}
      renderAs="svg"
    />
  </QRCodeModal>
)

const ArtifactDownloadButton = ({
  artifactPlistSignedUrl = '',
  artifactDlArtifactSignedUrl = '',
}) => {
  const { theme } = useContext(ThemeContext)
  const fullPlistSignedUrl = artifactPlistSignedUrl
    && `itms-services://?action=download-manifest&url=${process.env.API_SERVER}${artifactPlistSignedUrl}`
  const fullDlArtifactSignedUrl = artifactDlArtifactSignedUrl && `${process.env.API_SERVER}${artifactDlArtifactSignedUrl}`
  const hasDlUrl = fullPlistSignedUrl || fullDlArtifactSignedUrl

  return (hasDlUrl
    && (
      <a
        href={hasDlUrl}
        className="btn btn-large-icon"
        style={{
          ...primaryButtonColors(theme), width: '2.6rem', height: '2.6rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title={hasDlUrl}
      >
        <ArrowDownCircle style={{ transform: 'scale(120%)' }} />
      </a>
    )
  )
}

const ArtifactQrButton = ({ onClick, theme }) => (
  <div
    onClick={onClick}
    className="btn btn-large-icon"
    style={{
      ...primaryButtonColors(theme), width: '2.6rem', height: '2.6rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
    title="Show QR code"
  >
    <FontAwesomeIcon icon={faQrcode} size="2x" color={theme.text.btnPrimary} style={{ marginTop: 0, marginBottom: 0, transform: 'scale(90%)' }} />
  </div>
)

const ArtifactKindName = ({ artifactKind }) => <div style={{ marginRight: '0.4rem' }}>{ARTIFACT_KIND_TO_PLATFORM[ARTIFACT_KIND_VALUE[artifactKind]] || 'Unknown OS'}</div>

const BuildIdentifier = ({ buildShortId }) => <div>{`#${buildShortId}` || ''}</div>

const TimeSinceBuildUpdated = ({ buildMergeUpdatedAt }) => {
  const timeSinceBuildUpdated = getRelativeTime(buildMergeUpdatedAt)
  return (timeSinceBuildUpdated && (
    <Tag
      classes={['normal-caps', 'details']}
      title={buildMergeUpdatedAt && `updated: ${buildMergeUpdatedAt}`}
      icon={<Calendar />}
      text={timeSinceBuildUpdated}
    />
  ))
}


const BuildDuration = ({ buildStartedAt, buildFinishedAt }) => {
  const buildDurationSeconds = getTimeDuration(buildStartedAt, buildFinishedAt)
  const buildDurationShort = buildDurationSeconds
    ? `${parseInt(buildDurationSeconds / 60, 10)} minutes`
    : ''
  const buildDurationDetails = buildDurationSeconds > 0
    ? `duration: ${parseInt(buildDurationSeconds / 60, 10)}m${
      buildDurationSeconds % 60
    }s`
    : ''
  return buildDurationShort && (
    <Tag
      classes={['normal-caps', 'details']}
      title={buildDurationDetails || ''}
      icon={<Clock />}
      text={buildDurationShort}
    />
  )
}

const ArtifactFileSize = ({ artifactFileSize }) => artifactFileSize
  && !Number.isNaN(parseInt(artifactFileSize, 10)) && (
    <Tag classes={['normal-caps', 'details']} title="File size">
      <FontAwesomeIcon icon={faFile} size="lg" />
      {Math.round(artifactFileSize / 1000)}
      {' '}
      kB
    </Tag>
)

const ArtifactLocalPathRow = ({ artifactLocalPath }) => artifactLocalPath && (
  <div className="block-details-row artifact-local-path">
    <small>{artifactLocalPath}</small>
  </div>
)

const ArtifactDriver = ({ artifactDriver, theme }) => artifactDriver && (
  <Tag
    classes={['normal-caps', 'details']}
    title={`Artifact driver: ${artifactDriver}`}
  >
    <FontAwesomeIcon icon={faHammer} color={theme.text.sectionText} />
    <div>{artifactDriver}</div>
  </Tag>
)

const SharableArtifactLink = ({ artifactId, implemented = false }) => implemented && (
  <AnchorLink target={`?artifact_id=${artifactId}`}>
    <LinkIcon size={16} />
  </AnchorLink>
)

const ArtifactRow = ({
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
    plist_signed_url: artifactPlistSignedUrl = '',
    dl_artifact_signed_url: artifactDlArtifactSignedUrl = '',
    kind: artifactKind = '',
    local_path: artifactLocalPath = '',
    file_size: artifactFileSize = '',
    driver: artifactDriver = '',
  } = artifact

  return (
    <React.Fragment key={artifactId}>
      {showingQrModal && artifactPlistSignedUrl && (
        <QrCode artifactPlistSignedUrl={artifactPlistSignedUrl} closeAction={() => toggleShowQrModal(false)} />
      )}

      <div
        className="block-row expanded"
        style={{ color: theme.text.sectionText }}
      >
        <div className="block-left-icon icon-top">
          <SharableArtifactLink {...{ artifactId }} implemented={false} />
        </div>
        <div className="block-details">
          <div className="block-details-row">
            <ArtifactRowKindIcon color={theme.bg.tagGreen} kind={artifactKind} />
            <ArtifactKindName {...{ artifactKind }} />
            <BuildIdentifier {...{ buildShortId }} />
          </div>
          <ArtifactLocalPathRow {...{ artifactLocalPath }} />
          <div className="block-details-row">
            <TimeSinceBuildUpdated {...{ buildMergeUpdatedAt }} />
            <BuildDuration {...{ buildStartedAt, buildFinishedAt }} />
            <ArtifactFileSize {...{ artifactFileSize }} />
            <ArtifactDriver {...{ artifactDriver, theme }} />
          </div>
        </div>
        <div className="block-right-container">
          <ArtifactDownloadButton
            {...{ artifactPlistSignedUrl, artifactDlArtifactSignedUrl }}
          />
          {artifactPlistSignedUrl && <ArtifactQrButton theme={theme} onClick={() => toggleShowQrModal(true)} />}
        </div>
      </div>
    </React.Fragment>
  )
}

export default ArtifactRow
