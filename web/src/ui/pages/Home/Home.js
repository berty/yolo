/* eslint-disable import/no-named-as-default */
import React, {useContext, useState, useEffect} from 'react';
import {ThemeContext} from '../../../store/ThemeStore';
import './Home.scss';
import Header from '../../components/Header/Header';
import {ResultContext} from '../../../store/ResultStore';
import ErrorDisplay from '../../components/ErrorDisplay';
import BuildList from '../../components/BuildList';
import ApiKeyPrompt from '../../components/ApiKeyPrompt';
import {cloneDeep} from 'lodash';
import ShowFiltersButton from '../../components/ShowFiltersButton';
import FilterModal from '../../components/FilterModal';
import {PLATFORMS} from '../../../constants';

const Home = () => {
  const {theme} = useContext(ThemeContext);
  const {state, updateState} = useContext(ResultContext);
  const [showingFiltersModal, toggleShowFilters] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg.page;
  }, [theme.name]);

  return (
    <div className={'app--app-container'}>
      <div className="app--page" style={{backgroundColor: theme.bg.page}}>
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
