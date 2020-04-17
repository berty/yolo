import React, {useContext, useState} from 'react';
import {ThemeContext} from '../../../store/ThemeStore';
import {sharedThemes} from '../../../styleTools/themes';
import {
  GitCommit,
  GitMerge,
  User,
  ChevronUp,
  ChevronDown,
  Clock,
  Calendar,
} from 'react-feather';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAndroid, faApple, faGithub} from '@fortawesome/free-brands-svg-icons';
import {faAlignLeft} from '@fortawesome/free-solid-svg-icons';
import './BuildCard.scss';
import {tagStyle, actionButtonStyle} from '../../../styleTools/buttonStyler';

const ArtifactCard = ({artifact}) => {
  const {theme} = useContext(ThemeContext);
  const {id, state} = artifact;
  const normedStates = ['FINISHED', 'BUILDING', 'FAILED', 'DEFAULT'];
  const stateNormed =
    state && normedStates.includes(state.toUpperCase())
      ? state.toUpperCase()
      : 'DEFAULT';

  const artifactTagStyle = tagStyle({name: theme.name, stateNormed});
  const artifactActionButtonStyle = actionButtonStyle({
    name: theme.name,
    stateNormed,
  });

  const getArtifactActionButton = () => {
    // TODO: Handle DL button if not iOS/no plist
    switch (stateNormed) {
      case 'FINISHED':
        return (
          <a
            href={
              'itms-services://?action=download-manifest&url=' +
              process.env.API_SERVER +
              artifact.plist_signed_url
            }
            className="btn"
            style={artifactActionButtonStyle}
          >
            DL
          </a>
        );
      case 'FAILED':
        return (
          <div className="btn" style={artifactActionButtonStyle}>
            !
          </div>
        );
      default:
        return <React.Fragment />;
    }
  };

  const ArtifactActionButton = getArtifactActionButton();

  const PlatformIcon = (
    <FontAwesomeIcon
      icon={artifact.kind === 'APK' ? faAndroid : faApple}
      size="lg"
      color={theme.text.sectionText}
    />
  );

  const ArtifactStateTag = !state ? (
    <React.Fragment />
  ) : (
    <div className="btn" style={artifactTagStyle}>
      {state}
    </div>
  );

  return (
    <React.Fragment key={id}>
      <div
        className="card-row--yl expanded"
        style={{color: theme.text.sectionText}}
      >
        <div className="card-left-icon--yl icon-top--yl">{PlatformIcon}</div>
        <div className="card-details--yl">
          <div className="card-details-row--yl">
            <div>[TODO: platform] [TODO: artifact ID]</div>
            {ArtifactStateTag}
          </div>
          <div className="card-details-row--yl">
            <div>
              <Calendar />
            </div>
            <div>[TODO: elapsed time]</div>
            <div>
              <Clock />
            </div>
            <div>[TODO: duration]</div>
          </div>
        </div>
        <div className="card-build-actions--yl">{ArtifactActionButton}</div>
      </div>
    </React.Fragment>
  );
};

const BuildCard = ({item}) => {
  const [expanded, toggleExpanded] = useState(true);
  const {theme} = useContext(ThemeContext);
  const {id, branch, state} = item;
  const stateNormed = state.toUpperCase();
  const buildTagStyle = tagStyle({name: theme.name, stateNormed});

  const COMMIT_LEN = 7;

  const CardTitle = `${
    branch.toUpperCase() === 'MASTER' ? 'Master' : 'Pull'
  } [TODO: build name]`;

  const CardIcon =
    branch.toUpperCase() === 'MASTER' ? (
      <div className="card-left-icon--yl rotate-merge--yl">
        <GitCommit color={theme.icon.masterGreen} />
      </div>
    ) : (
      <div className="card-left-icon--yl">
        <GitMerge color={theme.icon.branchPurple} />
      </div>
    );

  const BuildIcon = (
    <div className="card-left-icon--yl icon-top--yl">
      <GitCommit color={theme.text.sectionText} />
    </div>
  );

  const Author = (
    <div style={{color: theme.text.author}} className="card-author--yl">
      [author]
    </div>
  );

  const ChevronIcon = (
    <div
      style={{color: theme.text.blockTitle, cursor: 'pointer'}}
      onClick={() => toggleExpanded(!expanded)}
    >
      {expanded ? <ChevronUp /> : <ChevronDown />}
    </div>
  );

  const AuthorImage = (
    <div className="card-avatar--yl">
      <User color={theme.text.sectionText} />
    </div>
  );

  const branchName = (
    <div
      className="btn"
      style={{backgroundColor: theme.border.filterUnselected}}
    >
      {branch}
    </div>
  );

  const BuildState = (
    <div className="btn btn-primary" style={buildTagStyle}>
      {state}
    </div>
  );

  const BuildLogs = (
    <a href={id}>
      <FontAwesomeIcon
        icon={faAlignLeft}
        color={theme.text.sectionText}
        size="2x"
      />
    </a>
  );

  const GithubLink = (
    <div>
      <FontAwesomeIcon icon={faGithub} size="2x" />
    </div>
  );

  const BuildCommit = <div>{item.commit.slice(0, COMMIT_LEN)}</div>;

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
      <div className={'card-row--yl' + (expanded ? ' expanded' : '')}>
        {CardIcon}
        <h2 className="card-title--yl" style={{color: theme.text.blockTitle}}>
          {CardTitle}
        </h2>
        {Author}
        {AuthorImage}
        {ChevronIcon}
      </div>
      {expanded && (
        <div
          className={'card-row--yl' + (expanded ? ' expanded' : '')}
          style={{color: theme.text.sectionText}}
        >
          {BuildIcon}
          <div className="card-details--yl">
            <div className="card-details-row--yl">
              {BuildCommit}
              {BuildState}
            </div>
            <div className="card-details-row--yl">{branchName}</div>
            <div className="card-details-row--yl">{item.message}</div>
          </div>
          <div className="card-build-actions--yl">
            {BuildLogs}
            {GithubLink}
          </div>
        </div>
      )}
      {expanded &&
        item.has_artifacts &&
        item.has_artifacts.map((artifact) => (
          <ArtifactCard artifact={artifact} key={artifact.id} />
        ))}
    </div>
  );
};

export default BuildCard;
