import React, {useContext} from 'react';
import {ThemeContext} from '../../store/ThemeStore';

const ErrorDisplay = ({error}) => {
  const {theme} = useContext(ThemeContext);
  const ErrorStatus =
    error.status > 0 ? `Error ${error.status}: ${error.statusText}` : `Error:`;
  return (
    <div
      style={{
        alignSelf: 'center',
        margin: 'auto',
        marginTop: '3rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <h3 className="title" style={{color: theme.text.sectionTitle}}>
        {ErrorStatus}
      </h3>
      <p className="" style={{color: theme.text.sectionText}}>
        {error.humanMessage}
      </p>
    </div>
  );
};

export default ErrorDisplay;
