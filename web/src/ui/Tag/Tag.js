import React from 'react'
import classNames from 'classnames'

import './Tag.scss'

const Tag = ({
  title = null,
  text = '',
  icon = null,
  href = '',
  onClick = null,
  classes = {},
  styles = {},
}) => {
  const validClasses = classes && Array.isArray(classes) ? classes.reduce((acc, curr) => { acc[curr] = true; return acc }, {}) : {}
  const tagClass = classNames('btn', 'btn-sm', 'btn-yolo-tag', { ...classes }, { ...validClasses })
  const contents = (
    <>
      {icon}
      {text}
    </>
  )
  const interactiveTag = onClick && (<div className={tagClass} title={title} role="button" onClick={onClick} onKeyDown={onClick} tabIndex={0} style={styles || {}}>{contents}</div>)
  const linkTag = href && (<a href={href} className={tagClass} title={href} style={styles || {}}>{contents}</a>)
  const displayTag = <div className={tagClass} title={title} style={styles || {}}>{contents}</div>
  return (
    <>
      {interactiveTag || linkTag || displayTag}
    </>
  )
}

export default Tag
