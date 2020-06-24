
/**
 * Test uses real data from server (since that is useful).
 * $YOLO_APP_PW and $API_SERVER needs to be set locally or in .env.dev
 */

import _ from 'lodash'
import { buildListRequest, ping } from './requests'
const { resolve } = require('path')

require('dotenv').config({ path: resolve(__dirname, '../../.env.dev') })

describe('ping', () => {
  it('gets 200 from server ping', () =>
    ping({ apiKey: `${btoa(process.env.YOLO_APP_PW)}` })
      .then((res) => expect(res.status).toEqual(200))
  )
})

describe('buildListRequest', () => {
  it('gets a list of builds', () =>
    buildListRequest({ apiKey: `${btoa(process.env.YOLO_APP_PW)}` })
      .then((res) => expect(res).toHaveProperty('data.builds'))
  )
  // ...whatever other build-list api requests we want to test on the front for some reason
})
