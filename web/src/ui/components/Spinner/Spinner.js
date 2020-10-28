import React from "react";
import styles from "./Spinner.module.css";

const Spinner = () => {
  return (
    <div className={styles.spinner}>
      <div className={styles.bounce1} />
      <div className={styles.bounce2} />
      <div className={styles.bounce3} />
    </div>
  );
};

export default Spinner;

/**
 * Spinner credit: https://github.com/tobiasahlin/SpinKit
 */
