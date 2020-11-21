/**
 * Bundle these since they are used abundantly
 */

import keys from "lodash/keys";
import isPlainObject from "lodash/isPlainObject";
import pickBy from "lodash/pickBy";
import uniq from "lodash/uniq";
import values from "lodash/values";

export { isPlainObject, keys, pickBy, uniq, values };

export const isArray = Array.isArray;
export const toUpper = (val) =>
  val && typeof val === "string" ? val.toUpperCase() : "";
export const toString = (val) =>
  val === undefined || val === null ? "" : val.toString();
export const isString = (val) => typeof val === "string";
export const isNonEmptyString = (val) => isString(val) && val.length > 0;

const conditionOrFalse = (condition) => (val) => condition(val) && val;

export const stringOrFalse = conditionOrFalse(isString);

export const equalsIgnoreCase = (str1, str2) => toUpper(str1) === toUpper(str2);

export const isNonEmptyArray = (val) => isArray(val) && val.length >= 1;

export const isArrayWithMin = (val, min = 1) =>
  isArray(val) && val.length >= min;

export const isFalseyOrEmpty = (val) =>
  !val ||
  (isArray(val) && !val.length) ||
  (isPlainObject(val) && !Object.keys(val).length);

export const upsertToArray = (val) => (!isArray(val) ? [val] : val);

export const safeJsonParse = (val, fallback = {}) => {
  try {
    const parsed = JSON.parse(val);
    return !parsed
      ? fallback
      : isArray(fallback) !== isArray(parsed) ||
        isPlainObject(fallback) !== isPlainObject(parsed) ||
        typeof parsed !== typeof fallback
      ? fallback
      : parsed;
  } catch (e) {
    return fallback;
  }
};

export const safeBase64 = {
  decode: (val) => {
    try {
      return atob(val);
    } catch (e) {
      console.warn(e.toString());
      return "";
    }
  },
  encode: (val) => {
    try {
      return btoa(val);
    } catch (e) {
      console.warn(e.toString());
      return "";
    }
  },
};

export const addOrRemoveFromArray = (val, array = []) =>
  !isArray(array)
    ? []
    : array.includes(val)
    ? array.filter((el) => el !== val)
    : [...array, val];
