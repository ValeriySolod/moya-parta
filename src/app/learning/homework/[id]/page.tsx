'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/navigation/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { studentApi } from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import styles from './homework.module.css';

export default function HomeworkPage() {
  return (
    <AppShell title="Завдання" allowedRoles={['student']}>
      <HomeworkContent />
    </AppShell>
  );
}

function HomeworkContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);
  const [answer, setAnswer] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['learning'],
    queryFn: studentApi.getLearning,
  });

  const homework = useMemo(
    () => data?.homework.find((item) => item.id === params.id),
    [data, params.id],
  );

  const mutation = useMutation({
    mutationFn: () => studentApi.submitHomework(params.id, answer),
    onSuccess: (result) => {
      showToast(result.message);
      router.push('/learning');
    },
    onError: () => showToast('Щось пішло не так. Спробуй ще раз', 'error'),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (!homework) {
    return (
      <EmptyState title="Завдання не знайдено" description="Повернись до навчання." />
    );
  }

  return (
    <Card className={styles.card}>
      <p className={styles.kicker}>
        {homework.status === 'revise'
          ? 'Учитель просить доробити'
          : 'Готовий до нового кроку?'}
      </p>
      <h1>{homework.title}</h1>
      <p className={styles.description}>{homework.description}</p>
      {homework.teacherComment ? (
        <p className={styles.comment}>
          Коментар учителя: {homework.teacherComment}
        </p>
      ) : null}
      {homework.linkedQuizId && homework.status === 'revise' ? (
        <Button
          variant="secondary"
          fullWidth
          onClick={() => router.push(`/learning/quiz/${homework.linkedQuizId}`)}
        >
          Пройти повʼязаний тест
        </Button>
      ) : null}
      <p className={styles.xp}>+{homework.xpReward} XP</p>

      <label className={styles.field}>
        <span>
          {homework.status === 'revise'
            ? 'Що ти змінив або доробив?'
            : 'Як ти виконав завдання?'}
        </span>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={5}
          placeholder="Напиши коротко або опиши свою роботу"
        />
      </label>

      <Button
        fullWidth
        disabled={!answer.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending
          ? 'Надсилаємо...'
          : homework.status === 'revise'
            ? 'Надіслати знову'
            : 'Виконати'}
      </Button>
    </Card>
  );
}
