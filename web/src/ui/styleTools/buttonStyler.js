import { BUILD_STATE, ARTIFACT_STATE } from '../../constants'

export const tagColorStyles = ({ theme, state = null }) => {
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
  }
  return styles[state] || styles.DEFAULT
}

export const primaryButtonColors = (theme) => ({
  backgroundColor: theme.bg.btnPrimary,
  border: `1px solid ${theme.bg.btnPrimary}`,
  color: theme.text.btnPrimary,
  boxShadow: `0px 4px 0px ${theme.shadow.btnPrimary}`,
})
