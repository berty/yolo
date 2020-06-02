import React, { useContext } from 'react'
import classNames from 'classnames'
import styles from './OutlineWidget.module.scss'
import { ThemeContext } from '../../../store/ThemeStore'

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
}) => {
  const { widgetStyles } = useContext(ThemeContext)
  const containerClass = classNames([styles['widget-wrapper']], { [styles['is-interactive']]: interactive, [styles['not-implemented']]: notImplemented, [styles['text-underneath']]: textUnderneath })
  const textClass = classNames([styles['widget-text']], { [styles['no-svg']]: !iconComponent })
  const themedColorsState = selected ? widgetStyles.selectedWidgetAccent : widgetStyles.unselectedWidgetAccent
  const themedColors = hasSelectedState ? themedColorsState : widgetStyles.noStateWidgetAccent
  const validTitle = title || text || ''
  const roll = interactive ? 'button' : null
  const tabIndex = interactive ? 0 : null

  const TextContents = () => (text && <p className={textClass}>{text}</p>)
  const Icon = () => <>{iconComponent}</>
  const Icons = () => <>{icons}</>


  return (
    <div
      style={themedColors}
      className={containerClass}
      title={validTitle}
      roll={roll}
      onClick={onClick}
      onKeyDown={onClick}
      tabIndex={tabIndex}
    >
      <Icon />
      <Icons />
      <TextContents />
    </div>
  )
}

export default OutlineWidget
