import React, {useContext} from 'react';
import BuildCard from './BuildCard/BuildCard';
import {ThemeContext} from '../../store/ThemeStore';

const BuildList = ({loaded, builds}) => {
  const {theme} = useContext(ThemeContext);
  const loading = <div style={{color: theme.text.sectionText}}>Loading...</div>;
  return !loaded ? (
    loading
  ) : (
    <div className="container">
      {builds.map((item) => (
        <BuildCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default BuildList;
