'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppShell } from '@/components/navigation/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { HomeworkCard } from '@/components/learning/HomeworkCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { toLocalDateTimeInput } from '@/lib/format';
import { teacherApi } from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import {
  SUBJECT_LABELS,
  type Homework,
  type HomeworkAnalytics,
  type Subject,
} from '@/types';
import styles from './tasks.module.css';

type Tab = 'homework' | 'tests' | 'review';

function defaultHomeworkWindow() {
  const now = Date.now();
  return {
    startsAt: toLocalDateTimeInput(new Date(now).toISOString()),
    endsAt: toLocalDateTimeInput(new Date(now + 86400000 * 2).toISOString()),
  };
}

const homeworkSchema = z
  .object({
    title: z.string().min(1, 'Напиши назву завдання'),
    description: z.string().min(1, 'Додай короткий опис'),
    subject: z.enum(['math', 'ukrainian', 'reading', 'science', 'art', 'other']),
    startsAt: z.string().min(1, 'Вкажи початок'),
    endsAt: z.string().min(1, 'Вкажи кінець'),
    xpReward: z.coerce.number().min(5).max(100),
    linkedQuizId: z.string().optional(),
  })
  .refine((values) => new Date(values.endsAt) > new Date(values.startsAt), {
    message: 'Кінець має бути пізніше за початок',
    path: ['endsAt'],
  });

type HomeworkForm = z.infer<typeof homeworkSchema>;

const quizSchema = z.object({
  title: z.string().min(1, 'Напиши назву тесту'),
  subject: z.enum(['math', 'ukrainian', 'reading', 'science', 'art', 'other']),
  xpReward: z.coerce.number().min(5).max(100),
  q1: z.string().min(1),
  o1a: z.string().min(1),
  o1b: z.string().min(1),
  correct1: z.coerce.number().min(0).max(1),
  q2: z.string().min(1),
  o2a: z.string().min(1),
  o2b: z.string().min(1),
  correct2: z.coerce.number().min(0).max(1),
});

type QuizForm = z.infer<typeof quizSchema>;

const submissionStatusLabel: Record<string, string> = {
  not_started: 'Не почав',
  new: 'Не здано',
  checking: 'На перевірці',
  done: 'Здано',
  reviewed: 'Прийнято',
  revise: 'На доопрацювання',
};

export default function TeacherTasksPage() {
  return (
    <AppShell title="Завдання" allowedRoles={['teacher']}>
      <TasksContent />
    </AppShell>
  );
}

