import React from 'react'
import ConditionallyWrappedComponent from '../ConditionallyWrappedComponent'
import styles from './Build.module.scss'

const SplitMessage = ({ text }) => (
  <>
    {text.split('\n').filter((x) => !!x).map((x, i) => (
      <p className={styles.buildMessageLine} key={i}>{x}</p>
    ))}
  </>
)

const LongBuildMessage = ({
  children, toggleMessageExpanded, messageExpanded, theme,
}) => (
  <div className={`${styles.buildMessage} ${styles.interactive}`} onClick={() => toggleMessageExpanded(!messageExpanded)}>
    {children}
    <span className={styles.buildMessageLineSuffix} style={{ color: theme.text.blockTitle }}>
        &nbsp;
      {!messageExpanded ? '... [show more]' : ' [show less]'}
    </span>
  </div>
)

const BuildMessage = ({
  buildMessage = '', messageExpanded, toggleMessageExpanded, theme,
}) => {
  const MESSAGE_LEN = 140
  const isLong = buildMessage.length > MESSAGE_LEN
  const text = !isLong || messageExpanded ? buildMessage : buildMessage.slice(0, MESSAGE_LEN)
  return (
    <ConditionallyWrappedComponent
      condition={isLong}
      wrapper={(children) => (
        <LongBuildMessage {...{ messageExpanded, toggleMessageExpanded, theme }}>
          {children}
        </LongBuildMessage>
      )}
    >
      <SplitMessage text={text} />
    </ConditionallyWrappedComponent>
  )
}

export default BuildMessage
