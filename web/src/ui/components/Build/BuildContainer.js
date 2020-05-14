import React, { useContext, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons'
import {
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons'

import { ThemeContext } from '../../../store/ThemeStore'
import { BRANCH, BUILD_STATE } from '../../../constants'

import './Build.scss'
import CardTitle from './CardTitle'
import CardHeader from './CardHeader'
import BuildAndMergeRequest from './BuildAndMergeRequest'
import { ResultContext } from '../../../store/ResultStore'
import { tagStyle } from '../../styleTools/buttonStyler'
import Tag from '../../Tag/Tag'

const BuildContainer = ({ build, toCollapse }) => {
  const { state } = useContext(ResultContext)
  const [expanded, toggleExpanded] = useState(!toCollapse)
  const { theme } = useContext(ThemeContext)

  const {
    short_id: buildShortId = '',
    id: buildId = '',
    branch: buildBranch = '',
    state: buildState = '',
    has_mergerequest: buildHasMr = null,
    has_artifacts: buildHasArtifacts = null,
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

  const cardTitle = (
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
  )

  // TODO: Factor out; this is duplicated in ArtifactCard
  const ArtifactKindIcon = (artifactKind, color) => (
    <FontAwesomeIcon
      icon={
        artifactKind === 'APK'
          ? faAndroid
          : artifactKind === 'DMG' || artifactKind === 'IPA'
            ? faApple
            : faQuestionCircle
      }
      color={color}
    />
  )

  const FirstBuildArtifactTags = buildHasArtifacts && (
    <>
      {buildHasArtifacts
        .map((a, i) => {
          const { state, kind } = a
          const artifactTagStyle = tagStyle({ name: theme.name, state })
          const iconColor = tagStyle.color
          return (
            <Tag key={i} text={state} styles={artifactTagStyle} icon={ArtifactKindIcon(kind, iconColor)} classes={{ 'btn-state-tag': true }} />
          )
        })}
    </>
  )

  const FirstBuildStatusTag = buildState && (
    <Tag
      classes={{ 'btn-state-tag': true }}
      text={buildState}
      styles={tagStyle({
        name: theme.name,
        state: BUILD_STATE[buildState],
      })}
    />
  )

  const otherBuildsMessage = allBuilds.length > 1 ? `${allBuilds.length - 1} other build${allBuilds.length - 1 > 1 ? 's' : ''}` : ''

  const BuildCountTag = otherBuildsMessage && (
    <Tag classes={{ 'btn-info-tag': true }} styles={tagStyle({ name: theme.name, state: null })} text={otherBuildsMessage} />
  )

  const cardStateTags = (
    <>
      {FirstBuildStatusTag}
      {FirstBuildArtifactTags}
      {BuildCountTag}
    </>
  )

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
            cardTitle,
            cardStateTags,
          }}
        />
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
