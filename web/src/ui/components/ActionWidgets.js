import React from "react";

const ActionWidgets = ({ children }) => {
  const actionWidgetsStyle = {
    height: "100%",
    display: "flex",
    alignItems: "center",
  };
  return <div style={actionWidgetsStyle}>{children}</div>;
};

export default ActionWidgets;
