import React, {useContext} from 'react';
import {ThemeContext} from '../../store/ThemeStore';

const ErrorDisplay = ({error}) => {
  const {theme} = useContext(ThemeContext);
  return (
    <section>
      <h3 className="title" style={{color: theme.text.sectionTitle}}>
        Error {error.status || ''}: {error.message}
      </h3>
      {error.data && (
        <small style={{color: theme.text.sectionText}}>
          {typeof error.data === 'object'
            ? JSON.stringify(error.data)
            : error.data}
        </small>
      )}
    </section>
  );
};

export default ErrorDisplay;
