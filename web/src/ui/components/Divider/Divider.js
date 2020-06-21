import React, { useContext } from 'react'
import { ThemeContext } from '../../../store/ThemeStore'
import styles from './Divider.module.scss'

const Divider = ({ dividerText }) => {
  const { theme } = useContext(ThemeContext)
  const stylesHr = { backgroundColor: theme.text.sectionText }
  const colorStylesHrText = {
    backgroundColor: theme.bg.page,
    color: theme.text.sectionText,
  }

  return (
    <div className={styles.hr} style={stylesHr}>
      <div className={styles.hrText} style={colorStylesHrText}>
        {dividerText}
      </div>
    </div>
  )
}

export default Divider
