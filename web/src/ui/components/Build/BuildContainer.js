import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useContext, useState } from 'react'
import { get } from 'lodash'
import { ARTIFACT_KIND_NAMES, BRANCH, BUILD_STATE } from '../../../constants'
import { ThemeContext } from '../../../store/ThemeStore'
import { ResultContext } from '../../../store/ResultStore'
import { getStrEquNormalized, getIsArray, getIsArrayWithN } from '../../../util/getters'
import { getArtifactKindIcon } from '../../styleTools/brandIcons'
import { tagColorStyles } from '../../styleTools/buttonStyler'
import Tag from '../Tag/Tag'
import './Build.scss'
import BuildAndMrContainer from './BuildAndMrContainer'
import BuildBlockHeader from './BuildBlockHeader'
import ShowingOlderBuildsTag from '../ShowingOlderBuildsTag'

const ArtifactKindIcon = ({ color, kind = '', isFirst }) => (
  <FontAwesomeIcon
    icon={getArtifactKindIcon(kind)}
    color={color}
    title={`Artifact kind: ${ARTIFACT_KIND_NAMES[kind]}`}
    size="lg"
    style={{ marginRight: '1rem', marginLeft: isFirst && '0.5rem', marginTop: kind === ARTIFACT_KIND_NAMES.APK && '0.1rem' }}
  />
)

const LatestBuildStatusTag = ({ theme, buildState }) => buildState && (
  <Tag
    classes={['btn-state-tag']}
    text={buildState}
    styles={tagColorStyles({
      theme,
      state: BUILD_STATE[buildState],
    })}
  />
)

const LatestBuildArtifactsIcons = ({ buildHasArtifacts, theme }) => getIsArray(buildHasArtifacts) && (
  <>
    {buildHasArtifacts.map((a, i) => <ArtifactKindIcon kind={get(a, 'kind', ARTIFACT_KIND_NAMES.UnknownKind)} color={theme.bg.tagGreen} isFirst={(i === 0)} key={i} />)}
  </>
)

const AnyRunningBuildTags = ({ hasRunningBuilds, allBuildsForMr, theme }) => (hasRunningBuilds && getIsArrayWithN(hasRunningBuilds) && getIsArrayWithN(allBuildsForMr, 2)
  && (
    <Tag
      title={`${hasRunningBuilds.length} build${hasRunningBuilds.length > 1 ? 's' : ''} running`}
      classes={['btn-state-tag']}
      styles={tagColorStyles({
        theme,
        state: BUILD_STATE.Running,
      })}
    >
      {`${hasRunningBuilds.length} build${hasRunningBuilds.length > 1 ? 's' : ''} running`}
    </Tag>
  )
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

  const LatestBuildStateTags = () => collapsed && (
    <>
      <LatestBuildStatusTag {...{ theme, buildState }} />
      <LatestBuildArtifactsIcons {...{ theme, buildHasArtifacts }} />
      <ShowingOlderBuildsTag nOlderBuilds={allBuildsForMr.length - 1} />
      <AnyRunningBuildTags {...{ hasRunningBuilds, allBuildsForMr, theme }} />
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
        <BuildBlockHeader {...{
          buildAuthorName,
          buildAuthorAvatarUrl,
          buildAuthorId,
          buildHasMr,
          buildId,
          buildShortId,
          collapsed,
          isMasterBuildBranch,
          mrId,
          mrTitle,
          mrShortId,
          mrState,
          toggleCollapsed,
          ...{ childrenLatestBuildTags: <LatestBuildStateTags /> },
        }}
        />
        {!collapsed
          && allBuildsForMr
            .filter((bIdx, i) => showingAllBuilds ? Number.isInteger(bIdx) : i === 0)
            .map((buildidx, i) => (
              <BuildAndMrContainer
                build={state.builds[buildidx]}
                buildHasMr={buildHasMr}
                hasRunningBuilds={hasRunningBuilds}
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
