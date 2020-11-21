import Cookies from "js-cookie";
import queryString from "query-string";
import { useCallback, useContext, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { requestBuilds } from "../api";
import { GlobalContext, INITIAL_STATE } from "../store/GlobalStore";
import { getUiFiltersFromUrlQuery } from "../store/globalStoreHelpers";
import { safeJsonParse, uniq } from "../util/getters";

export const useRedirectHome = () => {
  const history = useHistory();
  const redirectHome = useCallback(
    () => history.push({ path: "/", search: "" }),
    [history]
  );
  return { redirectHome };
};

/**
 * Adds query params to URL bar if there are none
 * Hacky; also sets userAgent and stores to global state
 */
export const useRedirectOnEmptyQuery = () => {
  const { search: locationSearch } = useLocation();

  const history = useHistory();

  useEffect(
    () => {
      if (!locationSearch) {
        const fallbackQueryString =
          window.localStorage.getItem("lastNonEmptyRequest") ||
          queryString.stringify(INITIAL_STATE.uiFilters);

        history.push({
          pathname: "/",
          search: fallbackQueryString,
        });
      }
    },
    // TODO: Refactor to follow hook rules
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locationSearch]
  );
};

/**
 * Call API if query in URL bar changes and state.needsRefresh is true
 */
export const useRequestOnQueryChange = () => {
  const {
    state: { needsRefresh },
    updateState,
  } = useContext(GlobalContext);
  const { search: locationSearch } = useLocation();

  useEffect(() => {
    if (locationSearch && needsRefresh) {
      requestBuilds({
        updateState,
        locationSearch,
        apiKey: Cookies.get("apiKey"),
      });
    }
    // TODO: Refactor to follow hook rules
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch, needsRefresh]);
};

/**
 * Parse URL query params for filters so we can update the UI
 */
export const useSetFiltersOnQueryChange = () => {
  const { updateState } = useContext(GlobalContext);
  const { search: locationSearch } = useLocation();

  useEffect(() => {
    if (locationSearch) {
      const uiFilters = getUiFiltersFromUrlQuery({ locationSearch });

      const availableBranchNames = uniq([
        "master",
        ...safeJsonParse(window.localStorage.getItem("branchNames"), []),
        ...uiFilters.branch,
      ]);

      window.localStorage.setItem("lastNonEmptyRequest", locationSearch);
      window.localStorage.setItem(
        "branchNames",
        JSON.stringify(availableBranchNames)
      );
      updateState({
        uiFilters,
      });
    }
    // TODO: Bad; refactor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch]);
};
