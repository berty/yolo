import React, { useContext } from 'react'
import { Sliders } from 'react-feather'
import { ThemeContext } from '../../store/ThemeStore'

const ShowFiltersButton = ({ clickAction, showingFiltersModal }) => {
  const {
    theme: {
      bg: { btnPrimary },
    },
  } = useContext(ThemeContext)

  const showFiltersButtonStyle = {
    position: 'fixed',
    right: '1rem',
    bottom: '1rem',
    borderRadius: '50%',
    padding: '0.7rem',
    margin: '0.6rem',
    backgroundColor: btnPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(90deg)',
    cursor: 'pointer',
    display: showingFiltersModal ? 'none' : 'flex',
    zIndex: 2000,
  }

  return (
    <div
      style={showFiltersButtonStyle}
      onClick={clickAction}
      onKeyDown={clickAction}
      tabIndex={0}
      role="button"
    >
      <Sliders color="white" size={20} />
    </div>
  )
}

export default ShowFiltersButton
