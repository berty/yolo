import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  faAlignLeft,
  faFile,
  faHammer,
  faPencilAlt,
  faQrcode,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import cn from "classnames";
import QRCode from "qrcode.react";
import queryString from "query-string";
import React, { useContext, useState } from "react";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  GitCommit,
  GitMerge,
  GitPullRequest,
} from "react-feather";
import { useHistory } from "react-router-dom";
import widgetStyles from "../../../assets/widget-snippets.module.css";
import {
  ARTIFACT_KIND_NAMES,
  ARTIFACT_KIND_TO_PLATFORM,
  ARTIFACT_KIND_VALUE,
  BUILD_STATE,
  MR_STATE,
} from "../../../constants";
import { GlobalContext } from "../../../store/GlobalStore";
import {
  getRelativeTime,
  getTimeDuration,
  getTimeLabel,
} from "../../../util/date";
import {
  addOrRemoveFromArray,
  isArray,
  isArrayWithMin,
  isNonEmptyArray,
  pickBy,
} from "../../../util/getters";
import { getTagColorStyle } from "../../styleTools/colorTools";
import { ArtifactKindComponent, ProjectIcon } from "../../styleTools/iconTools";
import AnchorLink from "../AnchorLink/AnchorLink";
import ConditionallyWrappedComponent from "../ConditionallyWrappedComponent";
import QRCodeModal from "../QRCodeModal";
import styles from "./FeedItemWidgets.module.css";

export const BuildMessage = ({ buildMessage = "" }) => {
  const MESSAGE_MAX = 120;
  const [expanded, setExpanded] = useState(false);
  const isLong = buildMessage.length > MESSAGE_MAX;
  const splitMessage = buildMessage.split("\n").filter((x) => !!x);
  const preview = splitMessage[0] && [splitMessage[0].slice(0, MESSAGE_MAX)];
  const longMessageClass = () =>
    expanded ? styles.messageLineExpanded : styles.messageLineTruncated;

  const messageRender = (messageLines) =>
    messageLines.map((x, i) => (
      <p
        key={i}
        className={cn(styles.messageLine, isLong && longMessageClass())}
      >
        {x}
      </p>
    ));

  return !splitMessage ? null : (
    <span onClick={!isLong ? null : () => setExpanded(!expanded)}>
      {messageRender(isLong && !expanded ? preview : splitMessage)}
    </span>
  );
};

export const HeaderChevronIcon = ({ collapsed, toggleCollapsed }) => (
  <div
    className={styles.wrapperChevronBig}
    onClick={() => {
      toggleCollapsed(!collapsed);
    }}
  >
    {!collapsed ? <ChevronUp /> : <ChevronDown />}
  </div>
);

export const HeaderProjectIcon = ({ projectId, projectName }) => {
  const displayName = projectName === "berty" ? "messenger" : projectName;
  return !projectName ? null : (
    <div className={cn(styles.headerProjectIcon)} title={displayName}>
      <span>{displayName}</span>
      {<ProjectIcon {...{ projectId }} />}
    </div>
  );
};

export const HeaderBlockIcon = ({ mrState, buildHasMr }) => {
  return (
    buildHasMr && (
      <div
        className={cn(
          styles.headerBlockIcon,
          getTagColorStyle({ state: mrState, noBackground: true })
        )}
      >
        {mrState ? <GitPullRequest /> : <GitCommit />}
      </div>
    )
  );
};

export const BuildStateTag = ({ buildState, buildId }) => {
  const buildStateIsPassed = buildState === BUILD_STATE.Passed;
  return (
    buildState && (
      <div
        className={cn(
          widgetStyles.tagFilled,
          buildStateIsPassed && widgetStyles.cursorPointer,
          getTagColorStyle({ state: BUILD_STATE[buildState] })
        )}
        onClick={
          !buildStateIsPassed
            ? undefined
            : (e) => {
                e.stopPropagation();
                window.location.href = buildId;
              }
        }
      >
        <span>{buildState}</span>
      </div>
    )
  );
};

export const ArtifactKindIcon = ({ artifactKind = "", artifactState = "" }) => (
  <div
    className={cn(
      widgetStyles.tagIconOnly,
      getTagColorStyle({ state: artifactState, noBackground: true })
    )}
  >
    <ArtifactKindComponent {...{ artifactKind }} />
  </div>
);

