'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/navigation/AppShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { notificationsApi } from '@/services/api';
import { formatRelativeTime } from '@/lib/format';
import styles from './notifications.module.css';

export default function NotificationsPage() {
  return (
    <AppShell title="Сповіщення" allowedRoles={['student', 'teacher']}>
      <NotificationsContent />
    </AppShell>
  );
}

function NotificationsContent() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOne = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Поки тихо"
        description="Нових сповіщень немає."
        icon="🔔"
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <h1>Сповіщення</h1>
        <Button size="md" variant="ghost" onClick={() => markAll.mutate()}>
          Позначити всі
        </Button>
      </div>
      <div className={styles.list}>
        {data.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.card} ${item.read ? '' : styles.unread}`}
            onClick={() => markOne.mutate(item.id)}
          >
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            <span>{formatRelativeTime(item.createdAt)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
