import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useContext, useState } from 'react'
import { ARTIFACT_KIND_NAMES, BRANCH, BUILD_STATE } from '../../../constants'
import { ThemeContext } from '../../../store/ThemeStore'
import { ResultContext } from '../../../store/ResultStore'
import { getStrEquNormalized, getIsArray, getIsArrayWithN } from '../../../util/getters'
import { getArtifactKindIcon } from '../../styleTools/brandIcons'
import { tagStyle } from '../../styleTools/buttonStyler'
import Tag from '../Tag/Tag'
import './Build.scss'
import BuildAndMrContainer from './BuildAndMrContainer'
import BuildBlockHeader from './BuildBlockHeader'
import BuildBlockTitle from './BuildBlockTitle'
import ShownBuildsButton from '../ShownBuildsButton'

const BuildContainer = ({
  build, toCollapse, children, hasRunningBuilds,
}) => {
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
    allBuildsForMr = [],
  } = build || {}

  const isMasterBuildBranch = getStrEquNormalized(buildBranch, BRANCH.MASTER)

  const blockTitle = (
    <BuildBlockTitle
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

  const AnyRunningBuildTags = () => (hasRunningBuilds && getIsArrayWithN(hasRunningBuilds) && getIsArrayWithN(allBuildsForMr, 2)
    && (
      <Tag
        title={`${hasRunningBuilds.length} build${hasRunningBuilds.length > 1 ? 's' : ''} running`}
        classes={['btn-state-tag']}
        styles={tagStyle({
          name: theme.name,
          state: BUILD_STATE.Running,
          cursor: 'auto',
        })}
      >
        {`${hasRunningBuilds.length} build${hasRunningBuilds.length > 1 ? 's' : ''} running`}
      </Tag>
    )
  )

  const latestBuildStateTags = collapsed && (
    <>
      {FirstBuildStatusTag}
      {FirstBuildArtifactTags}
      {getIsArray(allBuildsForMr) && allBuildsForMr.length > 1 && <ShownBuildsButton nOlderBuilds={allBuildsForMr.length - 1} />}
      <AnyRunningBuildTags />
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
        <BuildBlockHeader
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
            blockTitle,
            latestBuildStateTags,
            AnyRunningBuildTags,
          }}
        />
        {!collapsed
          && getIsArray(allBuildsForMr)
          && allBuildsForMr
            .filter((bIdx, i) => showingAllBuilds ? (!!bIdx) : i === 0)
            .map((buildidx, i) => (
              <BuildAndMrContainer
                build={state.builds[buildidx]}
                buildHasMr={buildHasMr}
                isLatestBuild={i === 0}
                nOlderBuilds={i === 0 && getIsArrayWithN(allBuildsForMr, 2) ? allBuildsForMr.length - 1 : 0}
                showingAllBuilds={showingAllBuilds}
                toggleShowingAllBuilds={toggleShowingAllBuilds}
                key={i}
                AnyRunningBuildTags={AnyRunningBuildTags}
              />
            ))}
      </div>
    </div>
  )
}

export default BuildContainer
