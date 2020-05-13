import React, { useState, useEffect } from 'react'
import { themes } from '../ui/styleTools/themes'

export const ThemeContext = React.createContext()

const detectBrowserTheme = () => {
  const supportsPreference = window.matchMedia('(prefers-color-scheme)').media !== 'not all'
  const isLight = supportsPreference
    && window.matchMedia('(prefers-color-scheme: light)').matches
  return { isLight }
}

export const ThemeStore = ({ children }) => {
  const [theme, setTheme] = useState(themes.dark)

  const changeTheme = (newName) => setTheme(themes[newName] || themes.dark)

  useEffect(() => {
    const { isLight } = detectBrowserTheme()
    if (isLight) changeTheme('light')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
