import React from "react";
import styles from "./Divider.module.css";

const DateDivider = ({ dividerText }) => {
  return (
    <div className={styles.hr}>
      <div className={styles.hrText}>
        <span className={styles.text}>{dividerText}</span>
      </div>
    </div>
  );
};

export default DateDivider;
