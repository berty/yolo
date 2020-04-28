import React, {useContext} from 'react';
import Filters from '../Filters/Filters';

import {ThemeContext} from '../../../store/ThemeStore';
import YoloLogo from '../../../assets/svg/yolo.svg';

import ActionWidgets from '../ActionWidgets';
import ThemeToggler from '../ThemeToggler';

import {ResultContext} from '../../../store/ResultStore';

import './Header.scss';
import {removeAuthCookie} from '../../../api/auth';

const Header = () => {
  const {theme} = useContext(ThemeContext);
  const {state, updateState} = useContext(ResultContext);

  return (
    <div className={'Header'} style={{backgroundColor: theme.bg.page}}>
      <div className="header-logo">
        <img src={YoloLogo}></img>
      </div>
      <ActionWidgets>
        <Filters />
        <div
          className="btn btn-outline-info btn-sm mr-1"
          onClick={() =>
            updateState({
              needsRequest: true,
            })
          }
        >
          F5
        </div>
        {state.apiKey && (
          <div
            className="btn btn-outline-info btn-sm"
            onClick={() => {
              removeAuthCookie();
              updateState({
                apiKey: '',
                needsRequest: true,
              });
            }}
          >
            Logout
          </div>
        )}
      </ActionWidgets>
      <ThemeToggler />
    </div>
  );
};

export default Header;
