import React from 'react';

const ActionWidgets = (props) => {
  const actionWidgetsStyle = {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
  };
  return <div style={actionWidgetsStyle}>{props.children}</div>;
};

export default ActionWidgets;
