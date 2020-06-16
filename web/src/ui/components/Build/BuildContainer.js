import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { get } from 'lodash'
import React, { useContext, useState } from 'react'
import { ARTIFACT_KIND_NAMES, BRANCH, BUILD_STATE } from '../../../constants'
import { GlobalContext } from '../../../store/GlobalStore'
import { ThemeContext } from '../../../store/ThemeStore'
import { getIsArray, getIsArrayWithN, getStrEquNormalized } from '../../../util/getters'
import { getArtifactKindIcon } from '../../styleTools/brandIcons'
import { tagColorStyles } from '../../styleTools/buttonStyler'
import ShowingOlderBuildsTag from '../ShowingOlderBuildsTag'
import Tag from '../Tag/Tag'
import styles from './Build.module.scss'
import BuildAndMrContainer from './BuildAndMrContainer'
import BuildBlockHeader from './BuildBlockHeader'
import tablerOverrides from './BuildTablerOverrides'
import { BuildStateTag } from './BuildWidgetsShared'

const ArtifactKindIcon = ({ color, kind = '' }) => (
  <div>
    <FontAwesomeIcon
      icon={getArtifactKindIcon(kind)}
      color={color}
      title={`Artifact kind: ${ARTIFACT_KIND_NAMES[kind]}`}
      size="lg"
    />
  </div>
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
      styles={{
        ...tagColorStyles({
          theme,
          state: BUILD_STATE.Running,
        }),
      }}
    >
      {`${hasRunningBuilds.length} build${hasRunningBuilds.length > 1 ? 's' : ''} running`}
    </Tag>
  )
)

const BuildContainer = React.memo(({
  build, toCollapse, children, hasRunningBuilds,
}) => {
  const { state } = useContext(GlobalContext)
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
    has_project: buildHasProject = null,
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

  const {
    has_owner: {
      id: projectOwnerId = '',
      avatar_url: projectOwnerAvatarUrl = '',
    } = {},
  } = buildHasProject || {}

  const isMasterBuildBranch = getStrEquNormalized(buildBranch, BRANCH.MASTER)

  const LatestBuildStateTags = () => collapsed && (
    <>
      <BuildStateTag {...{ theme, buildState, buildId }} />
      <LatestBuildArtifactsIcons {...{ theme, buildHasArtifacts }} />
      <ShowingOlderBuildsTag nOlderBuilds={allBuildsForMr.length - 1} />
      <AnyRunningBuildTags {...{ hasRunningBuilds, allBuildsForMr, theme }} />
    </>
  )

  return (
    <div className={styles.buildBlock}>
      {children}
      <div
        className="card"
        style={{
          backgroundColor: theme.bg.block,
          boxShadow: theme.shadowStyle.block,
          ...tablerOverrides.card,
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
          projectOwnerId,
          projectOwnerAvatarUrl,
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
})

BuildContainer.whyDidYouRender = true

export default BuildContainer
