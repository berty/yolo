import React, { useContext } from 'react'
import { User } from 'react-feather'
import styles from './Author.module.scss'
import ConditionallyWrappedComponent from '../ConditionallyWrappedComponent'
import { ThemeContext } from '../../../store/ThemeStore'

const Avatar = ({
  theme, buildAuthorAvatarUrl, buildAuthorId, buildAuthorName,
}) => buildAuthorId && buildAuthorAvatarUrl ? (
  <a href={buildAuthorId} title={buildAuthorId}>
    <img src={buildAuthorAvatarUrl} alt={buildAuthorId} />
  </a>
) : (
  <User
    color={theme.text.sectionTitle}
    title={buildAuthorName || 'Unknown author'}
  />
)

const AuthorName = ({
  theme, buildAuthorId, buildAuthorName,
}) => (
  <ConditionallyWrappedComponent
    condition={!!buildAuthorId}
    wrapper={(children) => (
      <a
        href={buildAuthorId}
        className={styles['author-url-name']}
        style={{ color: theme.text.sectionTitle }}
      >
        {children}
      </a>
    )}
  >
    <small>{buildAuthorName}</small>
  </ConditionallyWrappedComponent>
)

const Author = ({
  buildAuthorName = '', buildAuthorId = '', buildAuthorAvatarUrl = '',
}) => {
  const { theme } = useContext(ThemeContext)

  return (
    <div className={styles['author-wrapper']}>
      <div className={styles['author-name-wrapper']}>
        <AuthorName {...{
          buildAuthorId, buildAuthorName, buildAuthorAvatarUrl, theme,
        }}
        />
      </div>
      <div className={styles['author-avatar-wrapper']}>
        <Avatar {...{
          buildAuthorAvatarUrl, buildAuthorId, buildAuthorName, theme,
        }}
        />
      </div>
    </div>
  )
}

export default Author
