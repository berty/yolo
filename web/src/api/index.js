import axios from 'axios';
import {response as mockResponse} from '../assets/faker.js';

const baseMockRequest = () =>
  Promise.resolve(mockResponse).then(async (response) => {
    await new Promise((r) => setTimeout(r, 200));
    return await response;
  });

const baseRequest = ({platformId, apiKey}) =>
  axios.get(
    `${process.env.API_SERVER}/api/build-list?artifact_kind=${platformId}&`,
    {
      headers: apiKey
        ? {
            Authorization: 'Basic ' + btoa(`${apiKey}`),
          }
        : {},
    }
  );

export const getData = ({platformId, apiKey}) =>
  process.env.YOLO_UI_TEST === 'true'
    ? baseMockRequest()
    : baseRequest({platformId, apiKey});
