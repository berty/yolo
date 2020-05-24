import React from 'react'
import { Sliders } from 'react-feather'
import withTheme from '../helpers/withTheme'

const ShowFiltersButton = ({ clickAction, showingFiltersModal, ...injectedProps }) => {
  const { theme: { bg: { btnPrimary } } } = injectedProps

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
  }

  return (
    <div style={showFiltersButtonStyle} onClick={clickAction} onKeyDown={clickAction} tabIndex={0} role="button">
      <Sliders color="white" size={20} />
    </div>
  )
}

export default withTheme(ShowFiltersButton)
