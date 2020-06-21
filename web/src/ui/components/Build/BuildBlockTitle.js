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
}) => {
  const { theme } = useContext(ThemeContext)
  const mrDisplayId = mrShortId ? `#${mrShortId}` : ''
  const buildDisplayId = buildShortId ? `#${buildShortId}` : buildId
  const BlockTitleMasterNoMr = isMasterBuildBranch
    ? `Master - build ${buildDisplayId}` : ''
  const BlockTitleMasterWithMr = isMasterBuildBranch && buildHasMr ? 'Master' : ''
  const BlockTitlePullWithMr = !isMasterBuildBranch && mrShortId && (
    <a href={mrId}>
      {'Pull '}
      <u>
        {mrDisplayId}
      </u>
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
      <u>
        {mrDisplayId}
      </u>
      {mrTitle && `: ${mrTitle}`}
    </a>
  )
  const BlockSubtitlePullWithMr = !isMasterBuildBranch && mrShortId && <>{mrTitle}</>
  const BlockSubtitleDefault = ''

  const Title = () => (
    <h2 className={styles.shortBlockTitle}>
      {BlockTitleMasterWithMr
        || BlockTitleMasterNoMr
        || BlockTitlePullWithMr
        || BlockDefaultTitle}
    </h2>
  )

  const Subtitle = () => (
    <h3 className={styles.blockMrSubtitle} style={{ color: theme.text.sectionText }}>
      {BlockSubtitleMasterWithMr
        || BlockSubtitlePullWithMr
        || BlockSubtitleDefault}
    </h3>
  )

  return (
    <div className={styles.blockTitle} style={{ color: theme.text.blockTitle }}>
      <Title />
      <Subtitle />
    </div>
  )
}

export default BuildBlockTitle
