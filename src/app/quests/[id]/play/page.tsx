'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/navigation/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { studentApi } from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import styles from './play.module.css';

const GUIDE_EMOJI = '🦊';

export default function QuestPlayPage() {
  return (
    <AppShell title="Квест" allowedRoles={['student']}>
      <QuestPlayContent />
    </AppShell>
  );
}

function QuestPlayContent() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['quest', params.id],
    queryFn: () => studentApi.getQuest(params.id),
  });

  if (isLoading) {
    return <LoadingState label="Готуємо експедицію..." />;
  }

  if (!data) {
    return (
      <EmptyState
        title="Квест не знайдено"
        description="Можливо, його ще не додав учитель, або він належить іншому класу."
      />
    );
  }

  return <QuestPlaySession key={data.id} quest={data} />;
}

function QuestPlaySession({
  quest: data,
}: {
  quest: NonNullable<Awaited<ReturnType<typeof studentApi.getQuest>>>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  const [activeStep, setActiveStep] = useState(data.currentStep ?? 0);
  const [completed, setCompleted] = useState(Boolean(data.completed));
  const [xpEarned, setXpEarned] = useState(0);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [nextStep, setNextStep] = useState<number | null>(null);

  const answerMutation = useMutation({
    mutationFn: (optionIndex: number) =>
      studentApi.answerQuest(data.id, activeStep, optionIndex),
    onSuccess: (result) => {
      setFeedback({ correct: result.correct, message: result.message });

      if (result.correct) {
        void queryClient.invalidateQueries({ queryKey: ['learning'] });
        void queryClient.invalidateQueries({ queryKey: ['class'] });
        void queryClient.invalidateQueries({ queryKey: ['desk'] });

        if (result.progress.completed) {
          setCompleted(true);
          setXpEarned(result.xpEarned);
          showToast(`${result.message}`.trim());
        } else {
          setNextStep(result.progress.currentStep);
        }
      }
    },
    onError: () => {
      showToast('Не вдалося перевірити відповідь. Спробуй ще раз.', 'error');
    },
  });

  const totalSteps = data.totalSteps;
  const questions = data.questions ?? [];

  if (completed || questions.length === 0) {
    return (
      <Card className={styles.celebration}>
        <div className={styles.celebrationEmoji} aria-hidden="true">
          🎉
        </div>
        <h1>Експедицію завершено!</h1>
        <p>
          {GUIDE_EMOJI} привів{' '}тебе до фінішу — усі {totalSteps} зупинок
          пройдено правильно.
        </p>
        <p className={styles.xpBadge}>+{xpEarned || data.xpReward} XP</p>
        <Button fullWidth onClick={() => router.push('/quests')}>
          До інших квестів
        </Button>
      </Card>
    );
  }

  const question = questions[activeStep];
  const canRetry = feedback && !feedback.correct;
  const isPending = answerMutation.isPending;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{data.grade ? `${data.title} · ${data.grade} клас` : data.title}</h1>
        <p>{data.description}</p>
      </header>

      <Card className={styles.pathCard}>
        <ProgressBar
          value={activeStep}
          max={totalSteps}
          label={`Крок ${activeStep + 1} із ${totalSteps}`}
          tone="secondary"
        />
        <ol className={styles.path} aria-label="Маршрут експедиції">
          {Array.from({ length: totalSteps }, (_, index) => {
            const state =
              index < activeStep
                ? 'done'
                : index === activeStep
                  ? 'current'
                  : 'upcoming';

            return (
              <li key={index} className={styles.checkpointWrap}>
                <div
                  className={`${styles.checkpoint} ${styles[state]}`}
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  {state === 'current' ? (
                    <span aria-hidden="true" className={styles.guide}>
                      {GUIDE_EMOJI}
                    </span>
                  ) : state === 'done' ? (
                    <span aria-hidden="true">✓</span>
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                  <span className={styles.visuallyHidden}>
                    Зупинка {index + 1}:{' '}
                    {state === 'done'
                      ? 'пройдено'
                      : state === 'current'
                        ? 'поточна'
                        : 'попереду'}
                  </span>
                </div>
                {index < totalSteps - 1 ? (
                  <div
                    className={`${styles.track} ${index < activeStep ? styles.trackDone : ''}`}
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
        <p className={styles.reward}>Нагорода за квест: +{data.xpReward} XP</p>
      </Card>

      <Card className={styles.questionCard}>
        <h2>{question.text}</h2>
        <div className={styles.options} role="group" aria-label="Варіанти відповіді">
          {question.options.map((option, optionIndex) => {
            const isSelected = selectedOption === optionIndex;
            const isWrongPick =
              feedback && !feedback.correct && isSelected;

            return (
              <button
                key={option}
                type="button"
                className={`${styles.option} ${isWrongPick ? styles.optionWrong : ''}`}
                disabled={isPending || nextStep !== null}
                onClick={() => {
                  setSelectedOption(optionIndex);
                  setFeedback(null);
                  answerMutation.mutate(optionIndex);
                }}
              >
                <span className={styles.optionMark} aria-hidden="true">
                  {isWrongPick ? '✗' : ''}
                </span>
                {option}
              </button>
            );
          })}
        </div>

        <div aria-live="polite" className={styles.feedbackRegion}>
          {feedback ? (
            <p
              className={`${styles.feedback} ${feedback.correct ? styles.feedbackOk : styles.feedbackRetry}`}
            >
              <span aria-hidden="true">{feedback.correct ? '✓' : '↺'}</span>{' '}
              {feedback.message}
              {canRetry ? ' Обери інший варіант.' : ''}
            </p>
          ) : null}
          {nextStep !== null ? (
            <Button
              onClick={() => {
                setActiveStep(nextStep);
                setNextStep(null);
                setFeedback(null);
                setSelectedOption(null);
              }}
            >
              Далі
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
