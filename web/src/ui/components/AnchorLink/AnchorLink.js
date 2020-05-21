import React, { useState, useContext } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import classNames from 'classnames'

import { useLocation } from 'react-router-dom'
import styles from './AnchorLink.module.scss'
import { ThemeContext } from '../../../store/ThemeStore'

const AnchorLink = ({ children, target, isBlock = true }) => {
  const [confirmCopyMessage, setConfirmCopyMessage] = useState('')
  const {
    theme: {
      text: { blockTitle },
    },
  } = useContext(ThemeContext)
  const confirmationPopupClass = classNames(
    'badge',
    'badge-secondary',
    styles.badge,
  )
  const iconClasses = classNames(styles['copy-link-icon'], { [styles.block]: isBlock })
  const location = useLocation()

  return (
    <div className={iconClasses} style={{ color: blockTitle }}>
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

export default AnchorLink
