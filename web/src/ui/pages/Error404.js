import React from 'react'
import { useHistory } from 'react-router-dom'

import Header from '../components/Header/Header'
import withButtonStyles from '../helpers/withButtonStyles'

const Error404 = ({ ...injectedProps }) => {
  const history = useHistory()
  const { themedBtnStyles: { primaryButtonColors } } = injectedProps

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
        <div className="btn btn-primary" style={primaryButtonColors} onClick={() => history.goBack()} onKeyDown={() => history.goBack()} role="button" tabIndex={0}>
          Back
        </div>
      </div>
    </div>
  )
}

export default withButtonStyles(Error404)
