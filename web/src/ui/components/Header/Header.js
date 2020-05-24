import React, { useContext } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import YoloLogo from '../../../assets/svg/yolo.svg'
import { INITIAL_STATE, ResultContext } from '../../../store/ResultStore'
import Filters from '../Filters/Filters'
import './Header.scss'

const Header = ({
  autoRefreshOn,
  setAutoRefreshOn,
  onFilterClick = () => { },
}) => {
  const { state, updateState } = useContext(ResultContext)
  const history = useHistory()
  const location = useLocation()

  return (
    <div className="Header">
      <div
        className="header-logo"
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
      {state.isAuthed && (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <Filters {...{ autoRefreshOn, setAutoRefreshOn, onFilterClick }} />
        </div>
      )}
      {process.env.YOLO_UI_TEST && (
        <small>UI Test</small>
      )}
    </div>
  )
}

export default Header
