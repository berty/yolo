import { mockBuildListRequest } from './mock'
import { buildListRequest } from './requests'

export const getBuildList = ({ apiKey = '', queryObject, locationQuery }) => (process.env.YOLO_UI_TEST === 'true'
  ? mockBuildListRequest()
  : buildListRequest({ apiKey, queryObject, locationQuery }))
