import React, { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Link } from "react-feather";
import { useLocation } from "react-router-dom";
import styles from "./AnchorLink.module.css";

const AnchorLink = ({ target }) => {
  const [confirmCopyMessage, setConfirmCopyMessage] = useState("");
  const location = useLocation();

  return (
    <div
      title={`Copy to clipboard: ${window.location.protocol}//${window.location.host}${location.pathname}${target}`}
      className={styles.container}
    >
      {confirmCopyMessage && (
        <div className={styles.badge}>{confirmCopyMessage}</div>
      )}
      <CopyToClipboard
        text={`${window.location.protocol}//${window.location.host}${location.pathname}${target}`}
        title={`Copy to clipboard: ${window.location.protocol}//${window.location.host}${location.pathname}${target}`}
        onCopy={() => {
          setConfirmCopyMessage("Link copied");
          setTimeout(() => setConfirmCopyMessage(""), 1000);
        }}
      >
        <Link className={styles.link} />
      </CopyToClipboard>
    </div>
  );
};

export default AnchorLink;
