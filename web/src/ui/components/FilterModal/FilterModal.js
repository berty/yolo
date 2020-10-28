import cn from "classnames";
import pickBy from "lodash/pickBy";
import queryString from "query-string";
import React, { useContext, useState } from "react";
import { Check, LogOut, X } from "react-feather";
import { useHistory } from "react-router-dom";
import widgetStyles from "../../../assets/widget-snippets.module.css";
import {
  ARTIFACT_KINDS,
  BUILD_DRIVERS,
  BUILD_STATES,
  PROJECTS,
} from "../../../constants";
import { useRedirectHome } from "../../../hooks/queryHooks";
import { GlobalContext } from "../../../store/GlobalStore";
import { isNonEmptyArray, safeJsonParse } from "../../../util/getters";
import Modal from "../Modal/Modal";
import ThemeToggler from "../ThemeToggler";
import styles from "./FilterModal.module.css";
import {
  ArtifactFilter,
  BranchFilter,
  BuildDriverFilter,
  BuildStateFilter,
  ProjectFilter,
} from "./FilterModalWidgets";

const ProjectWidgets = ({ selectedProjects, setSelectedProjects }) => (
  <>
    {PROJECTS.map((projectId, i) => (
      <ProjectFilter
        key={i}
        project={projectId}
        {...{
          selectedProjects,
          setSelectedProjects,
        }}
      />
    ))}
  </>
);

const ArtifactKindWidgets = ({
  setSelectedArtifactKinds,
  selectedArtifactKinds,
}) => (
  <>
    {ARTIFACT_KINDS.map((k, i) => (
      <ArtifactFilter
        artifact_kind={k}
        key={i}
        {...{ setSelectedArtifactKinds, selectedArtifactKinds }}
      />
    ))}
  </>
);

const BuildDriverWidgets = ({ selectedDrivers, setSelectedDrivers }) => (
  <>
    {BUILD_DRIVERS.map((buildDriverValue, i) => (
      <BuildDriverFilter
        buildDriverValue={buildDriverValue}
        key={i}
        {...{ selectedDrivers, setSelectedDrivers }}
      />
    ))}
  </>
);

const BuildStateWidgets = ({ selectedBuildStates, setSelectedBuildStates }) => (
  <>
    {BUILD_STATES.map((buildStateValue, i) => (
      <BuildStateFilter
        key={i}
        buildStateValue={buildStateValue}
        {...{ selectedBuildStates, setSelectedBuildStates }}
      />
    ))}
  </>
);

const BranchWidgets = ({ selectedBranches, setSelectedBranches }) => {
  return (
    <>
      <BranchFilter
        branchName={"All"}
        {...{ selectedBranches, setSelectedBranches }}
      />
      <BranchFilter
        branchName={"master"}
        {...{ selectedBranches, setSelectedBranches }}
      />
      {safeJsonParse(window.localStorage.getItem("branchNames"), [])
        .filter((branchName) => branchName !== "master")
        .map((branchName) => {
          return (
            <BranchFilter
              key={branchName}
              {...{ branchName, setSelectedBranches, selectedBranches }}
            />
          );
        })}
    </>
  );
};

const FilterModal = ({ closeAction: onClose = () => {} }) => {
  const { state, updateState, logoutAction } = useContext(GlobalContext);
  const { redirectHome } = useRedirectHome();
  const [selectedDrivers, setSelectedDrivers] = useState([
    ...state.uiFilters.build_driver,
  ]);

  const [selectedProjects, setSelectedProjects] = useState([
    ...state.uiFilters.project_id,
  ]);
  const [selectedArtifactKinds, setSelectedArtifactKinds] = useState([
    ...state.uiFilters.artifact_kinds,
  ]);
  const [selectedBuildStates, setSelectedBuildStates] = useState([
    ...state.uiFilters.build_state,
  ]);
  const [selectedBranches, setSelectedBranches] = useState(
    state.uiFilters.branch.length ? [...state.uiFilters.branch] : []
  );
  const history = useHistory();

  const handleApplyFilters = () => {
    updateState({
      isLoaded: false,
      needsRefresh: true,
    });
    onClose();
    const queryObject = {
      build_driver: selectedDrivers,
      build_state: selectedBuildStates,
      artifact_kinds: selectedArtifactKinds,
      project_id: selectedProjects,
      branch: selectedBranches,
    };

    history.push({
      path: "/",
      search: queryString.stringify(pickBy(queryObject, isNonEmptyArray)),
    });
  };

  const onLogout = () => {
    logoutAction();
    onClose();
    redirectHome();
  };

  const Footer = (
    <div className={styles.containerFooter}>
      <div className={styles.footerAction}>
        <div
          role="button"
          data-dismiss="modal"
          onClick={handleApplyFilters}
          className={cn(widgetStyles.btnLg, widgetStyles.primary)}
        >
          <Check />
          Apply Filters
        </div>

        <div
          role="button"
          data-dismiss="modal"
          aria-label="Close"
          onClick={onClose}
          className={cn(widgetStyles.btnLg, widgetStyles.primary)}
        >
          <X />
          <span>Cancel</span>
        </div>
      </div>
      <div className={styles.footerSettings}>
        <ThemeToggler />
        <div
          role="button"
          tabIndex={0}
          className={cn(widgetStyles.tagGhostUpper, widgetStyles.tagLink)}
          title="logout"
          onClick={onLogout}
        >
          <LogOut />
          <span>Logout</span>
        </div>
      </div>
    </div>
  );

  const Body = (
    <>
      <span className={styles.rowTitle}>Projects</span>

      <div className={styles.rowOfItems}>
        <ProjectWidgets {...{ selectedProjects, setSelectedProjects }} />
      </div>
      <span className={styles.rowTitle}>Artifact Kinds</span>
      <div className={styles.rowOfItems}>
        <ArtifactKindWidgets
          {...{ selectedArtifactKinds, setSelectedArtifactKinds }}
        />
      </div>
      <span className={styles.rowTitle}>Build Drivers</span>
      <div className={styles.rowOfItems}>
        <BuildDriverWidgets {...{ selectedDrivers, setSelectedDrivers }} />
      </div>
      <span className={styles.rowTitle}>Branches</span>
      <div className={styles.rowOfItems}>
        <BranchWidgets {...{ selectedBranches, setSelectedBranches }} />
      </div>
      <span className={styles.rowTitle}>Build State</span>
      <div className={styles.rowOfItems}>
        <BuildStateWidgets
          {...{ selectedBuildStates, setSelectedBuildStates }}
        />
      </div>
    </>
  );

  return (
    <Modal
      Title="Filter builds"
      Body={Body}
      Footer={Footer}
      onClose={onClose}
    />
  );
};

export default FilterModal;
