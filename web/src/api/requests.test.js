/**
 * Test uses real data from server (since that is useful).
 * $YOLO_APP_PW and $API_SERVER needs to be set locally or in .env.dev
 */

import _ from "lodash";
import { buildListRequest, ping } from "./requests";
const { resolve } = require("path");

require("dotenv").config({ path: resolve(__dirname, "../../.env.dev") });

describe("ping", () => {
  it("gets 200 from server ping", () =>
    ping({ apiKey: `${btoa(process.env.YOLO_APP_PW)}` }).then((res) =>
      expect(res.status).toEqual(200)
    ));
});

describe("buildListRequest", () => {
  it("gets a list of builds", () =>
    buildListRequest({
      apiKey: `${btoa(process.env.YOLO_APP_PW)}`,
    }).then((res) => expect(res).toHaveProperty("data.builds")));
  // ...whatever other build-list api requests we want to test on the front for some reason
});

// WIP
// Was going to be used to implement handling of truncated MR blocks
// (if not all builds for oldest MR are fetched)
// but now I think the better solution is just to ungroup the last MR block
// (so they are just listed as individual builds)
describe("buildListRequest with parameters", () => {
  let mrIdWithMultipleBuilds = "";
  let buildList = null;
  beforeEach((done) => {
    buildListRequest({ apiKey: `${btoa(process.env.YOLO_APP_PW)}` })
      .then((res) => {
        buildList = _.get(res, "data.builds", []);
      })
      .catch(() => null)
      .finally(() => {
        if (!buildList) console.log("[INFO] No builds, test not useful.");
        done();
      });
  });
  afterEach(() => {
    buildList = null;
    mrIdWithMultipleBuilds = null;
  });
  it("gets only builds with specified merge request ID if passed mergerequest_id as query param", (done) => {
    if (!buildList) buildList = [];
    const mrIds = buildList
      .map((b) => b.has_mergerequest_id)
      .filter((mrId) => !!mrId);
    mrIdWithMultipleBuilds = mrIds.find(
      (mrId) => mrIds.filter((id) => id === mrId).length > 1
    );
    buildListRequest({
      apiKey: `${btoa(process.env.YOLO_APP_PW)}`,
      queryObject: {
        mergerequest_id: mrIdWithMultipleBuilds,
      },
    })
      .then((res) => {
        buildList = _.get(res, "data.builds", []);
        expect(
          buildsList.every(
            (b) =>
              b.has_mergerequest_id ===
              someValidMergeRequestIdWithMultipleBuilds
          )
        );
      })
      .catch(() => null)
      .finally(() => {
        if (!buildList) console.log("[INFO]: No builds, test not useful.");
        done();
      });
  });
});
