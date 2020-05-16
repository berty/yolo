import React, { useContext } from "react";
import { ThemeContext } from "../../../store/ThemeStore";

import "./ErrorDisplay.scss";

const ErrorDisplay = ({ error }) => {
  const { theme } = useContext(ThemeContext);
  const ErrorStatus =
    error.status > 0 ? `Error ${error.status}: ${error.statusText}` : "Error:";
  return (
    <div className="ErrorDisplay">
      <h3 className="title" style={{ color: theme.text.sectionTitle }}>
        {ErrorStatus}
      </h3>
      <p className="" style={{ color: theme.text.sectionText }}>
        {error.humanMessage}
      </p>
    </div>
  );
};

export default ErrorDisplay;
