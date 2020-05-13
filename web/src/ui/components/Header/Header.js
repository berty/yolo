import React, { useContext } from 'react'
import Filters from '../Filters/Filters'

import { ThemeContext } from '../../../store/ThemeStore'
import YoloLogo from '../../../assets/svg/yolo.svg'

import ActionWidgets from '../ActionWidgets'

import { ResultContext, INITIAL_STATE } from '../../../store/ResultStore'

import './Header.scss'

const Header = () => {
  const { theme } = useContext(ThemeContext)
  const { state, updateState } = useContext(ResultContext)

  return (
    <div className="Header" style={{ backgroundColor: theme.bg.page }}>
      <div
        className="header-logo"
        style={{ cursor: 'pointer' }}
        onClick={() => {
          updateState({
            needsProgrammaticQuery: true,
            uiFilters: INITIAL_STATE.uiFilters,
          })
        }}
      >
        <img src={YoloLogo} alt="Yolo logo" />
      </div>
      {state.isAuthed && (
        <ActionWidgets>
          <Filters />
        </ActionWidgets>
      )}
      {process.env.YOLO_UI_TEST && (
        <pre style={{ padding: 0, margin: 0 }}>UI Test</pre>
      )}
    </div>
  )
}

export default Header
