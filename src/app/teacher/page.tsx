'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppShell } from '@/components/navigation/AppShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionCard } from '@/components/ui/SectionCard';
import { teacherApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { formatEventRange } from '@/lib/format';
import styles from './teacher.module.css';

const classSchema = z.object({
  name: z.string().min(1, 'Напиши назву класу'),
  grade: z.coerce
    .number()
    .int()
    .refine((value) => value >= 1 && value <= 4, {
      message: 'Обери клас від 1 до 4',
    }),
});

type ClassForm = z.infer<typeof classSchema>;

export default function TeacherPage() {
  return (
    <AppShell title="Сьогодні" allowedRoles={['teacher']}>
      <TeacherDashboard />
    </AppShell>
  );
}

function TeacherDashboard() {
  const showToast = useUiStore((state) => state.showToast);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: teacherApi.getDashboard,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: '3-Б', grade: 3 },
  });

  const createClassMutation = useMutation({
    mutationFn: (values: ClassForm) =>
      teacherApi.createClass({
        name: values.name,
        grade: values.grade as 1 | 2 | 3 | 4,
      }),
    onSuccess: async (classRoom) => {
      await refreshUser();
      void queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      showToast(`Клас ${classRoom.name} створено! Код: ${classRoom.inviteCode}`);
    },
    onError: (err) => {
      showToast(
        err instanceof Error ? err.message : 'Не вдалося створити клас',
        'error',
      );
    },
  });

  if (isLoading) {
    return <LoadingState label="Готуємо кабінет..." />;
  }

  if (!data) {
    return <EmptyState title="Щось пішло не так" description="Спробуй ще раз." />;
  }

  if (!data.hasClass) {
    return (
      <section className={styles.onboarding}>
        <div className={styles.onboardingCopy}>
          <p className={styles.kicker}>Перший крок</p>
          <h1>Створи свій клас</h1>
          <p>
            Після цього зʼявиться код і посилання. Передай їх учням — або
            батькам, щоб допомогли увійти.
          </p>
        </div>
        <form
          className={styles.createForm}
          onSubmit={handleSubmit((values) => createClassMutation.mutate(values))}
        >
          <label>
            Назва класу
            <input placeholder="3-Б" {...register('name')} />
          </label>
          {errors.name ? <em>{errors.name.message}</em> : null}
          <label>
            Клас
            <select {...register('grade')}>
              <option value={1}>1 клас</option>
              <option value={2}>2 клас</option>
              <option value={3}>3 клас</option>
              <option value={4}>4 клас</option>
            </select>
          </label>
          {errors.grade ? <em>{errors.grade.message}</em> : null}
          <Button type="submit" disabled={createClassMutation.isPending} fullWidth>
            Створити клас
          </Button>
        </form>
      </section>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <Image
            src="/brand/teacher-hero.png"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 70vw"
            className={styles.heroArtImage}
            priority
          />
          <div className={styles.heroShade} />
        </div>
        <div className={styles.heroBody}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Клас {data.className}</p>
            <h1>Доброго дня, {data.greetingName}</h1>
            <p className={styles.heroLead}>
              Код → завдання → життя класу.
            </p>
          </div>
          <div className={styles.actions}>
            <Link href="/teacher/invite" className={`${styles.chip} ${styles.chipInvite}`}>
              <Image src="/brand/dash-invite.png" alt="" width={22} height={22} />
              Код
            </Link>
            <Link href="/teacher/tasks" className={`${styles.chip} ${styles.chipTasks}`}>
              <Image src="/brand/dash-tasks.png" alt="" width={22} height={22} />
              Завдання
            </Link>
            <Link href="/teacher/events" className={`${styles.chip} ${styles.chipEvents}`}>
              <Image src="/brand/dash-events.png" alt="" width={22} height={22} />
              Події
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.stats} aria-label="Сьогодні коротко">
        <Link href="/teacher/tasks" className={`${styles.stat} ${styles.statTasks}`}>
          <Image src="/brand/dash-tasks.png" alt="" width={26} height={26} />
          <div>
            <strong>{data.today.newWorks}</strong>
            <span>нові роботи</span>
          </div>
        </Link>
        <div className={`${styles.stat} ${styles.statToday}`}>
          <strong>{data.today.doneTasks}</strong>
          <span>виконано</span>
        </div>
        <div className={`${styles.stat} ${styles.statWins}`}>
          <Image src="/brand/dash-wins.png" alt="" width={26} height={26} />
          <div>
            <strong>{data.today.activeQuest}</strong>
            <span>квест</span>
          </div>
        </div>
        <Link href="/teacher/moderation" className={`${styles.stat} ${styles.statBoard}`}>
          <Image src="/brand/dash-board.png" alt="" width={26} height={26} />
          <div>
            <strong>{data.today.pendingPosts}</strong>
            <span>дошка</span>
          </div>
        </Link>
      </section>

      <div className={styles.midRow}>
        {data.today.nextEventTitle ? (
          <SectionCard
            tone="events"
            title="Подія"
            iconSrc="/brand/dash-events.png"
            action={
              <Link href="/teacher/events" className={styles.link}>
                Усі
              </Link>
            }
          >
            <p className={styles.compactTitle}>{data.today.nextEventTitle}</p>
            <p className={styles.muted}>
              {data.today.nextEventDate
                ? formatEventRange(
                    data.today.nextEventDate,
                    data.today.nextEventEndsAt ?? data.today.nextEventDate,
                  )
                : 'Незабаром'}
            </p>
          </SectionCard>
        ) : null}

        {data.goal ? (
          <SectionCard
            tone="class"
            title="Прогрес класу"
            iconSrc="/brand/dash-class.png"
          >
            <p className={styles.compactTitle}>{data.goal.title}</p>
            <ProgressBar
              value={data.goal.current}
              max={data.goal.target}
              label={`${data.goal.current} / ${data.goal.target} XP`}
              tone="secondary"
            />
          </SectionCard>
        ) : null}
      </div>

      <section className={styles.split}>
        <SectionCard
          tone="tasks"
          title="На перевірку"
          iconSrc="/brand/dash-tasks.png"
          action={
            <Link href="/teacher/tasks" className={styles.link}>
              Усі
            </Link>
          }
        >
          {data.checkingWorks.length === 0 ? (
            <p className={styles.emptyLine}>Все перевірено</p>
          ) : (
            <div className={styles.list}>
              {data.checkingWorks.slice(0, 4).map((work) => (
                <div key={work.id} className={styles.work}>
                  <div className={styles.workCopy}>
                    <strong>{work.studentName}</strong>
                    <p>{work.homeworkTitle}</p>
                  </div>
                  <Link href="/teacher/tasks" className={styles.workAction}>
                    <Button size="md">Перевірити</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          tone="board"
          title="Дошка"
          iconSrc="/brand/dash-board.png"
          action={
            <Link href="/teacher/moderation" className={styles.link}>
              Відкрити
            </Link>
          }
        >
          {data.recentPosts.length === 0 ? (
            <p className={styles.emptyLine}>Поки тихо</p>
          ) : (
            <div className={styles.list}>
              {data.recentPosts.slice(0, 4).map((post) => (
                <div key={post.id} className={styles.work}>
                  <div className={styles.workCopy}>
                    <strong>{post.authorName}</strong>
                    <p className={styles.clamp}>{post.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </section>
    </div>
  );
}
