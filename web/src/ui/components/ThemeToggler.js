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

  const themeTogglerButtonStyle = {
    display: 'flex',
    flex: '1 0 auto',
    justifyContent: 'flex-end',
    marginRight: '0.5rem',
    marginLeft: 'auto',
    fontSize: '2rem',
  };

  return (
    <div
      style={themeTogglerButtonStyle}
      onClick={() => {
        return changeTheme(theme.name === 'light' ? 'dark' : 'light');
      }}
    >
      <div style={{display: 'inline', cursor: 'pointer'}}>
        {theme.name === 'light' ? '🌙' : '☀️'}
      </div>
    </div>
  );
};

export default ThemeToggler;
