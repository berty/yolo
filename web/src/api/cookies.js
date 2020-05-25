import Cookies from 'js-cookie'

export const retrieveAuthCookie = () => Cookies.get('apiKey')

export const setAuthCookie = ({ apiKey }) => {
  Cookies.set('apiKey', apiKey, { expires: 7 })
}

export const removeAuthCookie = () => {
  Cookies.remove('apiKey')
}
