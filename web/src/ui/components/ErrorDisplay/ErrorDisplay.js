import React from 'react'

import './ErrorDisplay.scss'
import withTheme from '../../helpers/withTheme'

const ErrorDisplay = ({ error, ...injectedProps }) => {
  const { themeStyles: { textSectionTitle, textPlain } } = injectedProps
  const ErrorStatus = error.status > 0 ? `Error ${error.status}: ${error.statusText}` : 'Error:'
  return (
    <div className="ErrorDisplay">
      <h3 className="title" style={textSectionTitle}>
        {ErrorStatus}
      </h3>
      <p style={textPlain}>
        {error.humanMessage}
      </p>
    </div>
  )
}

export default withTheme(ErrorDisplay)
