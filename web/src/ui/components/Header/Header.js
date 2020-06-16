import React, { useContext } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import YoloLogo from '../../../assets/svg/yolo.svg'
import { INITIAL_STATE, GlobalContext } from '../../../store/GlobalStore'
import Filters from '../Filters/Filters'
import styles from './Header.module.scss'

const Header = ({
  autoRefreshOn,
  setAutoRefreshOn,
  onFilterClick = () => { },
}) => {
  const { state, updateState } = useContext(GlobalContext)
  const history = useHistory()
  const location = useLocation()

  return (
    <div className={styles.container}>
      <div
        className={styles.logo}
        style={{ cursor: 'pointer' }}
        onClick={location.pathname !== '/404.html' ? () => {
          updateState({
            needsProgrammaticQuery: true,
            uiFilters: INITIAL_STATE.uiFilters,
          })
        } : () => history.push('/')}
      >
        <img src={YoloLogo} alt="Yolo logo" />
      </div>
      {
        state.isAuthed && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <Filters {...{ autoRefreshOn, setAutoRefreshOn, onFilterClick }} />
          </div>
        )
      }
      {
        process.env.YOLO_UI_TEST && (
          <small>UI Test</small>
        )
      }
    </div>
  )
}

export default Header
