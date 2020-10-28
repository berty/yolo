import React, { useState, useEffect, useMemo } from "react";
import { themes } from "../ui/styleTools/themes";

export const ThemeContext = React.createContext();

const detectBrowserTheme = () => {
  const supportsPreference =
    window.matchMedia("(prefers-color-scheme)") &&
    window.matchMedia("(prefers-color-scheme)").media !== "not all";
  const isLight =
    supportsPreference &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  return { isLight };
};

export const ThemeStore = ({ children }) => {
  const [theme, setTheme] = useState(themes.dark);

  const changeTheme = (newName) => {
    window.localStorage.setItem("theme", newName);
    setTheme(themes[newName] || themes.dark);
  };

  const themeStyles = useMemo(() => {
    const primaryButtonColors = {
      backgroundColor: theme.bg.btnPrimary,
      border: `1px solid ${theme.bg.btnPrimary}`,
      color: theme.text.btnPrimary,
      boxShadow: `0px 4px 0px ${theme.shadow.btnPrimary}`,
    };

    return {
      primaryButtonColors,
    };
  }, [theme]);

  const widgetStyles = useMemo(() => {
    const widgetBg = { backgroundColor: theme.bg.filter };
    const selectedWidgetAccent = { color: theme.icon.filterSelected };
    const unselectedWidgetAccent = { color: theme.icon.filterUnselected };
    const noStateWidgetAccent = { color: theme.text.sectionTitle };
    return {
      widgetBg,
      selectedWidgetAccent,
      unselectedWidgetAccent,
      noStateWidgetAccent,
    };
  }, [theme]);

  useEffect(() => {
    const lTheme = window.localStorage.getItem("theme");
    if (lTheme) {
      changeTheme(lTheme);
      return;
    }
    const { isLight } = detectBrowserTheme();
    if (isLight) changeTheme("light");
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        changeTheme,
        themeStyles,
        widgetStyles,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
