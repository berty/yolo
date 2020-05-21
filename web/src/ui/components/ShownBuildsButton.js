
import React, { useContext } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { ThemeContext } from '../../store/ThemeStore'
import { tagStyle } from '../styleTools/buttonStyler'
import Tag from './Tag/Tag'

const ShownBuildsButton = ({
  nOlderBuilds,
  showingAllBuilds = null,
  toggleShowingAllBuilds = null,
}) => {
  const {
    theme: {
      name,
      text: { blockTitle },
    },
  } = useContext(ThemeContext)

  const multipleOlderBuilds = nOlderBuilds > 1
  const isInteractive = !!toggleShowingAllBuilds

  const messagePrefix = showingAllBuilds ? 'hide' : 'show'

  const message = nOlderBuilds
    ? `${isInteractive ? messagePrefix : ''} ${nOlderBuilds} older build${
      multipleOlderBuilds ? 's' : ''
    }`
    : ''

  const Icon = () => (showingAllBuilds ? <ChevronUp color={blockTitle} />
    : <ChevronDown color={blockTitle} />
  )

  const ShownBuildsTag = () => (
    <Tag
      classes={['btn-info-tag']}
      title={message}
      styles={tagStyle({
        name,
        state: null,
        cursor: !isInteractive ? undefined : 'pointer',
      })}
      onClick={!isInteractive ? undefined : () => toggleShowingAllBuilds(!showingAllBuilds)}
    >
      {isInteractive && <Icon />}
      {message}
    </Tag>
  )

  return (
    <>
      {message && <ShownBuildsTag />}
    </>
  )
}

export default ShownBuildsButton
