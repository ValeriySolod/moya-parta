'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { NavCount } from './NavCount';
import { useNavBadges } from '@/hooks/useNavBadges';
import { navApi, notificationsApi } from '@/services/api';
import { formatRelativeTime } from '@/lib/format';
import styles from './NotificationsMenu.module.css';

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { badges } = useNavBadges();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    enabled: open,
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['nav-badges'] });
    },
  });

  const markOne = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['nav-badges'] });
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    void navApi.markSeen('notifications').then((next) => {
      queryClient.setQueryData(['nav-badges'], next);
    });
  }, [open, queryClient]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const count = badges.notifications;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        aria-label={
          count ? `Сповіщення, ${count} нових` : 'Сповіщення'
        }
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.iconWrap}>
          <Bell size={20} aria-hidden="true" />
          <NavCount count={count} label="Сповіщення" />
        </span>
      </button>

      {open ? (
        <div className={styles.panel} role="menu" aria-label="Список сповіщень">
          <div className={styles.panelHead}>
            <strong>Сповіщення</strong>
            <button
              type="button"
              className={styles.markAll}
              disabled={markAll.isPending || !data?.length}
              onClick={() => markAll.mutate()}
            >
              Прочитати всі
            </button>
          </div>

          <div className={styles.list}>
            {isLoading || isFetching ? (
              <p className={styles.empty}>Завантажуємо...</p>
            ) : !data?.length ? (
              <p className={styles.empty}>Поки тихо — нових сповіщень немає.</p>
            ) : (
              data.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={`${styles.item} ${item.read ? '' : styles.unread}`}
                  onClick={() => markOne.mutate(item.id)}
                >
                  <strong>{item.title}</strong>
                  <span className={styles.body}>{item.body}</span>
                  <span className={styles.time}>
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            className={styles.footerLink}
            onClick={() => setOpen(false)}
          >
            Усі сповіщення
          </Link>
        </div>
      ) : null}
    </div>
  );
}
