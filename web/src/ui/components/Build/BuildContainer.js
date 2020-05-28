import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useContext, useState } from 'react'
import { get } from 'lodash'
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

const ArtifactKindIcon = ({ color, kind = '', isFirst }) => (
  <FontAwesomeIcon
    icon={getArtifactKindIcon(kind)}
    color={color}
    title={`Artifact kind: ${ARTIFACT_KIND_NAMES[kind]}`}
    size="lg"
    style={{ marginRight: '1rem', marginLeft: isFirst && '0.5rem', marginTop: kind === ARTIFACT_KIND_NAMES.APK && '0.1rem' }}
  />
)

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
      state: mrState = '',
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

  const FirstBuildArtifactTags = collapsed && buildHasArtifacts && (
    <>
      {buildHasArtifacts.map((a, i) => <ArtifactKindIcon kind={get(a, 'kind', ARTIFACT_KIND_NAMES.UnknownKind)} color={theme.bg.tagGreen} isFirst={(i === 0)} key={i} />)}
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
            blockTitle,
            buildAuthorAvatarUrl,
            buildAuthorId,
            buildAuthorName,
            buildHasMr,
            buildId,
            buildShortId,
            collapsed,
            isMasterBuildBranch,
            latestBuildStateTags,
            mrId,
            mrShortId,
            mrState,
            toggleCollapsed,
          }}
        />
        {!collapsed
          && getIsArray(allBuildsForMr)
          && allBuildsForMr
            .filter((bIdx, i) => showingAllBuilds ? Number.isInteger(bIdx) : i === 0)
            .map((buildidx, i) => (
              <BuildAndMrContainer
                AnyRunningBuildTags={AnyRunningBuildTags}
                build={state.builds[buildidx]}
                buildHasMr={buildHasMr}
                isLatestBuild={i === 0}
                key={i}
                nOlderBuilds={i === 0 && getIsArrayWithN(allBuildsForMr, 2) ? allBuildsForMr.length - 1 : 0}
                showingAllBuilds={showingAllBuilds}
                toggleShowingAllBuilds={toggleShowingAllBuilds}
              />
            ))}
      </div>
    </div>
  )
}

export default BuildContainer
