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
  const {
    id: artifactId = '',
    state: artifactState = '',
    plist_signed_url: artifactPlistSignedUrl = '',
    dl_artifact_signed_url: artifactDlArtifactSignedUrl = '',
    kind: artifactKind = '',
  } = artifact;
  const normedStates = ['FINISHED', 'BUILDING', 'FAILED', 'DEFAULT'];
  const stateNormed =
    artifactState && normedStates.includes(artifactState.toUpperCase())
      ? artifactState.toUpperCase()
      : 'DEFAULT';

  const artifactTagStyle = tagStyle({name: theme.name, stateNormed});
  const artifactActionButtonStyle = actionButtonStyle({
    name: theme.name,
    stateNormed,
  });

  const getArtifactActionButton = () => {
    switch (stateNormed) {
      case 'FINISHED':
        return (
          <a
            href={
              artifactPlistSignedUrl
                ? `itms-services://?action=download-manifest&url=${process.env.API_SERVER}${artifactPlistSignedUrl}`
                : `${process.env.API_SERVER}${artifactDlArtifactSignedUrl}`
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

  const ArtifactStateTag = !artifactState ? (
    <React.Fragment />
  ) : (
    <div className="btn artifact-tag--yl" style={artifactTagStyle}>
      {artifactState}
    </div>
  );

  return (
    <React.Fragment key={artifactId}>
      <div
        className="card-row--yl expanded"
        style={{color: theme.text.sectionText}}
      >
        <div className="card-left-icon--yl icon-top--yl">{PlatformIcon}</div>
        <div className="card-details--yl">
          <div className="card-details-row--yl">
            <div className="vertical-center--yl">
              [TODO: platform] [TODO: artifact ID]
            </div>
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
  const missing = (key) => `[no '${key}' in build]`;
  const {
    id: buildId = missing('id'),
    branch: buildBranch = missing('build'),
    state: buildState = missing('state'),
    commit: buildCommit = missing('commit'),
    message: buildMessage = missing('message'),
  } = item;
  const stateNormed = buildState.toUpperCase();
  const buildTagStyle = tagStyle({name: theme.name, stateNormed});

  const COMMIT_LEN = buildCommit === missing('commit') ? [0] : [0, 7];

  const CardTitle = (
    <div className="card-title">
      {`${buildBranch.toUpperCase() === 'MASTER' ? 'Master' : 'Pull'} [TODO:
      build name]`}
    </div>
  );

  const CardIcon =
    buildBranch.toUpperCase() === 'MASTER' ? (
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
      style={{
        color: theme.text.blockTitle,
        cursor: 'pointer',
      }}
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
      className="btn btn-branch-name--yl"
      style={{
        backgroundColor: theme.border.filterUnselected,
      }}
    >
      {buildBranch}
    </div>
  );

  const BuildState = (
    <div className="btn btn-primary" style={buildTagStyle}>
      {buildState}
    </div>
  );

  const BuildLogs = (
    <a href={buildId}>
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

  const BuildCommit = (
    <div className="vertical-center--yl">
      {buildCommit.slice(...COMMIT_LEN)}
    </div>
  );

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
      key={buildId}
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
            <div className="card-details-row--yl">{buildMessage}</div>
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
