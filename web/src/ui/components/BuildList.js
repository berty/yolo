import React, {useState, useEffect} from 'react';
import Card from './Card';

const BuildList = ({builds, baseURL}) => {
  return (
    <div className="container">
      <h3 className="m-3 title">Builds found: {parseInt(builds.length)}</h3>
      {builds.map((item) => (
        <Card key={item.id} item={item} baseURL={baseURL} />
      ))}
    </div>
  );
};

export default BuildList;
