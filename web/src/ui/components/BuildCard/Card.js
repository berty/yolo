import React, {useContext} from 'react';
import {ThemeContext} from '../../../store/ThemeStore';
import './Card.scss';
import {sharedThemes} from '../../../styleTools/themes';
import {GitCommit} from 'react-feather';

const Card = ({item, baseURL}) => {
  const {theme} = useContext(ThemeContext);
  const {
    id,
    branch,
    created_at,
    state,
    message,
    started_at,
    finished_at,
    commit,
    driver,
    has_artifacts,
  } = item;
  const cardId = id.match(/\d+?$/) || '[no id]';
  const cardTitle = `${branch.toUpperCase() === 'MASTER' ? 'Master' : 'Pull'}`;
  return (
    <div
      className="card"
      style={{
        backgroundColor: theme.bg.block,
        boxShadow: theme.shadowStyle.block,
        borderRadius: sharedThemes.borderRadius.block,
        marginBottom: sharedThemes.marginBottom.block,
        padding: sharedThemes.padding.block,
      }}
      key={id}
    >
      <div className="card-header">
        <h2 className="card-title" style={{color: theme.text.blockTitle}}>
          {cardTitle + ' ' + cardId}
        </h2>
      </div>
      <div className="card-body" style={{color: theme.text.sectionText}}>
        <p>branch: {item.branch}</p>
        <p>date: {item.created_at}</p>
        <p>message: {item.message}</p>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <GitCommit style={{marginRight: '10px'}} /> <p>{item.commit}</p>
        </div>
        <p>state: {item.state}</p>
        <div>
          <a className="btn btn-secondary" href={item.has_build}>
            Logs
          </a>
        </div>
      </div>
      {/* TODO: Factor out */}
      {item.has_artifacts &&
        item.has_artifacts.map((artifact) => (
          <React.Fragment key={artifact.id}>
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
          </React.Fragment>
        ))}
    </div>
  );
};

export default Card;
