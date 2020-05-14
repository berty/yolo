import React, { useContext } from 'react'
import classNames from 'classnames'
import {
  ArrowDownCircle, AlertTriangle,
} from 'react-feather'

import { ThemeContext } from '../../../store/ThemeStore'
import { actionButtonStyle } from '../../styleTools/buttonStyler'
import { ARTIFACT_STATE } from '../../../constants'

const ArtifactActionButton = ({
  artifactState = '',
  artifactPlistSignedUrl = '',
  artifactDlArtifactSignedUrl = '',
}) => {
  const { theme } = useContext(ThemeContext)
  const artifactActionButtonStyle = actionButtonStyle({
    name: theme.name,
    state: artifactState,
  })
  const fullPlistSignedUrl = artifactPlistSignedUrl
    && `itms-services://?action=download-manifest&url=${process.env.API_SERVER}${artifactPlistSignedUrl}`
  const fullDlArtifactSignedUrl = artifactDlArtifactSignedUrl && `${process.env.API_SERVER}${artifactDlArtifactSignedUrl}`
  const hasDlUrl = fullPlistSignedUrl || fullDlArtifactSignedUrl

  const actionButtonClasses = classNames('btn', 'btn-artifact-action')

  const DownloadButton = artifactState === ARTIFACT_STATE.Finished && hasDlUrl
    && (
      <a
        href={hasDlUrl}
        className={actionButtonClasses}
        style={artifactActionButtonStyle}
        title={hasDlUrl}
      >
        <ArrowDownCircle />
      </a>
    )

  const AlertDisplayButton = artifactState === ARTIFACT_STATE.Error && (
    <div className={actionButtonClasses} style={artifactActionButtonStyle}>
      <AlertTriangle />
    </div>
  )

  return DownloadButton || AlertDisplayButton
}

export default ArtifactActionButton
