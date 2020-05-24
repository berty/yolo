import React from 'react'
import classNames from 'classnames'
import styles from './Spinner.module.scss'
import withTheme from '../../helpers/withTheme'

const Spinner = ({ theme }) => {
  const spinnerClassNames = (...spinnerClasses) => classNames(spinnerClasses, { [styles.light]: theme.name === 'light', [styles.dark]: theme.name === 'dark' })
  return (
    <div className={spinnerClassNames(styles.spinner)}>
      <div className={styles.bounce1} />
      <div className={styles.bounce2} />
      <div className={styles.bounce3} />
    </div>
  )
}

export default withTheme(Spinner)

/**
 * Spinner credit: https://github.com/tobiasahlin/SpinKit
 */
