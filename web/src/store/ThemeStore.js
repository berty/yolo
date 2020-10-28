import React, { useEffect, useState } from "react";

export const ThemeContext = React.createContext();

const detectBrowserTheme = () => {
  const isLight =
    window.matchMedia("(prefers-color-scheme)") &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  return isLight ? "light" : "dark";
};

export const ThemeStore = ({ children }) => {
  const [theme, setTheme] = useState(null);

  const changeTheme = (newThemeName) => {
    setTheme(newThemeName === "light" ? "light" : "dark");
  };

  useEffect(() => {
    if (!theme) {
      const themePreference =
        window.localStorage.getItem("theme") || detectBrowserTheme();
      setTheme(themePreference);
    } else {
      window.localStorage.setItem("theme", theme);
      document.body.setAttribute(
        "data-theme",
        theme === "light" ? "light" : "dark"
      );
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
