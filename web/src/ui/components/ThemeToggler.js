import React, { useContext } from 'react'
import { ThemeContext } from '../../store/ThemeStore'
import withTheme from '../helpers/withTheme'

const ThemeToggler = ({ ...injectedProps }) => {
  const { theme } = injectedProps
  const { changeTheme } = useContext(ThemeContext)
  const getOtherThemeName = () => (theme.name === 'light' ? 'dark' : 'light')

  return (
    <div
      className="btn btn-sm btn-small"
      style={{ cursor: 'pointer' }}
      onClick={() => changeTheme(getOtherThemeName())}
      onKeyDown={() => changeTheme(getOtherThemeName())}
      tabIndex={0}
      role="button"
    >
      {theme.name === 'light'
        ? '🌙 Switch to dark theme'
        : '☀️ Use light theme'}
    </div>
  )
}

export default withTheme(ThemeToggler)
