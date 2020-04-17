/* eslint-disable import/no-named-as-default */
import React, {useContext} from 'react';
import {ThemeContext} from '../../../store/ThemeStore';
import './Home.scss';
import Header from '../../components/Header/Header';
import {ResultContext, PLATFORMS} from '../../../store/ResultStore';
import ErrorDisplay from '../../components/ErrorDisplay';
import BuildList from '../../components/BuildList';
import ApiKeyPrompt from '../../components/ApiKeyPrompt';
import {cloneDeep} from 'lodash';

const Home = () => {
  const {theme} = useContext(ThemeContext);
  const {state, updateState} = useContext(ResultContext);

  return (
    <div className={'app--app-container'}>
      <div className="app--page" style={{backgroundColor: theme.bg.page}}>
        <Header />
        {state.error && <ErrorDisplay error={state.error} />}
        {state.error && state.error.status === 401 && (
          <ApiKeyPrompt failedKey={state.apiKey} setApiKey={updateState} />
        )}
        {!state.error && state.platformId !== PLATFORMS.none && (
          <BuildList
            builds={cloneDeep(state.items)}
            baseURL={state.baseURL}
            loaded={state.isLoaded}
          />
        )}
        <div
          className="footer p-4"
          style={{backgroundColor: theme.bg.block}}
        ></div>
      </div>
    </div>
  );
};

export default Home;
