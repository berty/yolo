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

  return (
    <div
      className="btn btn-sm btn-small"
      style={{cursor: 'pointer'}}
      onClick={() => changeTheme(theme.name === 'light' ? 'dark' : 'light')}
    >
      {theme.name === 'light'
        ? '🌙 Switch to dark theme'
        : '☀️ Use light theme'}
    </div>
  );
};

export default ThemeToggler;
