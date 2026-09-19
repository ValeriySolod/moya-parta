'use client';

import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/navigation/AppShell';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PostCard } from '@/components/posts/PostCard';
import { studentApi } from '@/services/api';
import styles from './class.module.css';

export default function TeacherClassPage() {
  return (
    <AppShell title="Мій клас" allowedRoles={['teacher']}>
      <TeacherClassContent />
    </AppShell>
  );
}

function TeacherClassContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-class'],
    queryFn: studentApi.getClass,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (!data) {
    return <EmptyState title="Клас не знайдено" />;
  }

  return (
    <div className={styles.page}>
      <Card className={styles.overview}>
        <div>
          <h1>{data.class.name}</h1>
          <div className={styles.students}>
            {data.students.map((student) => (
              <div key={student.id} className={styles.student}>
                <Avatar
                  emoji={student.avatarEmoji}
                  color={student.avatarColor}
                  size="sm"
                />
                <span>{student.displayName}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.goalBlock}>
          <h2>Спільний прогрес</h2>
          <ProgressBar
            value={data.goal.current}
            max={data.goal.target}
            label={data.goal.title}
            tone="secondary"
          />
        </div>
      </Card>

      <section className={styles.board}>
        <h2>Дошка класу</h2>
        <div className={styles.boardList}>
          {data.board.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
