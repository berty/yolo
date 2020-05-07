import React, {useContext, useState} from 'react';
import {ThemeContext} from '../../../store/ThemeStore';
import {Check, GitBranch, GitMerge, GitCommit, X, LogOut} from 'react-feather';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAndroid, faApple} from '@fortawesome/free-brands-svg-icons';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import IconChat from '../../../assets/svg/IconChat';
import IconMini from '../../../assets/svg/IconMini';
import classNames from 'classnames';
import {ResultContext} from '../../../store/ResultStore';
import './FilterModal.scss';
import {
  PLATFORMS,
  ARTIFACT_KIND_TO_PLATFORM,
  ARTIFACT_KIND_VALUE,
  ARTIFACT_KINDS,
} from '../../../constants';
import ThemeToggler from '../ThemeToggler';
import {removeAuthCookie} from '../../../api/auth';

const FilterModal = ({closeAction, showingFiltersModal}) => {
  const {theme} = useContext(ThemeContext);
  const {state, updateState} = useContext(ResultContext);
  const [selectedProjects] = useState(['chat']);
  const [localArtifactKinds, setLocalArtifactKinds] = useState([
    ...state.uiFilters.artifact_kinds,
  ]);
  const [selectedBranches] = useState(['all']);
  const filterSelectedAccent = theme.icon.filterSelected;

  const updateLocalOs = ({name}) => {
    setSelectedOs([name]);
    setLocalPlatformId(PLATFORMS[name]);
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

  const ArtifactFilter = ({artifact_kind}) => {
    const selected = localArtifactKinds.includes(artifact_kind);
    const colorIcon = colorsIcon({selected});
    const colorWidget = colorsWidget({selected});
    const widgetClass = classNames('modal-filter-widget', {
      'modal-filter-not-implemented': false,
      'cannot-unselect': false,
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
    return (
      <div
        className={widgetClass}
        style={colorWidget}
        onClick={
          selected && localArtifactKinds.length >= 2
            ? () =>
                setLocalArtifactKinds(
                  localArtifactKinds.filter((kind) => kind !== artifact_kind)
                )
            : !selected
            ? () =>
                setLocalArtifactKinds([...localArtifactKinds, artifact_kind])
            : () => setLocalArtifactKinds([...ARTIFACT_KINDS])
        }
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
  const ProjectFilter = ({name}) => {
    const selected = selectedProjects.includes(name);
    const implemented = state.filtersImplemented.apps.includes(name);
    const colorIcon = colorsIcon({selected});
    const colorWidget = colorsWidget({selected});
    const widgetClass = classNames('modal-filter-widget', {
      'modal-filter-not-implemented': !implemented,
    });
    const icon =
      name === 'chat' ? (
        <IconChat stroke={colorIcon} />
      ) : name === 'mini' ? (
        <IconMini stroke={colorIcon} />
      ) : (
        <React.Fragment />
      );
    const projectName =
      name === 'chat'
        ? 'Berty Chat'
        : name === 'mini'
        ? 'Berty Mini'
        : 'Berty Maxi';
    return (
      <div className={widgetClass} style={colorWidget}>
        {icon}
        <p className="filter-text">{projectName}</p>
      </div>
    );
  };

  const BranchFilter = ({name}) => {
    const selected = selectedBranches.includes(name);
    const implemented = state.filtersImplemented.branch.includes(name);
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
    const branchName =
      name === 'all'
        ? 'All'
        : name === 'master'
        ? 'Master'
        : name === 'develop'
        ? 'Development'
        : '?';
    return (
      <div className={widgetClass} style={colorWidget}>
        {icon}
        <p className="filter-text">{branchName}</p>
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
                  Projects
                </div>
                <div className="filter-row">
                  {ProjectFilter({name: 'chat'})}
                  {ProjectFilter({name: 'mini'})}
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
                    localArtifactKinds.every((kind) =>
                      state.uiFilters.artifact_kinds.includes(kind)
                    )
                      ? {}
                      : updateState({
                          needsProgrammaticQuery: true,
                          isLoaded: false,
                          builds: [],
                          uiFilters: {artifact_kinds: localArtifactKinds},
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
