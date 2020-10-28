import React from "react";
import { User } from "react-feather";
import styles from "../FeedItem/FeedItemWidgets.module.css";

const Author = ({
  buildAuthorName = "",
  buildAuthorId = "",
  buildAuthorAvatarUrl = "",
}) => {
  return !buildAuthorId || !buildAuthorName ? null : (
    <a
      className={styles.authorWrapper}
      href={buildAuthorId}
      title={buildAuthorId}
    >
      {<span className={styles.authorName}>{buildAuthorName}</span>}
      <div className={styles.avatar}>
        {buildAuthorAvatarUrl ? (
          <img src={buildAuthorAvatarUrl} alt={buildAuthorName} />
        ) : (
          <User title={buildAuthorName} />
        )}
      </div>
    </a>
  );
};

export default Author;
