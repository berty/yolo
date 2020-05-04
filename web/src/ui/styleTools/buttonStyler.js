import {themes} from './themes';
import {BUILD_STATE, ARTIFACT_STATE} from '../../constants';

export const tagStyle = ({name, state, cursor = 'default'}) => {
  const theme = themes[name] || themes.dark;

  const styles = {
    [ARTIFACT_STATE.Finished]: {
      backgroundColor: theme.bg.tagGreen,
      color: theme.text.tagGreen,
    },
    [ARTIFACT_STATE.Error]: {
      backgroundColor: theme.bg.tagPink,
      color: theme.text.tagPink,
    },
    [BUILD_STATE.Passed]: {
      backgroundColor: theme.bg.tagGreen,
      color: theme.text.tagGreen,
    },
    [BUILD_STATE.Failed]: {
      backgroundColor: theme.bg.tagPink,
      color: theme.text.tagPink,
    },
    [BUILD_STATE.Running]: {
      backgroundColor: theme.bg.tagOrange,
      color: theme.text.tagOrange,
    },
    [BUILD_STATE.Building]: {
      backgroundColor: theme.bg.tagOrange,
      color: theme.text.tagOrange,
    },
    DEFAULT: {
      backgroundColor: 'transparent',
      color: theme.text.sectionText,
      border: '1px solid gray',
    },
  };
  const style = styles[state] || styles.DEFAULT;
  return {...style, cursor};
};

export const actionButtonStyle = ({name, stateNormed}) => {
  const theme = themes[name] || themes.light;
  const styles = {
    FINISHED: {
      backgroundColor: theme.bg.tagGreen,
      color: theme.text.tagGreen,
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

export const colorMrState = ({name, buildMrStateNormed}) => {
  const theme = themes[name] || themes.light;
  const styles = {
    OPEN: {
      color: theme.icon.masterGreen,
    },
    CLOSED: {
      color: theme.icon.branchPurple,
    },
    DEFAULT: {
      color: theme.text.sectionText,
    },
  };
  return styles[buildMrStateNormed] || styles.DEFAULT;
};
