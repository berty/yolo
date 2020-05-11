import React, {useContext} from 'react';

import BuildCard from './BuildCard/BuildCard';
import {ThemeContext} from '../../store/ThemeStore';

const BuildList = ({loaded, builds, collapseCondition}) => {
  const {theme} = useContext(ThemeContext);
  const loading = <div style={{color: theme.text.sectionText}}>Loading...</div>;
  const useCollapseCondition = collapseCondition.condition(builds);
  return !loaded ? (
    loading
  ) : !builds.length ? (
    <div>No results match your query.</div>
  ) : (
    <div className="container">
      {builds.map((build, i) => (
        <BuildCard
          key={`${build.id}-${i}`}
          build={build}
          toCollapse={
            useCollapseCondition && collapseCondition.toCollapse(build)
              ? true
              : false
          }
        />
      ))}
    </div>
  );
};

export default BuildList;
