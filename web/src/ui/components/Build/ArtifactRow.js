import { faFile, faHammer, faQrcode } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import QRCode from 'qrcode.react'
import React, { useContext, useState } from 'react'
import {
  ArrowDownCircle,
  Calendar,
  Clock,
  Link as LinkIcon,
} from 'react-feather'
import {
  ARTIFACT_KIND_NAMES,
  ARTIFACT_KIND_TO_PLATFORM,
  ARTIFACT_KIND_VALUE,
} from '../../../constants'
import { ThemeContext } from '../../../store/ThemeStore'
import { getRelativeTime, getTimeDuration } from '../../../util/date'
import { getArtifactKindIcon } from '../../styleTools/brandIcons'
import { primaryButtonColors } from '../../styleTools/buttonStyler'
import AnchorLink from '../AnchorLink/AnchorLink'
import QRCodeModal from '../QRCodeModal'
import Tag from '../Tag/Tag'
import styles from './Build.module.scss'

const ArtifactRowKindIcon = ({ color, kind = '' }) => (
  <FontAwesomeIcon
    icon={getArtifactKindIcon(kind)}
    color={color}
    title={`Artifact kind: ${ARTIFACT_KIND_NAMES[kind]}`}
    size="lg"
  />
)

const QrCode = ({ artifactPlistSignedUrl, closeAction }) => (
  <QRCodeModal closeAction={closeAction}>
    <QRCode
      value={`itms-services://?action=download-manifest&url=${process.env.API_SERVER}${artifactPlistSignedUrl}`}
      size={256}
      level="M"
      renderAs="svg"
      includeMargin
    />
  </QRCodeModal>
)

export const SharableArtifactLink = ({ buildId, artifactKind, isBlock }) => (
  <AnchorLink
    target={`?build_id=${buildId}&artifact_kinds=${
      ARTIFACT_KIND_VALUE[artifactKind.toString() || '1']
    }`}
    isBlock={isBlock}
  >
    <LinkIcon size={16} />
  </AnchorLink>
)

