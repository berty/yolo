import classNames from "classnames";
import React from "react";
import { onAccessibleClickHandler } from "../../../util/browser";
import styles from "./OutlineWidget.module.css";

const OutlineWidget = ({
  title = null,
  selected = undefined,
  interactive = true,
  notImplemented = false,
  textIsUnderneath = false,
  textCollapses = false,
  text = "",
  iconComponent = null,
  iconCollapses = false,
  icons = [],
  onClick = undefined,
}) => {
  const validTitle = title || text || "";
  const role = interactive ? "button" : null;
  const tabIndex = interactive ? 0 : null;

  const containerClass = classNames([
    styles.widgetWrapper,
    notImplemented && styles.notImplemented,
    interactive && styles.interactive,
    typeof selected !== "undefined" &&
      (selected ? styles.selected : styles.unselected),
  ]);

  const textClass = classNames([
    styles.widgetTextArea,
    textIsUnderneath && styles.textIsUnderneath,
    textCollapses && styles.textCollapses,
  ]);

  const iconClass = classNames([
    styles.iconArea,
    iconCollapses && styles.iconCollapses,
  ]);

  return (
    <div
      className={containerClass}
      title={validTitle}
      role={role}
      onClick={!onClick ? undefined : onAccessibleClickHandler(onClick)}
      onKeyDown={!onClick ? undefined : onAccessibleClickHandler(onClick)}
      tabIndex={tabIndex}
    >
      {iconComponent && <div className={iconClass}>{iconComponent}</div>}
      {icons && icons.length > 0 && <div className={iconClass}>{icons}</div>}
      {text && (
        <p className={textClass}>
          {text.length <= 30 ? text : text.slice(0, 30) + "..."}
        </p>
      )}
    </div>
  );
};

export default OutlineWidget;
