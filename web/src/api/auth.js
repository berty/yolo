import Cookies from 'js-cookie';

export const retrieveAuthCookie = () => {
  return Cookies.get('apiKey');
};

export const setAuthCookie = ({apiKey}) => {
  Cookies.set('apiKey', btoa(apiKey), {expires: 7});
};

export const removeAuthCookie = () => {
  Cookies.remove('apiKey');
};
