/* eslint-disable import/no-named-as-default */
import React, {useContext, useState, useEffect} from 'react';
import {
  BrowserRouter as Router,
  Link,
  useLocation,
  useHistory,
} from 'react-router-dom';
import {cloneDeep} from 'lodash';
import queryString from 'query-string';

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

import Cookies from 'js-cookie';

import './Home.scss';

const Home = () => {
  const {theme} = useContext(ThemeContext);
  const {state, updateState} = useContext(ResultContext);
  const [showingFiltersModal, toggleShowFilters] = useState(false);
  const [showingDisclaimerModal, toggleShowDisclaimer] = useState(false);
  const [defaultParams, setDefaultParams] = useState(false);
  const {search} = useLocation();
  const history = useHistory();

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg.page;
  }, [theme.name]);

  useEffect(() => {
    const disclaimerAccepted = Cookies.get('disclaimerAccepted');
    toggleShowDisclaimer(disclaimerAccepted ? false : true);
  }, []);

  useEffect(() => {
    if (!search && !defaultParams) {
      history.push({
        pathname: '/',
        search: queryString.stringify({'artifact-kinds': state.platformId}),
      });
    }
    setDefaultParams(true);
  }, []);

  useEffect(() => {});

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
          <ApiKeyPrompt failedKey={state.apiKey} setApiKey={updateState} />
        )}
        {!state.error && state.platformId !== PLATFORMS.none && (
          <BuildList builds={cloneDeep(state.items)} loaded={state.isLoaded} />
        )}
        <div
          className="footer p-4"
          style={{backgroundColor: theme.bg.block}}
        ></div>
      </div>
      {showingDisclaimerModal && (
        <MessageModal closeAction={() => setDisclaimerAccepted(true)} />
      )}
      {!showingFiltersModal && (
        <ShowFiltersButton
          showingFiltersModal={showingFiltersModal}
          clickAction={() => toggleShowFilters(!showingFiltersModal)}
        />
      )}
      {showingFiltersModal && (
        <FilterModal closeAction={() => toggleShowFilters(false)} />
      )}
    </div>
  );
};

export default Home;