export const LatestBuildArtifactsIcons = ({ buildHasArtifacts }) =>
  isArray(buildHasArtifacts) && (
    <>
      {buildHasArtifacts.map((a, i) => (
        <ArtifactKindIcon
          artifactKind={ARTIFACT_KIND_VALUE[a["kind"] || "UnknownKind"]}
          artifactState={a["state"]}
          isFirst={i === 0}
          key={i}
        />
      ))}
    </>
  );

export const AnyRunningBuildTags = ({ hasRunningBuilds, allBuildsForMr }) => {
  if (
    !hasRunningBuilds ||
    !isNonEmptyArray(hasRunningBuilds) ||
    !isArrayWithMin(allBuildsForMr, 2)
  ) {
    return null;
  }
  const text = `${hasRunningBuilds.length} build${
    hasRunningBuilds.length > 1 ? "s" : ""
  } running`;
  return (
    <div className={cn(widgetStyles.filled, widgetStyles.warn)}>{text}</div>
  );
};

export const LatestBuildQrButton = ({ onClick, artifactPlistSignedUrl }) =>
  artifactPlistSignedUrl && (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(widgetStyles.btnSm, widgetStyles.primary)}
      title="Show QR code"
    >
      <FontAwesomeIcon icon={faQrcode} />
    </div>
  );

export const DlButtonSmall = ({ buildHasArtifacts }) =>
  buildHasArtifacts && (
    <>
      {buildHasArtifacts.map((artifact, i) => {
        const {
          plist_signed_url: artifactPlistSignedUrl = "",
          dl_artifact_signed_url: artifactDlArtifactSignedUrl = "",
          kind: artifactKind = "",
        } = artifact;

        const fullPlistSignedUrl =
          artifactPlistSignedUrl &&
          `itms-services://?action=download-manifest&url=${process.env.REACT_APP_API_SERVER}${artifactPlistSignedUrl}`;

        const fullDlArtifactSignedUrl =
          artifactDlArtifactSignedUrl &&
          `${process.env.REACT_APP_API_SERVER}${artifactDlArtifactSignedUrl}`;

        const hasDlUrl = fullPlistSignedUrl || fullDlArtifactSignedUrl;
        return (
          <a
            key={`${artifactPlistSignedUrl}=${i}`}
            className={cn(widgetStyles.btnSm, widgetStyles.primary)}
            title={hasDlUrl}
            href={hasDlUrl}
          >
            <Download />
            {ARTIFACT_KIND_NAMES[artifactKind] && (
              <span>{`.${ARTIFACT_KIND_NAMES[artifactKind]}`}</span>
            )}
          </a>
        );
      })}
    </>
  );

export const ArtifactRowKindIcon = ({
  artifactKind = "",
  artifactState = "",
}) => (
  <div
    className={cn(
      getTagColorStyle({ state: artifactState, noBackground: true }),
      widgetStyles.tagIconOnly
    )}
  >
    <ArtifactKindComponent
      artifactKind={ARTIFACT_KIND_VALUE[artifactKind || "UnknownKind"]}
    />
  </div>
);

export const ArtifactState = ({ artifactState = "" }) => (
  <div
    className={cn(
      getTagColorStyle({ state: artifactState }),
      widgetStyles.tagFilled
    )}
  >
    <span>{artifactState}</span>
  </div>
);

export const QrCode = ({ artifactPlistSignedUrl, closeAction }) => (
  <QRCodeModal closeAction={closeAction}>
    <QRCode
      value={`itms-services://?action=download-manifest&url=${process.env.REACT_APP_API_SERVER}${artifactPlistSignedUrl}`}
      // size={256}
      level="M"
      renderAs="svg"
      includeMargin
      style={{ width: "100%" }}
    />
  </QRCodeModal>
);

export const ArtifactQrButton = ({ onClick }) => (
  <div
    onClick={onClick}
    className={cn(widgetStyles.btnLg, widgetStyles.primary)}
    title="Show QR code"
  >
    <FontAwesomeIcon icon={faQrcode} />
  </div>
);

export const BuildIdentifier = ({ buildShortId }) => (
  <div className={widgetStyles.tagGhostUpper}>
    {`Build #${buildShortId}` || ""}
  </div>
);

export const TimeSinceBuildUpdated = ({ buildMergeUpdatedAt }) => {
  const timeSinceBuildUpdated = getRelativeTime(buildMergeUpdatedAt);
  return (
    timeSinceBuildUpdated && (
      <div
        className={cn(widgetStyles.tagGhostUpper)}
        title={buildMergeUpdatedAt && `updated: ${buildMergeUpdatedAt}`}
      >
        <Calendar />
        <span>{timeSinceBuildUpdated}</span>
      </div>
    )
  );
};

