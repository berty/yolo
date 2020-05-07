import React, {useContext} from 'react';
import {Sliders} from 'react-feather';

import {ThemeContext} from '../../store/ThemeStore';

const ShowFiltersButton = ({clickAction, showingFiltersModal}) => {
  const {theme} = useContext(ThemeContext);

  const showFiltersButtonStyle = {
    position: 'fixed',
    right: '1rem',
    bottom: '1rem',
    borderRadius: '50%',
    padding: '0.7rem',
    margin: '0.6rem',
    backgroundColor: theme.bg.btnPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(90deg)',
    cursor: 'pointer',
    display: showingFiltersModal ? 'none' : 'flex',
  };

  return (
    <div style={showFiltersButtonStyle} onClick={clickAction}>
      <Sliders color="white" size="1.3rem" />
    </div>
  );
};

export default ShowFiltersButton;
