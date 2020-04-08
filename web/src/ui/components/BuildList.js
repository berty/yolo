import React, {useState, useEffect} from 'react';
import Card from './Card';
import axios from 'axios';
import {results} from '../../assets/sample-build-response';

const BuildList = ({platformName, platformId}) => {
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState([]);
  const [baseURL, setBaseURL] = useState('');

  // TODO: Move these controllers out of component code
  useEffect(() => {
    console.log(`process.env.YOLO_UI_TEST:`, process.env.YOLO_UI_TEST);
    const source = () =>
      process.env.YOLO_UI_TEST === 'true'
        ? Promise.resolve(results)
        : axios.get(
            `${process.env.API_URL}/build-list?artifact_kind=${platformId}&`,
            {
              headers: process.env.YOLO_APP_PW
                ? {
                    Authorization:
                      'Basic ' + btoa(`${process.env.YOLO_APP_PW}`),
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
          setIsLoaded(true);
          setBaseURL(
            `${document.location.protocol}//${document.location.host}`
          );
          setItems(builds);
        },
        (error) => {
          setIsLoaded(true);
          setError(error);
        }
      );
    if (!isLoaded) {
      getBuilds(source);
    }
  });

  // TODO: Factor out HOC
  if (error) {
    return (
      <div>
        <h3 className="m-3">Builds for{' ' + platformName}</h3>Error:{' '}
        {error.message}
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
