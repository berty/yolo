import * as actions from './actions.js';

export const KIND_TO_PLATFORM = {
  IPA: 'iOS',
  APK: 'Android',
  DMG: 'Mac OS',
  UNKNOWN: 'Unknown OS',
};

export const ARTIFACT_KIND_VALUE = {
  UnknownKind: '0',
  IPA: '1',
  APK: '2',
  DMG: '3',
};

export const ARTIFACT_KIND_TO_PLATFORM = {
  '0': 'Unknown OS',
  '1': 'iOS',
  '2': 'Android',
  '3': 'Mac OS',
};

export const ARTIFACT_VALUE_KIND = {
  '0': 'UnknownKind',
  '1': 'IPA',
  '2': 'APK',
  '3': 'DMG',
};

export const ARTIFACT_KINDS = Object.values(ARTIFACT_KIND_VALUE).map((kind) =>
  kind.toString()
);

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
