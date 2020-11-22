import React from "react";
import { ChevronDown, ChevronUp } from "react-feather";
import {
  tagGhostUpper,
  tagLink,
} from "../../assets/widget-snippets.module.css";
import cn from "classnames";

const ShowingOlderBuildsTag = ({
  nOlderBuilds,
  showingAllBuilds = null,
  toggleShowingAllBuilds = null,
}) => {
  const multipleOlderBuilds = nOlderBuilds > 1;
  const isInteractive = !!toggleShowingAllBuilds;

  const messagePrefix = showingAllBuilds ? "hide" : "show";

  const message =
    nOlderBuilds > 0
      ? `${isInteractive ? messagePrefix : ""} ${nOlderBuilds} older build${
          multipleOlderBuilds ? "s" : ""
        }`
      : "";

  const Icon = () => (showingAllBuilds ? <ChevronUp /> : <ChevronDown />);

  return (
    message && (
      <div
        title={message}
        role={isInteractive ? "button" : "contentinfo"}
        className={cn(tagGhostUpper, isInteractive && tagLink)}
        onClick={
          !isInteractive
            ? undefined
            : () => toggleShowingAllBuilds(!showingAllBuilds)
        }
      >
        {isInteractive && <Icon />}
        <span>{message}</span>
      </div>
    )
  );
};

export default ShowingOlderBuildsTag;
