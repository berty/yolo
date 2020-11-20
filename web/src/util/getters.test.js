/**
 * Test uses real data from server (since that is useful).
 * $YOLO_APP_PW and $REACT_APP_API_SERVER needs to be set locally or in .env.dev
 */

import { safeBase64, safeJsonParse } from "./getters";

const { resolve } = require("path");

require("dotenv").config({ path: resolve(__dirname, "../../.env") });

describe("parses JSON with no error", () => {
  it("gives fallback with null", () => {
    expect(safeJsonParse(null, [])).toEqual([]);
  });
  it("returns fallback if undefined", () => {
    expect(safeJsonParse(undefined, [])).toEqual([]);
  });
  it("returns fallback if get object literal and expect array", () => {
    expect(safeJsonParse({ a: 1, b: 2 }, [])).toEqual([]);
  });
  it("returns fallback if get array and expect object literal", () => {
    expect(safeJsonParse([1, 2], {})).toEqual({});
  });
});

describe("base64 encode decode", () => {
  it("decoding does not throw for falsy or wide vals", () => {
    expect(() =>
      [undefined, null, 0, false, "", [], "😎"].map((val) =>
        safeBase64.decode(val)
      )
    ).not.toThrow();
  });
  it("encoding does not throw for falsy or wide vals", () => {
    expect(() =>
      [undefined, null, 0, false, "", [], "😎"].map((val) =>
        safeBase64.encode(val)
      )
    ).not.toThrow();
  });
});
