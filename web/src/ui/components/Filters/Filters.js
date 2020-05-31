import { faCube } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useContext } from 'react'
import {
  Check, GitBranch, LogOut, MessageCircle, X,
} from 'react-feather'
import { removeAuthCookie } from '../../../api/cookies'
import {
  ARTIFACT_VALUE_KIND, BUILD_DRIVERS, BUILD_DRIVER_TO_NAME, BUILD_STATES, BUILD_STATE_VALUE_TO_NAME, PROJECT,
} from '../../../constants'
import { ResultContext } from '../../../store/ResultStore.js'
import { getIsArrayWithN } from '../../../util/getters.js'
import { getArtifactKindIcon } from '../../styleTools/brandIcons.js'
import OutlineWidget from '../OutlineWidget/OutlineWidget.js'
import styles from './Filters.module.scss'

const Filters = ({ autoRefreshOn, onFilterClick, setAutoRefreshOn }) => {
  const {
    state: {
      uiFilters: {
        artifact_kinds: artifactKinds, build_driver: buildDrivers, build_state: buildStates,
      },
      calculatedFilters: {
        projects,
      },
    }, updateState,
  } = useContext(ResultContext)

  const FilterChat = () => (projects.includes(PROJECT.chat) && (
    <OutlineWidget
      interactive
      selected
      onClick={onFilterClick}
      iconComponent={<MessageCircle />}
      text={PROJECT.chat}
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
      <FilterChat />
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
          setAutoRefreshOn(!autoRefreshOn)
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
        updateState({
          isAuthed: false,
          apiKey: '',
          needsProgrammaticQuery: true,
        })
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

export default Filters
