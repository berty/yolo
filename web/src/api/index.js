import queryString from "query-string";
import { mockBuildListRequest } from "./mock";
import { buildListRequest } from "./requests";
import { validateError } from "./apiResponseTransforms";
import { sleep } from "../util/misc";

export const getBuildList = ({ apiKey = "", queryObject }) =>
  process.env.YOLO_UI_TEST === "true"
    ? mockBuildListRequest()
    : buildListRequest({ apiKey, queryObject });

export const requestBuilds = ({
  updateState = () => {},
  locationSearch = "",
  apiKey = "",
}) => {
  if (!locationSearch) {
    updateState({
      error: validateError({ message: "No query provided" }),
      isLoaded: true,
      needsRefresh: false,
      autoRefreshOn: false,
    });
    return Promise.resolve();
  }
  updateState({
    error: null,
    isLoaded: false,
    needsRefresh: false,
  });

  if (
    process.env.REACT_APP_LOCAL === "true" &&
    process.env.NODE_ENV === "development" &&
    window.localStorage.getItem("builds")
  ) {
    return sleep(600).then(() => {
      updateState({
        builds: JSON.parse(window.localStorage.getItem("builds")),
        error: null,
        isAuthed: true,
        isLoaded: true,
        authIsPending: false,
        resultSource: "localStorage",
      });
    });
  }

  return getBuildList({
    apiKey,
    queryObject: queryString.parse(locationSearch),
  })
    .then(
      (result) => {
        const { data: { builds = [] } = { builds: [] } } = result;
        updateState({
          builds,
          error: null,
          isAuthed: true,
          isLoaded: true,
          authIsPending: false,
          resultSource: "API request",
        });
        if (
          process.env.REACT_APP_LOCAL === "true" &&
          process.env.NODE_ENV === "development" &&
          !window.localStorage.getItem("builds")
        ) {
          window.localStorage.setItem("builds", JSON.stringify(builds));
        }
      },
      (error) => {
        const validatedError = validateError(error);
        const { status } = validatedError;
        updateState({
          error: validatedError,
          isAuthed: status !== 401,
          autoRefreshOn: false,
          isLoaded: true,
          authIsPending: false,
        });
      }
    )
    .finally(() => {
      updateState({
        isLoaded: true,
        authIsPending: false,
      });
    });
};
