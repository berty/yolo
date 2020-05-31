import React from 'react'
import { User } from 'react-feather'
import styles from './Author.module.scss'
import withTheme from '../../helpers/withTheme'
import ConditionallyWrappedComponent from '../ConditionallyWrappedComponent'

const Avatar = ({
  sectionText, buildAuthorAvatarUrl, buildAuthorId, buildAuthorName,
}) => buildAuthorId && buildAuthorAvatarUrl ? (
  <a href={buildAuthorId} title={buildAuthorId}>
    <img src={buildAuthorAvatarUrl} alt={buildAuthorId} />
  </a>
) : (
  <User
    color={sectionText}
    title={buildAuthorName || 'Unknown author'}
  />
)

const AuthorName = ({
  themeStyles, buildAuthorId, buildAuthorName,
}) => (
  <ConditionallyWrappedComponent
    condition={!!buildAuthorId}
    wrapper={(children) => (
      <a
        href={buildAuthorId}
        className={styles['author-url-name']}
        style={themeStyles.textSectionTitle}
      >
        {children}
      </a>
    )}
  >
    <small>{buildAuthorName}</small>
  </ConditionallyWrappedComponent>
)

const Author = ({
  buildAuthorName = '', buildAuthorId = '', buildAuthorAvatarUrl = '', ...injectedProps
}) => {
  const { theme: { text: { sectionText } }, themeStyles } = injectedProps


  return (
    <div className={styles['author-wrapper']}>
      <div className={styles['author-name-wrapper']}>
        <AuthorName {...{
          buildAuthorId, buildAuthorName, buildAuthorAvatarUrl, themeStyles,
        }}
        />
      </div>
      <div className={styles['author-avatar-wrapper']}>
        <Avatar {...{
          buildAuthorAvatarUrl, buildAuthorId, buildAuthorName, sectionText,
        }}
        />
      </div>
    </div>
  )
}

export default withTheme(Author)
