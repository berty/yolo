import React from 'react'
import classNames from 'classnames'
import stylers from './Tag.module.scss'

const Tag = ({
  title = null,
  text = '',
  icon = null,
  href = '',
  onClick = null,
  classes = {},
  styles: manualStyles = {},
  children = null,
  normalCaps = false,
}) => {
  const validClasses = classes && Array.isArray(classes) ? classes.reduce((acc, curr) => { acc[curr] = true; return acc }, {}) : { ...classes }
  const tagClass = classNames('btn', 'btn-sm', { ...validClasses, [stylers['normal-caps']]: normalCaps })
  const contents = (
    children ? <>{children}</> : (
      <>
        {icon}
        {text}
      </>
    )
  )
  const interactiveTag = onClick && (<div className={tagClass} title={title} role="button" onClick={onClick} onKeyDown={onClick} tabIndex={0} style={manualStyles || {}}>{contents}</div>)
  const linkTag = href && (<a href={href} className={tagClass} title={href} style={manualStyles || {}}>{contents}</a>)
  const displayTag = <div className={tagClass} title={title} style={manualStyles || {}}>{contents}</div>
  return (
    <>
      {interactiveTag || linkTag || displayTag}
    </>
  )
}

export default Tag
