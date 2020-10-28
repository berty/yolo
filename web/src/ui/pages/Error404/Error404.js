import React from "react";
import { useHistory } from "react-router-dom";

import ErrorDisplay from "../../components/ErrorDisplay/ErrorDisplay";
import pageStyles from "../Page.module.css";
import { buttonArea, emoji, message } from "./Error404.module.css";
import { btnLg, primary } from "../../../assets/widget-snippets.module.css";
import cn from "classnames";

const Error404 = () => {
  const history = useHistory();

  return (
    <main className={pageStyles.container}>
      <ErrorDisplay error={{ status: 404, statusText: "Not found" }}>
        <span role="img" aria-label="oh no!" className={emoji}>
          😦
        </span>
        <p className={message}>{`We couldn't find the page you requested.`}</p>
        <div className={buttonArea}>
          <button
            className={cn(btnLg, primary)}
            onClick={() => history.goBack()}
            onKeyDown={() => history.goBack()}
            tabIndex={0}
          >
            Back
          </button>

          <button
            className={cn(btnLg, primary)}
            onClick={() => history.push("/")}
            onKeyDown={() => history.push("/")}
            tabIndex={0}
          >
            Home
          </button>
        </div>
      </ErrorDisplay>
    </main>
  );
};

export default Error404;
