/* eslint-disable no-nested-ternary */
import axios from "axios";
import queryString from "query-string";
import { baseMockRequest } from "./mock";

const baseRequest = ({ apiKey = "", queryObject = {}, locationQuery = "" }) => {
  const options = {
    method: "get",
    baseURL: `${process.env.API_SERVER}/api/build-list`,
    params: { ...queryObject, ...locationQuery },
    paramsSerializer: (params) => queryString.stringify(params),
    headers: {
      Authorization: `Basic ${apiKey}`,
    },
  };
  return axios(options);
};

export const getBuildList = ({ apiKey = "", queryObject, locationQuery }) =>
  process.env.YOLO_UI_TEST === "true"
    ? baseMockRequest()
    : baseRequest({ apiKey, queryObject, locationQuery });

export const validateError = ({ error }) => {
  const { message: axiosMessage } = error.toJSON();
  const {
    response: { data: customTopLevelMessage = "", status, statusText } = {
      data: "",
      status: 0,
      statusText: "",
    },
  } = error || {};
  const {
    response: {
      data: { message: customNestedMessage } = { data: { message: "" } },
    },
  } = error || {};
  const humanMessage =
    typeof customTopLevelMessage === "string"
      ? customTopLevelMessage
      : typeof customNestedMessage === "string"
      ? customNestedMessage
      : axiosMessage;
  return {
    humanMessage,
    status,
    statusText,
  };
};
