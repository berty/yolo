import React, {useContext, useState} from 'react';
import {GitCommit, GitMerge, User, ChevronUp, ChevronDown} from 'react-feather';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {faAlignLeft} from '@fortawesome/free-solid-svg-icons';

import {ThemeContext} from '../../../store/ThemeStore';
import {sharedThemes} from '../../styleTools/themes';

import {tagStyle} from '../../styleTools/buttonStyler';
import ArtifactCard from './ArtifactCard';

import './BuildCard.scss';

const BuildCard = ({item}) => {
  const [expanded, toggleExpanded] = useState(true);
  const {theme} = useContext(ThemeContext);
  const missing = (key) => `[no '${key}' in build]`;
  const {
    short_id: buildShortId = '',
    id: buildId = missing('id'),
    branch: buildBranch = '',
    state: buildState = missing('state'),
    commit: buildCommit = missing('commit'), // legacy
    has_commit: {id: buildCommitId = ''} = {},
    message: buildMessage = missing('message'),
    has_mergerequest: {
      commit_url: commitUrl = '',
      updated_at: buildMergeUpdatedAt = '',
      id: buildMergeIdUrl = '',
    } = {},
    has_project: {id: buildProjectUrl = ''} = {},
  } = item || {};
  const stateNormed = buildState.toUpperCase();

  const [buildMergeId] = buildMergeIdUrl.match(/\d+?$/) || [];
  const buildTagStyle = tagStyle({name: theme.name, stateNormed});
  const COMMIT_LEN = !buildCommitId ? [0] : [0, 7];

  const CardTitle = (
    <div className="card-title">
      {`${
        buildBranch.toUpperCase() === 'MASTER' ? 'Master' : 'Pull'
      } ${buildShortId}`}
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

  const CommitIcon = commitUrl ? (
    <a href={commitUrl} className={'card-left-icon--yl icon-top--yl'}>
      <GitCommit color={theme.text.sectionTitle} />
    </a>
  ) : (
    <div className={'card-left-icon--yl icon-top--yl'}>
      <GitCommit color={theme.text.sectionText} />
    </div>
  );

  const Author = (
    <div style={{color: theme.text.author}} className="card-author--yl">
      [TODO: author]
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

  const BranchName = buildBranch && (
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

  const GithubLink = buildProjectUrl && (
    <a href={buildProjectUrl}>
      <FontAwesomeIcon
        icon={faGithub}
        color={theme.text.sectionText}
        size="2x"
      />
    </a>
  );

  const BuildCommit = <div>{buildCommitId.slice(...COMMIT_LEN)}</div>;

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
          {CommitIcon}
          <div className="card-details--yl">
            <div className="card-details-row--yl">
              {BuildCommit}
              {BuildState}
            </div>
            <div className="card-details-row--yl">{BranchName}</div>
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
          <ArtifactCard
            artifact={artifact}
            buildMergeUpdatedAt={buildMergeUpdatedAt}
            buildMergeId={buildMergeId}
            key={artifact.id}
          />
        ))}
    </div>
  );
};

export default BuildCard;
