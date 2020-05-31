import classNames from 'classnames'
import React, { useContext } from 'react'
import {
  ChevronDown, ChevronUp, GitCommit, GitPullRequest,
} from 'react-feather'
import { MR_STATE } from '../../../constants'
import { ThemeContext } from '../../../store/ThemeStore'
import { colors } from '../../styleTools/themes'
import './Build.scss'
import BuildBlockTitle from './BuildBlockTitle'
import Author from '../Author/Author'

const BlockIcon = ({ theme, mrState, buildHasMr }) => {
  const blockHeaderIconClassNames = classNames('block-left-icon')
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
    style={{
      color: theme.text.blockTitle,
      cursor: 'pointer',
      flexShrink: 0,
    }}
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
  const blockRowClassNames = classNames('block-row', { expanded: !collapsed })

  return (
    <>
      <div className={blockRowClassNames}>
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
          className={blockRowClassNames}
          style={{ display: 'flex', flexWrap: 'wrap' }}
        >
          {childrenLatestBuildTags}
        </div>
      )}
    </>
  )
}

export default BuildBlockHeader
