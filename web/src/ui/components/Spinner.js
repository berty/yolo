import React, { useContext } from 'react'
import cN from 'classnames'
import styles from './Spinner.module.scss'
import { ThemeContext } from '../../store/ThemeStore'

const Spinner = () => {
  const { theme } = useContext(ThemeContext)
  const spinnerClassNames = (...classNames) => cN(classNames, { [styles.light]: theme.name === 'light', [styles.dark]: theme.name === 'dark' })
  return (
    <div className={spinnerClassNames(styles.spinner)}>
      <div className={styles.bounce1} />
      <div className={styles.bounce2} />
      <div className={styles.bounce3} />
    </div>
  )
}

export default Spinner

/**
 * Spinner credit: https://github.com/tobiasahlin/SpinKit
 */
