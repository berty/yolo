import React, { useContext } from 'react'

import styles from './ErrorDisplay.module.scss'
import { ThemeContext } from '../../../store/ThemeStore'

const ErrorDisplay = ({ error }) => {
  const { theme } = useContext(ThemeContext)
  const errorStatus = error.status > 0 ? `Error ${error.status}: ${error.statusText}` : 'Error:'
  return (
    <div className={styles.container}>
      <h3 className="title" style={{ color: theme.text.sectionTitle }}>
        {errorStatus}
      </h3>
      <p style={{ color: theme.text.sectionTitle }}>
        {error.humanMessage}
      </p>
    </div>
  )
}

export default ErrorDisplay
