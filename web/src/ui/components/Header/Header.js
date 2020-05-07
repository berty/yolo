import React, {useContext} from 'react';
import Filters from '../Filters/Filters';

import {ThemeContext} from '../../../store/ThemeStore';
import YoloLogo from '../../../assets/svg/yolo.svg';

import ActionWidgets from '../ActionWidgets';

import {ResultContext} from '../../../store/ResultStore';

import './Header.scss';

const Header = () => {
  const {theme} = useContext(ThemeContext);
  const {state} = useContext(ResultContext);

  return (
    <div className={'Header'} style={{backgroundColor: theme.bg.page}}>
      <div className="header-logo">
        <img src={YoloLogo}></img>
      </div>
      {state.isAuthed && (
        <ActionWidgets>
          <Filters />
        </ActionWidgets>
      )}
      {process.env.YOLO_UI_TEST && (
        <pre style={{padding: 0, margin: 0}}>UI Test</pre>
      )}
    </div>
  );
};

export default Header;
