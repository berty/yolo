import React, {useContext} from 'react';
import {ThemeContext} from '../../../store/ThemeStore';
import {Clock, Calendar, ArrowDownCircle, AlertTriangle} from 'react-feather';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAndroid, faApple} from '@fortawesome/free-brands-svg-icons';

import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

import {tagStyle, actionButtonStyle} from '../../styleTools/buttonStyler';

import {KIND_TO_PLATFORM} from '../../../constants';

import './BuildCard.scss';

const ArtifactCard = ({
  artifact,
  buildMergeUpdatedAt,
  buildMergeId,
  startedAt,
  finishedAt,
}) => {
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

  dayjs.extend(advancedFormat);
  dayjs.extend(relativeTime);
  const timeSinceBuildUpdated = buildMergeUpdatedAt
    ? dayjs(dayjs(buildMergeUpdatedAt, 'YYYY-MM-DDTHH:mm:ssZ')).fromNow()
    : '';
  const buildDuration =
    startedAt && finishedAt
      ? `${dayjs(dayjs(finishedAt, 'YYYY-MM-DDTHH:mm:ssZ')).diff(
          dayjs(startedAt, 'YYYY-MM-DDTHH:mm:ssZ'),
          'minute'
        )} minutes`
      : '';
  const ArtifactKindName = KIND_TO_PLATFORM[artifactKind] || 'Unknown OS';
  const BuildMergeId = buildMergeId || '';

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
    <>
      <Calendar />
      <div>{timeSinceBuildUpdated}</div>
    </>
  ) : (
    ''
  );

  const BuildDuration = buildDuration ? (
    <>
      <Clock />
      <div>{buildDuration}</div>
    </>
  ) : (
    ''
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
              {ArtifactKindName} {BuildMergeId}
            </div>
            {ArtifactStateTag}
          </div>
          <div className="card-details-row">
            {TimeSinceBuildUpdated}
            {BuildDuration}
          </div>
        </div>
        <div className="card-build-actions">{ArtifactActionButton}</div>
      </div>
    </React.Fragment>
  );
};

export default ArtifactCard;
