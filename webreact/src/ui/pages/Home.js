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
          setPlatformId(PLATFORMS.none);
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
      {/* TODO: No magic strings */}
      {platformId !== PLATFORMS.none && (
        <BuildList
          platformName={
            platformId === PLATFORMS.iOS
              ? 'iOS'
              : platformId === PLATFORMS.android
              ? 'Android'
              : 'No platform selected.'
          }
          platformId={platformId}
        />
      )}
      <footer class="text-muted">
        <div class="container">
          <p>Yolo Footer</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
