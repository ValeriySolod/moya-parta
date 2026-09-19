import Image from 'next/image';
import type { ReactNode } from 'react';
import styles from './SectionCard.module.css';

export type SectionTone =
  | 'today'
  | 'tasks'
  | 'events'
  | 'board'
  | 'class'
  | 'learning'
  | 'wins'
  | 'invite'
  | 'chat';

type SectionCardProps = {
  tone: SectionTone;
  title: string;
  iconSrc?: string;
  action?: ReactNode;
  children: ReactNode;
  compact?: boolean;
  className?: string;
};

export function SectionCard({
  tone,
  title,
  iconSrc,
  action,
  children,
  compact = true,
  className = '',
}: SectionCardProps) {
  return (
    <article
      className={[
        styles.card,
        styles[tone],
        compact ? styles.compact : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.head}>
        <div className={styles.titleRow}>
          {iconSrc ? (
            <Image
              src={iconSrc}
              alt=""
              width={28}
              height={28}
              className={styles.icon}
            />
          ) : null}
          <h2>{title}</h2>
        </div>
        {action ? <div className={styles.action}>{action}</div> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </article>
  );
}
