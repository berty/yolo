import classNames from 'classnames'
import React, { useContext } from 'react'
import { ThemeContext } from '../../../store/ThemeStore'
import styles from './Divider.module.scss'

const Divider = ({ dividerText }) => {
  const { theme } = useContext(ThemeContext)
  const stylesHr = { backgroundColor: theme.text.sectionText }
  const stylesBadge = {
    backgroundColor: theme.bg.page,
    color: theme.text.sectionText,
  }
  const badgeClassName = classNames('badge', styles['hr-text'])

  return (
    <div className={styles.hr} style={stylesHr}>
      <div className={badgeClassName} style={stylesBadge}>
        {dividerText}
      </div>
    </div>
  )
}

export default Divider
