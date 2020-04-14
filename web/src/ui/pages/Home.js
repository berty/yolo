import React, {useState, useEffect} from 'react';
import BuildList from '../components/BuildList';

import './Home.scss';

const PLATFORMS = {
  iOS: '1',
  android: '2',
  none: '3',
};

const Home = () => {
  const [platformId, setPlatformId] = useState(PLATFORMS.none);
  const [apiKey, setApiKey] = useState(`${process.env.YOLO_APP_PW || ''}`);
  const updateApiKey = (key) => {
    return setApiKey(key);
  };

  return (
    <div className="container mt-3">
      <h2>Yolo!</h2>
      <div className="form-group">
        <select
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
            Select your platform
          </option>
          <option value={PLATFORMS.iOS}>iOS</option>
          <option value={PLATFORMS.android}>Android</option>
        </select>
      </div>
      {/* TODO: Factor */}
      {platformId === PLATFORMS.android && (
        <BuildList
          platformName="Android"
          platformId={PLATFORMS.android}
          apiKey={apiKey}
          setApiKey={updateApiKey}
        />
      )}
      {platformId === PLATFORMS.iOS && (
        <BuildList
          platformName="iOS"
          platformId={PLATFORMS.iOS}
          apiKey={apiKey}
          setApiKey={updateApiKey}
        />
      )}
    </div>
  );
};

export default Home;
