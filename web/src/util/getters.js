export const getStrUpperCase = (val) => val && typeof val === 'string' ? val.toUpperCase() : ''

export const getHasKey = (val, key) => val && typeof val === 'object' && typeof key === 'string' && key in val

export const getStrEquNormalized = (str1, str2) => getStrUpperCase(str1)
  && getStrUpperCase(str2)
  && getStrUpperCase(str1) === getStrUpperCase(str2)

export const getIsArr = (val) => val && Array.isArray(val)
export const getIsArrayWithN = (val, n) => getIsArr(val) && val.length >= n
const getIsObject = (val) => val && typeof val === 'object'
export const getIsEmpty = (val) => !val || (getIsArr(val) && !val.length) || (getIsObject(val) && !Object.keys(val).length)
