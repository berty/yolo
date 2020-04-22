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

  // TODO: Dynamic, based on device etc
  const yoloLogo = 'yoloLogo';

  return (
    <div
      className={'header--yl pt-2 mb-5 px-md-4 pb-0 mt-2'}
      style={{backgroundColor: theme.bg.page}}
    >
      <div className={yoloLogo}>
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
      <div className="headerUser">
        <User />
      </div>
    </div>
  );
};

export default Header;
