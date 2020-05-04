import * as actions from './actions.js';

export const KIND_TO_PLATFORM = {
  IPA: 'iOS',
  APK: 'Android',
  DMG: 'Mac OS',
  UNKNOWN: 'Unknown OS',
};

export const PLATFORMS = {
  iOS: '1',
  android: '2',
  none: '3',
};

export const BRANCH = {
  MASTER: 'MASTER',
};

export const MR_STATE = {
  UnknownState: 'UnknownState',
  Opened: 'Opened',
  Closed: 'Closed',
};

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
};

export const ARTIFACT_STATE = {
  UnknownState: 'UnknownState',
  Finished: 'Finished',
  New: 'New',
  Error: 'Error',
  Deleted: 'Deleted',
};

export {actions};
