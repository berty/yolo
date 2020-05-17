export const getStrUpperCase = (val) => val && typeof val === 'string' ? val.toUpperCase() : ''

export const getHasKey = (val, key) => val && typeof val === 'object' && typeof key === 'string' && key in val

export const getStrEquNormalized = (str1, str2) => getStrUpperCase(str1)
  && getStrUpperCase(str2)
  && getStrUpperCase(str1) === getStrUpperCase(str2)
