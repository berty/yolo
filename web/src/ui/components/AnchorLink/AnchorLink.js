import React, { useState, useContext } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import './AnchorLink.scss'
import { ThemeContext } from '../../../store/ThemeStore'

const AnchorLink = ({
  children,
  target,
}) => {
  const [tooltipMessage, setTooltipMessage] = useState('')
  const { theme: { text: { blockTitle } } } = useContext(ThemeContext)
  return (
    <>
      <div className="copy-link-icon" style={{ color: blockTitle }}>
        {tooltipMessage && (
          <div className="badge badge-secondary confirm-copy">
            {tooltipMessage}
          </div>
        )}
        <CopyToClipboard
          text={`${window.location.protocol}//${window.location.host}${location.pathname}${target}`}
          title="Copy link to clipboard"
          onCopy={() => {
            setTooltipMessage('Link copied')
            setTimeout(() => setTooltipMessage(''), 1000)
          }}
        >
          {children}
        </CopyToClipboard>
      </div>
    </>
  )
}

export default AnchorLink
