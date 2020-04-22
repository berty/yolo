import React, {useContext} from 'react';
import Filters from '../Filters';

import {ThemeContext} from '../../../store/ThemeStore';
import YoloLogo from '../../../assets/svg/yolo.svg';
import ActionWidgets from '../ActionWidgets';
import ThemeToggler from '../ThemeToggler';
import {User} from 'react-feather';
import './Header.scss';
import {ResultContext} from '../../../store/ResultStore';

const Header = () => {
  const {theme} = useContext(ThemeContext);
  const {state, updateState} = useContext(ResultContext);

  return (
    <div className={'header--yl'} style={{backgroundColor: theme.bg.page}}>
      <div className="header-logo--yl">
        <img src={YoloLogo}></img>
      </div>
      <ActionWidgets>
        <Filters />
        <div
          className="btn btn-outline-info btn-sm"
          onClick={() =>
            updateState({
              isLoaded: false,
              items: [],
              platformId: state.platformId,
            })
          }
        >
          F5
        </div>
      </ActionWidgets>
      <ThemeToggler />
    </div>
  );
};

export default Header;
