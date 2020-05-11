import React from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';

const AnchorLink = ({
  tooltipMessage,
  setTooltipMessage,
  location,
  children,
  target,
}) => {
  return (
    <>
      <div className="copy-artifact-to-clipboard-icon">
        {tooltipMessage && (
          <div className="badge badge-secondary confirm-copy">
            {tooltipMessage}
          </div>
        )}
        <CopyToClipboard
          text={`${window.location.protocol}//${window.location.host}${location.pathname}${location.search}#${target}`}
          title="Copy link to clipboard"
          onCopy={() => {
            setTooltipMessage('Link copied');
            setTimeout(() => setTooltipMessage(''), 1000);
          }}
        >
          {children}
        </CopyToClipboard>
      </div>
    </>
  );
};

export default AnchorLink;
