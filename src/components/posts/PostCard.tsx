'use client';

import { Avatar } from '@/components/ui/Avatar';
import { SAFE_REACTIONS, type Post } from '@/types';
import { formatRelativeTime } from '@/lib/format';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: Post;
  onReact?: (reaction: string) => void;
}

export function PostCard({ post, onReact }: PostCardProps) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <Avatar
          emoji={post.author?.avatarEmoji ?? '🙂'}
          color={post.author?.avatarColor ?? '#B8DDF5'}
          size="sm"
          label={post.author?.displayName}
        />
        <div>
          <div className={styles.name}>{post.author?.displayName ?? 'Учень'}</div>
          <div className={styles.time}>{formatRelativeTime(post.createdAt)}</div>
        </div>
      </header>

      <p className={styles.text}>{post.text}</p>

      {post.imageEmoji ? (
        <div className={styles.media} aria-hidden="true">
          {post.imageEmoji}
        </div>
      ) : null}

      {onReact ? (
        <div className={styles.reactions}>
          {SAFE_REACTIONS.map((reaction) => {
            const count = post.reactionCounts?.[reaction] ?? 0;
            return (
              <button
                key={reaction}
                type="button"
                className={styles.reaction}
                onClick={() => onReact(reaction)}
                aria-label={`Реакція ${reaction}`}
              >
                <span>{reaction}</span>
                {count > 0 ? <span>{count}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
