import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useContext, useState } from 'react'
import { ARTIFACT_KIND_NAMES, BRANCH, BUILD_STATE } from '../../../constants'
import { ThemeContext } from '../../../store/ThemeStore'
import { ResultContext } from '../../../store/ResultStore'
import { getStrEquNormalized, getIsArr, getIsArrayWithN } from '../../../util/getters'
import { getArtifactKindIcon } from '../../styleTools/brandIcons'
import { tagStyle } from '../../styleTools/buttonStyler'
import Tag from '../Tag/Tag'
import './Build.scss'
import BuildAndMrContainer from './BuildAndMrContainer'
import CardHeader from './CardHeader'
import CardTitle from './CardTitle'
import ShownBuildsButton from '../ShownBuildsButton'

const BuildContainer = ({ build, toCollapse, children }) => {
  const { state } = useContext(ResultContext)
  const [collapsed, toggleCollapsed] = useState(toCollapse)
  const [showingAllBuilds, toggleShowingAllBuilds] = useState(false)
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
    allBuilds = [],
  } = build || {}

  const isMasterBuildBranch = getStrEquNormalized(buildBranch, BRANCH.MASTER)

  const cardTitle = (
    <CardTitle
      {...{
        buildHasMr,
        buildId,
        buildShortId,
        isMasterBuildBranch,
        mrId,
        mrShortId,
        mrTitle,
      }}
    />
  )

  const ArtifactKindIcon = ({ color, kind = '' }) => (
    <FontAwesomeIcon
      icon={getArtifactKindIcon(kind)}
      color={color}
      title={`Artifact kind: ${ARTIFACT_KIND_NAMES[kind]}`}
    />
  )

  const FirstBuildArtifactTags = collapsed && buildHasArtifacts && (
    <>
      {buildHasArtifacts.map((a, i) => {
        const { state: artifactState, kind = 'UnknownKind' } = a
        const artifactTagStyle = tagStyle({
          name: theme.name,
          state: artifactState,
        })
        const iconColor = tagStyle.color
        return (
          <Tag
            key={i}
            text={artifactState}
            styles={artifactTagStyle}
            icon={ArtifactKindIcon({ color: iconColor, kind })}
            classes={{ 'btn-state-tag': true }}
            title={`Artifact kind: ${kind}`}
          />
        )
      })}
    </>
  )

  const FirstBuildStatusTag = collapsed && buildState && (
    <Tag
      classes={{ 'btn-state-tag': true }}
      text={buildState}
      styles={tagStyle({
        name: theme.name,
        state: BUILD_STATE[buildState],
      })}
    />
  )

  const cardStateTags = collapsed && (
    <>
      {FirstBuildStatusTag}
      {FirstBuildArtifactTags}
      {allBuilds.length > 1 && <ShownBuildsButton nOlderBuilds={allBuilds.length - 1} />}
    </>
  )

  return (
    <div className="Build" id={buildId}>
      {children}
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
            collapsed,
            isMasterBuildBranch,
            mrId,
            mrShortId,
            toggleCollapsed,
            cardTitle,
            cardStateTags,
          }}
        />
        {!collapsed
          && getIsArr(allBuilds)
          && allBuilds.slice(0, showingAllBuilds ? undefined : 1).map((b, i) => (
            <BuildAndMrContainer
              build={state.builds[b]}
              buildHasMr={buildHasMr}
              isLatestBuild={i === 0}
              nOlderBuilds={i === 0 && getIsArrayWithN(allBuilds, 2) ? allBuilds.length - 1 : 0}
              showingAllBuilds={showingAllBuilds}
              toggleShowingAllBuilds={toggleShowingAllBuilds}
              key={i}
            />
          ))}
      </div>
    </div>
  )
}

export default BuildContainer
