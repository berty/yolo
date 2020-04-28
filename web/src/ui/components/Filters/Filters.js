import React, {useEffect, useContext} from 'react';
import {GitMerge, GitBranch, GitCommit} from 'react-feather';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAndroid, faApple} from '@fortawesome/free-brands-svg-icons';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';

import {getData, validateError} from '../../../api';

import {ResultContext} from '../../../store/ResultStore.js';
import {ThemeContext} from '../../../store/ThemeStore.js';

import IconChat from '../../../assets/svg/IconChat';
import IconMini from '../../../assets/svg/IconMini';

import './Filters.scss';

const Filters = () => {
  const {state, updateState} = useContext(ResultContext);
  const {theme} = useContext(ThemeContext);

  useEffect(() => {
    const makeRequest = () => {
      updateState({
        error: null,
        isLoaded: false,
        items: [],
      });
      getData({platformId: state.platformId, apiKey: state.apiKey})
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

  const filterAccentColor = theme.icon.filterSelected;

  const headerWidgetWrapperColors = {
    color: filterAccentColor,
    borderColor: filterAccentColor,
    backgroundColor: theme.bg.filter,
  };

  const HeaderWidgetWrapper = ({children}) => (
    <div className="filter--yl" style={headerWidgetWrapperColors}>
      {children}
    </div>
  );

  const HeaderWidget = ({children, text}) => {
    return (
      <React.Fragment>
        {children}
        {text && <p className="filter-text--yl">{text}</p>}
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
                children={<IconChat stroke={filterAccentColor} />}
              />
            }
          />
        )}
        {mini && (
          <HeaderWidgetWrapper
            children={
              <HeaderWidget
                text="Mini"
                children={<IconMini stroke={filterAccentColor} />}
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
                    color={filterAccentColor}
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
          children={<GitBranch color={filterAccentColor} />}
        />
      );
    } else if (master) {
      branchWidget = (
        <HeaderWidget
          text="Master"
          children={<GitCommit color={filterAccentColor} />}
        />
      );
    } else if (develop) {
      branchWidget = (
        <HeaderWidget
          text="Develop"
          children={<GitMerge color={filterAccentColor} />}
        />
      );
    } else {
      branchWidget = <React.Fragment />;
    }
    return <HeaderWidgetWrapper children={branchWidget} />;
  };

  return (
    <div className="filter-wrapper--yl">
      {FiltersAppWidget()}
      {FiltersPlatformWidget()}
      {FiltersBranchWidget()}
    </div>
  );
};

export default Filters;
