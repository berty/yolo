import axios from "axios";
import queryString from "query-string";

export const buildListRequest = ({ apiKey = "", queryObject = {} }) => {
  const options = {
    method: "get",
    baseURL: `${process.env.REACT_APP_API_SERVER}/api/build-list`,
    params: { ...queryObject },

    paramsSerializer: (params) => queryString.stringify(params),
    headers: {
      Authorization: `Basic ${apiKey}`,
    },
  };
  return axios(options);
};

export const ping = ({ apiKey = "" }) => {
  const options = {
    method: "get",
    baseURL: `${process.env.REACT_APP_API_SERVER}/api/ping`,
    headers: {
      Authorization: `Basic ${apiKey}`,
    },
  };
  return axios(options);
};
