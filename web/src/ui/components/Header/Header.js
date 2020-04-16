import React, {useContext} from 'react';
import Filters from '../Filters';

import {ThemeContext} from '../../../store/ThemeStore';
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
      <h2 className={'mb-0 py-0'} style={{color: theme.text.sectionTitle}}>
        Yolo-logo!
      </h2>
      <ActionWidgets>
        <Filters />
      </ActionWidgets>
      <ThemeToggler />
    </div>
  );
};

export default Header;
