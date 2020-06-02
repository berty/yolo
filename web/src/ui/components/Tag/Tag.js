import React from 'react'
import classNames from 'classnames'
import stylers from './Tag.module.scss'
import ConditionallyWrappedComponent from '../ConditionallyWrappedComponent'

const Tag = ({
  title = null,
  text = '',
  icon = null,
  href = '',
  onClick = null,
  styles: manualStyles = {},
  children = null,
  plainDisplay = false, // no border, no background
  disabled = false,
}) => {
  const tagClass = classNames('btn', 'btn-sm', stylers.tag, { [stylers.tagPlainDisplay]: plainDisplay })
  const tablerOverrideStyles = {
    letterSpacing: 'normal',
  }
  const textTransformStyle = plainDisplay ? {
    textTransform: 'none',
    paddingLeft: 0,
  } : {}
  const cursorStyle = { cursor: (href || onClick) && !disabled ? 'pointer' : 'auto' }

  const contents = (
    children ? <>{children}</> : (
      <>
        {icon}
        {text}
      </>
    )
  )

  const style = {
    ...tablerOverrideStyles,
    ...textTransformStyle,
    ...cursorStyle,
    ...manualStyles,
  }

  const interactiveTag = onClick && (
    <div
      className={tagClass}
      title={title}
      role="button"
      onClick={onClick}
      onKeyDown={onClick}
      tabIndex={0}
      style={style}
    >
      {contents}
    </div>
  )

  const displayTag = (
    <div
      className={tagClass}
      title={title}
      style={style}
    >
      {contents}
    </div>
  )

  return (
    <ConditionallyWrappedComponent condition={!!href} wrapper={(linkChildren) => <a href={href}>{linkChildren}</a>}>
      {interactiveTag || displayTag}
    </ConditionallyWrappedComponent>
  )
}

export default Tag
