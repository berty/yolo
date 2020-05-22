import React, { useContext } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import Filters from '../Filters/Filters'
import { ThemeContext } from '../../../store/ThemeStore'
import YoloLogo from '../../../assets/svg/yolo.svg'
import YoloLogoSquare from '../../../assets/svg/yolo-logo-square.svg'
import ActionWidgets from '../ActionWidgets'
import { ResultContext, INITIAL_STATE } from '../../../store/ResultStore'

import styles from './Header.module.scss'
import './Header.scss'

const Header = ({ autoRefreshOn, setAutoRefreshOn, onFilterClick = () => { } }) => {
  const { theme } = useContext(ThemeContext)
  const { state, updateState } = useContext(ResultContext)
  const history = useHistory()
  const location = useLocation()

  return (
    <div className={styles.header} style={{ backgroundColor: theme.bg.page }}>
      <div
        className={styles['header-logo-lg']}
        style={{ cursor: 'pointer' }}
        onClick={location.pathname !== '/404' ? () => {
          updateState({
            needsProgrammaticQuery: true,
            uiFilters: INITIAL_STATE.uiFilters,
          })
        } : () => history.push('/')}
      >
        <img src={YoloLogo} alt="Yolo logo" />
      </div>
      <div
        className={styles['header-logo-sm']}
        style={{ cursor: 'pointer' }}
        onClick={location.pathname !== '/404' ? () => {
          updateState({
            needsProgrammaticQuery: true,
            uiFilters: INITIAL_STATE.uiFilters,
          })
        } : () => history.push('/')}
      >
        <img src={YoloLogoSquare} alt="Yolo logo" />
      </div>
      {state.isAuthed && (
        // TODO: Unecessary nesting
        <ActionWidgets>
          {/* TODO: Logout, refresh, autoRefresh should not be in Filters */}
          <Filters {...{ autoRefreshOn, setAutoRefreshOn, onFilterClick }} />
        </ActionWidgets>
      )}
      {process.env.YOLO_UI_TEST && (
        <pre style={{ padding: 0, margin: 0 }}>UI Test</pre>
      )}
    </div>
  )
}

export default Header
