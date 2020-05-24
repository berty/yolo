/* eslint-disable import/prefer-default-export */
import axios from 'axios'

/**
 * Serve a JSON document here
 * e.g. process.env.MOCK_DATA_FILE_ENDPOINT = 'localhost:8000/data.json'
 * { "JSON": { "builds": [...]}}
 */
export const mockBuildListRequest = () => axios.get(`${process.env.MOCK_DATA_FILE_ENDPOINT}`)
  .then(async (response) => {
    await new Promise((r) => setTimeout(r, 600))
    return response
  })
  .then((response) => {
    const result = response.data.JSON
    const { builds } = result
    return { data: { builds } }
  })
