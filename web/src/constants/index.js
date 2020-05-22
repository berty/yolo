import * as actions from './actions.js'

export const KIND_TO_PLATFORM = {
  IPA: 'iOS',
  APK: 'Android',
  DMG: 'Mac OS',
  UNKNOWN: 'Unknown OS',
}

export const ARTIFACT_KIND_VALUE = {
  UnknownKind: '0',
  IPA: '1',
  APK: '2',
  DMG: '3',
}

export const ARTIFACT_KIND_TO_PLATFORM = {
  0: 'Unknown OS',
  1: 'iOS',
  2: 'Android',
  3: 'Mac OS',
}

export const ARTIFACT_VALUE_KIND = {
  0: 'UnknownKind',
  1: 'IPA',
  2: 'APK',
  3: 'DMG',
}

export const ARTIFACT_KIND_NAMES = {
  UnknownKind: 'UnknownKind',
  IPA: 'IPA',
  APK: 'APK',
  DMG: 'DMG',
}

export const ARTIFACT_KINDS = Object.values(ARTIFACT_KIND_VALUE).map((kind) => kind.toString())

export const PROJECT = {
  chat: 'chat',
  'gomobile-ipfs-demo': 'gomobile-ipfs-demo',
}

export const PROJECTS = Object.values(PROJECT)

export const BUILD_DRIVER_VALUE = {
  UnknownDriver: '0',
  Buildkite: '1',
  CircleCI: '2',
  Bintray: '3',
  GitHub: '4',
}

export const BUILD_DRIVER_TO_NAME = {
  0: 'UnknownDriver',
  1: 'Buildkite',
  2: 'CircleCI',
  3: 'Bintray',
  4: 'GitHub',
}

export const BUILD_DRIVER_NAMES = {
  UnknownDriver: 'UnknownDriver',
  Buildkite: 'Buildkite',
  CircleCI: 'CircleCI',
  Bintray: 'Bintray',
  GitHub: 'GitHub',
}

export const BUILD_DRIVERS = Object.values(BUILD_DRIVER_VALUE)

export const PROJECT_BUILD_DRIVER = {
  chat: BUILD_DRIVER_VALUE.Buildkite,
  'gomobile-ipfs-demo': BUILD_DRIVER_VALUE.Bintray,
}

export const PROJECT_ARTIFACT_KINDS = {
  chat: [ARTIFACT_KIND_VALUE.IPA],
  'gomobile-ipfs-demo': [ARTIFACT_KIND_VALUE.APK, ARTIFACT_KIND_VALUE.IPA],
}

export const BRANCH = {
  MASTER: 'MASTER',
}

export const BRANCH_TO_DISPLAY_NAME = {
  MASTER: 'Master',
  DEVELOP: 'Development',
  ALL: 'All',
}

export const IMPLEMENTED_BRANCHES = ['ALL']

export const MR_STATE = {
  UnknownState: 'UnknownState',
  Opened: 'Opened',
  Closed: 'Closed',
}

export const BUILD_STATE = {
  UnknownState: 'UnknownState',
  Running: 'Running',
  Failed: 'Failed',
  Passed: 'Passed',
  Canceled: 'Canceled',
  Scheduled: 'Scheduled',
  Skipped: 'Skipped',
  NotRun: 'NotRun',
  Timedout: 'Timedout',
}

export const BUILD_STATE_VALUE = {
  UnknownState: '0',
  Running: '1',
  Failed: '2',
  Passed: '3',
  Canceled: '4',
  Scheduled: '5',
  Skipped: '6',
  NotRun: '7',
  Timedout: '8',
}

export const BUILD_STATE_VALUE_TO_NAME = {
  0: 'UnknownState',
  1: 'Running',
  2: 'Failed',
  3: 'Passed',
  4: 'Canceled',
  5: 'Scheduled',
  6: 'Skipped',
  7: 'NotRun',
  8: 'Timedout',
}

export const BUILD_STATES = Object.values(BUILD_STATE_VALUE)

export const ARTIFACT_STATE = {
  UnknownState: 'UnknownState',
  Finished: 'Finished',
  New: 'New',
  Error: 'Error',
  Deleted: 'Deleted',
}

export { actions }
