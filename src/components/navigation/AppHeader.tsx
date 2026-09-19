'use client';

import Link from 'next/link';
import styles from './AppHeader.module.css';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { NotificationsMenu } from './NotificationsMenu';

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <header className={styles.header}>
      <div className={styles.titleWrap}>
        {title ? <h1 className={styles.title}>{title}</h1> : null}
      </div>
      <div className={styles.actions}>
        <NotificationsMenu />
        <Link href="/profile" className={styles.profileLink} aria-label="Профіль">
          <Avatar
            emoji={user.avatarEmoji}
            color={user.avatarColor}
            size="sm"
            label={user.displayName}
          />
        </Link>
      </div>
    </header>
  );
}
