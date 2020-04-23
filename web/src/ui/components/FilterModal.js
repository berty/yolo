import React, {useContext, useState} from 'react';
import {ThemeContext} from '../../store/ThemeStore';
import {Check, GitBranch, GitMerge, GitCommit, X} from 'react-feather';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAndroid, faApple} from '@fortawesome/free-brands-svg-icons';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import IconChat from '../../assets/svg/IconChat';
import IconMini from '../../assets/svg/IconMini';
import classNames from 'classnames';
import {ResultContext, PLATFORMS} from '../../store/ResultStore';
import './FilterModal.scss';

const FilterModal = ({closeAction, showingFiltersModal}) => {
  const {theme} = useContext(ThemeContext);
  const {state, updateState} = useContext(ResultContext);
  const [selectedProjects] = useState(['chat']);
  const [selectedOs, setSelectedOs] = useState([
    ...Object.keys(state.filtersPlatform).filter(
      (k) => !!state.filtersPlatform[k]
    ),
  ]);
  const [localPlatformId, setLocalPlatformId] = useState(state.platformId);
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
    const widgetClass = classNames('modal-filter-widget--yl', {
      'modal-filter-not-implemented--yl': !implemented,
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
        <p className="filter-text--yl">{projectName}</p>
      </div>
    );
  };

  const OsFilter = ({name}) => {
    const selected = selectedOs.includes(name);
    const implemented = state.filtersImplemented.os.includes(name);
    const colorIcon = colorsIcon({selected});
    const colorWidget = colorsWidget({selected});
    const widgetClass = classNames('modal-filter-widget--yl', {
      'modal-filter-not-implemented--yl': !implemented,
    });
    const icon =
      name === 'iOS' ? (
        <FontAwesomeIcon icon={faApple} size="lg" color={colorIcon} />
      ) : name === 'android' ? (
        <FontAwesomeIcon icon={faAndroid} size="lg" color={colorIcon} />
      ) : name === 'macOS' ? (
        <FontAwesomeIcon icon={faApple} size="lg" color={colorIcon} />
      ) : (
        <FontAwesomeIcon icon={faQuestionCircle} size="lg" color={colorIcon} />
      );
    const osName =
      name === 'iOS'
        ? 'iOS'
        : name === 'android'
        ? 'Android'
        : name === 'macOS'
        ? 'Mac OS'
        : '?';
    return (
      <div
        className={widgetClass}
        style={colorWidget}
        onClick={implemented ? () => updateLocalOs({name}) : () => {}}
      >
        {icon}
        <p className="filter-text--yl">{osName}</p>
      </div>
    );
  };

  const BranchFilter = ({name}) => {
    const selected = selectedBranches.includes(name);
    const implemented = state.filtersImplemented.branch.includes(name);
    const colorIcon = colorsIcon({selected});
    const colorWidget = colorsWidget({selected});
    const widgetClass = classNames('modal-filter-widget--yl', {
      'modal-filter-not-implemented--yl': !implemented,
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
        <p className="filter-text--yl">{branchName}</p>
      </div>
    );
  };

  return (
    <>
      <div className="faded" />
      <div
        className="modal modal-blur fade show"
        id="modal-large"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered"
          role="document"
        >
          <div className="modal-content" style={colorsModal}>
            <div className="modal-header">
              <h5 className="modal-title" style={colorsModalTitle}>
                Filter the builds
              </h5>
              <div
                className="btn-close--yl"
                data-dismiss="modal"
                aria-label="Close"
                onClick={closeAction}
                style={colorsCloseButton}
              >
                <X size={14} strokeWidth={3} color={filterSelectedAccent} />
              </div>
            </div>
            <div className="modal-body">
              <div style={colorsModalTitle} className="subtitle--yl">
                Projects
              </div>
              <div className="filter-row--yl">
                {ProjectFilter({name: 'chat'})}
                {ProjectFilter({name: 'mini'})}
                {ProjectFilter({name: 'maxi'})}
              </div>
              <div style={colorsModalTitle} className="subtitle--yl">
                OS
              </div>
              <div className="filter-row--yl">
                {OsFilter({name: 'iOS'})}
                {OsFilter({name: 'android'})}
                {OsFilter({name: 'macOS'})}
              </div>
              <div style={colorsModalTitle} className="subtitle--yl">
                Branches
              </div>
              <div className="filter-row--yl">
                {BranchFilter({name: 'all'})}
                {BranchFilter({name: 'master'})}
                {BranchFilter({name: 'develop'})}
              </div>
            </div>
            <div className="modal-footer">
              <div
                type="button"
                className="btn-primary--yl"
                data-dismiss="modal"
                // TODO: Create action instead of doing this work here
                onClick={() => {
                  const emptyFilters = {
                    iOS: false,
                    android: false,
                  };
                  const [localPlatformName] = selectedOs;
                  localPlatformId === state.platformId
                    ? {}
                    : updateState({
                        platformId: localPlatformId,
                        isLoaded: false,
                        items: [],
                        filtersPlatform: {
                          ...emptyFilters,
                          [localPlatformName]: true,
                        },
                      });
                  closeAction();
                }}
                style={applyFilterButtonColors}
              >
                <Check />
                <div className="btn-text--yl">Apply Filters</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterModal;
