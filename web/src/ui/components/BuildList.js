import React, {useContext} from 'react';
import Card from './BuildCard/Card';
import {ThemeContext} from '../../store/ThemeStore';

const BuildList = ({loaded, builds, baseURL}) => {
  const {theme} = useContext(ThemeContext);
  const loading = <div style={{color: theme.text.sectionText}}>Loading...</div>;
  return !loaded ? (
    loading
  ) : (
    <div className="container">
      {builds.map((item) => (
        <Card key={item.id} item={item} baseURL={baseURL} />
      ))}
    </div>
  );
};

export default BuildList;
