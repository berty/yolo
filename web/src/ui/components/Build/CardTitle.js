import React, { useContext } from 'react'

import './Build.scss'
import { ThemeContext } from '../../../store/ThemeStore'

const CardTitle = ({
  isMaster,
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

  const mrDisplayShortId = mrShortId && <>{`#${mrShortId}`}</>
  const mrDisplayId = mrDisplayShortId || <>{mrId}</>

  const buildDisplayShortId = buildShortId && <>{`#${buildShortId}`}</>
  const buildDisplayId = buildDisplayShortId || <>{buildId}</>

  const CardTitleMasterNoMr = isMaster && (
  <>
    Master - build
    {buildDisplayId}
  </>
  )
  const CardTitleMasterWithMr = isMaster && buildHasMr && <>Master</>
  const CardTitlePullWithMr = !isMaster && mrShortId && (
    <>
      Pull
      {' '}
      <u>
        <a href={mrId}>{mrDisplayId}</a>
      </u>
    </>
  )
  const CardDefaultTitle = (
    <>
      Build
      {buildDisplayId}
    </>
  )

  const CardSubtitleMasterWithMr = isMaster && buildHasMr && (
    <>
      Merge
      {' '}
      <u>
        <a href={mrId}>{mrDisplayId}</a>
      </u>
    </>
  )
  const CardSubtitlePullWithMr = !isMaster && mrShortId && <>{mrTitle}</>
  const CardSubtitleDefault = ''

  const CardMainTitle = (
    <div className="short-card-title">
      {CardTitleMasterWithMr
        || CardTitleMasterNoMr
        || CardTitlePullWithMr
        || CardDefaultTitle}
    </div>
  )

  const CardSubtitle = (
    <div className="card-mr-subtitle" style={{ color: sectionText }}>
      {CardSubtitleMasterWithMr
        || CardSubtitlePullWithMr
        || CardSubtitleDefault}
    </div>
  )

  return (
    <h2 className="card-title" style={{ color: blockTitle }}>
      <div className="card-title">
        {CardMainTitle}
        {CardSubtitle}
      </div>
    </h2>
  )
}

export default CardTitle
