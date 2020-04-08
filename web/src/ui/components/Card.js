import React from 'react';

const Card = ({item, baseURL}) => (
  <div className="card" key={item.id}>
    <div className="card-header">
      <h2 className="card-title">{item.id}</h2>
    </div>
    <div className="card-body">
      <p className="text-muted">branch: {item.branch}</p>
      <p className="text-muted">date: {item.date}</p>
      <p className="text-muted">message: {item.message}</p>
      <p className="text-muted">commit: {item.commit}</p>
      <p className="text-muted">state: {item.state}</p>
      <div>
        <a className="btn btn-secondary" href={item.has_build}>
          Logs
        </a>
      </div>
    </div>
    <div className="card-body">
      {item.has_artifacts &&
        item.has_artifacts.map((artifact) => (
          <div className="card" key={artifact.id}>
            <div className="card-body d-flex flex-column">
              <p className="text-muted">path: {artifact.local_path}</p>
              <p className="text-muted">state: {artifact.state}</p>
              <div className="d-flex align-items-baseline">
                <a
                  className="btn btn-primary mr-3"
                  href={artifact.dl_artifact_signed_url}
                >
                  DL
                </a>
                <a
                  className="btn btn-primary mr-3"
                  href={
                    'itms-services://?action=download-manifest&url=' +
                    baseURL +
                    artifact.plist_signed_url
                  }
                >
                  Plist
                </a>
                <small className="text-muted">{artifact.file_size}b</small>
              </div>
            </div>
          </div>
        ))}
    </div>
  </div>
);

export default Card;
