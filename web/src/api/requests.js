import axios from 'axios'
import queryString from 'query-string'

export const buildListRequest = ({ apiKey = '', queryObject = {}, locationQuery = '' }) => {
  const options = {
    method: 'get',
    baseURL: `${process.env.API_SERVER}/api/build-list`,
    params: { ...queryObject, ...locationQuery },
    paramsSerializer: (params) => queryString.stringify(params),
    headers: {
      Authorization: `Basic ${apiKey}`,
    },
  }
  return axios(options)
}
