import React, { useContext } from 'react'
import { useHistory } from 'react-router-dom'
import YoloLogo from '../../../assets/svg/yolo.svg'
import { GlobalContext } from '../../../store/GlobalStore'
import Filters from '../Filters/Filters'
import styles from './Header.module.scss'

const Header = ({ onFilterClick = () => { } }) => {
  const { state: { isAuthed }, updateState } = useContext(GlobalContext)
  const history = useHistory()

  return (
    <div className={styles.container}>
      <div
        className={styles.logo}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          updateState({
            needsRefresh: true,
          })
          history.push('/')
        }}
      >
        <img src={YoloLogo} alt="Yolo logo" />
      </div>
      {
        isAuthed && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <Filters onFilterClick={onFilterClick} />
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

// Header.whyDidYouRender = {
//   logOwnerReasons: true,
// }

export default Header
