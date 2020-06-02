import React from 'react'
import { BUILD_STATE } from '../../../constants'
import { tagColorStyles } from '../../styleTools/buttonStyler'
import Tag from '../Tag/Tag'

export const BuildStateTag = ({
  buildState, theme, buildId,
}) => {
  const buildStateIsPassed = (buildState === BUILD_STATE.Passed)
  return buildState && (
    <Tag
      title={buildStateIsPassed ? buildId : 'Build state'}
      styles={tagColorStyles({ theme, state: BUILD_STATE[buildState] })}
      href={buildStateIsPassed ? buildId : null}
    >
      {buildState}
    </Tag>
  )
}
