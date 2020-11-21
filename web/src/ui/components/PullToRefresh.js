import Cookies from "js-cookie";
import React, { useContext } from "react";
import { PullToRefresh } from "react-js-pull-to-refresh";
import { useLocation } from "react-router-dom";
import { requestBuilds } from "../../api";
import { GlobalContext, userAgent } from "../../store/GlobalStore";
import { sleep } from "../../util/misc";
import ConditionallyWrappedComponent from "./ConditionallyWrappedComponent";

export const PullToRefreshWrapper = ({ children }) => {
  const { state, updateState } = useContext(GlobalContext);
  const { search: locationSearch } = useLocation();

  function onRefreshHandler() {
    requestBuilds({
      updateState,
      locationSearch,
      apiKey: Cookies.get("apiKey"),
    });
    return sleep(600);
  }

  return (
    <>
      <ConditionallyWrappedComponent
        condition={
          (userAgent === "iOS" || userAgent === "Android") &&
          !!Cookies.get("disclaimerAccepted") &&
          !state.showingFilterModal
        }
        wrapper={(children) => (
          <PullToRefresh
            onRefresh={onRefreshHandler}
            pullDownThreshold={40}
            triggerHeight={200}
          >
            <div className="rootInner">{children}</div>
          </PullToRefresh>
        )}
      >
        {children}
      </ConditionallyWrappedComponent>
    </>
  );
};
