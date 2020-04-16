import React from 'react';

const ActionWidgets = (props) => {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {props.children}
    </div>
  );
};

export default ActionWidgets;
