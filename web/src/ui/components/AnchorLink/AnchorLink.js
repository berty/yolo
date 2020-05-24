import React, { useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import classNames from 'classnames'

import { useLocation } from 'react-router-dom'
import styles from './AnchorLink.module.scss'
import withTheme from '../../helpers/withTheme'

const AnchorLink = ({
  children, target, isBlock = true, ...injectedProps
}) => {
  const [confirmCopyMessage, setConfirmCopyMessage] = useState('')
  const {
    themeStyles,
  } = injectedProps
  const confirmationPopupClass = classNames(
    'badge',
    'badge-secondary',
    styles.badge,
  )
  const iconClasses = classNames(styles['copy-link-icon'], { [styles.block]: isBlock })
  const location = useLocation()

  return (
    <div className={iconClasses} style={themeStyles.textBlockTitle}>
      {confirmCopyMessage && (
        <div className={confirmationPopupClass}>{confirmCopyMessage}</div>
      )}
      <CopyToClipboard
        text={`${window.location.protocol}//${window.location.host}${location.pathname}${target}`}
        title="Copy link to clipboard"
        onCopy={() => {
          setConfirmCopyMessage('Link copied')
          setTimeout(() => setConfirmCopyMessage(''), 1000)
        }}
      >
        {children}
      </CopyToClipboard>
    </div>
  )
}

export default withTheme(AnchorLink)
