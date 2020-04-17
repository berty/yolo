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

  return (
    <div
      className="btn btn-primary btn-sm"
      onClick={() => {
        return changeTheme(theme.name === 'light' ? 'dark' : 'light');
      }}
    >
      {theme.name === 'light' ? '🌙' : '☀️'}
    </div>
  );
};

export default ThemeToggler;
