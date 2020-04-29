import queryString from 'query-string';

const mockResponse = process.env.MOCK_DATA_PATH
  ? process.env.MOCK_DATA_PATH['JSON']
  : null;

export const baseMockRequest = ({queryObject = {}, locationQuery = ''}) =>
  Promise.resolve(mockResponse).then(async (response) => {
    // Uncomment to check search params
    // const formattedParams = queryString.stringify({
    //   ...queryObject,
    //   ...locationQuery,
    // });
    await new Promise((r) => setTimeout(r, 2000));
    return await response;
  });
