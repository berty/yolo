import React, {useState} from 'react';
import BuildList from '../components/BuildList';

const PLATFORMS = {
  iOS: '1',
  android: '2',
  none: '3',
};

const Home = () => {
  const [platformId, setPlatformId] = useState(PLATFORMS.none);

  return (
    <div className="container mt-3">
      <h2>Yolo!</h2>
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
      {platformId === PLATFORMS.android && (
        <BuildList platformName="Android" platformId={PLATFORMS.android} />
      )}
      {platformId === PLATFORMS.iOS && (
        <BuildList platformName="iOS" platformId={PLATFORMS.iOS} />
      )}
      <footer className="text-muted">
        <div className="container">
          <p>Yolo Footer</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
