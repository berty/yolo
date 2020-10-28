/* eslint-disable import/no-named-as-default */
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * BEWARE ⚠️
 *
 * A container for many side effects
 *
 * The most important "feature" here:
 *     Query params in the URL bar
 *     are parsed and stored in global state,
 *     AND are used directly to make an API request.
 *
 * Tell ekelen to refactor me
 */

import Cookies from "js-cookie";
// import _ from "lodash";
import React, { useContext, useEffect, useState } from "react";
import {
  useRedirectOnEmptyQuery,
  useRequestOnQueryChange,
  useSetFiltersOnQueryChange,
} from "../../../hooks/queryHooks";
import { useRecursiveTimeout } from "../../../hooks/useRecursiveTimeout";
import { GlobalContext } from "../../../store/GlobalStore";
import ApiKeyPrompt from "../../components/ApiKeyPrompt/ApiKeyPrompt";
import Feed from "../../components/Feed/Feed";
import ErrorDisplay from "../../components/ErrorDisplay/ErrorDisplay";
import FilterModal from "../../components/FilterModal/FilterModal";
import ProtocolDisclaimer from "../../components/ProtocolDisclaimer";
import ShowFilterModalButton from "../../components/ShowFilterModalButton/ShowFilterModalButton";
import Spinner from "../../components/Spinner/Spinner";
import pageStyles from "../Page.module.css";
import { faded } from "../../../assets/modal-snippets.module.css";

const Home = () => {
  const { state, updateState } = useContext(GlobalContext);
  const [disclaimerAccepted, acceptDisclaimer] = useState(true);

  // Hide protocol warning popup
  const onAcceptDisclaimer = () => {
    Cookies.set("disclaimerAccepted", 1, { expires: 21 });
    acceptDisclaimer(true);
  };

  // Show protocol warning modal + agreement on component render
  useEffect(() => {
    acceptDisclaimer(!!Cookies.get("disclaimerAccepted"));
  }, []);

  useRedirectOnEmptyQuery();
  useSetFiltersOnQueryChange();
  useRequestOnQueryChange();

  // Fetch data every 10 sec if state.autoRefeshOn is true
  useRecursiveTimeout(() => {
    if (
      state.autoRefreshOn &&
      !state.showingFilterModal &&
      disclaimerAccepted
    ) {
      updateState({
        needsRefresh: true,
      });
    }
  }, 10 * 1000);

  useEffect(() => {
    if (state.showingFilterModal) {
      document.body.style.position = "fixed";
    } else {
      document.body.style.position = "initial";
    }
  }, [state.showingFilterModal]);

  const Main = () => (
    <main className={pageStyles.container}>
      {state.error && <ErrorDisplay error={state.error} />}
      {state.error && state.error.status === 401 && (
        <ApiKeyPrompt
          failedKey={Cookies.get("apiKey")}
          updateState={updateState}
          authIsPending={state.authIsPending}
        />
      )}
      {!state.error && <Feed builds={state.builds} loaded={state.isLoaded} />}
    </main>
  );

  return (
    <>
      <>
        <Main />
        {!disclaimerAccepted && (
          <ProtocolDisclaimer closeAction={onAcceptDisclaimer} />
        )}
        <ShowFilterModalButton
          onClick={() => updateState({ showingFilterModal: true })}
          isAuthed={state.isAuthed}
          isLoaded={state.isLoaded}
          showingFilterModal={state.showingFilterModal}
        />

        {state.showingFilterModal && state.isAuthed && (
          <FilterModal
            closeAction={() => updateState({ showingFilterModal: false })}
            needsFilterColors
          />
        )}
        {!state.isLoaded && (
          <>
            <div
              className={faded}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
            <Spinner />
          </>
        )}
      </>
      {/* TODO: Footer */}
    </>
  );
};

// Home.whyDidYouRender = true

export default Home;
