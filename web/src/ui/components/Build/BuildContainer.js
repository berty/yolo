import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { get } from "lodash";
import React, { useContext, useState } from "react";
import { Download } from "react-feather";
import { ARTIFACT_KIND_NAMES, BRANCH, BUILD_STATE } from "../../../constants";
import { GlobalContext } from "../../../store/GlobalStore";
import { ThemeContext } from "../../../store/ThemeStore";
import {
  getIsArray,
  getIsArrayWithN,
  getStrEquNormalized,
} from "../../../util/getters";
import { getArtifactKindIcon } from "../../styleTools/brandIcons";
import {
  primaryButtonColors,
  tagColorStyles,
} from "../../styleTools/buttonStyler";
import ShowingOlderBuildsTag from "../ShowingOlderBuildsTag";
import Tag from "../Tag/Tag";
import { QrCode } from "./ArtifactRow";
import styles from "./Build.module.scss";
import BuildAndMrContainer from "./BuildAndMrContainer";
import BuildBlockHeader from "./BuildBlockHeader";
import tablerOverrides from "./BuildTablerOverrides";
import { BuildStateTag } from "./BuildWidgetsShared";

const ArtifactKindIcon = ({ color, kind = "" }) => (
  <div>
    <FontAwesomeIcon
      icon={getArtifactKindIcon(kind)}
      color={color}
      title={`Artifact kind: ${ARTIFACT_KIND_NAMES[kind]}`}
      size="lg"
    />
  </div>
);

const LatestBuildArtifactsIcons = ({ buildHasArtifacts, theme }) =>
  getIsArray(buildHasArtifacts) && (
    <>
      {buildHasArtifacts.map((a, i) => (
        <ArtifactKindIcon
          kind={get(a, "kind", ARTIFACT_KIND_NAMES.UnknownKind)}
          color={theme.bg.tagGreen}
          isFirst={i === 0}
          key={i}
        />
      ))}
    </>
  );

const AnyRunningBuildTags = ({ hasRunningBuilds, allBuildsForMr, theme }) =>
  hasRunningBuilds &&
  getIsArrayWithN(hasRunningBuilds) &&
  getIsArrayWithN(allBuildsForMr, 2) && (
    <Tag
      title={`${hasRunningBuilds.length} build${
        hasRunningBuilds.length > 1 ? "s" : ""
      } running`}
      styles={{
        ...tagColorStyles({
          theme,
          state: BUILD_STATE.Running,
        }),
      }}
    >
      {`${hasRunningBuilds.length} build${
        hasRunningBuilds.length > 1 ? "s" : ""
      } running`}
    </Tag>
  );

const LatestBuildQrButton = ({ onClick, theme, artifactPlistSignedUrl }) =>
  artifactPlistSignedUrl && (
    <div
      onClick={(e) => {
        onClick();
        e.stopPropagation();
      }}
      className="btn btn-sm"
      style={{
        ...primaryButtonColors(theme),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      title="Show QR code"
    >
      <FontAwesomeIcon
        icon={faQrcode}
        size="lg"
        color={theme.text.btnPrimary}
        style={{
          marginTop: 0,
          marginBottom: 0,
        }}
      />
    </div>
  );

const DlButtonSmall = ({ buildHasArtifacts, theme }) =>
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
          <div
            onClick={(e) => e.stopPropagation()}
            key={`${artifactPlistSignedUrl}=${i}`}
          >
            <a
              href={hasDlUrl}
              className="btn btn-sm"
              style={{
                ...primaryButtonColors(theme),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={hasDlUrl}
            >
              <Download size="1rem" style={{ marginRight: "0.3rem" }} />
              {`.${ARTIFACT_KIND_NAMES[artifactKind]}`}
            </a>
          </div>
        );
      })}
    </>
  );

