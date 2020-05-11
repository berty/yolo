import React, {useContext, useState} from 'react';
import {Check, GitBranch, GitMerge, GitCommit, X, LogOut} from 'react-feather';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAndroid, faApple} from '@fortawesome/free-brands-svg-icons';
import {faQuestionCircle, faCube} from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import {flatten, uniq} from 'lodash';
import {Form} from 'tabler-react';

import './FilterModal.scss';
import {ThemeContext} from '../../../store/ThemeStore';
import IconChat from '../../../assets/svg/IconChat';
import {ResultContext, INITIAL_STATE} from '../../../store/ResultStore';
import {
  ARTIFACT_KIND_TO_PLATFORM,
  ARTIFACT_KIND_VALUE,
  PROJECT,
  BRANCH_TO_DISPLAY_NAME,
  PROJECT_ARTIFACT_KINDS,
  PROJECT_BUILD_DRIVER,
} from '../../../constants';
import ThemeToggler from '../ThemeToggler';
import {removeAuthCookie} from '../../../api/auth';

const FilterModal = ({closeAction, showingFiltersModal}) => {
  const {theme} = useContext(ThemeContext);
  const {state, updateState} = useContext(ResultContext);
  const [filterByProject, setFilterByProject] = useState(true);
  const [selectedDrivers, setSelectedDrivers] = useState([
    ...state.uiFilters.build_driver,
  ]);
  const [selectedProjects, setSelectedProjects] = useState([
    ...state.calculatedFilters.projects,
  ]);
  const [localArtifactKinds, setLocalArtifactKinds] = useState([
    ...state.uiFilters.artifact_kinds,
  ]);
  const [selectedBranches] = useState(['all']);
  const filterSelectedAccent = theme.icon.filterSelected;

  const useFilterByProject = () => {
    setFilterByProject(true);
    setSelectedDrivers(
      uniq([
        ...selectedProjects
          .map((p) => PROJECT_BUILD_DRIVER[p])
          .filter((d) => !!d),
      ])
    );
    setLocalArtifactKinds([
      ...uniq(
        flatten(
          selectedProjects
            .map((p) => PROJECT_ARTIFACT_KINDS[p])
            .filter((p) => !!p)
        )
      ),
    ]);
  };

  const doNotFilterByProject = () => {
    setFilterByProject(false);
    setSelectedProjects([]);
    setSelectedDrivers([]);
    setLocalArtifactKinds([]);
  };

  const applyFilterButtonColors = {
    backgroundColor: theme.bg.btnPrimary,
    border: '1px solid ' + theme.bg.btnPrimary,
    boxShadow: '0px 4px 0px ' + theme.shadow.btnPrimary,
  };

  const colorsCloseButton = {
    backgroundColor: theme.bg.filter,
  };

  const colorsModal = {
    backgroundColor: theme.bg.page,
    color: theme.text.sectionText,
  };

  const colorsModalTitle = {
    color: theme.text.sectionTitle,
  };

  const isArrayWithStuff = (val) =>
    !!val && Array.isArray(val) && val.length > 0;

  const ArtifactFilter = ({artifact_kind}) => {
    const selected = localArtifactKinds.includes(artifact_kind);
    const colorIcon = colorsIcon({selected});
    const colorWidget = colorsWidget({selected});
    const widgetClass = classNames('modal-filter-widget', {
      'modal-filter-not-implemented': false,
      'cannot-unselect': false,
      'not-interactive': filterByProject,
    });
    const icon =
      artifact_kind === ARTIFACT_KIND_VALUE.IPA ||
      artifact_kind === ARTIFACT_KIND_VALUE.DMG ? (
        <FontAwesomeIcon icon={faApple} size="lg" color={colorIcon} />
      ) : artifact_kind === ARTIFACT_KIND_VALUE.APK ? (
        <FontAwesomeIcon icon={faAndroid} size="lg" color={colorIcon} />
      ) : (
        <FontAwesomeIcon icon={faQuestionCircle} size="lg" color={colorIcon} />
      );
    const osName = ARTIFACT_KIND_TO_PLATFORM[artifact_kind.toString()];
    const addArtifactFilter = () => {
      !filterByProject &&
        !localArtifactKinds.includes(artifact_kind) &&
        setLocalArtifactKinds([...localArtifactKinds, artifact_kind]);
    };
    const removeArtifactFilter = () => {
      !filterByProject &&
        setLocalArtifactKinds(
          localArtifactKinds.filter((kind) => kind !== artifact_kind)
        );
    };
    return (
      <div
        className={widgetClass}
        style={colorWidget}
        onClick={selected ? removeArtifactFilter : addArtifactFilter}
      >
        {icon}
        <p className="filter-text">{osName}</p>
      </div>
    );
  };

  const colorsWidget = ({selected} = {selected: false}) => {
    const {
      text: {filterSelectedTitle, filterUnselectedTitle},
      bg: {filter: bgFilter},
      border: {
        filterSelected: selectedBorder,
        filterUnselected: unselectedBorder,
      },
    } = theme;
    return selected
      ? {
          color: filterSelectedTitle,
          borderColor: selectedBorder,
          backgroundColor: bgFilter,
        }
      : {
          color: filterUnselectedTitle,
          borderColor: unselectedBorder,
          background: 'transparent',
        };
  };

  const colorsIcon = ({selected} = {selected: false}) => {
    return selected ? theme.icon.filterSelected : theme.icon.filterUnselected;
  };

  const ProjectFilter = ({project}) => {
    const selected = selectedProjects.includes(project);
    const colorIcon = colorsIcon({selected});
    const colorWidget = colorsWidget({selected});
    const widgetClass = classNames('modal-filter-widget', {
      'modal-filter-not-implemented': false,
      'cannot-unselect': false,
      'not-interactive': !filterByProject,
    });
    const icon =
      project === PROJECT.chat ? (
        <IconChat stroke={colorIcon} />
      ) : project === PROJECT['gomobile-ipfs-demo'] ? (
        <FontAwesomeIcon icon={faCube} size="lg" color={colorIcon} />
      ) : (
        <FontAwesomeIcon icon={faQuestionCircle} size="lg" color={colorIcon} />
      );
    const displayText = PROJECT[project] || 'Unknown Project';

    // TODO: Messy
    const addProjectFilter = () => {
      filterByProject &&
        isArrayWithStuff(PROJECT_ARTIFACT_KINDS[project]) &&
        setLocalArtifactKinds(
          uniq([...localArtifactKinds, ...PROJECT_ARTIFACT_KINDS[project]])
        );
      filterByProject &&
        setSelectedDrivers(
          uniq([...selectedDrivers, PROJECT_BUILD_DRIVER[project]])
        );
      filterByProject &&
        setSelectedProjects(uniq([...selectedProjects, PROJECT[project]]));
    };
    const removeProjectFilter = () => {
      isArrayWithStuff(PROJECT_ARTIFACT_KINDS[project]) &&
        setLocalArtifactKinds(
          localArtifactKinds.filter(
            (a) => !PROJECT_ARTIFACT_KINDS[project].includes(a)
          )
        );
      setSelectedDrivers(
        !!PROJECT_BUILD_DRIVER[project] &&
          selectedDrivers.filter((d) => d !== PROJECT_BUILD_DRIVER[project])
      );
      setSelectedProjects(
        !!PROJECT[project] &&
          selectedProjects.filter((p) => p !== PROJECT[project])
      );
    };
    const noOp = () => {};

    return (
      <div
        className={widgetClass}
        style={colorWidget}
        onClick={
          !filterByProject
            ? noOp
            : selected
            ? removeProjectFilter
            : addProjectFilter
        }
      >
        {icon}
        <p className="filter-text">{displayText}</p>
      </div>
    );
  };

  const BranchFilter = ({name}) => {
    const selected = selectedBranches.includes(name);
    const implemented = name.toUpperCase() === 'ALL';
    const colorIcon = colorsIcon({selected});
    const colorWidget = colorsWidget({selected});
    const widgetClass = classNames('modal-filter-widget', {
      'modal-filter-not-implemented': !implemented,
    });
    const icon =
      name === 'all' ? (
        <GitBranch color={colorIcon} />
      ) : name === 'master' ? (
        <GitCommit color={colorIcon} />
      ) : name === 'develop' ? (
        <GitMerge color={colorIcon} />
      ) : (
        <React.Fragment />
      );
    const branchDisplayName =
      BRANCH_TO_DISPLAY_NAME[name.toUpperCase()] || 'Unknown Branch';
    return (
      <div className={widgetClass} style={colorWidget}>
        {icon}
        <p className="filter-text">{branchDisplayName}</p>
      </div>
    );
  };

  return (
    <React.Fragment>
      <div className="faded" />
      <span className="FilterModal">
        <div
          className="modal modal-blur fade show modal-open"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            role="document"
          >
            <div className="modal-content" style={colorsModal}>
              <div className="modal-header">
                <h5 className="modal-title" style={colorsModalTitle}>
                  Filter the builds
                </h5>
                <div
                  className="btn-close"
                  data-dismiss="modal"
                  aria-label="Close"
                  onClick={closeAction}
                  style={colorsCloseButton}
                >
                  <X size={14} strokeWidth={3} color={filterSelectedAccent} />
                </div>
              </div>
              <div className="modal-body">
                <div style={colorsModalTitle} className="subtitle">
                  Filter by project
                </div>
                <div className="filter-row">
                  <Form.Switch
                    checked={filterByProject}
                    onChange={() =>
                      filterByProject
                        ? doNotFilterByProject()
                        : useFilterByProject()
                    }
                  />
                </div>
                <div style={colorsModalTitle} className="subtitle">
                  Projects
                </div>
                <div className="filter-row">
                  {ProjectFilter({project: PROJECT['chat']})}
                  {ProjectFilter({project: PROJECT['gomobile-ipfs-demo']})}
                </div>
                <div style={colorsModalTitle} className="subtitle">
                  Artifact Kinds
                </div>
                <div className="filter-row">
                  {ArtifactFilter({artifact_kind: '0'})}
                  {ArtifactFilter({artifact_kind: '1'})}
                  {ArtifactFilter({artifact_kind: '2'})}
                  {ArtifactFilter({artifact_kind: '3'})}
                </div>
                <div style={colorsModalTitle} className="subtitle">
                  Branches
                </div>
                <div className="filter-row">
                  {BranchFilter({name: 'all'})}
                  {BranchFilter({name: 'master'})}
                  {BranchFilter({name: 'develop'})}
                </div>
              </div>
              <div className="modal-footer">
                <div
                  type="button"
                  className="btn btn-primary"
                  data-dismiss="modal"
                  onClick={() => {
                    updateState({
                      needsProgrammaticQuery: true,
                      isLoaded: false,
                      builds: [],
                      uiFilters: {
                        build_driver: [...selectedDrivers],
                        artifact_kinds: [...localArtifactKinds],
                      },
                      calculatedFilters: {
                        projects: [...selectedProjects],
                      },
                    });
                    closeAction();
                  }}
                  style={applyFilterButtonColors}
                >
                  <Check />
                  Apply Filters
                </div>
              </div>
              <div className="modal-footer settings">
                <ThemeToggler />
                {state.apiKey && state.isAuthed && (
                  <div
                    className="btn btn-sm"
                    style={{display: 'flex', alignItems: 'center'}}
                    onClick={() => {
                      removeAuthCookie();
                      updateState({
                        isAuthed: false,
                        apiKey: '',
                        needsProgrammaticQuery: true,
                        uiFilters: INITIAL_STATE.uiFilters,
                        calculatedFilters: INITIAL_STATE.calculatedFilters,
                      });
                      closeAction();
                    }}
                  >
                    <LogOut height="14" color={filterSelectedAccent} />
                    Logout
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </span>
    </React.Fragment>
  );
};

export default FilterModal;
