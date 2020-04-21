import React, {useContext, useEffect} from 'react';
import {ThemeContext} from '../../store/ThemeStore';

const detectBrowserTheme = () => {
  const supportsPreference =
    window.matchMedia('(prefers-color-scheme)').media !== 'not all';
  const isDark =
    supportsPreference &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return {isDark};
};

const ThemeToggler = () => {
  const {theme, changeTheme} = useContext(ThemeContext);

  useEffect(() => {
    const {isDark} = detectBrowserTheme();
    if (isDark) changeTheme('dark');
  }, []);

  const buttonStyle = {
    display: 'flex',
    flex: '1 0 auto',
    justifyContent: 'flex-end',
    marginRight: '80px',
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
