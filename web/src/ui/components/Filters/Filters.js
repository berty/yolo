import { faCube } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useContext } from 'react'
import {
  Check, GitBranch, LogOut, X,
} from 'react-feather'
import { removeAuthCookie } from '../../../api/cookies'
import {
  ARTIFACT_VALUE_KIND, BUILD_DRIVERS, BUILD_DRIVER_TO_NAME, BUILD_STATES, BUILD_STATE_VALUE_TO_NAME, PROJECT, PROJECT_NAME, actions,
} from '../../../constants'
import { GlobalContext } from '../../../store/GlobalStore.js'
import { getIsArrayWithN } from '../../../util/getters.js'
import { getArtifactKindIcon } from '../../styleTools/brandIcons.js'
import OutlineWidget from '../OutlineWidget/OutlineWidget.js'
import styles from './Filters.module.scss'
import IconProjectBertyMessenger from '../../../assets/svg/IconProjectBertyMessenger'
import { useRedirectHome } from '../../../hooks/queryHooks'

const Filters = ({ onFilterClick = () => { } }) => {
  const {
    dispatch,
    state: {
      autoRefreshOn,
      uiFilters: {
        artifact_kinds: artifactKinds, build_driver: buildDrivers, build_state: buildStates,
      },
      calculatedFilters: {
        projects,
      },
    },
    updateState,
  } = useContext(GlobalContext)
  const { redirectHome } = useRedirectHome()

  const FilterMessenger = () => (projects.includes(PROJECT.messenger) && (
    <OutlineWidget
      interactive
      selected
      onClick={onFilterClick}
      iconComponent={<IconProjectBertyMessenger size="20px" />}
      title={PROJECT_NAME[PROJECT.messenger]}
    />
  ))

  const FilterGoIpfs = () => (projects.includes(PROJECT['gomobile-ipfs-demo']) && (
    <OutlineWidget
      interactive
      selected
      onClick={onFilterClick}
      iconComponent={<FontAwesomeIcon icon={faCube} size="lg" />}
      text={PROJECT['gomobile-ipfs-demo']}
    />
  ))

  const FiltersAppWidget = () => (
    <>
      <FilterMessenger />
      <FilterGoIpfs />
    </>
  )

  const ArtifactKindsFilter = () => (getIsArrayWithN(artifactKinds, 1) && (
    <OutlineWidget
      interactive
      selected
      onClick={onFilterClick}
      icons={artifactKinds
        .map((artifactKind, i) => (
          <FontAwesomeIcon
            key={i}
            icon={getArtifactKindIcon(artifactKind)}
            size="lg"
            title={ARTIFACT_VALUE_KIND[artifactKind] || ''}
          />
        ))}
    />
  ))

  const FiltersBranchWidget = () => (
    <OutlineWidget
      text="All"
      selected
      interactive
      iconComponent={<GitBranch />}
      onClick={onFilterClick}
    />
  )

  const FiltersBuildDriver = () => (
    <>
      {BUILD_DRIVERS.filter((driver) => buildDrivers.includes(driver.toString())).map((build, i) => (
        <OutlineWidget
          text={BUILD_DRIVER_TO_NAME[build]}
          interactive
          selected
          onClick={onFilterClick}
          key={i}
        />

      ))}
    </>
  )

  const ShowRunningBuilds = () => (getIsArrayWithN(buildStates, 1)
    && (
      <>
        {BUILD_STATES.filter((buildState) => buildStates.includes(buildState))
          .map((buildsState, i) => (
            <OutlineWidget
              interactive
              selected
              text={BUILD_STATE_VALUE_TO_NAME[buildsState]}
              onClick={onFilterClick}
              key={i}
            />
          ))}
      </>
    )
  )

  const RefreshActionButton = () => (
    <OutlineWidget
      interactive
      hasSelectedState={false}
      onClick={() => {
        updateState({
          needsRefresh: true,
          error: null,
        })
      }}
      text="F5"
    />
  )

  const SetAutoRefreshActionButton = () => {
    const selected = !!autoRefreshOn
    return (
      <OutlineWidget
        interactive
        selected={selected}
        onClick={() => {
          updateState({
            autoRefreshOn: (!autoRefreshOn),
          })
        }}
        title="Toggle auto refresh every 10 sec"
        iconComponent={selected ? <Check /> : <X />}
        text="Auto Reload"
      />
    )
  }

  const Logout = () => (
    <OutlineWidget
      interactive
      hasSelectedState={false}
      onClick={() => {
        removeAuthCookie()
        dispatch({ type: actions.LOGOUT })
        dispatch({ type: actions.UPDATE_UI_FILTERS, payload: {} })
        redirectHome()
      }}
      iconComponent={<LogOut />}
      text="Logout"
    />
  )

  return (
    <div className={styles.container}>
      <FiltersAppWidget />
      <ArtifactKindsFilter />
      <FiltersBranchWidget />
      <FiltersBuildDriver />
      <SetAutoRefreshActionButton />
      <ShowRunningBuilds />
      <RefreshActionButton />
      <Logout />
    </div>
  )
}

// Filters.whyDidYouRender = {
//   logOwnerReasons: true,
// }

export default Filters
