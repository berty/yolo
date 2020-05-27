import React, { useContext, useState } from 'react'
import classNames from 'classnames'
import { ThemeContext } from '../../store/ThemeStore'
import withTheme from '../helpers/withTheme'

const ThemeToggler = ({ ...injectedProps }) => {
  const { theme } = injectedProps
  const { changeTheme } = useContext(ThemeContext)
  const [themeChangePending, setThemeChangePending] = useState(false)
  const themeBtnClassName = classNames('btn', 'btn-sm', { disabled: !!themeChangePending })
  const onChangeTheme = () => {
    if (!themeChangePending) {
      setThemeChangePending(true)
      changeTheme(theme.name === 'light' ? 'dark' : 'light')
      setTimeout(() => setThemeChangePending(false), 250)
    }
  }

  return (
    <div
      className={themeBtnClassName}
      onClick={onChangeTheme}
      onKeyDown={onChangeTheme}
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
