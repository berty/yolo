import React, {useContext} from 'react';
import Filters from '../Filters';

import {ThemeContext} from '../../../store/ThemeStore';
import YoloLogo from '../../../assets/svg/yolo.svg';
import './Header.scss';
import ActionWidgets from '../ActionWidgets';
import ThemeToggler from '../ThemeToggler';

const Header = () => {
  const {theme} = useContext(ThemeContext);

  return (
    <div
      className={'header my-0 py-2 px-md-4'}
      style={{backgroundColor: theme.bg.page}}
    >
      <div>
        <img src={YoloLogo}></img>
      </div>
      <ActionWidgets>
        <Filters />
      </ActionWidgets>
      <ThemeToggler />
    </div>
  );
};

export default Header;
