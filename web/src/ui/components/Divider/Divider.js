import React from 'react'
import classNames from 'classnames'

import styles from './Divider.module.scss'
import withTheme from '../../helpers/withTheme'

const Divider = ({ dividerText, theme }) => {
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

export default withTheme(Divider)
