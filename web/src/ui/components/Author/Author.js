import React from 'react'
import { User } from 'react-feather'
import styles from './Author.module.scss'
import withTheme from '../../helpers/withTheme'

const Author = ({
  authorName = '', authorUrl = '', avatarUrl = '', ...injectedProps
}) => {
  const { theme: { text: { sectionText } }, themeStyles } = injectedProps
  const Avatar = () => authorUrl && avatarUrl ? (
    <a href={authorUrl} title={authorUrl}>
      <img src={avatarUrl} alt={authorUrl} />
    </a>
  ) : (
    <User
      color={sectionText}
      title={authorName || 'Unknown author'}
    />
  )

  const AuthorName = () => authorUrl ? (
    <a
      href={authorUrl}
      className={styles['author-url-name']}
      style={themeStyles.textSectionTitle}
    >
      <small>{authorName}</small>
    </a>
  ) : (
    <small>{authorName}</small>
  )

  return (
    <div className={styles['author-wrapper']}>
      <div className={styles['author-name-wrapper']}>
        <AuthorName />
      </div>
      <div className={styles['author-avatar-wrapper']}>
        <Avatar />
      </div>
    </div>
  )
}

export default withTheme(Author)
