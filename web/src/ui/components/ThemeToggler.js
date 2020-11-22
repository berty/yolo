import cn from "classnames";
import throttle from "lodash/throttle";
import React, { useContext, useRef } from "react";
import {
  tagGhostUpper,
  tagLink,
} from "../../assets/widget-snippets.module.css";
import { ThemeContext } from "../../store/ThemeStore";

const ThemeToggler = () => {
  const { theme, changeTheme } = useContext(ThemeContext);

  const onChangeHandler = useRef(
    throttle((newTheme) => {
      changeTheme(newTheme);
    }, 500)
  ).current;

  return (
    <div
      className={cn(tagGhostUpper, tagLink)}
      onClick={() => onChangeHandler(theme === "light" ? "dark" : "light")}
      role="button"
      tabIndex={0}
    >
      <span>{theme === "light" ? "🌙  Dark mode" : "☀️  light mode"}</span>
    </div>
  );
};

export default ThemeToggler;
