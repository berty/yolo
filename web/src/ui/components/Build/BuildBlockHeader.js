import classNames from 'classnames'
import React, { useContext } from 'react'
import {
  ChevronDown, ChevronUp, GitCommit, GitPullRequest,
} from 'react-feather'
import { MR_STATE } from '../../../constants'
import { ThemeContext } from '../../../store/ThemeStore'
import { colors } from '../../styleTools/themes'
import Author from '../Author/Author'
import styles from './Build.module.scss'
import BuildBlockTitle from './BuildBlockTitle'

const BlockIcon = ({ theme, mrState, buildHasMr }) => {
  const blockHeaderIconClassNames = classNames(styles.blockSectionLeftColumn, styles.headerIcon)
  const blockHeaderIconColorWithMr = mrState === MR_STATE.Merged ? colors.gitHub.ghMergedPurpleLighter : colors.gitHub.ghOpenGreen
  const blockHeaderIconColor = buildHasMr && (mrState === MR_STATE.Merged || mrState === MR_STATE.Opened) ? blockHeaderIconColorWithMr : theme.text.sectionText

  const BlockHeaderIcon = () => mrState ? <GitPullRequest color={blockHeaderIconColor} /> : <GitCommit color={blockHeaderIconColor} />
  return (
    <div className={blockHeaderIconClassNames}>
      <BlockHeaderIcon />
    </div>
  )
}

const ChevronIcon = ({ theme, collapsed, toggleCollapsed }) => (
  <div
    className={styles.headerChevronToggler}
    style={{ color: theme.text.blockTitle }}
    onClick={() => toggleCollapsed(!collapsed)}
  >
    {!collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
  </div>
)


const BuildBlockHeader = ({
  buildAuthorName,
  buildAuthorAvatarUrl,
  buildAuthorId,
  buildHasMr,
  buildId,
  buildShortId,
  mrShortId,
  mrId,
  mrTitle,
  childrenLatestBuildTags,
  collapsed,
  isMasterBuildBranch,
  mrState,
  toggleCollapsed,
}) => {
  const { theme } = useContext(ThemeContext)
  const blockHeaderContainerClassNames = classNames(styles.blockSectionContainer, { [styles.noBorderBottom]: !!collapsed })

  return (
    <>
      <div className={blockHeaderContainerClassNames}>
        <BlockIcon {...{ theme, buildHasMr, mrState }} />
        <BuildBlockTitle {...{
          isMasterBuildBranch,
          buildShortId,
          mrShortId,
          buildId,
          mrId,
          mrTitle,
          buildHasMr,
        }}
        />
        <Author {...{ buildAuthorAvatarUrl, buildAuthorName, buildAuthorId }} />
        <ChevronIcon {...{ theme, collapsed, toggleCollapsed }} />
      </div>
      {collapsed && childrenLatestBuildTags && (
        <div
          className={blockHeaderContainerClassNames}
        >
          <div className={styles.blockSectionLeftColumn} />
          <div className={styles.blockSectionDetailContainer}>
            <div className={styles.blockSectionDetailRow}>
              {childrenLatestBuildTags}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// BuildBlockHeader.whyDidYouRender = true

export default BuildBlockHeader
