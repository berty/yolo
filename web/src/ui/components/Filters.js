import React, {useEffect, useContext} from 'react';
import axios from 'axios';
import {response} from '../../assets/faker.js';
import {ResultContext, PLATFORMS} from '../../store/ResultStore.js';
import {cloneDeep} from 'lodash';
import {ThemeContext} from '../../store/ThemeStore.js';
import './Filters.scss';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAndroid, faApple} from '@fortawesome/free-brands-svg-icons';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import IconChat from '../../assets/svg/IconChat';
import IconMini from '../../assets/svg/IconMini';
import {GitMerge, GitBranch, GitCommit} from 'react-feather';

const getData = ({platformId, apiKey}) =>
  process.env.YOLO_UI_TEST === 'true'
    ? Promise.resolve(response).then(async (response) => {
        await new Promise((r) => setTimeout(r, 200));
        return await response;
      })
    : axios.get(
        `${process.env.API_SERVER}/api/build-list?artifact_kind=${platformId}&`,
        {
          headers: apiKey
            ? {
                Authorization: 'Basic ' + btoa(`${apiKey}`),
              }
            : {},
        }
      );

const Filters = () => {
  const {state, updateState} = useContext(ResultContext);
  const {theme} = useContext(ThemeContext);

  useEffect(() => {
    const makeRequest = () => {
      updateState({
        error: null,
        isLoaded: false,
        items: [],
        needsRequest: true,
      });
      getData({platformId: state.platformId, apiKey: state.apiKey})
        .then(
          (result) => {
            if (
              !result ||
              !result.data ||
              !result.data.builds ||
              !Array.isArray(result.data.builds)
            ) {
              throw new Error('No build list from server!');
            }
            const {
              data: {builds},
            } = result;

            updateState({
              isLoaded: true,
              items: cloneDeep(builds),
              error: null,
              needsRequest: false,
            });
          },
          (error) => {
            updateState({
              isLoaded: true,
              needsRequest: false,
            });
            if (!error.response)
              return updateState(
                cloneDeep({
                  error: {message: 'Network Error', status: 500, data: ''},
                })
              );
            const {
              response: {statusText: message, status, data},
            } = error;
            updateState({
              error: {message, status, data},
            });
          }
        )
        .catch((err) => {
          // TODO: This kind of stuff should be in an error boundary component.
          updateState({
            isLoaded: true,
            needsRequest: false,
            items: [],
            error: {
              message: err.message || 'Error making your request.',
              status: 0,
              data: '',
            },
          });
        });
    };
    if (
      (state.platformId !== PLATFORMS.none && state.isLoaded === false) ||
      state.needsRequest
    ) {
      makeRequest();
    }
  }, [
    // TODO: Simplify to needsRequest
    state.apiKey,
    state.platformId,
    state.appFilter,
    state.isLoaded,
    state.needsRequest,
  ]);

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
