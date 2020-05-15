import React, { useContext, useState } from 'react'
import {
  GitCommit, GitMerge, User, ChevronUp, ChevronDown,
} from 'react-feather'

import { ThemeContext } from '../../../store/ThemeStore'

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
  const colorInteractiveText = {
    color: theme.text.blockTitle,
  }

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

  const Author = buildAuthorName && (
    <div className="card-author">
      {buildAuthorName && buildAuthorId ? (
        <a
          href={buildAuthorId}
          style={colorInteractiveText}
          className="interactive-text"
        >
          {buildAuthorName}
        </a>
      ) : (
        buildAuthorName
      )}
    </div>
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

  const AuthorImage = buildAuthorId && buildAuthorAvatarUrl ? (
    <div className="card-avatar">
      <a href={buildAuthorId}>
        <img src={buildAuthorAvatarUrl} alt={buildAuthorId} />
      </a>
    </div>
  ) : (
    <div className="card-avatar" title="Unknown author">
      <User color={theme.text.sectionText} size={14} />
    </div>
  )

  return (
    <>
      <div className={`card-row${!collapsed ? ' expanded' : ''}`}>
        {CardIcon}
        {cardTitle}
        {Author}
        {AuthorImage}
        {ChevronIcon}
      </div>
      {collapsed && cardStateTags && (
        <div className={`card-row${!collapsed ? ' expanded' : ''}`} style={{ display: 'flex', flexWrap: 'wrap' }}>
          {cardStateTags}
        </div>
      )}
    </>
  )
}

export default CardHeader
