import React from 'react'

import './Build.scss'
import withTheme from '../../helpers/withTheme'

const BuildBlockTitle = ({
  isMasterBuildBranch,
  buildShortId,
  mrShortId,
  buildId,
  mrId,
  mrTitle,
  buildHasMr,
  ...injectedProps
}) => {
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
    </a>
  )
  const BlockSubtitlePullWithMr = !isMasterBuildBranch && mrShortId && <>{mrTitle}</>
  const BlockSubtitleDefault = ''

  const Title = () => (
    <h2 className="short-block-title">
      {BlockTitleMasterWithMr
        || BlockTitleMasterNoMr
        || BlockTitlePullWithMr
        || BlockDefaultTitle}
    </h2>
  )

  const Subtitle = () => (
    <h3 className="block-mr-subtitle" style={injectedProps.themeStyles.textPlain}>
      {BlockSubtitleMasterWithMr
        || BlockSubtitlePullWithMr
        || BlockSubtitleDefault}
    </h3>
  )

  return (
    <div className="block-title" style={injectedProps.themeStyles.textBlockTitle}>
      <Title />
      <Subtitle />
    </div>
  )
}

export default withTheme(BuildBlockTitle)
