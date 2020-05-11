import React, {useContext} from 'react';
import {ThemeContext} from '../../store/ThemeStore';

const ThemeToggler = () => {
  const {theme, changeTheme} = useContext(ThemeContext);

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
