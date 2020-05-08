import axios from 'axios';

/**
 * Serve a JSON document here
 * e.g. process.env.MOCK_DATA_FILE_ENDPOINT = 'localhost:8000/data.json'
 * { "JSON": { "builds": [...]}}
 */
export const baseMockRequest = ({queryObject = {}, locationQuery = ''}) =>
  axios.get(`${process.env.MOCK_DATA_FILE_ENDPOINT}`).then((response) => {
    const result = response.data.JSON;
    const {builds} = result;
    return {data: {builds}};
  });
