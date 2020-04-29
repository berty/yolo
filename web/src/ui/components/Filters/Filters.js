import React, {useEffect, useContext} from 'react';
import {GitMerge, GitBranch, GitCommit} from 'react-feather';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAndroid, faApple} from '@fortawesome/free-brands-svg-icons';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';

import {getBuildList, validateError} from '../../../api';

import {ResultContext} from '../../../store/ResultStore.js';
import {ThemeContext} from '../../../store/ThemeStore.js';

import IconChat from '../../../assets/svg/IconChat';
import IconMini from '../../../assets/svg/IconMini';

import './Filters.scss';
import {useHistory, useLocation} from 'react-router-dom';
import queryString from 'query-string';
import {PLATFORMS} from '../../../constants';

const Filters = () => {
  const {state, updateState} = useContext(ResultContext);
  const {theme} = useContext(ThemeContext);
  const history = useHistory();
  const {search} = useLocation();

  useEffect(() => {
    // TDOO: This is a weird place to make this request
    const makeRequest = () => {
      const {filtersPlatform, filtersImplemented} = state;
      const locationQuery = {'user-query': search};

      // Validate current filter state, then update URL bar with query
      // (Platform filters only; other query strings will trigger API call directly)
      const osToRequest = Object.entries(filtersPlatform)
        .map((p) => ({os: p[0], toInclude: p[1]}))
        .map((p) => ({...p, implemented: filtersImplemented.os.includes(p.os)}))
        .map((p) => ({...p, id: PLATFORMS[p.os]}))
        .filter((p) => p.implemented && p.toInclude)
        .map((p) => p.id);
      const queryObject = {
        artifact_kinds: osToRequest,
      };
      history.push({
        pathname: '/',
        search: queryString.stringify(queryObject),
      });

      updateState({
        error: null,
        isLoaded: false,
        items: [],
      });

      // send filters to API consumer function
      getBuildList({
        platformId: state.platformId,
        apiKey: state.apiKey,
        queryObject,
        locationQuery,
      })
        .then(
          (result) => {
            const {data: {builds = []} = {builds: []}} = result;
            updateState({
              items: builds,
              error: null,
            });
          },
          (error) => {
            updateState({
              error: validateError({error}),
            });
          }
        )
        .finally(() => {
          updateState({
            isLoaded: true,
            needsRequest: false,
          });
        });
    };
    if (state.needsRequest) {
      makeRequest();
    }
  }, [state.needsRequest]);

  const widgetAccentColor = theme.icon.filterSelected;

  const headerWidgetWrapperColors = {
    color: widgetAccentColor,
    borderColor: widgetAccentColor,
    backgroundColor: theme.bg.filter,
  };

  const HeaderWidgetWrapper = ({children}) => (
    <div className="widget-wrapper" style={headerWidgetWrapperColors}>
      {children}
    </div>
  );

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

  return (
    <div className="Filters">
      {FiltersAppWidget()}
      {FiltersPlatformWidget()}
      {FiltersBranchWidget()}
    </div>
  );
};

export default Filters;
