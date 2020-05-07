import React, {useContext} from 'react';
import {GitMerge, GitBranch, GitCommit, LogOut} from 'react-feather';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAndroid, faApple} from '@fortawesome/free-brands-svg-icons';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';

import {ResultContext} from '../../../store/ResultStore.js';
import {ThemeContext} from '../../../store/ThemeStore.js';

import IconChat from '../../../assets/svg/IconChat';
import IconMini from '../../../assets/svg/IconMini';

import './Filters.scss';
import {removeAuthCookie} from '../../../api/auth';
import {ARTIFACT_KIND_VALUE, ARTIFACT_VALUE_KIND} from '../../../constants';

const Filters = () => {
  const {state, updateState} = useContext(ResultContext);
  const {theme} = useContext(ThemeContext);
  const widgetAccentColor = theme.icon.filterSelected;

  const headerWidgetWrapperColors = {
    color: widgetAccentColor,
    borderColor: widgetAccentColor,
    backgroundColor: theme.bg.filter,
  };

  const shouldRenderUiFilter = ({key = artifact_kinds}) =>
    state.uiFilters[key] &&
    Array.isArray(state.uiFilters[key]) &&
    state.uiFilters[key].length > 0;

  // TODO: Unecessary abstraction
  const HeaderWidgetWrapper = ({children}) => (
    <div className="widget-wrapper" style={headerWidgetWrapperColors}>
      {children}
    </div>
  );

  // TODO: Unecessary abstraction
  const HeaderWidget = ({children, text}) => {
    return (
      <React.Fragment>
        {children}
        {text && <p className="widget-text">{text}</p>}
      </React.Fragment>
    );
  };

  const FiltersAppWidget = () => {
    const {
      filtersApp: {chat, mini},
    } = state;
    return (
      <React.Fragment>
        {chat && (
          <HeaderWidgetWrapper
            children={
              <HeaderWidget
                text="Chat"
                children={<IconChat stroke={widgetAccentColor} />}
              />
            }
          />
        )}
        {mini && (
          <HeaderWidgetWrapper
            children={
              <HeaderWidget
                text="Mini"
                children={<IconMini stroke={widgetAccentColor} />}
              />
            }
          />
        )}
      </React.Fragment>
    );
  };

  const ArtifactKindsFilter = () =>
    shouldRenderUiFilter({key: 'artifact_kinds'}) && (
      <div className="widget-wrapper" style={headerWidgetWrapperColors}>
        {state.uiFilters.artifact_kinds.map((kind, i) => (
          <FontAwesomeIcon
            key={i}
            size="lg"
            color={widgetAccentColor}
            icon={
              kind == ARTIFACT_KIND_VALUE.IPA ||
              kind === ARTIFACT_KIND_VALUE.DMG
                ? faApple
                : kind === ARTIFACT_KIND_VALUE.APK
                ? faAndroid
                : faQuestionCircle
            }
            title={ARTIFACT_VALUE_KIND[kind.toString()] || ''}
          />
        ))}
      </div>
    );

  const FiltersBranchWidget = () => {
    const {
      filtersBranch: {master, develop, all},
    } = state;
    let branchWidget;
    if (all) {
      branchWidget = (
        <HeaderWidget
          text="All"
          children={<GitBranch color={widgetAccentColor} />}
        />
      );
    } else if (master) {
      branchWidget = (
        <HeaderWidget
          text="Master"
          children={<GitCommit color={widgetAccentColor} />}
        />
      );
    } else if (develop) {
      branchWidget = (
        <HeaderWidget
          text="Develop"
          children={<GitMerge color={widgetAccentColor} />}
        />
      );
    } else {
      branchWidget = <React.Fragment />;
    }
    return <HeaderWidgetWrapper children={branchWidget} />;
  };

  const RefreshActionButton = (
    <div
      className="widget-wrapper"
      style={{color: theme.text.sectionTitle}}
      onClick={() => {
        updateState({
          needsRefresh: true,
        });
      }}
    >
      <div className="widget-text no-svg is-interactive">F5</div>
    </div>
  );

  const Logout = (
    <div
      className="widget-wrapper"
      style={{color: theme.text.sectionTitle}}
      onClick={() => {
        removeAuthCookie();
        updateState({
          isAuthed: false,
          apiKey: '',
          needsProgrammaticQuery: true,
        });
      }}
    >
      <LogOut />
      <p className="widget-text is-interactive">Logout</p>
    </div>
  );

  return (
    <div className="Filters">
      {FiltersAppWidget()}
      {ArtifactKindsFilter()}
      {FiltersBranchWidget()}
      {RefreshActionButton}
      {Logout}
    </div>
  );
};

export default Filters;
