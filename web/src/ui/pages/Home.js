import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {response} from '../../assets/faker.js';
import {has} from 'lodash';

import './Home.scss';
import ApiKeyPrompt from '../components/ApiKeyPrompt.js';
import BuildList from '../components/BuildList.js';

const PLATFORMS = {
  iOS: '1',
  android: '2',
  none: '3',
};

const getData = ({platformId, apiKey}) =>
  process.env.YOLO_UI_TEST === 'true'
    ? Promise.resolve(response)
    : axios.get(
        `${process.env.API_URL}/build-list?artifact_kind=${platformId}&`,
        {
          headers: apiKey
            ? {
                Authorization: 'Basic ' + btoa(`${apiKey}`),
              }
            : {},
        }
      );

const Home = () => {
  const [platformId, setPlatformId] = useState(PLATFORMS.none);
  const [apiKey, setApiKey] = useState(`${process.env.YOLO_APP_PW || ''}`);

  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(true);
  const [items, setItems] = useState([]);
  const baseURL = `${document.location.protocol}//${document.location.host}`;

  useEffect(() => {
    const makeRequest = () => {
      setError(null);
      setIsLoaded(false);
      getData({platformId, apiKey}).then(
        (result) => {
          const {
            data: {builds},
          } = result;
          setError(null);
          setIsLoaded(true);
          setItems(builds);
        },
        (error) => {
          setIsLoaded(true);
          if (!error.response)
            return setError({message: 'Network Error', status: 500, data: ''});
          const {
            response: {statusText: message, status, data},
          } = error;
          setError({message, status, data});
        }
      );
    };
    if (platformId !== PLATFORMS.none) makeRequest();
  }, [apiKey, platformId]);

  const errorDisplay = () => (
    <section>
      <h3 className="title">
        Error {error.status || ''}: {error.message}
      </h3>
      {error.data && <small>{error.data}</small>}
    </section>
  );

  return (
    <div className="container mt-3">
      <h2>Yolo!</h2>
      <section>
        <h4 className="subtitle">Filters:</h4>
        <div className="form-group">
          <select
            disabled={!isLoaded}
            className="mb-4"
            id="kind"
            onChange={(e) => {
              const {
                target: {value: platform},
              } = e;
              return setPlatformId(platform);
            }}
          >
            <option defaultValue value={PLATFORMS.none}>
              Platform
            </option>
            <option value={PLATFORMS.iOS}>iOS</option>
            <option value={PLATFORMS.android}>Android</option>
          </select>
        </div>
      </section>
      {/* TODO: Factor into HOC */}
      {error && errorDisplay()}
      {error && error.status === 401 && (
        <ApiKeyPrompt failedKey={apiKey} setApiKey={setApiKey} />
      )}
      {!error && isLoaded && platformId !== PLATFORMS.none && (
        <BuildList builds={items} platformId={platformId} baseURL={baseURL} />
      )}
      {!isLoaded && <div>Loading...</div>}
    </div>
  );
};

export default Home;
