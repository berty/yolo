import React, { useContext } from 'react'
import { useHistory } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { ThemeContext } from '../../../store/ThemeStore'

const Error404 = () => {
  const history = useHistory()
  const { themeStyles } = useContext(ThemeContext)

  return (
    <div>
      <Header />
      <div
        style={{
          width: '100%',
          paddingTop: '4rem',
          textAlign: 'center',
          display: 'flex',
          flexFlow: 'column nowrap',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <p>404 Not Found</p>
        <div className="btn btn-primary" style={themeStyles.primaryButtonColors} onClick={() => history.goBack()} onKeyDown={() => history.goBack()} role="button" tabIndex={0}>
          Back
        </div>
      </div>
    </div>
  )
}

export default Error404
