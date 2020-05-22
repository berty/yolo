import classNames from 'classnames'
import React, { useContext } from 'react'
import {
  ChevronDown, ChevronUp, GitCommit, GitPullRequest,
} from 'react-feather'
import { MR_STATE } from '../../../constants'
import { ThemeContext } from '../../../store/ThemeStore'
import { colors } from '../../styleTools/themes'
import Author from '../Author/Author'
import './Build.scss'

const BuildBlockHeader = ({
  blockTitle,
  buildAuthorAvatarUrl,
  buildAuthorId,
  buildAuthorName,
  buildHasMr,
  collapsed,
  isMasterBuildBranch,
  latestBuildStateTags,
  mrState,
  toggleCollapsed,
}) => {
  const { theme } = useContext(ThemeContext)
  const blockRowClassNames = classNames('block-row', { expanded: !collapsed })
  const blockHeaderIconClassNames = classNames('block-left-icon')
  const blockHeaderIconColorWithMr = mrState === MR_STATE.Merged ? colors.gitHub.ghMergedPurpleLighter : colors.gitHub.ghOpenGreen
  const blockHeaderIconColor = buildHasMr && (mrState === MR_STATE.Merged || mrState === MR_STATE.Opened) ? blockHeaderIconColorWithMr : theme.text.sectionText
  const BlockHeaderIcon = ({ color }) => mrState ? <GitPullRequest color={color} /> : <GitCommit color={color} />

  const BlockIconPullHasMr = () => (
    <div className={blockHeaderIconClassNames}>
      <BlockHeaderIcon color={blockHeaderIconColor} />
    </div>
  )

  const BlockIconDefault = () => (
    <div className={blockHeaderIconClassNames}>
      <BlockHeaderIcon color={blockHeaderIconColor} />
    </div>
  )

  const BlockIcon = () => (!isMasterBuildBranch && buildHasMr ? <BlockIconPullHasMr /> : <BlockIconDefault />)

  const ChevronIcon = () => (
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

  return (
    <>
      <div className={blockRowClassNames}>
        <BlockIcon />
        {blockTitle}

        <Author
          authorName={buildAuthorName || undefined}
          authorUrl={buildAuthorId}
          avatarUrl={buildAuthorAvatarUrl}
        />
        <ChevronIcon />
      </div>
      {collapsed && latestBuildStateTags && (
        <div
          className={blockRowClassNames}
          style={{ display: 'flex', flexWrap: 'wrap' }}
        >
          {latestBuildStateTags}
        </div>
      )}
    </>
  )
}

export default BuildBlockHeader
