export const getStrUpperCase = (val) => (val && typeof val === 'string' ? val.toUpperCase() : '')

export const getHasKey = (val, key) => (val && typeof val === 'object' && typeof key === 'string' && key in val)

export const getSafeStr = (val) => val && typeof val === 'string' ? val : ''

export const getStrEquNormalized = (str1, str2) => (getStrUpperCase(str1)
  && getStrUpperCase(str2)
  && getStrUpperCase(str1) === getStrUpperCase(str2))

export const getIsArray = (val) => (val && Array.isArray(val))

export const getIsArrayWithN = (val, n = 1) => (getIsArray(val) && val.length >= n)

export const getIsEmptyArr = (val) => (getIsArray(val) && val.length === 0)

const getIsObject = (val) => (val && typeof val === 'object')

export const getIsEmpty = (val) => (!val || (getIsArray(val) && !val.length) || (getIsObject(val) && !Object.keys(val).length))

export const singleItemToArray = (val) => !getIsArray(val) ? [val] : val

export const addOrRemoveFromArray = (val, array) => array.includes(val) ? array.filter((el) => el !== val) : [...array, val]
