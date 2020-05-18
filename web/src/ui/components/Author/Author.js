import React, { useContext } from 'react'
import { User } from 'react-feather'
import styles from './Author.module.scss'
import { ThemeContext } from '../../../store/ThemeStore'

const Author = ({ authorName = '', authorUrl = '', avatarUrl = '' }) => {
  const { theme } = useContext(ThemeContext)
  const Avatar = () => authorUrl && avatarUrl ? (
    <a href={authorUrl} title={authorUrl}>
      <img src={avatarUrl} alt={authorUrl} />
    </a>
  ) : (
    <User
      color={theme.text.sectionText}
      title={authorName || 'Unknown author'}
    />
  )

  const AuthorName = () => authorUrl ? (
    <a
      href={authorUrl}
      className={styles['author-url-name']}
      style={{ color: theme.text.sectionTitle }}
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

export default Author
