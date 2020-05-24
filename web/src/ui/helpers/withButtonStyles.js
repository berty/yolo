import React, { useContext } from 'react'
import { ThemeContext } from '../../store/ThemeStore'
import { primaryButtonColors } from '../styleTools/buttonStyler'


const withButtonStyles = (WrappedComponent) => (originalProps) => {
  const { theme } = useContext(ThemeContext)

  const themedBtnStyles = {
    primaryButtonColors: primaryButtonColors(theme),
  }

  return (
    <>
      <WrappedComponent themedBtnStyles={themedBtnStyles} {...originalProps} />
    </>
  )
}

export default withButtonStyles
