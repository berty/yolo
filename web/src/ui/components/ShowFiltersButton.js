import React, {useContext} from 'react';
import {Sliders} from 'react-feather';

import {ThemeContext} from '../../store/ThemeStore';

const ShowFiltersButton = ({clickAction, showingFiltersModal}) => {
  const {theme} = useContext(ThemeContext);

  const showFiltersButtonStyle = {
    position: 'fixed',
    right: '1em',
    bottom: '1em',
    borderRadius: '50%',
    padding: '0.8em',
    margin: '12px',
    backgroundColor: theme.bg.btnPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(90deg)',
    cursor: 'pointer',
    display: showingFiltersModal ? 'none' : 'flex',
  };

  return (
    <div style={showFiltersButtonStyle} onClick={clickAction}>
      <Sliders color="white" />
    </div>
  );
};

export default ShowFiltersButton;
