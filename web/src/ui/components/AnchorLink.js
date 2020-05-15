import React from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'

const AnchorLink = ({
  tooltipMessage,
  setTooltipMessage,
  children,
  target,
}) => (
  <>
    <div className="copy-link-icon">
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

export default AnchorLink