export const BuildDuration = ({ buildCreatedAt, buildFinishedAt }) => {
  const buildDurationSeconds = getTimeDuration(buildCreatedAt, buildFinishedAt);
  const buildDurationShort = buildDurationSeconds
    ? `${parseInt(buildDurationSeconds / 60, 10)} minutes`
    : "";
  const buildDurationDetails =
    buildDurationSeconds > 0
      ? `duration: ${parseInt(buildDurationSeconds / 60, 10)}m${
          buildDurationSeconds % 60
        }s`
      : "";
  return (
    buildDurationShort && (
      <div
        className={cn(widgetStyles.tagGhostUpper)}
        title={buildDurationDetails || ""}
      >
        <Clock />
        <span>{buildDurationShort}</span>
      </div>
    )
  );
};

export const ArtifactFileSize = ({ artifactFileSize }) =>
  artifactFileSize &&
  !Number.isNaN(parseInt(artifactFileSize, 10)) && (
    <div className={cn(widgetStyles.tagGhostUpper)}>
      <FontAwesomeIcon icon={faFile} />
      <span>{Math.round(artifactFileSize / 1000)} kB</span>
    </div>
  );

export const ArtifactDriver = ({ artifactDriver }) =>
  artifactDriver && (
    <div
      className={cn(widgetStyles.tagGhostUpper)}
      title={`Artifact driver: ${artifactDriver}`}
    >
      <FontAwesomeIcon icon={faHammer} />
      <span>{artifactDriver}</span>
    </div>
  );

export const SharableArtifactLink = ({ buildId, artifactKind }) => (
  <AnchorLink
    target={`?build_id=${buildId}${
      artifactKind ? `&artifact_kinds=${ARTIFACT_KIND_VALUE[artifactKind]}` : ""
    }
    `}
  />
);

export const ArtifactDownloadButton = ({
  artifactPlistSignedUrl = "",
  artifactDlArtifactSignedUrl = "",
}) => {
  const fullPlistSignedUrl =
    artifactPlistSignedUrl &&
    `itms-services://?action=download-manifest&url=${process.env.REACT_APP_API_SERVER}${artifactPlistSignedUrl}`;
  const fullDlArtifactSignedUrl =
    artifactDlArtifactSignedUrl &&
    `${process.env.REACT_APP_API_SERVER}${artifactDlArtifactSignedUrl}`;
  const hasDlUrl = fullPlistSignedUrl || fullDlArtifactSignedUrl;

  return (
    hasDlUrl && (
      <a
        href={hasDlUrl}
        className={cn(widgetStyles.btnLg, widgetStyles.primary)}
        title={hasDlUrl}
      >
        <Download />
        <span>Download</span>
      </a>
    )
  );
};

export const ArtifactKindName = ({ artifactKind }) => (
  <div className={widgetStyles.tagGhost}>
    {ARTIFACT_KIND_TO_PLATFORM[ARTIFACT_KIND_VALUE[artifactKind]] ||
      "Unknown OS"}
  </div>
);

export const ArtifactLocalPathRow = ({ artifactLocalPath }) =>
  artifactLocalPath && (
    <span className={cn(styles.artifactLocalPathText)}>
      {artifactLocalPath}
    </span>
  );

export const BranchName = ({ buildBranch }) => {
  const { updateState, state } = useContext(GlobalContext);
  const selected = state.uiFilters.branch.includes(buildBranch);

  const history = useHistory();
  const onClickToggler = () => {
    const updatedFilters = {
      ...state.uiFilters,
      branch: addOrRemoveFromArray(buildBranch, state.uiFilters.branch || []),
    };
    updateState({
      needsRefresh: true,
      isLoaded: false,
    });
    history.push({
      path: "/",
      search: queryString.stringify(pickBy(updatedFilters, isNonEmptyArray)),
    });
  };
  return (
    buildBranch && (
      <div
        className={cn(styles.branchName, selected && styles.selected)}
        onClick={onClickToggler}
        title={`${selected ? "remove" : "add"} this branch as a filter`}
      >
        {buildBranch}
      </div>
    )
  );
};

// export const SharableBuildLink = ({ isBlock, buildId }) => (
//   <AnchorLink target={`?build_id=${buildId}`} isBlock={isBlock}>
//     <LinkIcon size={16} />
//   </AnchorLink>
// );

