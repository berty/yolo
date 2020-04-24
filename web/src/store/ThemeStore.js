import React, {useState} from 'react';
import {themes} from '../ui/styleTools/themes';

export const ThemeContext = React.createContext();

export const ThemeStore = ({children}) => {
  const [theme, setTheme] = useState(themes.dark);
  const changeTheme = (newName) => {
    return setTheme(themes[newName] || themes.dark);
  };
  return (
    <ThemeContext.Provider value={{theme, changeTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};
