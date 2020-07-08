import React, { useContext } from 'react'
import { ThemeContext } from '../../../store/ThemeStore'
import styles from './Build.module.scss'

const BuildBlockTitle = ({
  isMasterBuildBranch,
  buildShortId,
  mrShortId,
  buildId,
  mrId,
  mrTitle,
  buildHasMr,
  isLatestMaster,
}) => {
  const { theme } = useContext(ThemeContext)
  const mrDisplayId = mrShortId ? `#${mrShortId}` : ''
  const buildDisplayId = buildShortId ? `#${buildShortId}` : buildId
  const BlockTitleMasterNoMr = isMasterBuildBranch
    ? `Master - build ${buildDisplayId}`
    : ''
  const BlockTitleMasterWithMr = isMasterBuildBranch && buildHasMr ? 'Master' : ''
  const BlockTitlePullWithMr = !isMasterBuildBranch && mrShortId && (
    <a href={mrId}>
      {'Pull '}
      <u>{mrDisplayId}</u>
    </a>
  )
  const BlockDefaultTitle = (
    <a href={buildId}>
      {'Build '}
      <u>{`${buildDisplayId}`}</u>
    </a>
  )

  const BlockSubtitleMasterWithMr = isMasterBuildBranch && buildHasMr && (
    <a href={mrId}>
      {'Merge '}
      <u>{mrDisplayId}</u>
      {mrTitle && `: ${mrTitle}`}
    </a>
  )

  const BuildIsLatestMasterIndicator = isLatestMaster && (
    <span
      role="img"
      aria-label="sheep"
      style={{ marginRight: '0.66rem', cursor: 'default' }}
      title="Latest build on Master!"
    >
      ⭐️
    </span>
  )
  const BlockSubtitlePullWithMr = !isMasterBuildBranch && mrShortId && (
    <>{mrTitle}</>
  )
  const BlockSubtitleDefault = ''

  const Title = () => (
    <h2 className={styles.shortBlockTitle}>
      {BuildIsLatestMasterIndicator}
      {BlockTitleMasterWithMr
        || BlockTitleMasterNoMr
        || BlockTitlePullWithMr
        || BlockDefaultTitle}
    </h2>
  )

  const Subtitle = () => (
    <h3
      className={styles.blockMrSubtitle}
      style={{ color: theme.text.sectionText }}
    >
      {BlockSubtitleMasterWithMr
        || BlockSubtitlePullWithMr
        || BlockSubtitleDefault}
    </h3>
  )

  return (
    <div
      className={styles.blockTitle}
      style={{ color: theme.text.blockTitle }}
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <Title />
      <Subtitle />
    </div>
  )
}

export default BuildBlockTitle
