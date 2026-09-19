'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/navigation/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { studentApi } from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import styles from './quiz.module.css';

export default function QuizPage() {
  return (
    <AppShell title="Тест" allowedRoles={['student']}>
      <QuizContent />
    </AppShell>
  );
}

function QuizContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{
    message: string;
    attempt: { score: number; total: number; xpEarned: number };
    review: Array<{
      text: string;
      selected: number;
      correctIndex: number;
      isCorrect: boolean;
      options: string[];
    }>;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['quiz', params.id],
    queryFn: () => studentApi.getQuiz(params.id),
  });

  const mutation = useMutation({
    mutationFn: (payload: number[]) => studentApi.submitQuiz(params.id, payload),
    onSuccess: (payload) => {
      setResult(payload);
      showToast(`${payload.message} +${payload.attempt.xpEarned} XP`);
    },
  });

  if (isLoading) {
    return <LoadingState label="Готуємо питання..." />;
  }

  if (!data) {
    return <EmptyState title="Тест не знайдено" description="Повернись до навчання." />;
  }

  if (result) {
    return (
      <Card className={styles.card}>
        <h1>Ти завершив тест!</h1>
        <p>
          Результат: {result.attempt.score} із {result.attempt.total}
        </p>
        <p className={styles.xp}>+{result.attempt.xpEarned} XP</p>
        <div className={styles.review}>
          {result.review.map((item) => (
            <div key={item.text} className={styles.reviewItem}>
              <strong>{item.text}</strong>
              <p>
                Твоя відповідь: {item.options[item.selected] ?? '—'}
                {item.isCorrect ? ' ✓' : ''}
              </p>
              {!item.isCorrect ? (
                <p className={styles.hint}>
                  Можна повторити. Правильний варіант: {item.options[item.correctIndex]}
                </p>
              ) : (
                <p className={styles.ok}>Чудово!</p>
              )}
            </div>
          ))}
        </div>
        <Button fullWidth onClick={() => router.push('/learning')}>
          Повернутися до навчання
        </Button>
      </Card>
    );
  }

  const question = data.questions[index];

  return (
    <Card className={styles.card}>
      <ProgressBar
        value={index + 1}
        max={data.questions.length}
        label={`Питання ${index + 1} із ${data.questions.length}`}
      />
      <h1>{question.text}</h1>
      <div className={styles.options}>
        {question.options.map((option, optionIndex) => (
          <button
            key={option}
            type="button"
            className={styles.option}
            onClick={() => {
              const nextAnswers = [...answers];
              nextAnswers[index] = optionIndex;
              setAnswers(nextAnswers);

              if (index + 1 >= data.questions.length) {
                mutation.mutate(nextAnswers);
                return;
              }

              setIndex((value) => value + 1);
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </Card>
  );
}
