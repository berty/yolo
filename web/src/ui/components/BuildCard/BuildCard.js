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
  const [messageExpanded, toggleMessageExpanded] = useState(false);
  const {theme} = useContext(ThemeContext);
  const missing = (key) => `[no '${key}' in build]`;
  const {
    short_id: buildShortId = '',
    id: buildId = missing('id'),
    branch: buildBranch = '',
    state: buildState = missing('state'),
    has_commit_id: buildCommitId = '',
    message: buildMessage = '',
    started_at: startedAt = '',
    finished_at: finishedAt = '',
    has_mergerequest: {
      commit_url: commitUrl = '',
      updated_at: buildMergeUpdatedAt = '',
      id: buildMergeIdUrl = '',
      has_author: {
        name: buildAuthorName = '',
        id: buildAuthorId,
        avatar_url: buildAuthorAvatarUrl = '',
      } = {},
    } = {},
    has_project: {id: buildProjectUrl = ''} = {},
  } = item || {};
  const stateNormed = buildState.toUpperCase();

  const [buildMergeId] = buildMergeIdUrl.match(/\d+?$/) || [];
  const buildTagStyle = tagStyle({name: theme.name, stateNormed});
  const COMMIT_LEN = 7;
  const MESSAGE_LEN = 280;

  const colorInteractiveText = {
    color: theme.text.blockTitle,
  };

  const CardTitle = (
    <div className="card-title">
      {`${
        buildBranch.toUpperCase() === 'MASTER' ? 'Master' : 'Pull'
      } ${buildShortId}`}
    </div>
  );

  const CardIcon =
    buildBranch.toUpperCase() === 'MASTER' ? (
      <div className="card-left-icon rotate-merge">
        <GitCommit color={theme.icon.masterGreen} />
      </div>
    ) : (
      <div className="card-left-icon">
        <GitMerge color={theme.icon.branchPurple} />
      </div>
    );

  const CommitIcon = commitUrl ? (
    <a href={commitUrl} className={'card-left-icon icon-top'}>
      <GitCommit color={theme.text.sectionTitle} />
    </a>
  ) : (
    <div className={'card-left-icon icon-top'}>
      <GitCommit color={theme.text.sectionText} />
    </div>
  );

  const Author = buildAuthorName && (
    <div className="card-author">
      {buildAuthorName && buildAuthorId ? (
        <a
          href={buildAuthorId}
          style={colorInteractiveText}
          className="interactive-text"
        >
          {buildAuthorName}
        </a>
      ) : (
        buildAuthorName
      )}
    </div>
  );

  const BuildMessage = !buildMessage ? (
    ''
  ) : buildMessage.length < MESSAGE_LEN ? (
    buildMessage
  ) : messageExpanded ? (
    <div
      className="interactive-text"
      onClick={() => toggleMessageExpanded(false)}
    >
      {buildMessage + ' '}
      <span style={colorInteractiveText}>[show less]</span>
    </div>
  ) : (
    <div
      className="interactive-text"
      onClick={() => toggleMessageExpanded(true)}
    >
      {buildMessage.slice(0, MESSAGE_LEN)}...{' '}
      <span style={colorInteractiveText}>[show more]</span>
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

  const AuthorImage =
    buildAuthorId && buildAuthorAvatarUrl ? (
      <div className="card-avatar">
        <a href={buildAuthorId}>
          <img src={buildAuthorAvatarUrl} alt={buildAuthorId} />
        </a>
      </div>
    ) : (
      <div className="card-avatar" title="Unknown author">
        <User color={theme.text.sectionText} />
      </div>
    );

  const BranchName = buildBranch && (
    <div
      className="btn btn-branch-name"
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
        title={buildId}
      />
    </a>
  );

  const GithubLink = buildProjectUrl && (
    <a href={buildProjectUrl}>
      <FontAwesomeIcon
        icon={faGithub}
        color={theme.text.sectionText}
        size="2x"
        title={buildProjectUrl}
      />
    </a>
  );

  const BuildCommit = buildCommitId && (
    <div title={buildCommitId}>{buildCommitId.slice(0, COMMIT_LEN)}</div>
  );

  return (
    <div className="BuildCard">
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
        <div className={'card-row' + (expanded ? ' expanded' : '')}>
          {CardIcon}
          <h2 className="card-title" style={{color: theme.text.blockTitle}}>
            {CardTitle}
          </h2>
          {Author}
          {AuthorImage}
          {ChevronIcon}
        </div>
        {expanded && (
          <div
            className={'card-row' + (expanded ? ' expanded' : '')}
            style={{color: theme.text.sectionText}}
          >
            {CommitIcon}
            <div className="card-details">
              <div className="card-details-row">
                {BuildCommit}
                {BuildState}
              </div>
              <div className="card-details-row">{BranchName}</div>
              <div className="card-details-row">{BuildMessage}</div>
            </div>
            <div className="card-build-actions">
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
              startedAt={startedAt}
              finishedAt={finishedAt}
              key={artifact.id}
            />
          ))}
      </div>
    </div>
  );
};

export default BuildCard;
