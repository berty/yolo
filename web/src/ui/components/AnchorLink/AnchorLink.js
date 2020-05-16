import React, { useState, useContext } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import classNames from "classnames";

import styles from "./AnchorLink.module.scss";
import { ThemeContext } from "../../../store/ThemeStore";

const AnchorLink = ({ children, target }) => {
  const [confirmCopyMessage, setConfirmCopyMessage] = useState("");
  const {
    theme: {
      text: { blockTitle },
    },
  } = useContext(ThemeContext);
  const confirmationPopupClass = classNames(
    "badge",
    "badge-secondary",
    styles.badge
  );

  return (
    <>
      <div className={styles["copy-link-icon"]} style={{ color: blockTitle }}>
        {confirmCopyMessage && (
          <div className={confirmationPopupClass}>{confirmCopyMessage}</div>
        )}
        <CopyToClipboard
          text={`${window.location.protocol}//${window.location.host}${location.pathname}${target}`}
          title="Copy link to clipboard"
          onCopy={() => {
            setConfirmCopyMessage("Link copied");
            setTimeout(() => setConfirmCopyMessage(""), 1000);
          }}
        >
          {children}
        </CopyToClipboard>
      </div>
    </>
  );
};

export default AnchorLink;
