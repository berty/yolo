import React from "react";
import { Sliders } from "react-feather";
import { onAccessibleClickHandler } from "../../../util/browser";
import { button, buttonIcon } from "./ShowFilterModalButton.module.css";

const ShowFilterModalButton = ({
  onClick,
  showingFilterModal,
  isAuthed,
  isLoaded,
}) => {
  return (
    <button
      className={button}
      disabled={showingFilterModal || !isAuthed || !isLoaded}
      onClick={
        showingFilterModal || !isAuthed || !isLoaded
          ? undefined
          : onAccessibleClickHandler(onClick)
      }
    >
      <Sliders className={buttonIcon} />
    </button>
  );
};

export default ShowFilterModalButton;
