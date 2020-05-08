import React, {useContext, useState} from 'react';
import {
  GitCommit,
  GitMerge,
  GitPullRequest,
  User,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Calendar,
} from 'react-feather';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {
  faAlignLeft,
  faHammer,
  faPencilAlt,
  faFile,
} from '@fortawesome/free-solid-svg-icons';

import {ThemeContext} from '../../../store/ThemeStore';
import {sharedThemes} from '../../styleTools/themes';

import {tagStyle} from '../../styleTools/buttonStyler';
import ArtifactCard from './ArtifactCard';

import {MR_STATE, BUILD_STATE} from '../../../constants';
import {getRelativeTime, getTimeLabel} from '../../../util/date';

import './BuildCard.scss';

const BuildCard = ({build, toCollapse}) => {
  const [expanded, toggleExpanded] = useState(!toCollapse);
  const [messageExpanded, toggleMessageExpanded] = useState(false);
  const {theme} = useContext(ThemeContext);
  const {
    short_id: buildShortId = '',
    id: buildId = '',
    branch: buildBranch = '',
    state: buildState = '',
    has_commit_id: buildCommitId = '',
    message: buildMessage = '',
    started_at: buildStartedAt = '',
    finished_at: buildFinishedAt = '',
    created_at: buildCreatedAt = '',
    completed_at: buildCompletedAt = '',
    updated_at: buildUpdatedAt = '',
    driver: buildDriver = '',
    has_mergerequest: {
      short_id: mrShortId = '',
      commit_url: mrCommitUrl = '',
      updated_at: buildMergeUpdatedAt = '',
      id: mrId = '',
      title: mrTitle = '',
      driver: mrDriver = '',
      state: mrState = '',
      has_author: {
        name: buildAuthorName = '',
        id: buildAuthorId,
        avatar_url: buildAuthorAvatarUrl = '',
      } = {},
    } = {},
    has_project: {id: buildProjectUrl = ''} = {},
  } = build || {};

  const COMMIT_LEN = 7;
  const MESSAGE_LEN = 280;
  const isMaster = buildBranch && buildBranch.toUpperCase() === 'MASTER';
  const {has_mergerequest: buildHasMr = false} = build;

  const timeSinceUpdated = getRelativeTime(buildUpdatedAt);
  const timeSinceCreated = getRelativeTime(buildCreatedAt);

  const colorInteractiveText = {
    color: theme.text.blockTitle,
  };

  const colorPlainText = {
    color: theme.text.sectionText,
  };

  const mrDisplayShortId = mrShortId && <>{`#${mrShortId}`}</>;
  const mrDisplayId = mrDisplayShortId || <>{mrId}</>;

  const buildDisplayShortId = buildShortId && <>{`#${buildShortId}`}</>;
  const buildDisplayId = buildDisplayShortId || <>{buildId}</>;

  const CardTitleMasterNoMr = isMaster && <>Master - build {buildDisplayId}</>;
  const CardTitleMasterWithMr = isMaster && buildHasMr && <>Master</>;
  const CardTitlePullWithMr = !isMaster && mrShortId && (
    <>
      Pull{' '}
      <u>
        <a href={mrId}>{mrDisplayId}</a>
      </u>
    </>
  );
  const CardDefaultTitle = <>Build {buildDisplayId}</>;

  const CardSubtitleMasterWithMr = isMaster && buildHasMr && (
    <>
      Merge{' '}
      <u>
        <a href={mrId}>{mrDisplayId}</a>
      </u>
    </>
  );
  const CardSubtitlePullWithMr = !isMaster && mrShortId && <>{mrTitle}</>;
  const CardSubtitleDefault = '';

  const CardTitle = (
    <div className="card-title">
      <div className="short-card-title">
        {CardTitleMasterWithMr ||
          CardTitleMasterNoMr ||
          CardTitlePullWithMr ||
          CardDefaultTitle}
      </div>
      <div className="card-mr-subtitle" style={colorPlainText}>
        {CardSubtitleMasterWithMr ||
          CardSubtitlePullWithMr ||
          CardSubtitleDefault}
      </div>
    </div>
  );

  const CardIconMasterWithMr = isMaster && buildHasMr && (
    <div className="card-left-icon rotate-merge">
      <GitCommit color={theme.icon.masterGreen} />
    </div>
  );
  const CardIconMasterNoMr = isMaster && !buildHasMr && (
    <div className="card-left-icon rotate-merge">
      <GitCommit color={theme.text.sectionText} />
    </div>
  );
  const CardIconPullHasMr = !isMaster && buildHasMr && (
    <div className="card-left-icon">
      <GitMerge color={theme.icon.branchPurple} />
    </div>
  );
  const CardIconDefault = (
    <div className="card-left-icon rotate-merge">
      <GitCommit color={theme.text.sectionText} />
      {/* <FontAwesomeIcon icon={faFile} color={theme.text.sectionText} /> */}
    </div>
  );

  const CardIcon = (
    <>
      {CardIconMasterWithMr ||
        CardIconPullHasMr ||
        CardIconMasterNoMr ||
        CardIconDefault}
    </>
  );

  const CommitIcon = mrCommitUrl ? (
    <a
      href={mrCommitUrl}
      className={'card-left-icon icon-top'}
      title={buildCommitId || ''}
    >
      <GitCommit color={theme.text.sectionTitle} />
    </a>
  ) : !buildHasMr ? (
    <div className="card-left-icon icon-top rotate-merge">
      <GitCommit color={theme.text.sectionText} />
    </div>
  ) : (
    <div className={'card-left-icon icon-top'} title={buildCommitId || ''}>
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

  // TODO: Parse line breaks in message
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
      {expanded ? <ChevronUp size="1.25rem" /> : <ChevronDown size="1.25rem" />}
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
        <User color={theme.text.sectionText} size="1.5rem" />
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

  const BuildState = !buildState ? (
    ''
  ) : buildState === BUILD_STATE.Passed ? (
    <div
      title={buildId || 'Build state'}
      className="btn btn-primary btn-sm state-tag"
      style={tagStyle({
        name: theme.name,
        state: BUILD_STATE[buildState],
        cursor: 'pointer',
      })}
      onClick={buildId ? () => (window.location = buildId) : () => {}}
    >
      {buildState}
    </div>
  ) : (
    <div
      title="Build state"
      className="btn btn-primary btn-sm state-tag"
      style={tagStyle({name: theme.name, state: BUILD_STATE[buildState]})}
    >
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
    <div title={buildCommitId}>
      {mrCommitUrl ? (
        <a
          href={mrCommitUrl}
          style={colorPlainText}
          className="interactive-text"
        >
          {buildCommitId.slice(0, COMMIT_LEN)}
        </a>
      ) : (
        buildCommitId.slice(0, COMMIT_LEN)
      )}
    </div>
  );

  const BuildDriver = buildDriver && (
    <div
      className="btn btn-sm normal-caps details"
      title={`Build driver: ${buildDriver}`}
    >
      <FontAwesomeIcon icon={faHammer} color={theme.text.sectionText} />
      {`Build driver: ${buildDriver}`}
    </div>
  );

  const MrDriver = mrDriver && (
    <div
      className="btn btn-sm normal-caps details"
      title={`Merge request driver: ${mrDriver}`}
    >
      <FontAwesomeIcon icon={faHammer} color={theme.text.sectionText} />
      {mrDriver}
    </div>
  );

  const MrState = mrState && (
    <div
      title="Merge request state"
      className="btn btn-primary btn-sm state-tag"
      style={tagStyle({name: theme.name, state: MR_STATE[mrState]})}
    >
      {mrState === MR_STATE.Opened ? <AlertCircle /> : <GitPullRequest />}
      {mrState}
    </div>
  );

  const BuildUpdatedAt = timeSinceUpdated && (
    <div
      className="btn btn-sm normal-caps details"
      title={getTimeLabel('Build updated', buildUpdatedAt)}
    >
      <FontAwesomeIcon icon={faPencilAlt} color={theme.text.sectionText} />
      {timeSinceUpdated}
    </div>
  );

  const BuildCreatedAt = timeSinceCreated && (
    <div
      className="btn btn-sm normal-caps details"
      title={getTimeLabel('Build created', buildCreatedAt)}
    >
      <Calendar />
      {timeSinceCreated}
    </div>
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
              {(buildCommitId || mrState || mrDriver) && (
                <div className="card-details-row">
                  {BuildCommit}

                  {MrState}
                  {MrDriver}
                </div>
              )}
              {buildBranch && (
                <div className="card-details-row">{BranchName}</div>
              )}
              {buildMessage && (
                <div className="card-details-row">{BuildMessage}</div>
              )}
              <div className="card-details-row">
                {BuildState}
                {BuildDriver}
                {BuildUpdatedAt}
                {BuildCreatedAt}
              </div>
            </div>
            <div className="card-build-actions">
              {BuildLogs}
              {GithubLink}
            </div>
          </div>
        )}
        {expanded &&
          build.has_artifacts &&
          build.has_artifacts.map((artifact) => (
            <ArtifactCard
              artifact={artifact}
              buildMergeUpdatedAt={buildMergeUpdatedAt}
              mrId={mrId}
              mrShortId={mrShortId}
              buildStartedAt={buildStartedAt}
              buildFinishedAt={buildFinishedAt}
              key={artifact.id}
            />
          ))}
      </div>
    </div>
  );
};

export default BuildCard;
