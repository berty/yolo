/* eslint-disable import/no-named-as-default */
import React, {useContext, useState, useEffect} from 'react';
import {useLocation, useHistory} from 'react-router-dom';
import {cloneDeep} from 'lodash';
import queryString from 'query-string';
import Cookies from 'js-cookie';

import Header from '../../components/Header/Header';
import ErrorDisplay from '../../components/ErrorDisplay/ErrorDisplay';
import BuildList from '../../components/BuildList';
import ApiKeyPrompt from '../../components/ApiKeyPrompt';
import ShowFiltersButton from '../../components/ShowFiltersButton';
import FilterModal from '../../components/FilterModal/FilterModal';
import MessageModal from '../../components/MessageModal/MessageModal';

import {ThemeContext} from '../../../store/ThemeStore';
import {ResultContext} from '../../../store/ResultStore';

import {PLATFORMS} from '../../../constants';
import {getBuildList, validateError} from '../../../api';

import './Home.scss';
import {queryHasMaster} from '../../../api/dataTransforms';

const Home = () => {
  const {theme} = useContext(ThemeContext);
  const {state, updateState} = useContext(ResultContext);
  const [showingFiltersModal, toggleShowFilters] = useState(false);
  const [showingDisclaimerModal, toggleShowDisclaimer] = useState(false);
  const [needsNewFetch, setNeedsNewFetch] = useState(true);
  const {search: locationSearch} = useLocation();
  const history = useHistory();

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg.page;
  }, [theme.name]);

  useEffect(() => {
    const disclaimerAccepted = Cookies.get('disclaimerAccepted');
    toggleShowDisclaimer(disclaimerAccepted ? false : true);
  }, []);

  useEffect(() => {
    if (!locationSearch) {
      history.push({
        pathname: '/',
        search: queryString.stringify({artifact_kinds: state.platformId}),
      });
    }
  }, []);

  useEffect(() => {
    const getNewFetch = () => {
      updateState({
        error: null,
        isLoaded: false,
      });
      getBuildList({
        apiKey: state.apiKey,
        queryObject: queryString.parse(locationSearch),
        locationQuery: queryString.parse({'user-query': locationSearch}),
      })
        .then(
          (result) => {
            const {data: {builds = []} = {builds: []}} = result;
            updateState({
              builds,
              error: null,
              isAuthed: true,
            });
          },
          (error) => {
            const validatedError = validateError({error});
            updateState({
              error: validatedError,
              isAuthed: validatedError.status !== 401,
            });
          }
        )
        .finally(() => {
          setNeedsNewFetch(false);
          updateState({
            isLoaded: true,
          });
        });
    };
    if (needsNewFetch && locationSearch) {
      getNewFetch();
    }
  }, [locationSearch, needsNewFetch]);

  useEffect(() => {
    const triggerNewQuery = () => {
      updateState({
        needsProgrammaticQuery: false,
      });
      history.push({
        path: '/',
        search: queryString.stringify({artifact_kinds: [state.platformId]}),
      });
      setNeedsNewFetch(true);
    };
    if (state.needsProgrammaticQuery === true) triggerNewQuery();
  }, [state.needsProgrammaticQuery]);

  useEffect(() => {
    const triggerNewQuery = () => {
      updateState({
        needsRefresh: false,
      });
      history.push({
        path: '/',
        search: locationSearch,
      });
      setNeedsNewFetch(true);
    };
    if (state.needsRefresh === true) triggerNewQuery();
  }, [state.needsRefresh]);

  const setDisclaimerAccepted = (accepted) => {
    Cookies.set('disclaimerAccepted', 1, {expires: 7});
    toggleShowDisclaimer(accepted ? false : true);
  };

  return (
    <div className={'Home'}>
      <div className="page" style={{backgroundColor: theme.bg.page}}>
        <Header />
        {state.error && <ErrorDisplay error={state.error} />}
        {state.error && state.error.status === 401 && (
          <ApiKeyPrompt failedKey={state.apiKey} updateState={updateState} />
        )}
        {!state.error && state.platformId !== PLATFORMS.none && (
          <BuildList
            builds={cloneDeep(state.builds)}
            loaded={state.isLoaded}
            collapseCondition={queryHasMaster}
          />
        )}
        <div
          className="footer p-4"
          style={{backgroundColor: theme.bg.block}}
        ></div>
      </div>
      {showingDisclaimerModal && (
        <MessageModal closeAction={() => setDisclaimerAccepted(true)} />
      )}
      {!showingFiltersModal && state.isAuthed && (
        <ShowFiltersButton
          showingFiltersModal={showingFiltersModal}
          clickAction={() => toggleShowFilters(!showingFiltersModal)}
        />
      )}
      {showingFiltersModal && state.isAuthed && (
        <FilterModal closeAction={() => toggleShowFilters(false)} />
      )}
    </div>
  );
};

export default Home;
