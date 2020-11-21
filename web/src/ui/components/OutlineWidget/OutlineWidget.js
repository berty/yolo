import cn from "classnames";
import React from "react";
import { onAccessibleClickHandler } from "../../../util/browser";
import styles from "./OutlineWidget.module.css";

const Icon = ({ iconComponent, iconCollapses }) => {
  return (
    iconComponent && (
      <div
        className={cn(styles.iconArea, iconCollapses && styles.iconCollapses)}
      >
        {iconComponent}
      </div>
    )
  );
};

const Text = ({ text, textIsUnderneath, textCollapses }) => {
  const textClass = () =>
    cn([
      styles.widgetTextArea,
      textIsUnderneath && styles.textIsUnderneath,
      textCollapses && styles.textCollapses,
    ]);
  return (
    text && (
      <p className={textClass()}>
        {text.length <= 30 ? text : text.slice(0, 30) + "..."}
      </p>
    )
  );
};

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
  onClick = undefined,
}) => {
  const validTitle = title || text || "";
  const role = interactive ? "button" : null;
  const tabIndex = interactive ? 0 : null;

  const containerClass = cn([
    styles.widgetWrapper,
    notImplemented && styles.notImplemented,
    interactive && styles.interactive,
    typeof selected !== "undefined" &&
      (selected ? styles.selected : styles.unselected),
  ]);

  return (
    <div
      className={containerClass}
      title={validTitle}
      role={role}
      onClick={onAccessibleClickHandler(onClick)}
      onKeyDown={onAccessibleClickHandler(onClick)}
      tabIndex={tabIndex}
    >
      <Icon {...{ iconComponent, iconCollapses }} />
      <Text {...{ text, textIsUnderneath, textCollapses }} />
    </div>
  );
};

export default OutlineWidget;
