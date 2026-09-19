'use client';

import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/navigation/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ComposePostCard } from '@/components/posts/ComposePostCard';
import { PostCard } from '@/components/posts/PostCard';
import { studentApi } from '@/services/api';
import styles from './board.module.css';

export default function BoardPage() {
  return (
    <AppShell title="Моя дошка" allowedRoles={['student']}>
      <BoardContent />
    </AppShell>
  );
}

function BoardContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['board'],
    queryFn: studentApi.getBoard,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className={styles.page}>
      <ComposePostCard />

      <section className={styles.list}>
        <h2>Мої публікації</h2>
        {!data || data.length === 0 ? (
          <EmptyState
            title="Ти ще нічого не показував"
            description="Напиши зверху, чим хочеш поділитись з класом."
          />
        ) : (
          data.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </section>
    </div>
  );
}
