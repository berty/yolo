import axios from 'axios';
import {response as mockResponse} from '../assets/faker.js';

const baseMockRequest = () =>
  Promise.resolve(mockResponse).then(async (response) => {
    await new Promise((r) => setTimeout(r, 200));
    return await response;
  });

const baseRequest = ({platformId, apiKey}) =>
  axios.get(
    `${process.env.API_SERVER}/api/build-list?artifact_kinds=${platformId}&`,
    {
      headers: apiKey
        ? {
            Authorization: `Basic ${apiKey}`,
          }
        : {},
    }
  );

export const getData = ({platformId, apiKey}) =>
  process.env.YOLO_UI_TEST === 'true'
    ? baseMockRequest()
    : baseRequest({platformId, apiKey});

export const validateError = ({error}) => {
  const {message: axiosMessage} = error.toJSON();
  const {
    response: {data: customTopLevelMessage = '', status, statusText} = {
      data: '',
      status: 0,
      statusText: '',
    },
  } = error || {};
  const {
    response: {data: {message: customNestedMessage} = {data: {message: ''}}},
  } = error || {};
  const humanMessage =
    typeof customTopLevelMessage === 'string'
      ? customTopLevelMessage
      : typeof customNestedMessage === 'string'
      ? customNestedMessage
      : axiosMessage;
  return {
    humanMessage,
    status,
    statusText,
  };
};
