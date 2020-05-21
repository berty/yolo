import React, { useContext } from 'react'

import './Build.scss'
import { ThemeContext } from '../../../store/ThemeStore'

const BuildBlockTitle = ({
  isMasterBuildBranch,
  buildShortId,
  mrShortId,
  buildId,
  mrId,
  mrTitle,
  buildHasMr,
}) => {
  const {
    theme: {
      text: { sectionText, blockTitle },
    },
  } = useContext(ThemeContext)

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
    <h3 className="block-mr-subtitle" style={{ color: sectionText }}>
      {BlockSubtitleMasterWithMr
        || BlockSubtitlePullWithMr
        || BlockSubtitleDefault}
    </h3>
  )

  return (
    <div className="block-title" style={{ color: blockTitle }}>
      <Title />
      <Subtitle />
    </div>
  )
}

export default BuildBlockTitle