const ArtifactDownloadButton = ({
  artifactPlistSignedUrl = '',
  artifactDlArtifactSignedUrl = '',
}) => {
  const { theme } = useContext(ThemeContext)
  const fullPlistSignedUrl = artifactPlistSignedUrl
    && `itms-services://?action=download-manifest&url=${process.env.API_SERVER}${artifactPlistSignedUrl}`
  const fullDlArtifactSignedUrl = artifactDlArtifactSignedUrl
    && `${process.env.API_SERVER}${artifactDlArtifactSignedUrl}`
  const hasDlUrl = fullPlistSignedUrl || fullDlArtifactSignedUrl

  return (
    hasDlUrl && (
      <a
        href={hasDlUrl}
        className="btn btn-large-icon"
        style={{
          ...primaryButtonColors(theme),
          width: '2.6rem',
          height: '2.6rem',
          marginTop: '0.3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
      ...primaryButtonColors(theme),
      width: '2.6rem',
      height: '2.6rem',
      marginTop: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    title="Show QR code"
  >
    <FontAwesomeIcon
      icon={faQrcode}
      size="2x"
      color={theme.text.btnPrimary}
      style={{ marginTop: 0, marginBottom: 0, transform: 'scale(90%)' }}
    />
  </div>
)

const ArtifactKindName = ({ artifactKind }) => (
  <div style={{ marginRight: '0.4rem' }}>
    {ARTIFACT_KIND_TO_PLATFORM[ARTIFACT_KIND_VALUE[artifactKind]]
      || 'Unknown OS'}
  </div>
)

const BuildIdentifier = ({ buildShortId }) => (
  <div>{`#${buildShortId}` || ''}</div>
)

const TimeSinceBuildUpdated = ({ buildMergeUpdatedAt }) => {
  const timeSinceBuildUpdated = getRelativeTime(buildMergeUpdatedAt)
  return (
    timeSinceBuildUpdated && (
      <Tag
        title={buildMergeUpdatedAt && `updated: ${buildMergeUpdatedAt}`}
        icon={<Calendar />}
        text={timeSinceBuildUpdated}
        plainDisplay
      />
    )
  )
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
  return (
    buildDurationShort && (
      <Tag
        title={buildDurationDetails || ''}
        icon={<Clock />}
        text={buildDurationShort}
        plainDisplay
      />
    )
  )
}

const ArtifactFileSize = ({ artifactFileSize }) => artifactFileSize
  && !Number.isNaN(parseInt(artifactFileSize, 10)) && (
    <Tag title="File size" plainDisplay>
      <FontAwesomeIcon icon={faFile} size="lg" />
      {Math.round(artifactFileSize / 1000)}
      {' '}
      kB
    </Tag>
)

const ArtifactLocalPathRow = ({ artifactLocalPath }) => artifactLocalPath && (
<div className={styles.blockSectionDetailRow}>
  <small className={styles.artifactLocalPath}>{artifactLocalPath}</small>
</div>
)

const ArtifactDriver = ({ artifactDriver, theme }) => artifactDriver && (
<Tag title={`Artifact driver: ${artifactDriver}`} plainDisplay>
  <FontAwesomeIcon icon={faHammer} color={theme.text.sectionText} />
  <div>{artifactDriver}</div>
</Tag>
)

// const SharableArtifactLink = ({ artifactId, implemented = false }) => implemented && (
//   <AnchorLink target={`?artifact_id=${artifactId}`}>
//     <LinkIcon size={16} />
//   </AnchorLink>
// )

const ArtifactRow = ({
  artifact,
  buildId,
  buildMergeUpdatedAt,
  buildStartedAt,
  buildFinishedAt,
  buildShortId,
  isLastArtifactOfLatestBuild,
}) => {
  const { theme } = useContext(ThemeContext)
  const [showingQrModal, toggleShowQrModal] = useState(false)
  const {
    plist_signed_url: artifactPlistSignedUrl = '',
    dl_artifact_signed_url: artifactDlArtifactSignedUrl = '',
    kind: artifactKind = '',
    local_path: artifactLocalPath = '',
    file_size: artifactFileSize = '',
    driver: artifactDriver = '',
  } = artifact

  const containerBorderBottomStyle = isLastArtifactOfLatestBuild
    ? { borderBottom: 'none' }
    : {}

  return (
    <>
      {showingQrModal && artifactPlistSignedUrl && (
        <QrCode
          artifactPlistSignedUrl={artifactPlistSignedUrl}
          closeAction={() => toggleShowQrModal(false)}
        />
      )}

      <div
        className={styles.blockSectionContainer}
        style={{ color: theme.text.sectionText, ...containerBorderBottomStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.blockSectionLeftColumn}>
          <SharableArtifactLink {...{ artifactKind, buildId }} isBlock />
        </div>
        <div className={styles.blockSectionDetailContainer}>
          <div className={styles.blockSectionDetailRow}>
            <ArtifactRowKindIcon
              color={theme.bg.tagGreen}
              kind={artifactKind}
            />
            <ArtifactKindName {...{ artifactKind }} />
            <BuildIdentifier {...{ buildShortId }} />
            <SharableArtifactLink
              {...{ artifactKind, buildId }}
              isBlock={false}
            />
          </div>
          <ArtifactLocalPathRow {...{ artifactLocalPath }} />
          <div className={styles.blockSectionDetailRow}>
            <TimeSinceBuildUpdated {...{ buildMergeUpdatedAt }} />
            <BuildDuration {...{ buildStartedAt, buildFinishedAt }} />
            <ArtifactFileSize {...{ artifactFileSize }} />
            <ArtifactDriver {...{ artifactDriver, theme }} />
          </div>
        </div>
        <div className={styles.blockRightContainer}>
          <ArtifactDownloadButton
            {...{ artifactPlistSignedUrl, artifactDlArtifactSignedUrl }}
          />
          {artifactPlistSignedUrl && (
            <ArtifactQrButton
              theme={theme}
              onClick={() => toggleShowQrModal(true)}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default ArtifactRow
