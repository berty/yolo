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

const Filters = () => {
  const {state, updateState} = useContext(ResultContext);
  const {theme} = useContext(ThemeContext);
  const widgetAccentColor = theme.icon.filterSelected;

  const headerWidgetWrapperColors = {
    color: widgetAccentColor,
    borderColor: widgetAccentColor,
    backgroundColor: theme.bg.filter,
  };

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

  const FiltersPlatformWidget = () => {
    const platforms = Object.entries(state.filtersPlatform)
      .map((e) => ({
        name: e[0],
        val: e[1],
      }))
      .filter((p) => p.val);
    return (
      <React.Fragment>
        {platforms.length > 0 && (
          <HeaderWidgetWrapper
            children={platforms.map((p) => (
              <HeaderWidget
                key={p.name}
                children={
                  <FontAwesomeIcon
                    icon={
                      p.name === 'iOS'
                        ? faApple
                        : p.name === 'android'
                        ? faAndroid
                        : faQuestionCircle
                    }
                    size="lg"
                    color={widgetAccentColor}
                  />
                }
              />
            ))}
          />
        )}
      </React.Fragment>
    );
  };

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
          // Note, won't work for maually inputted URLs
          needsProgrammaticQuery: true,
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
      {FiltersPlatformWidget()}
      {FiltersBranchWidget()}
      {RefreshActionButton}
      {Logout}
    </div>
  );
};

export default Filters;