function TasksContent() {
  const [tab, setTab] = useState<Tab>('homework');
  const [defaultWindow] = useState(defaultHomeworkWindow);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const showToast = useUiStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: teacherApi.getDashboard,
  });

  const templatesQuery = useQuery({
    queryKey: ['quiz-templates'],
    queryFn: () => teacherApi.getQuizTemplates(),
  });

  const quizzesQuery = useQuery({
    queryKey: ['teacher-quizzes'],
    queryFn: teacherApi.getQuizzes,
  });

  const analyticsQuery = useQuery({
    queryKey: ['homework-analytics', analyticsId],
    queryFn: () => teacherApi.getHomeworkAnalytics(analyticsId!),
    enabled: Boolean(analyticsId),
  });

  const homeworkForm = useForm<HomeworkForm>({
    resolver: zodResolver(homeworkSchema),
    defaultValues: {
      subject: 'math',
      xpReward: 20,
      startsAt: defaultWindow.startsAt,
      endsAt: defaultWindow.endsAt,
      linkedQuizId: '',
    },
  });

  const quizForm = useForm<QuizForm>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      subject: 'math',
      xpReward: 25,
      correct1: 0,
      correct2: 0,
    },
  });

  const createHomework = useMutation({
    mutationFn: (values: HomeworkForm) =>
      teacherApi.createHomework({
        ...values,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
        linkedQuizId: values.linkedQuizId || undefined,
      }),
    onSuccess: () => {
      const next = defaultHomeworkWindow();
      homeworkForm.reset({
        subject: 'math',
        xpReward: 20,
        startsAt: next.startsAt,
        endsAt: next.endsAt,
        linkedQuizId: '',
        title: '',
        description: '',
      });
      void queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      showToast('Завдання додано для класу');
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Помилка', 'error');
    },
  });

  const deleteHomework = useMutation({
    mutationFn: teacherApi.deleteHomework,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      if (analyticsId) {
        setAnalyticsId(null);
      }
      showToast('Завдання видалено');
    },
  });

  const assignTemplate = useMutation({
    mutationFn: teacherApi.assignQuizFromTemplate,
    onSuccess: (quiz) => {
      void queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] });
      showToast(`Тест «${quiz.title}» додано класу`);
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Помилка', 'error');
    },
  });

  const createQuiz = useMutation({
    mutationFn: (values: QuizForm) =>
      teacherApi.createQuiz({
        title: values.title,
        subject: values.subject,
        xpReward: values.xpReward,
        questions: [
          {
            text: values.q1,
            options: [values.o1a, values.o1b],
            correctIndex: values.correct1,
          },
          {
            text: values.q2,
            options: [values.o2a, values.o2b],
            correctIndex: values.correct2,
          },
        ],
      }),
    onSuccess: () => {
      quizForm.reset({
        subject: 'math',
        xpReward: 25,
        correct1: 0,
        correct2: 0,
        title: '',
        q1: '',
        o1a: '',
        o1b: '',
        q2: '',
        o2a: '',
        o2b: '',
      });
      void queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] });
      showToast('Власний тест створено');
    },
  });

  const deleteQuiz = useMutation({
    mutationFn: teacherApi.deleteQuiz,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] });
      showToast('Тест видалено');
    },
  });

  const review = useMutation({
    mutationFn: ({
      id,
      decision,
      comment,
    }: {
      id: string;
      decision: 'accept' | 'revise' | 'redo_test';
      comment: string;
    }) => teacherApi.reviewSubmission(id, { decision, comment }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['homework-analytics'] });
      showToast('Рішення збережено');
    },
  });

  const templatesBySubject = useMemo(() => {
    const list = templatesQuery.data ?? [];
    return list.reduce<Record<string, typeof list>>((acc, item) => {
      (acc[item.subject] ??= []).push(item);
      return acc;
    }, {});
  }, [templatesQuery.data]);

  const activeHomeworks = useMemo(() => {
    const data = dashboardQuery.data;
    if (!data) return [];
    if (data.activeHomeworks) return data.activeHomeworks;
    return (data.homeworks ?? []).filter((hw) => !hw.ended);
  }, [dashboardQuery.data]);

  const endedHomeworks = useMemo(() => {
    const data = dashboardQuery.data;
    if (!data) return [];
    if (data.endedHomeworks) return data.endedHomeworks;
    return (data.homeworks ?? []).filter((hw) => hw.ended);
  }, [dashboardQuery.data]);

  if (dashboardQuery.isLoading) {
    return <LoadingState />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.tabs} role="tablist">
        {(
          [
            ['homework', 'Завдання'],
            ['tests', 'Тести'],
            ['review', 'Перевірка'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
            {key === 'review' && dashboardQuery.data?.checkingWorks.length
              ? ` (${dashboardQuery.data.checkingWorks.length})`
              : ''}
          </button>
        ))}
      </div>

      {tab === 'homework' ? (
        <div className={styles.stack}>
          <Card className={styles.block}>
            <div className={styles.blockHead}>
              <h2>Створити завдання</h2>
              <p className={styles.hint}>
                Після дати закінчення завдання зникне зі списку активних, але
                залишиться для перевірки та аналітики.
              </p>
            </div>
            <form
              className={styles.form}
              onSubmit={homeworkForm.handleSubmit((values) =>
                createHomework.mutate(values),
              )}
            >
              <input placeholder="Назва" {...homeworkForm.register('title')} />
              {homeworkForm.formState.errors.title ? (
                <em>{homeworkForm.formState.errors.title.message}</em>
              ) : null}
              <textarea
                placeholder="Опис"
                rows={3}
                {...homeworkForm.register('description')}
              />
              <select {...homeworkForm.register('subject')}>
                <option value="math">Математика</option>
                <option value="ukrainian">Українська мова</option>
                <option value="reading">Читання</option>
                <option value="science">Я досліджую світ</option>
                <option value="art">Мистецтво</option>
                <option value="other">Інше</option>
              </select>
              <div className={styles.dateRow}>
                <label className={styles.label}>
                  Від (початок)
                  <input
                    type="datetime-local"
                    {...homeworkForm.register('startsAt')}
                  />
                </label>
                <label className={styles.label}>
                  До (закінчення)
                  <input
                    type="datetime-local"
                    {...homeworkForm.register('endsAt')}
                  />
                </label>
              </div>
              {homeworkForm.formState.errors.endsAt ? (
                <em>{homeworkForm.formState.errors.endsAt.message}</em>
              ) : null}
              <input type="number" {...homeworkForm.register('xpReward')} />
              <label className={styles.label}>
                Повʼязати тест (необовʼязково)
                <select {...homeworkForm.register('linkedQuizId')}>
                  <option value="">Без тесту</option>
                  {(quizzesQuery.data ?? []).map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="submit"
                fullWidth
                disabled={createHomework.isPending}
                className={styles.submit}
              >
                Додати завдання
              </Button>
            </form>
          </Card>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Активні завдання</h2>
            </div>
            {activeHomeworks.length === 0 ? (
              <EmptyState
                title="Поки порожньо"
                description="Створи перше завдання для класу."
              />
            ) : (
              <div className={styles.cards}>
                {activeHomeworks.map((homework) => (
                  <HomeworkRow
                    key={homework.id}
                    homework={homework}
                    compact
                    analyticsOpen={analyticsId === homework.id}
                    onToggleAnalytics={() =>
                      setAnalyticsId((prev) =>
                        prev === homework.id ? null : homework.id,
                      )
                    }
                    onDelete={() => {
                      if (confirm('Видалити це завдання?')) {
                        deleteHomework.mutate(homework.id);
                      }
                    }}
                    analytics={
                      analyticsId === homework.id
                        ? analyticsQuery.data
                        : undefined
                    }
                    analyticsLoading={
                      analyticsId === homework.id && analyticsQuery.isLoading
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Для перевірки (завершені)</h2>
              <p className={styles.hint}>
                Ці завдання вже не показуються учням як активні, але ти можеш
                перевірити роботи й аналітику.
              </p>
            </div>
            {endedHomeworks.length === 0 ? (
              <EmptyState
                title="Завершених ще немає"
                description="Коли мине дата закінчення, завдання зʼявиться тут."
              />
            ) : (
              <div className={styles.cards}>
                {endedHomeworks.map((homework) => (
                  <HomeworkRow
                    key={homework.id}
                    homework={homework}
                    compact
                    analyticsOpen={analyticsId === homework.id}
                    onToggleAnalytics={() =>
                      setAnalyticsId((prev) =>
                        prev === homework.id ? null : homework.id,
                      )
                    }
                    onDelete={() => {
                      if (confirm('Видалити це завдання?')) {
                        deleteHomework.mutate(homework.id);
                      }
                    }}
                    analytics={
                      analyticsId === homework.id
                        ? analyticsQuery.data
                        : undefined
                    }
                    analyticsLoading={
                      analyticsId === homework.id && analyticsQuery.isLoading
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {tab === 'tests' ? (
        <div className={styles.stack}>
          <Card className={styles.block}>
            <div className={styles.blockHead}>
              <h2>База готових тестів</h2>
              <p className={styles.hint}>
                Обери тест із бази (наприклад математика) і одразу додай класу.
              </p>
            </div>
            <div className={styles.bank}>
              {Object.entries(templatesBySubject).map(([subject, items]) => (
                <div key={subject} className={styles.bankGroup}>
                  <h3>{SUBJECT_LABELS[subject as Subject] ?? subject}</h3>
                  {items.map((tpl) => (
                    <div key={tpl.id} className={styles.bankItem}>
                      <div>
                        <strong>{tpl.title}</strong>
                        <p>
                          {tpl.description} · {tpl.questions.length} пит. · +
                          {tpl.xpReward} XP
                        </p>
                      </div>
                      <Button
                        size="md"
                        disabled={assignTemplate.isPending}
                        onClick={() => assignTemplate.mutate(tpl.id)}
                      >
                        Додати класу
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <Card className={styles.block}>
            <div className={styles.blockHead}>
              <h2>Створити свій тест</h2>
            </div>
            <form
              className={styles.form}
              onSubmit={quizForm.handleSubmit((values) =>
                createQuiz.mutate(values),
              )}
            >
              <input placeholder="Назва тесту" {...quizForm.register('title')} />
              <select {...quizForm.register('subject')}>
                <option value="math">Математика</option>
                <option value="ukrainian">Українська мова</option>
                <option value="reading">Читання</option>
                <option value="science">Я досліджую світ</option>
                <option value="art">Мистецтво</option>
                <option value="other">Інше</option>
              </select>
              <input type="number" {...quizForm.register('xpReward')} />
              <fieldset className={styles.fieldset}>
                <legend>Питання 1</legend>
                <input placeholder="Текст питання" {...quizForm.register('q1')} />
                <input placeholder="Варіант A" {...quizForm.register('o1a')} />
                <input placeholder="Варіант B" {...quizForm.register('o1b')} />
                <select {...quizForm.register('correct1')}>
                  <option value={0}>Правильна: A</option>
                  <option value={1}>Правильна: B</option>
                </select>
              </fieldset>
              <fieldset className={styles.fieldset}>
                <legend>Питання 2</legend>
                <input placeholder="Текст питання" {...quizForm.register('q2')} />
                <input placeholder="Варіант A" {...quizForm.register('o2a')} />
                <input placeholder="Варіант B" {...quizForm.register('o2b')} />
                <select {...quizForm.register('correct2')}>
                  <option value={0}>Правильна: A</option>
                  <option value={1}>Правильна: B</option>
                </select>
              </fieldset>
              <Button type="submit" fullWidth disabled={createQuiz.isPending}>
                Створити тест
              </Button>
            </form>
          </Card>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Тести класу</h2>
            </div>
            {(quizzesQuery.data?.length ?? 0) === 0 ? (
              <EmptyState
                title="Тестів ще немає"
                description="Додай з бази або створи свій."
              />
            ) : (
              quizzesQuery.data?.map((quiz) => (
                <Card key={quiz.id} className={styles.quizCard}>
                  <div>
                    <Badge tone="primary">
                      {SUBJECT_LABELS[quiz.subject] ?? quiz.subject}
                    </Badge>
                    <h3>{quiz.title}</h3>
                    <p>
                      {quiz.questions.length} питань · +{quiz.xpReward} XP
                      {quiz.templateId ? ' · з бази' : ' · свій'}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (confirm('Видалити цей тест?')) {
                        deleteQuiz.mutate(quiz.id);
                      }
                    }}
                  >
                    Видалити
                  </Button>
                </Card>
              ))
            )}
          </section>
        </div>
      ) : null}

      {tab === 'review' ? (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Роботи учнів</h2>
          </div>
          {(dashboardQuery.data?.checkingWorks.length ?? 0) === 0 ? (
            <EmptyState
              title="Все перевірено"
              description="Нових робіт на перевірку немає."
            />
          ) : (
            dashboardQuery.data?.checkingWorks.map((work) => (
              <ReviewCard
                key={work.id}
                work={work}
                busy={review.isPending}
                onReview={(decision, comment) =>
                  review.mutate({ id: work.id, decision, comment })
                }
              />
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}

function HomeworkRow({
  homework,
  compact = false,
  analyticsOpen,
  onToggleAnalytics,
  onDelete,
  analytics,
  analyticsLoading,
}: {
  homework: Homework;
  compact?: boolean;
  analyticsOpen: boolean;
  onToggleAnalytics: () => void;
  onDelete: () => void;
  analytics?: HomeworkAnalytics;
  analyticsLoading: boolean;
}) {
  return (
    <div className={styles.itemRow}>
      <HomeworkCard
        homework={homework}
        compact={compact}
        analyticsOpen={analyticsOpen}
        onAnalytics={onToggleAnalytics}
        onDelete={onDelete}
      />
      {analyticsOpen ? (
        <HomeworkAnalyticsPanel
          loading={analyticsLoading}
          data={analytics}
        />
      ) : null}
    </div>
  );
}

function HomeworkAnalyticsPanel({
  loading,
  data,
}: {
  loading: boolean;
  data?: HomeworkAnalytics;
}) {
  if (loading) {
    return (
      <Card className={styles.analyticsCard}>
        <LoadingState />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={styles.analyticsCard}>
        <EmptyState
          title="Немає даних"
          description="Аналітику для цього завдання зараз не вдалося завантажити."
        />
      </Card>
    );
  }

  return (
    <Card className={styles.analyticsCard}>
      <h3>Аналітика: {data.homework.title}</h3>
      <div className={styles.analyticsStats}>
        <span>
          Брали участь: {data.participatedCount} з {data.studentsTotal}
        </span>
        <span>На перевірці: {data.checkingCount}</span>
        {data.quizSummary ? (
          <span>
            Тест «{data.quizSummary.quizTitle}»: середній результат{' '}
            {data.quizSummary.averagePercent ?? '—'}%
          </span>
        ) : null}
      </div>

      {data.quizSummary && data.quizSummary.topScorers.length > 0 ? (
        <div className={styles.topBlock}>
          <h4>Краще впоралися з тестом</h4>
          <ul className={styles.topList}>
            {data.quizSummary.topScorers.map((item, index) => (
              <li key={item.studentId}>
                <strong>
                  {index + 1}. {item.displayName}
                </strong>
                <span>
                  {item.quizScore}/{item.quizTotal} ({item.quizPercent}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.participants}>
        <h4>Участь класу</h4>
        <ul className={styles.participantList}>
          {data.participants.map((item) => (
            <li key={item.studentId}>
              <span className={styles.participantName}>
                <span aria-hidden="true">{item.avatarEmoji}</span>
                {item.displayName}
              </span>
              <span className={styles.participantMeta}>
                {submissionStatusLabel[item.status] ?? item.status}
                {item.quizPercent !== null
                  ? ` · тест ${item.quizPercent}%`
                  : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function ReviewCard({
  work,
  busy,
  onReview,
}: {
  work: {
    id: string;
    studentName?: string;
    homeworkTitle?: string;
    answer?: string;
    linkedQuizId?: string;
  };
  busy: boolean;
  onReview: (
    decision: 'accept' | 'revise' | 'redo_test',
    comment: string,
  ) => void;
}) {
  const [comment, setComment] = useState('');

  return (
    <Card className={styles.reviewCard}>
      <div>
        <strong>{work.studentName}</strong>
        <p className={styles.hint}>{work.homeworkTitle}</p>
      </div>
      {work.answer ? (
        <blockquote className={styles.answer}>{work.answer}</blockquote>
      ) : (
        <p className={styles.hint}>Учень ще не написав відповідь текстом.</p>
      )}
      <label className={styles.label}>
        Коментар для учня
        <textarea
          rows={3}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Напиши коротко, що добре і що доробити"
        />
      </label>
      <div className={styles.reviewActions}>
        <Button disabled={busy} onClick={() => onReview('accept', comment)}>
          Прийняти
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => onReview('revise', comment)}
        >
          На доопрацювання
        </Button>
        <Button
          variant="secondary"
          disabled={busy || !work.linkedQuizId}
          onClick={() => onReview('redo_test', comment)}
          title={
            work.linkedQuizId
              ? undefined
              : 'Спочатку повʼяжи завдання з тестом'
          }
        >
          Переробити тест
        </Button>
      </div>
    </Card>
  );
}
