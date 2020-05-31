
import React from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { tagColorStyles } from '../styleTools/buttonStyler'
import Tag from './Tag/Tag'
import withTheme from '../helpers/withTheme'

const ShowingOlderBuildsTag = ({
  nOlderBuilds,
  showingAllBuilds = null,
  toggleShowingAllBuilds = null,
  ...injectedProps
}) => {
  const {
    theme: {
      text: { blockTitle },
    },
    theme,
  } = injectedProps

  const multipleOlderBuilds = nOlderBuilds > 1
  const isInteractive = !!toggleShowingAllBuilds

  const messagePrefix = showingAllBuilds ? 'hide' : 'show'

  const message = nOlderBuilds > 0
    ? `${isInteractive ? messagePrefix : ''} ${nOlderBuilds} older build${
      multipleOlderBuilds ? 's' : ''
    }`
    : ''

  const Icon = () => (showingAllBuilds ? <ChevronUp color={blockTitle} />
    : <ChevronDown color={blockTitle} />
  )

  return (message
    && (
    <Tag
      classes={['btn-info-tag']}
      title={message}
      styles={{
        ...tagColorStyles({
          theme,
          state: null,

        }),
        cursor: !isInteractive ? 'default' : 'pointer',
      }}
      onClick={!isInteractive ? undefined : () => toggleShowingAllBuilds(!showingAllBuilds)}
    >
      {isInteractive && <Icon />}
      {message}
    </Tag>
    )
  )
}

export default withTheme(ShowingOlderBuildsTag)
