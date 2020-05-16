import React, { useContext } from "react";
import { useHistory, useLocation } from "react-router-dom";

import Filters from "../Filters/Filters";
import { ThemeContext } from "../../../store/ThemeStore";
import YoloLogo from "../../../assets/svg/yolo.svg";
import ActionWidgets from "../ActionWidgets";
import { ResultContext, INITIAL_STATE } from "../../../store/ResultStore";

import "./Header.scss";

const Header = ({ onFilterClick = () => {} }) => {
  const { theme } = useContext(ThemeContext);
  const { state, updateState } = useContext(ResultContext);
  const history = useHistory();
  const location = useLocation();

  return (
    <div className="Header" style={{ backgroundColor: theme.bg.page }}>
      <div
        className="header-logo"
        style={{ cursor: "pointer" }}
        onClick={
          location.pathname !== "/404"
            ? () => {
                updateState({
                  needsProgrammaticQuery: true,
                  uiFilters: INITIAL_STATE.uiFilters,
                });
              }
            : () => history.push("/")
        }
      >
        <img src={YoloLogo} alt="Yolo logo" />
      </div>
      {state.isAuthed && (
        <ActionWidgets>
          <Filters onFilterClick={onFilterClick} />
        </ActionWidgets>
      )}
      {process.env.YOLO_UI_TEST && (
        <pre style={{ padding: 0, margin: 0 }}>UI Test</pre>
      )}
    </div>
  );
};

export default Header;
