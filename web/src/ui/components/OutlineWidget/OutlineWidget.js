import React from 'react'
import classNames from 'classnames'
import styles from './OutlineWidget.module.scss'
import withWidgetStyles from '../../helpers/withWidgetStyles'

const OutlineWidget = ({
  title = null,
  selected = false,
  interactive = true,
  hasSelectedState = true,
  notImplemented = false,
  textUnderneath = false,
  text = '',
  iconComponent = '',
  icons = [],
  onClick = null,
  ...injectedProps
}) => {
  const {
    themedWidgetStyles: {
      noStateWidgetAccent, selectedWidgetAccent, unselectedWidgetAccent,
    },
  } = injectedProps
  const containerClass = classNames([styles['widget-wrapper']], { [styles['is-interactive']]: interactive, [styles['not-implemented']]: notImplemented, [styles['text-underneath']]: textUnderneath })
  const textClass = classNames([styles['widget-text']], { [styles['no-svg']]: !iconComponent })
  const themedColorsState = selected ? selectedWidgetAccent : unselectedWidgetAccent
  const themedColors = hasSelectedState ? themedColorsState : noStateWidgetAccent
  const validTitle = title || text || ''
  const roll = interactive ? 'button' : null
  const tabIndex = interactive ? 0 : null

  const TextContents = () => (text && <p className={textClass}>{text}</p>)
  const Icon = () => <>{iconComponent}</>
  const Icons = () => <>{icons}</>


  return (
    <div style={themedColors} className={containerClass} title={validTitle} roll={roll} onClick={onClick} onKeyDown={onClick} tabIndex={tabIndex}>
      <Icon />
      <Icons />
      <TextContents />
    </div>
  )
}

export default withWidgetStyles(OutlineWidget)
