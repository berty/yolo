import React, { useContext, useState } from 'react'

import { ThemeContext } from '../../../store/ThemeStore'

import { BRANCH } from '../../../constants'

import './Build.scss'
import CardTitle from './CardTitle'
import CardHeader from './CardHeader'
import BuildAndMergeRequest from './BuildAndMergeRequest'
import { ResultContext } from '../../../store/ResultStore'

const BuildContainer = ({ build, toCollapse }) => {
  const { state } = useContext(ResultContext)
  const [expanded, toggleExpanded] = useState(!toCollapse)
  const { theme } = useContext(ThemeContext)

  const {
    short_id: buildShortId = '',
    id: buildId = '',
    branch: buildBranch = '',
    has_mergerequest: buildHasMr = null,
    has_mergerequest: {
      short_id: mrShortId = '',
      id: mrId = '',
      title: mrTitle = '',
      has_author: {
        name: buildAuthorName = '',
        id: buildAuthorId = '',
        avatar_url: buildAuthorAvatarUrl = '',
      } = {},
    } = {},
    topLevelMrId = '',
    allBuilds = [],
    hasMaster,
  } = build || {}

  const isMaster = buildBranch && buildBranch.toUpperCase() === BRANCH.MASTER

  return (
    <div className="Build" id={buildId}>
      <div
        className="card"
        style={{
          backgroundColor: theme.bg.block,
          boxShadow: theme.shadowStyle.block,
        }}
        key={buildId}
      >
        <CardHeader
          {...{
            buildAuthorAvatarUrl,
            buildAuthorId,
            buildAuthorName,
            buildHasMr,
            buildId,
            buildShortId,
            expanded,
            isMaster,
            mrId,
            mrShortId,
            toggleExpanded,
          }}
        >
          <CardTitle
            {...{
              buildHasMr,
              buildId,
              buildShortId,
              isMaster,
              mrId,
              mrShortId,
              mrTitle,
            }}
          />
        </CardHeader>
        {expanded
          && allBuilds.map((b, i) => (
            <BuildAndMergeRequest
              {...{
                build: state.builds[b],
                isMaster,
                topLevelMrId,
                mr: buildHasMr,
                toCollapse,
                isDetailed: i === 0,
              }}
              key={i}
            />
          ))}
      </div>
    </div>
  )
}

export default BuildContainer
