import { BUILD_STATE, ARTIFACT_STATE, MR_STATE } from "../../constants";
import widgetStyles from "../../assets/widget-snippets.module.css";
import cn from "classnames";

export const getTagColorStyle = ({ state = "", noBackground = false }) => {
  const colorNames = {
    [ARTIFACT_STATE.Finished]: "success",
    [ARTIFACT_STATE.Error]: "fail",
    [BUILD_STATE.Passed]: "success",
    [BUILD_STATE.Failed]: "fail",
    [BUILD_STATE.Running]: "warn",
    [BUILD_STATE.Building]: "warn",
    [MR_STATE.Merged]: "merged",
    [MR_STATE.Closed]: "closed",
    [MR_STATE.Opened]: "open",
  };

  const styleClass = noBackground ? widgetStyles.noFill : widgetStyles.filled;
  return colorNames[state]
    ? cn(styleClass, widgetStyles[colorNames[state]])
    : cn(styleClass, widgetStyles.fallback);
};
