export const strUpper = (val) =>
  val && typeof val === "string" ? val.toUpperCase() : "";

export const getSafeStr = (val) => (val && typeof val === "string" ? val : "");

export const equalsIgnoreCase = (str1, str2) =>
  strUpper(str1) === strUpper(str2);

export const getIsArray = (val) => val && Array.isArray(val);

export const isNonEmptyArray = (val) => getIsArray(val) && val.length >= 1;

export const isArrayWithMin = (val, min = 1) =>
  getIsArray(val) && val.length >= min;

export const getIsEmptyArr = (val) => getIsArray(val) && val.length === 0;

export const getIsObject = (val) => val && typeof val === "object";

export const getIsEmpty = (val) =>
  !val ||
  (getIsArray(val) && !val.length) ||
  (getIsObject(val) && !Object.keys(val).length);

export const singleItemToArray = (val) => (!getIsArray(val) ? [val] : val);

export const safeJsonParse = (val, fallback = {}) => {
  if (!!val) {
    try {
      const parsed = JSON.parse(val);
      return getIsArray(parsed) || getIsObject(parsed) ? parsed : fallback;
    } catch (e) {
      console.warn(`${e}`);
      return fallback;
    }
  }
  return fallback;
};

export const addOrRemoveFromArray = (val, array = []) =>
  !getIsArray(array)
    ? []
    : array.includes(val)
    ? array.filter((el) => el !== val)
    : [...array, val];
