
import React, { useContext } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import Tag from './Tag/Tag'
import { ThemeContext } from '../../store/ThemeStore'

const ShowingOlderBuildsTag = ({
  nOlderBuilds,
  showingAllBuilds = null,
  toggleShowingAllBuilds = null,
}) => {
  const { theme } = useContext(ThemeContext)

  const multipleOlderBuilds = nOlderBuilds > 1
  const isInteractive = !!toggleShowingAllBuilds
  const marginRight = isInteractive ? 0 : undefined

  const messagePrefix = showingAllBuilds ? 'hide' : 'show'

  const message = nOlderBuilds > 0
    ? `${isInteractive ? messagePrefix : ''} ${nOlderBuilds} older build${
      multipleOlderBuilds ? 's' : ''
    }`
    : ''

  const Icon = () => (showingAllBuilds ? <ChevronUp />
    : <ChevronDown />
  )

  return (message
    && (
      <Tag
        title={message}
        styles={{
          color: theme.text.blockTitle,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: isInteractive ? theme.text.blockTitle : theme.text.sectionText,
          marginRight,
        }}
        onClick={!isInteractive ? undefined : () => toggleShowingAllBuilds(!showingAllBuilds)}
      >
        {isInteractive && <Icon />}
        {message}
      </Tag>
    )
  )
}

export default ShowingOlderBuildsTag
