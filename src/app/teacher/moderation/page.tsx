'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/navigation/AppShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { PostCard } from '@/components/posts/PostCard';
import { studentApi, teacherApi } from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import styles from './moderation.module.css';

export default function ModerationPage() {
  return (
    <AppShell title="Дошка класу" allowedRoles={['teacher']}>
      <ModerationContent />
    </AppShell>
  );
}

function ModerationContent() {
  const showToast = useUiStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-class-board'],
    queryFn: studentApi.getClass,
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'published' | 'rejected' | 'hidden';
    }) => teacherApi.moderatePost(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher-class-board'] });
      showToast('Готово');
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  const board = data?.board ?? [];

  if (board.length === 0) {
    return (
      <EmptyState
        title="Дошка ще порожня"
        description="Коли учні поділяться — пости зʼявляться тут. За потреби можна приховати."
      />
    );
  }

  return (
    <div className={styles.page}>
      <p className={styles.lead}>
        Публікації зʼявляються одразу. Тут можна приховати пост, якщо треба.
      </p>
      {board.map((post) => (
        <div key={post.id} className={styles.item}>
          <PostCard post={post} />
          <div className={styles.actions}>
            <Button
              size="md"
              variant="ghost"
              onClick={() => mutation.mutate({ id: post.id, status: 'hidden' })}
            >
              Приховати
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
