import React, {useContext} from 'react';
import {ThemeContext} from '../../store/ThemeStore';
import {Sliders} from 'react-feather';

const ShowFiltersButton = ({clickAction, showingFiltersModal}) => {
  const {theme} = useContext(ThemeContext);

  const notShowingFiltersStyle = {
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
    <div style={notShowingFiltersStyle} onClick={clickAction}>
      <Sliders color="white" />
    </div>
  );
};

export default ShowFiltersButton;
