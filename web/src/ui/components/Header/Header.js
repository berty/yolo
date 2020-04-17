import React, {useContext} from 'react';
import Filters from '../Filters';

import {ThemeContext} from '../../../store/ThemeStore';
import YoloLogo from '../../../assets/svg/yolo.svg';
import ActionWidgets from '../ActionWidgets';
import ThemeToggler from '../ThemeToggler';
import {User} from 'react-feather';
import './Header.scss';

const Header = () => {
  const {theme} = useContext(ThemeContext);

  // TODO: Dynamic, based on device etc
  const yoloLogo = 'yoloLogo';

  return (
    <div
      className={'header--yl pt-2 mb-2 px-md-4 pb-0 mt-2'}
      style={{backgroundColor: theme.bg.page}}
    >
      <div className={yoloLogo}>
        <img src={YoloLogo}></img>
      </div>
      <ActionWidgets>
        <Filters />
      </ActionWidgets>
      <ThemeToggler />
      <div className="headerUser">
        <User />
      </div>
    </div>
  );
};

export default Header;
