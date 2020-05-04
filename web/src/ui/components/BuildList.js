import React, {useContext} from 'react';

import BuildCard from './BuildCard/BuildCard';
import {ThemeContext} from '../../store/ThemeStore';

const BuildList = ({loaded, builds}) => {
  const {theme} = useContext(ThemeContext);
  const loading = <div style={{color: theme.text.sectionText}}>Loading...</div>;
  return !loaded ? (
    loading
  ) : !builds.length ? (
    <div>No results match your query.</div>
  ) : (
    <div className="container">
      {builds.map((item, i) => (
        <BuildCard key={'item.id' + i} item={item} />
      ))}
    </div>
  );
};

export default BuildList;