const LatestBuildStateTags = ({
  collapsed,
  theme,
  buildState,
  buildId,
  buildHasArtifacts,
  allBuildsForMr,
  hasRunningBuilds,
}) => {
  const [showingQrModal, toggleShowQrModal] = useState(false);
  const firstArtifactPlistSignedUrl =
    buildHasArtifacts?.find((a) => a.kind === ARTIFACT_KIND_NAMES.IPA)
      ?.plist_signed_url || null;
  return (
    collapsed && (
      <>
        {showingQrModal && firstArtifactPlistSignedUrl && (
          <QrCode
            artifactPlistSignedUrl={firstArtifactPlistSignedUrl}
            closeAction={() => toggleShowQrModal(false)}
          />
        )}
        <BuildStateTag {...{ theme, buildState, buildId }} />
        <LatestBuildArtifactsIcons {...{ theme, buildHasArtifacts }} />
        <AnyRunningBuildTags {...{ hasRunningBuilds, allBuildsForMr, theme }} />
        <DlButtonSmall {...{ buildHasArtifacts, theme }} />
        <LatestBuildQrButton
          onClick={() => toggleShowQrModal(true)}
          theme={theme}
          artifactPlistSignedUrl={firstArtifactPlistSignedUrl}
        />
        <ShowingOlderBuildsTag nOlderBuilds={allBuildsForMr.length - 1} />
      </>
    )
  );
};

const BuildContainer = React.memo(
  ({ build, toCollapse, hasRunningBuilds, isLatestMaster = false }) => {
    const { state } = useContext(GlobalContext);
    const [collapsed, setCollapsed] = useState(toCollapse);
    const [showingAllBuilds, toggleShowingAllBuilds] = useState(false);

    const { theme } = useContext(ThemeContext);

    const toggleCollapsed = () => setCollapsed(!collapsed);

    const {
      short_id: buildShortId = "",
      id: buildId = "",
      branch: buildBranch = "",
      state: buildState = "",
      has_mergerequest: buildHasMr = null,
      has_artifacts: buildHasArtifacts = null,
      has_project: buildHasProject = null,
      has_mergerequest: {
        short_id: mrShortId = "",
        id: mrId = "",
        title: mrTitle = "",
        state: mrState = "",
        has_author: {
          name: buildAuthorName = "",
          id: buildAuthorId = "",
          avatar_url: buildAuthorAvatarUrl = "",
        } = {},
      } = {},
      allBuildsForMr = [],
    } = build || {};

    const {
      has_owner: {
        id: projectOwnerId = "",
        avatar_url: projectOwnerAvatarUrl = "",
      } = {},
    } = buildHasProject || {};

    const isMasterBuildBranch = getStrEquNormalized(buildBranch, BRANCH.MASTER);

    return (
      <>
        <div className={styles.buildBlock}>
          <div
            className="card"
            style={{
              backgroundColor: theme.bg.block,
              boxShadow: theme.shadowStyle.block,
              ...tablerOverrides.card,
            }}
            key={buildId}
            onClick={() => {
              if (collapsed) {
                toggleCollapsed();
              }
            }}
          >
            <BuildBlockHeader
              {...{
                buildAuthorName,
                buildAuthorAvatarUrl,
                buildAuthorId,
                buildHasMr,
                buildId,
                buildShortId,
                collapsed,
                isMasterBuildBranch,
                isLatestMaster,
                mrId,
                mrTitle,
                mrShortId,
                mrState,
                toggleCollapsed,
                projectOwnerId,
                projectOwnerAvatarUrl,
                ...{
                  childrenLatestBuildTags: (
                    <LatestBuildStateTags
                      {...{
                        collapsed,
                        theme,
                        buildState,
                        buildId,
                        buildHasArtifacts,
                        allBuildsForMr,
                        hasRunningBuilds,
                      }}
                    />
                  ),
                },
              }}
            />
            {!collapsed &&
              allBuildsForMr
                .filter((bIdx, i) =>
                  showingAllBuilds ? Number.isInteger(bIdx) : i === 0
                )
                .map((buildidx, i) => (
                  <BuildAndMrContainer
                    build={state.builds[buildidx]}
                    buildHasMr={buildHasMr}
                    hasRunningBuilds={hasRunningBuilds}
                    isLatestBuild={i === 0}
                    key={i}
                    nOlderBuilds={
                      i === 0 && getIsArrayWithN(allBuildsForMr, 2)
                        ? allBuildsForMr.length - 1
                        : 0
                    }
                    showingAllBuilds={showingAllBuilds}
                    toggleShowingAllBuilds={toggleShowingAllBuilds}
                  />
                ))}
          </div>
        </div>
      </>
    );
  }
);

// BuildContainer.whyDidYouRender = true

export default BuildContainer;
