import {themes} from './themes';

export const tagStyle = ({name, stateNormed}) => {
  const theme = themes[name] || themes.dark;

  const styles = {
    FINISHED: {backgroundColor: theme.bg.tagGreen, color: theme.text.tagGreen},
    PASSED: {backgroundColor: theme.bg.tagGreen, color: theme.text.tagGreen},
    BUILDING: {
      backgroundColor: theme.bg.tagOrange,
      color: theme.text.tagOrange,
    },
    FAILED: {backgroundColor: theme.bg.tagPink, color: theme.text.tagPink},
    DEFAULT: {
      backgroundColor: 'transparent',
      color: theme.text.sectionText,
      border: '1px solid gray',
    },
  };
  const style = styles[stateNormed] || styles.DEFAULT;
  return {...style, cursor: 'default'};
};

export const actionButtonStyle = ({name, stateNormed}) => {
  const theme = themes[name] || themes.dark;
  const styles = {
    FINISHED: {
      backgroundColor: theme.bg.tagGreen,
      color: 'white',
      boxShadow: '0px 4px 0px ' + theme.shadow.btnDlMaster,
    },
    BUILDING: {display: 'none'},
    FAILED: {
      backgroundColor: theme.bg.tagPink,
      color: theme.text.tagPink,
      cursor: 'default',
    },
    DEFAULT: {display: 'none'},
  };
  return styles[stateNormed] || styles.DEFAULT;
};
