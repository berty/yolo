import React from "react";
import { container, header } from "./ErrorDisplay.module.css";

const ErrorDisplay = ({ error = {}, children }) => {
  const errorStatus =
    error && error.status > 0 && error.statusText
      ? `Error ${error.status}: ${error.statusText}`
      : "Error:";
  return (
    <div className={container}>
      <span className={header}>{errorStatus}</span>
      {<p>{error.humanMessage}</p>}
      {children}
    </div>
  );
};

export default ErrorDisplay;
