import React from 'react'
import ConditionallyWrappedComponent from '../ConditionallyWrappedComponent'

const SplitMessage = ({ text }) => (
  <>
    {text.split('\n').filter((x) => !!x).map((x, i) => (
      <p className="build-message-line" key={i}>{x}</p>
    ))}
  </>
)

const LongBuildMessage = ({
  children, colorInteractiveText, toggleMessageExpanded, messageExpanded,
}) => (
  <div className="interactive-text build-message" onClick={() => toggleMessageExpanded(!messageExpanded)}>
    {children}
    <span className="build-message-line-suffix" style={colorInteractiveText}>
      {!messageExpanded ? '... [show more]' : ' [show less]'}
    </span>
  </div>
)

const BuildMessage = ({
  buildMessage = '', colorInteractiveText, messageExpanded, toggleMessageExpanded,
}) => {
  const MESSAGE_LEN = 140
  const isLong = buildMessage.length > MESSAGE_LEN
  const text = !isLong || messageExpanded ? buildMessage : buildMessage.slice(0, MESSAGE_LEN)
  return (
    <ConditionallyWrappedComponent
      condition={isLong}
      wrapper={(children) => (
        <LongBuildMessage {...{ colorInteractiveText, messageExpanded, toggleMessageExpanded }}>
          {children}
        </LongBuildMessage>
      )}
    >
      <SplitMessage text={text} />
    </ConditionallyWrappedComponent>
  )
}

export default BuildMessage