export const BuildUpdatedAt = ({ buildUpdatedAt }) => {
  const timeSinceUpdated = getRelativeTime(buildUpdatedAt);
  return (
    timeSinceUpdated && (
      <div
        className={cn(widgetStyles.tagGhostUpper)}
        title={getTimeLabel("Build updated", buildUpdatedAt)}
      >
        <FontAwesomeIcon icon={faPencilAlt} />
        <span>{timeSinceUpdated}</span>
      </div>
    )
  );
};

export const BuildLogs = ({ buildId }) => (
  <a href={buildId} title={buildId}>
    <FontAwesomeIcon icon={faAlignLeft} size="lg" />
  </a>
);

export const GithubLink = ({ buildProjectUrl }) =>
  buildProjectUrl && (
    <a href={buildProjectUrl} title={buildProjectUrl}>
      <FontAwesomeIcon icon={faGithub} size="lg" />
    </a>
  );

export const BuildDriver = ({ buildDriver }) =>
  buildDriver && (
    <div
      className={cn(widgetStyles.tagGhostUpper)}
      title={`Build driver: ${buildDriver}`}
    >
      <FontAwesomeIcon icon={faHammer} />
      <span>{`${buildDriver}`}</span>
    </div>
  );

export const MrDriver = ({ mrDriver }) =>
  mrDriver && (
    <div
      className={widgetStyles.tagGhostUpper}
      title={`Merge request driver: ${mrDriver}`}
    >
      <GitMerge />
      <span>{mrDriver}</span>
    </div>
  );

export const BuildCommit = ({ buildCommitId, mrCommitUrl }) => {
  const COMMIT_LEN = 7;
  return (
    buildCommitId && (
      <div title={buildCommitId} className={cn(widgetStyles.tagGhostUpper)}>
        <span>Commit</span>
        <ConditionallyWrappedComponent
          condition={!!mrCommitUrl}
          wrapper={(children) => <a href={mrCommitUrl}>{children}</a>}
        >
          {buildCommitId.slice(0, COMMIT_LEN)}
        </ConditionallyWrappedComponent>
      </div>
    )
  );
};

export const BuildCreatedAt = ({ buildCreatedAt }) => {
  const timeSinceCreated = getRelativeTime(buildCreatedAt);
  return (
    timeSinceCreated && (
      <div
        className={cn(widgetStyles.tagGhostUpper)}
        title={getTimeLabel("Build created", buildCreatedAt)}
      >
        <Calendar />
        <span>{timeSinceCreated}</span>
      </div>
    )
  );
};

export const ArtifactCreatedAt = ({ artifactCreatedAt = "" }) => {
  const timeSinceCreated = getRelativeTime(artifactCreatedAt);
  return (
    timeSinceCreated && (
      <div
        className={cn(widgetStyles.tagGhostUpper)}
        title={getTimeLabel("Artifact created", artifactCreatedAt)}
      >
        <Calendar />
        <span>{timeSinceCreated}</span>
      </div>
    )
  );
};

export const FeedDisplayToggler = ({
  loaded = false,
  displayFeed = false,
  onSetDisplayFeed = () => {},
}) => {
  return (
    <button
      disabled={!loaded}
      className={cn(
        widgetStyles.btnLg,
        widgetStyles.primary,
        widgetStyles.flat
      )}
      onClick={onSetDisplayFeed}
    >
      {displayFeed ? <ChevronUp /> : <ChevronDown />}
      <span>{`${displayFeed ? "Hide" : "Show"} feed`}</span>
    </button>
  );
};

export const MrState = ({ mrState }) =>
  mrState && (
    <div
      className={cn(
        widgetStyles.tagGhostUpper,
        getTagColorStyle({ state: MR_STATE[mrState], noBackground: true })
      )}
    >
      {mrState === MR_STATE.Opened ? <AlertCircle /> : <GitPullRequest />}
      <span>{mrState}</span>
    </div>
  );

export const CommitIcon = ({ mrCommitUrl }) => (
  <a
    className={widgetStyles.tagIconOnly}
    href={mrCommitUrl || "#"}
    title={mrCommitUrl || ""}
    alt="Link to commit"
  >
    <GitCommit />
  </a>
);

export const LatestMasterIndicator = ({ isLatestMaster }) => {
  return (
    isLatestMaster && (
      <span
        role="img"
        aria-label="star"
        className={styles.star}
        title="Latest build on Master!"
      >
        ⭐️
      </span>
    )
  );
};
