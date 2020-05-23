import React, { useContext } from 'react'
import { ThemeContext } from '../../store/ThemeStore'

export const getWidgetStyles = (theme) => ({
  widgetBg: {
    backgroundColor: theme.bg.filter,
  },

  selectedWidgetAccent: {
    color: theme.icon.filterSelected,
  },

  unselectedWidgetAccent: {
    color: theme.icon.filterUnselected,
  },

  noStateWidgetAccent: {
    color: theme.text.sectionTitle,
  },

  widgetSelected: {
    color: theme.text.filterSelectedTitle,
    borderColor: theme.icon.filterSelected,
    backgroundColor: theme.bg.filter,
  },

  widgetUnselected: {
    color: theme.text.filterUnselectedTitle,
    borderColor: theme.border.filter,
  },
})


const withWidgetStyles = (WrappedComponent) => (originalProps) => {
  const { theme } = useContext(ThemeContext)

  return (
    <>
      <WrappedComponent theme={theme} themedWidgetStyles={{ ...getWidgetStyles(theme) }} {...originalProps} />
    </>
  )
}

export default withWidgetStyles
