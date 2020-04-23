import React, {useContext, useEffect} from 'react';
import {ThemeContext} from '../../store/ThemeStore';

const detectBrowserTheme = () => {
  const supportsPreference =
    window.matchMedia('(prefers-color-scheme)').media !== 'not all';
  const isLight =
    supportsPreference &&
    window.matchMedia('(prefers-color-scheme: light)').matches;
  return {isLight};
};

const ThemeToggler = () => {
  const {theme, changeTheme} = useContext(ThemeContext);

  useEffect(() => {
    const {isLight} = detectBrowserTheme();
    if (isLight) changeTheme('light');
  }, []);

  const buttonStyle = {
    display: 'flex',
    flex: '1 0 auto',
    justifyContent: 'flex-end',
    marginRight: '0.5rem',
    fontSize: '2rem',
    cursor: 'pointer',
  };

  return (
    <div
      style={buttonStyle}
      onClick={() => {
        return changeTheme(theme.name === 'light' ? 'dark' : 'light');
      }}
    >
      {theme.name === 'light' ? '🌙' : '☀️'}
    </div>
  );
};

export default ThemeToggler;
