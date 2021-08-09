import React, { useEffect, useRef, useState } from "react";
import { Lock } from "react-feather";
import { useHistory, useLocation } from "react-router-dom";
import { safeBase64 } from "../../../util/getters";

import styles from "./ApiKeyPrompt.module.css";
import { btnLg, primary } from "../../../assets/widget-snippets.module.css";
import cn from "classnames";
import Cookies from "js-cookie";

const ApiKeyPrompt = ({ failedKey, authIsPending, updateState }) => {
  const [formApiKey, updateFormApiKey] = useState("");

  const inputEl = useRef(null);

  const history = useHistory();
  const { search: locationSearch } = useLocation();

  useEffect(() => inputEl.current.focus());

  const onFormSubmit = (e) => {
    e.preventDefault();
    Cookies.set("apiKey", safeBase64.encode(formApiKey), { expires: 365 });
    updateState({
      needsRefresh: true,
      authIsPending: true,
    });
    inputEl.current.value = "";
    history.push({
      path: "/",
      search: locationSearch,
    });
  };
  useEffect(() => {
    inputEl.current.focus();
  });

  return (
    <section className={styles.container}>
      <Lock className={styles.icon} />
      <form className={styles.form} onSubmit={onFormSubmit}>
        <label>
          Enter an API key in the form of <pre>:PASSWORD</pre>
        </label>
        <input
          ref={inputEl}
          autoComplete="false"
          type="text"
          placeholder={`Current key: ${(failedKey && safeBase64.decode(failedKey)) || "no key set"}`}
          className={styles.input}
          onChange={(e) => {
            updateFormApiKey(e.target.value);
          }}
          disabled={authIsPending}
        />
        <button
          type="submit"
          className={cn(btnLg, primary, styles.button)}
          onClick={onFormSubmit}
          disabled={!formApiKey || authIsPending}
        >
          Update
        </button>
      </form>
    </section>
  );
};

export default ApiKeyPrompt;
