import cn from "classnames";
import React, { useContext } from "react";
import { Check, LogOut, Trash, X } from "react-feather";
import {
  BRANCH,
  BRANCH_TO_DISPLAY_NAME,
  BUILD_DRIVERS,
  BUILD_DRIVER_TO_NAME,
  BUILD_STATES,
  BUILD_STATE_VALUE_TO_NAME,
  PROJECT_ID_TO_NAME,
} from "../../../constants";
import { useRedirectHome } from "../../../hooks/queryHooks";
import { GlobalContext } from "../../../store/GlobalStore.js";
import { isNonEmptyArray } from "../../../util/getters.js";
import {
  ArtifactKindComponent,
  ProjectIcon,
  VcsIcon,
} from "../../styleTools/iconTools.js";
import styles from "../Header/Header.module.css";
import OutlineWidget from "../OutlineWidget/OutlineWidget.js";

const AuthedHeaderContents = () => {
  const {
    state: {
      autoRefreshOn,
      uiFilters: {
        artifact_kinds: artifactKinds,
        build_driver: buildDrivers,
        build_state: buildStates,
        project_id: projects,
        branch,
      },
    },
    updateState,
    logoutAction,
  } = useContext(GlobalContext);

  const { redirectHome } = useRedirectHome();

  const openFilterModal = () => {
    updateState({ showingFilterModal: true });
  };

  const FiltersProjects = () =>
    isNonEmptyArray(projects) && (
      <>
        {projects.map((projectId, i) => {
          return (
            <OutlineWidget
              key={i}
              selected
              interactive
              iconComponent={<ProjectIcon projectId={projectId} />}
              title={PROJECT_ID_TO_NAME[projectId]}
              text={PROJECT_ID_TO_NAME[projectId]}
              onClick={openFilterModal}
            />
          );
        })}
      </>
    );

  const ArtifactKindsFilter = () =>
    isNonEmptyArray(artifactKinds) && (
      <OutlineWidget
        interactive
        selected
        onClick={openFilterModal}
        icons={artifactKinds.map((artifactKind) => (
          <ArtifactKindComponent
            artifactKind={artifactKind}
            key={artifactKind}
          />
        ))}
      />
    );

  const FiltersBranchWidget = () => {
    return (
      branch && (
        <>
          {branch.length < 1 ? (
            <OutlineWidget
              text={"All"}
              selected
              interactive
              iconComponent={<VcsIcon branchName={[BRANCH.ALL]} />}
              onClick={openFilterModal}
            />
          ) : (
            branch
              .filter((branchName) => !!branchName)
              .map((branchName) => (
                <OutlineWidget
                  key={branchName}
                  text={BRANCH_TO_DISPLAY_NAME[branchName] || branchName}
                  selected
                  interactive
                  iconComponent={<VcsIcon {...{ branchName }} />}
                  onClick={openFilterModal}
                />
              ))
          )}
        </>
      )
    );
  };

  const FiltersBuildDriver = () =>
    isNonEmptyArray(buildDrivers) && (
      <>
        {BUILD_DRIVERS.filter((driver) =>
          buildDrivers.includes(driver.toString())
        ).map((driver, i) => (
          <OutlineWidget
            text={BUILD_DRIVER_TO_NAME[driver]}
            interactive
            selected
            onClick={openFilterModal}
            key={i}
          />
        ))}
      </>
    );

  const FiltersBuildState = () =>
    isNonEmptyArray(buildStates) && (
      <>
        {BUILD_STATES.filter((buildState) =>
          buildStates.includes(buildState.toString())
        ).map((buildState, i) => (
          <OutlineWidget
            text={BUILD_STATE_VALUE_TO_NAME[buildState]}
            interactive
            selected
            onClick={openFilterModal}
            key={i}
          />
        ))}
      </>
    );

  return (
    <>
      <FiltersProjects />
      <ArtifactKindsFilter />
      <FiltersBranchWidget />
      <FiltersBuildDriver />
      <FiltersBuildState />
      <div className={styles.settingsBar}>
        <button
          className={styles.settingsItem}
          onClick={() => {
            window.localStorage.removeItem("uiFilters");
            updateState({
              needsRefresh: true,
              isLoaded: false,
            });
            redirectHome();
          }}
        >
          <Trash />
          <span>Reset filters</span>
        </button>
        <button
          className={cn(
            styles.settingsItem,
            !!autoRefreshOn && styles.selected
          )}
          onClick={() => {
            updateState({
              autoRefreshOn: !autoRefreshOn,
            });
          }}
        >
          {!autoRefreshOn ? <X /> : <Check />}
          <span>Auto-reload</span>
        </button>
        <button
          className={styles.settingsItem}
          onClick={() => {
            updateState({
              needsRefresh: true,
              error: null,
            });
          }}
        >
          F5
        </button>
        <button
          className={styles.settingsItem}
          onClick={() => {
            logoutAction();
            redirectHome();
          }}
        >
          <LogOut />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
};

// Filters.whyDidYouRender = {
//   logOwnerReasons: true,
// }

export default AuthedHeaderContents;
