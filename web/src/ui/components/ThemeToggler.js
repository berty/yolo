import React, { useContext, useState } from 'react'
import { ThemeContext } from '../../store/ThemeStore'
import Tag from './Tag/Tag'

const ThemeToggler = () => {
  const { theme, changeTheme } = useContext(ThemeContext)
  const [themeChangePending, setThemeChangePending] = useState(false)
  const onChangeTheme = () => {
    if (!themeChangePending) {
      setThemeChangePending(true)
      changeTheme(theme.name === 'light' ? 'dark' : 'light')
      setTimeout(() => setThemeChangePending(false), 250)
    }
  }

  return (
    <Tag
      onClick={onChangeTheme}
      tabIndex={0}
      role="button"
      disabled={!!themeChangePending}
    >
      {theme.name === 'light'
        ? '🌙 Dark mode'
        : '☀️ light mode'}
    </Tag>
  )
}

export default ThemeToggler
