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

export {actions};
