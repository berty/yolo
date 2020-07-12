import { faCube, faSyncAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useContext, useMemo } from 'react'
import {
  GitBranch, LogOut, Check, X,
} from 'react-feather'
import { removeAuthCookie } from '../../../api/cookies'
import {
  ARTIFACT_VALUE_KIND,
  BUILD_DRIVERS,
  BUILD_DRIVER_TO_NAME,
  BUILD_STATES,
  BUILD_STATE_VALUE_TO_NAME,
  PROJECT,
  PROJECT_NAME,
  actions,
  USERAGENT,
} from '../../../constants'
import { GlobalContext } from '../../../store/GlobalStore.js'
import { getIsArrayWithN } from '../../../util/getters.js'
import { getArtifactKindIcon } from '../../styleTools/brandIcons.js'
import OutlineWidget from '../OutlineWidget/OutlineWidget.js'
import styles from './Filters.module.scss'
import IconProjectBertyMessenger from '../../../assets/svg/IconProjectBertyMessenger'
import { useRedirectHome } from '../../../hooks/queryHooks'
import { getMobileOperatingSystem } from '../../../util/browser'
import { ThemeContext } from '../../../store/ThemeStore'
import {
  getThemedBuildDriverIcon,
  fromBlack,
} from '../../styleTools/otherIcons'

const Filters = ({ onFilterClick = () => {} }) => {
  const {
    dispatch,
    state: {
      autoRefreshOn,
      uiFilters: {
        artifact_kinds: artifactKinds,
        build_driver: buildDrivers,
        build_state: buildStates,
        branchFilter,
      },
      userAgent,
      calculatedFilters: { projects },
    },
    updateState,
  } = useContext(GlobalContext)
  const { redirectHome } = useRedirectHome()
  const {
    theme: { name: themeName },
  } = useContext(ThemeContext)

  const isMobile = useMemo(() => {
    const localUserAgent = userAgent || getMobileOperatingSystem()
    return (
      localUserAgent === USERAGENT.iOS || localUserAgent === USERAGENT.Android
    )
  }, [userAgent])

  const FilterMessenger = () => projects.includes(PROJECT.messenger) && (
  <OutlineWidget
    interactive
    selected
    onClick={onFilterClick}
    iconComponent={<IconProjectBertyMessenger size="20px" />}
    title={PROJECT_NAME[PROJECT.messenger]}
  />
  )

  const FilterGoIpfs = () => projects.includes(PROJECT['gomobile-ipfs-demo']) && (
  <OutlineWidget
    interactive
    selected
    onClick={onFilterClick}
    iconComponent={<FontAwesomeIcon icon={faCube} size="lg" />}
    text={PROJECT['gomobile-ipfs-demo']}
  />
  )

  const FiltersAppWidget = () => (
    <>
      <FilterMessenger />
      <FilterGoIpfs />
    </>
  )

  const ArtifactKindsFilter = () => getIsArrayWithN(artifactKinds, 1) && (
  <OutlineWidget
    interactive
    selected
    onClick={onFilterClick}
    icons={artifactKinds.map((artifactKind, i) => (
      <FontAwesomeIcon
        key={i}
        icon={getArtifactKindIcon(artifactKind)}
        size="lg"
        title={ARTIFACT_VALUE_KIND[artifactKind] || ''}
      />
    ))}
  />
  )

  const FiltersBranchWidget = () => (
    <OutlineWidget
      text={branchFilter || 'All'}
      selected
      interactive
      iconComponent={<GitBranch />}
      onClick={onFilterClick}
    />
  )

  const BuildDriverIcon = ({ driver, iconStyles }) => (
    <>
      {getThemedBuildDriverIcon({
        themeName,
        logo: BUILD_DRIVER_TO_NAME[driver].toUpperCase(),
      })({ styles: iconStyles })}
    </>
  )

  const FiltersBuildDriverMobile = () => (
    <OutlineWidget
      interactive
      selected
      onClick={onFilterClick}
      icons={BUILD_DRIVERS.filter((driver) => buildDrivers.includes(driver.toString())).map((driver, i) => (
        <BuildDriverIcon
          themeName={themeName}
          driver={driver}
          iconStyles={{
            marginLeft: i > 0 ? '0.5rem' : 0,
            filter: fromBlack({ themeName }).toFilterAccentColor,
          }}
          key={i}
        />
      ))}
    />
  )

  const TextBuildDrivers = () => (
    <>
      {BUILD_DRIVERS.filter((driver) => buildDrivers.includes(driver.toString())).map((driver, i) => (
        <OutlineWidget
          text={BUILD_DRIVER_TO_NAME[driver]}
          interactive
          selected
          onClick={onFilterClick}
          key={i}
        />
      ))}
    </>
  )

  const FiltersBuildDriver = () => buildDrivers.length
    && (isMobile ? <FiltersBuildDriverMobile /> : <TextBuildDrivers />)

  const ShowRunningBuilds = () => getIsArrayWithN(buildStates, 1) && (
  <>
    {BUILD_STATES.filter((buildState) => buildStates.includes(buildState)).map((buildsState, i) => (
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

  const PulseIcon = ({ faIcon = faSyncAlt, duration = 0.8 }) => {
    const pulseOpacity = `
  @keyframes pulse {
    from   { opacity: 0.33; }
    to { opacity: 1; }
  }
`
    return (
      <>
        <style>{pulseOpacity}</style>
        <div
          style={{
            animationDuration: `${duration}s`,
            animationIterationCount: 'infinite',
            animationName: 'pulse',
            animationDirection: 'alternate',
          }}
        >
          <FontAwesomeIcon icon={faIcon} size="lg" />
        </div>
      </>
    )
  }

  const SetAutoRefreshActionButton = () => {
    const selected = !!autoRefreshOn
    const IconComponentDesktop = () => (selected ? <Check /> : <X />)
    const IconComponentMobile = () => selected ? <PulseIcon /> : <FontAwesomeIcon icon={faSyncAlt} size="lg" />

    return (
      <OutlineWidget
        interactive
        selected={selected}
        onClick={() => {
          updateState({
            autoRefreshOn: !autoRefreshOn,
          })
        }}
        title="Toggle auto refresh every 10 sec"
        text={isMobile ? '' : 'Auto Reload'}
        iconComponent={
          isMobile ? <IconComponentMobile /> : <IconComponentDesktop />
        }
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
