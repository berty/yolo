import React, { useContext } from 'react'
import { ThemeContext } from '../../store/ThemeStore'

const withTheme = (WrappedComponent) => (originalProps) => {
  const { theme } = useContext(ThemeContext)

  const textPlain = {
    color: theme.text.sectionText,
  }

  const textSectionTitle = {
    color: theme.text.sectionTitle,
  }

  const textBlockTitle = {
    color: theme.text.blockTitle,
  }

  const pageBg = {
    backgroundColor: theme.bg.page,
  }

  const blockBg = {
    backgroundColor: theme.bg.block,
  }

  const themeStyles = {
    textBlockTitle,
    textPlain,
    textSectionTitle,
    pageBg,
    blockBg,
  }


  return (
    <>
      <WrappedComponent
        theme={theme}
        themeStyles={themeStyles}
        {...originalProps}
      />
    </>
  )
}

export default withTheme
