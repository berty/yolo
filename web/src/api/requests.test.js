/**
 * Test uses real data from server (since that is useful).
 * $YOLO_APP_PW and $REACT_APP_API_SERVER needs to be set locally or in .env.dev
 */

// import _ from 'lodash'
import { BUILD_STATE_VALUE_TO_NAME } from "../constants";
import { buildListRequest, ping } from "./requests";
const { resolve } = require("path");

require("dotenv").config({ path: resolve(__dirname, "../../.env") });

describe("ping", () => {
  it("gets 200 from server ping", () =>
    ping({
      apiKey: `${btoa(process.env.REACT_APP_SECRET_API_KEY)}`,
    }).then((res) => expect(res.status).toEqual(200)));
});

describe("buildListRequest", () => {
  it("gets a list of builds", () =>
    buildListRequest({
      apiKey: `${btoa(process.env.REACT_APP_SECRET_API_KEY)}`,
    }).then((res) => {
      expect(res).toHaveProperty("data.builds");
      expect(Array.isArray(res.data.builds)).toBeTruthy();
    }));
  it("gets one build if limit is 1", () =>
    buildListRequest({
      apiKey: `${btoa(process.env.REACT_APP_SECRET_API_KEY)}`,
      queryObject: { limit: 1 },
    }).then((res) => {
      expect(res).toHaveProperty("data.builds");
      expect(res.data.builds).toHaveLength(1);
    }));
  it("gives us human readable values for build state that front has mapping for", () =>
    buildListRequest({
      apiKey: `${btoa(process.env.REACT_APP_SECRET_API_KEY)}`,
      queryObject: { build_state: 2 },
    }).then((res) => {
      expect(res).toHaveProperty("data.builds");
      expect(
        res.data.builds.every((b) => b.state === BUILD_STATE_VALUE_TO_NAME[2])
      ).toBeTruthy();
    }));
  // ...whatever other build-list api requests we want to test on the front for some reason
});
