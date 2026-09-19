'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/navigation/AppShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SectionCard } from '@/components/ui/SectionCard';
import { HomeworkCard } from '@/components/learning/HomeworkCard';
import { studentApi } from '@/services/api';
import { SUBJECT_ICONS, SUBJECT_LABELS, type Subject } from '@/types';
import styles from './learning.module.css';

type FocusTab = 'today' | 'waiting' | 'later' | 'tests' | 'missed';

export default function LearningPage() {
  return (
    <AppShell title="Моє навчання" allowedRoles={['student']}>
      <LearningContent />
    </AppShell>
  );
}

function LearningContent() {
  const [tab, setTab] = useState<FocusTab | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['learning'],
    queryFn: studentApi.getLearning,
  });

  const buckets = useMemo(() => {
    const homework = data?.homework ?? [];
    return {
      today: homework.filter((item) => item.bucket === 'today'),
      waiting: homework.filter((item) => item.bucket === 'waiting'),
      later: homework.filter((item) => item.bucket === 'later'),
    };
  }, [data?.homework]);

  if (isLoading) {
    return <LoadingState label="Готуємо навчання..." />;
  }

  if (isError || !data) {
    return (
      <EmptyState title="Щось пішло не так" description="Спробуй ще раз." />
    );
  }

  const missed = data.materials.filter((item) => item.missedLesson);
  const activeTab: FocusTab =
    tab ??
    (buckets.today.length > 0
      ? 'today'
      : buckets.waiting.length > 0
        ? 'waiting'
        : 'today');

  const focusCount = {
    today: buckets.today.length,
    waiting: buckets.waiting.length,
    later: buckets.later.length,
    tests: data.quizzes.length,
    missed: missed.length,
  };

  const tabs: Array<{ key: FocusTab; label: string }> = [
    { key: 'today', label: 'Сьогодні' },
    { key: 'waiting', label: 'Чекає' },
    { key: 'later', label: 'Пізніше' },
    { key: 'tests', label: 'Тести' },
    { key: 'missed', label: 'Пропущене' },
  ];

  return (
    <div className={styles.page}>
      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Твій шлях</p>
          <h1>Моє навчання</h1>
          <p className={styles.lead}>
            Один крок за раз. Без поспіху — просто те, що важливо сьогодні.
          </p>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <Image
            src="/brand/dash-learning.png"
            alt=""
            width={120}
            height={120}
            className={styles.heroIcon}
          />
        </div>
      </motion.section>

      <div className={styles.focusStrip} role="tablist" aria-label="Розділи навчання">
        {tabs.map((item) => {
          const count = focusCount[item.key];
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.focusChip} ${active ? styles.focusChipActive : ''}`}
              onClick={() => setTab(item.key)}
            >
              <span>{item.label}</span>
              {count > 0 ? <em>{count}</em> : null}
            </button>
          );
        })}
      </div>

      <div className={styles.stack}>
        {activeTab === 'today' ? (
          <SectionCard
            tone="learning"
            title="Сьогоднішні завдання"
            iconSrc="/brand/dash-learning.png"
          >
            {buckets.today.length === 0 ? (
              <p className={styles.emptyLine}>
                Сьогодні все спокійно. Можна відпочити або глянути квести.
              </p>
            ) : (
              <div className={styles.cards}>
                {buckets.today.map((homework) => (
                  <HomeworkCard
                    key={homework.id}
                    homework={homework}
                    compact
                    onAction={() => {
                      window.location.href = `/learning/homework/${homework.id}`;
                    }}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        ) : null}

        {activeTab === 'waiting' ? (
          <SectionCard
            tone="tasks"
            title="Ще чекає на тебе"
            iconSrc="/brand/dash-tasks.png"
          >
            {buckets.waiting.length === 0 ? (
              <p className={styles.emptyLine}>
                Немає завдань, які чекають відповіді.
              </p>
            ) : (
              <div className={styles.cards}>
                {buckets.waiting.map((homework) => (
                  <HomeworkCard
                    key={homework.id}
                    homework={homework}
                    compact
                    onAction={() => {
                      window.location.href = `/learning/homework/${homework.id}`;
                    }}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        ) : null}

        {activeTab === 'later' ? (
          <SectionCard
            tone="events"
            title="На потім"
            iconSrc="/brand/dash-events.png"
          >
            {buckets.later.length === 0 ? (
              <p className={styles.emptyLine}>
                Попереду тихо — нових завдань ще немає.
              </p>
            ) : (
              <div className={styles.cards}>
                {buckets.later.map((homework) => (
                  <HomeworkCard
                    key={homework.id}
                    homework={homework}
                    compact
                    onAction={() => {
                      window.location.href = `/learning/homework/${homework.id}`;
                    }}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        ) : null}

        {activeTab === 'tests' ? (
          <SectionCard
            tone="learning"
            title="Тести"
            iconSrc="/brand/dash-learning.png"
          >
            {data.quizzes.length === 0 ? (
              <p className={styles.emptyLine}>Тестів поки немає.</p>
            ) : (
              <div className={styles.quizList}>
                {data.quizzes.map((quiz) => (
                  <article key={quiz.id} className={styles.quizRow}>
                    <div className={styles.quizCopy}>
                      <span className={styles.quizEmoji} aria-hidden="true">
                        {SUBJECT_ICONS[quiz.subject as Subject] ?? '📘'}
                      </span>
                      <div>
                        <strong>{quiz.title}</strong>
                        <p>
                          {SUBJECT_LABELS[quiz.subject as Subject] ?? 'Предмет'} · +
                          {quiz.xpReward} XP
                        </p>
                      </div>
                    </div>
                    <Link href={`/learning/quiz/${quiz.id}`}>
                      <Button size="md">Почати</Button>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        ) : null}

        {activeTab === 'missed' ? (
          <SectionCard
            tone="class"
            title="Що я пропустив?"
            iconSrc="/brand/dash-class.png"
          >
            {missed.length === 0 ? (
              <p className={styles.emptyLine}>Ти нічого не пропустив — супер!</p>
            ) : (
              <div className={styles.missedList}>
                {missed.map((material) => (
                  <article key={material.id} className={styles.missedItem}>
                    <h3>{material.title}</h3>
                    <p>{material.summary}</p>
                    <p className={styles.placeholder}>
                      Коротке повторення зʼявиться пізніше. Поки можна глянути
                      завдання дня.
                    </p>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        ) : null}

        <aside className={styles.sideNote}>
          <div>
            <strong>Квести</strong>
            <p>Пригоди класу — окремо, у своєму розділі.</p>
          </div>
          <Link href="/quests" className={styles.sideLink}>
            Відкрити квести
          </Link>
        </aside>
      </div>
    </div>
  );
}
