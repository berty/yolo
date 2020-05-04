import React, {useContext} from 'react';
import {ThemeContext} from '../../../store/ThemeStore';
import {Clock, Calendar, ArrowDownCircle, AlertTriangle} from 'react-feather';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAndroid, faApple} from '@fortawesome/free-brands-svg-icons';
import {faQuestionCircle, faFile} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import className from 'classnames';

import {tagStyle, actionButtonStyle} from '../../styleTools/buttonStyler';

import {KIND_TO_PLATFORM} from '../../../constants';

import './BuildCard.scss';

const ArtifactCard = ({
  artifact,
  buildMergeUpdatedAt,
  mrShortId,
  startedAt,
  finishedAt,
}) => {
  const {theme} = useContext(ThemeContext);
  const plainText = className('plaintext', theme.name);
  const {
    id: artifactId = '',
    state: artifactState = '',
    plist_signed_url: artifactPlistSignedUrl = '',
    dl_artifact_signed_url: artifactDlArtifactSignedUrl = '',
    kind: artifactKind = '',
    local_path: artifactLocalPath = '',
    file_size: artifactFileSize = '',
  } = artifact;
  const normedStates = ['FINISHED', 'BUILDING', 'FAILED', 'DEFAULT'];
  const stateNormed =
    artifactState && normedStates.includes(artifactState.toUpperCase())
      ? artifactState.toUpperCase()
      : 'DEFAULT';

  dayjs.extend(advancedFormat);
  dayjs.extend(relativeTime);
  const timeSinceBuildUpdated = buildMergeUpdatedAt
    ? dayjs(dayjs(buildMergeUpdatedAt, 'YYYY-MM-DDTHH:mm:ssZ')).fromNow()
    : '';
  const buildDurationSeconds =
    startedAt && finishedAt
      ? dayjs(dayjs(finishedAt, 'YYYY-MM-DDTHH:mm:ssZ')).diff(
          dayjs(startedAt, 'YYYY-MM-DDTHH:mm:ssZ'),
          'second'
        )
      : 0;
  const buildDurationShort =
    buildDurationSeconds > 0
      ? `${parseInt(buildDurationSeconds / 60)} minutes`
      : '';
  const buildDurationDetails =
    buildDurationSeconds > 0
      ? `duration: ${parseInt(buildDurationSeconds / 60)}m${
          buildDurationSeconds % 60
        }s`
      : '';
  const timeSinceBuildUpdatedString = `updated: ${buildMergeUpdatedAt}`;
  const ArtifactKindName = KIND_TO_PLATFORM[artifactKind] || 'Unknown OS';
  const MrShortId = mrShortId || '';

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
            <ArrowDownCircle />
          </a>
        );
      case 'FAILED':
        return (
          <div className="btn" style={artifactActionButtonStyle}>
            <AlertTriangle />
          </div>
        );
      default:
        return <React.Fragment />;
    }
  };

  const ArtifactActionButton = getArtifactActionButton();

  const PlatformIcon = (
    <FontAwesomeIcon
      icon={
        artifactKind === 'APK'
          ? faAndroid
          : artifactKind === 'DMG' || artifactKind === 'IPA'
          ? faApple
          : faQuestionCircle
      }
      size="lg"
      color={theme.text.sectionText}
    />
  );

  const ArtifactStateTag = !artifactState ? (
    <React.Fragment />
  ) : (
    <div className="btn artifact-tag" style={artifactTagStyle}>
      {artifactState}
    </div>
  );

  const TimeSinceBuildUpdated = timeSinceBuildUpdated ? (
    <div className="detail-icon-label" title={timeSinceBuildUpdatedString}>
      <Calendar />
      <div>{timeSinceBuildUpdated}</div>
    </div>
  ) : (
    ''
  );

  const BuildDuration = buildDurationShort ? (
    <div className="detail-icon-label" title={buildDurationDetails || ''}>
      <Clock />
      <div>{buildDurationShort}</div>
    </div>
  ) : (
    ''
  );

  const ArtifactFileSize = artifactFileSize &&
    parseInt(artifactFileSize) !== NaN && (
      <div className="detail-icon-label">
        <FontAwesomeIcon icon={faFile} size="lg" />
        <div className={plainText}>
          {Math.round(artifactFileSize / 1000)} kB
        </div>
      </div>
    );

  const ArtifactLocalPathRow = artifactLocalPath && (
    <div className="card-details-row artifact-local-path">
      {artifactLocalPath}
    </div>
  );

  return (
    <React.Fragment key={artifactId}>
      <div
        className="card-row expanded"
        style={{color: theme.text.sectionText}}
      >
        <div className="card-left-icon icon-top">{PlatformIcon}</div>
        <div className="card-details">
          <div className="card-details-row">
            <div className="">
              {ArtifactKindName} {MrShortId}
            </div>
            {ArtifactStateTag}
          </div>
          {ArtifactLocalPathRow}
          <div className="card-details-row">
            {TimeSinceBuildUpdated}
            {BuildDuration}
            {ArtifactFileSize}
          </div>
        </div>
        <div className="card-build-actions">{ArtifactActionButton}</div>
      </div>
    </React.Fragment>
  );
};

export default ArtifactCard;
