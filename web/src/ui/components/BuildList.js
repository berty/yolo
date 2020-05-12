import React, {useContext} from 'react';

import {ThemeContext} from '../../store/ThemeStore';
import {ResultContext} from '../../store/ResultStore';
import BuildContainer from './Build/BuildContainer';

const BuildList = ({loaded, builds, collapseCondition}) => {
  const {theme} = useContext(ThemeContext);
  const {state} = useContext(ResultContext);
  const loading = <div style={{color: theme.text.sectionText}}>Loading...</div>;
  const useCollapseCondition = collapseCondition.condition(builds);
  return (
    <>
      {!loaded ? (
        loading
      ) : !builds.length ? (
        <div>No results match your query.</div>
      ) : (
        <div className="container">
          {state.buildsByMr.map((build, i) => (
            <BuildContainer
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
      )}
    </>
  );
};

export default BuildList;
