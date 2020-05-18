import React, { useContext } from 'react'
import {
  GitCommit, GitMerge, ChevronUp, ChevronDown,
} from 'react-feather'

import { ThemeContext } from '../../../store/ThemeStore'
import Author from '../Author/Author'

import './Build.scss'

const CardHeader = ({
  isMaster,
  buildHasMr,
  buildAuthorAvatarUrl,
  buildAuthorId,
  buildAuthorName,
  collapsed,
  toggleCollapsed,
  cardTitle,
  cardStateTags,
}) => {
  const { theme } = useContext(ThemeContext)

  const CardIconMasterWithMr = isMaster && buildHasMr && (
    <div className="card-left-icon rotate-merge">
      <GitCommit color={theme.icon.masterGreen} />
    </div>
  )
  const CardIconMasterNoMr = isMaster && !buildHasMr && (
    <div className="card-left-icon rotate-merge">
      <GitCommit color={theme.text.sectionText} />
    </div>
  )
  const CardIconPullHasMr = !isMaster && buildHasMr && (
    <div className="card-left-icon">
      <GitMerge color={theme.icon.branchPurple} />
    </div>
  )
  const CardIconDefault = (
    <div className="card-left-icon rotate-merge">
      <GitCommit color={theme.text.sectionText} />
      {/* <FontAwesomeIcon icon={faFile} color={theme.text.sectionText} /> */}
    </div>
  )

  const CardIcon = (
    <>
      {CardIconMasterWithMr
        || CardIconPullHasMr
        || CardIconMasterNoMr
        || CardIconDefault}
    </>
  )

  const ChevronIcon = (
    <div
      style={{
        color: theme.text.blockTitle,
        cursor: 'pointer',
      }}
      onClick={() => toggleCollapsed(!collapsed)}
    >
      {!collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </div>
  )

  return (
    <>
      <div className={`card-row${!collapsed ? ' expanded' : ''}`}>
        {CardIcon}
        {cardTitle}
        <Author
          authorName={buildAuthorName || undefined}
          authorUrl={buildAuthorId}
          avatarUrl={buildAuthorAvatarUrl}
        />
        {ChevronIcon}
      </div>
      {collapsed && cardStateTags && (
        <div
          className={`card-row${!collapsed ? ' expanded' : ''}`}
          style={{ display: 'flex', flexWrap: 'wrap' }}
        >
          {cardStateTags}
        </div>
      )}
    </>
  )
}

export default CardHeader
