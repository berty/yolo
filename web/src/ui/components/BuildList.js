import React, {useState, useEffect} from 'react';
import Card from './Card';
import axios from 'axios';
import {response} from '../../assets/faker.js';
import ApiKeyPrompt from './ApiKeyPrompt';
import {has} from 'lodash';

const BuildList = ({platformName, platformId, apiKey, setApiKey}) => {
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState([]);
  const [baseURL, setBaseURL] = useState('');
  const [hasValidAPIKey, setApiKeyValidity] = useState(true);

  // TODO: Move these controllers out of component code
  useEffect(() => {
    setError(null);
    setIsLoaded(false);
    const source = () =>
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
    const getBuilds = (getFunction = () => null) =>
      getFunction().then(
        (result) => {
          const {
            data: {builds},
          } = result;
          setError(null);
          setIsLoaded(true);
          setApiKeyValidity(true);
          setBaseURL(
            `${document.location.protocol}//${document.location.host}`
          );
          setItems(builds);
        },
        (error) => {
          setIsLoaded(true);
          const {
            response: {statusText: message, status},
          } = error;
          setError({message, status});
          if (status === 401) setApiKeyValidity(false);
        }
      );
    getBuilds(source);
  }, [apiKey, platformId]);

  const errorDisplay = () => (
    <h3 className="title">
      Error {error.status || ''}: {error.message}
    </h3>
  );

  // TODO: Factor out HOC
  if (!hasValidAPIKey && error && error.status && error.status === 401) {
    return (
      <div>
        {errorDisplay()}
        <small>No valid API token detected.</small>
        <ApiKeyPrompt failedKey={apiKey} setApiKey={setApiKey} />
      </div>
    );
  } else if (error) {
    return (
      <div>
        <h3 className="m-3">Builds for{' ' + platformName}</h3>
        {errorDisplay()}
      </div>
    );
  } else if (!isLoaded) {
    return (
      <div>
        <h3 className="m-3">Builds for{' ' + platformName}</h3>Loading...
      </div>
    );
  } else {
    return (
      <div className="container">
        <h3 className="m-3">Builds for{' ' + platformName}</h3>
        {items.map((item) => (
          <Card key={item.id} item={item} baseURL={baseURL} />
        ))}
      </div>
    );
  }
};

export default BuildList;
