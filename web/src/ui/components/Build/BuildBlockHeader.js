import React, { useContext } from 'react'
import {
  GitCommit, GitMerge, ChevronUp, ChevronDown,
} from 'react-feather'
import classNames from 'classnames'

import { ThemeContext } from '../../../store/ThemeStore'
import Author from '../Author/Author'

import './Build.scss'

const BuildBlockHeader = ({
  isMasterBuildBranch,
  buildHasMr,
  buildAuthorAvatarUrl,
  buildAuthorId,
  buildAuthorName,
  collapsed,
  toggleCollapsed,
  blockTitle,
  latestBuildStateTags,
}) => {
  const { theme } = useContext(ThemeContext)
  const blockRowClassNames = classNames('block-row', { expanded: !collapsed })
  const blockHeaderIconClassNames = classNames('block-left-icon', { 'rotate-merge': isMasterBuildBranch })
  const blockHeaderIconColor = isMasterBuildBranch && buildHasMr ? theme.icon.masterGreen : theme.text.sectionText

  const BlockIconPullHasMr = () => (
    <div className={blockHeaderIconClassNames}>
      <GitMerge color={blockHeaderIconColor} />
    </div>
  )
  const BlockIconDefault = () => (
    <div className={blockHeaderIconClassNames}>
      <GitCommit color={blockHeaderIconColor} />
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
