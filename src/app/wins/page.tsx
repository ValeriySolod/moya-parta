'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/navigation/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { studentApi } from '@/services/api';
import styles from './wins.module.css';

type Filter = 'all' | 'unlocked' | 'locked' | string;

export default function WinsPage() {
  return (
    <AppShell title="Мої перемоги" allowedRoles={['student']}>
      <WinsContent />
    </AppShell>
  );
}

function WinsContent() {
  const [filter, setFilter] = useState<Filter>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: studentApi.getAchievements,
  });

  const categories = useMemo(
    () => Array.from(new Set((data ?? []).map((item) => item.category))),
    [data],
  );

  const unlockedCount = (data ?? []).filter((item) => item.unlocked).length;
  const total = data?.length ?? 0;

  const visible = useMemo(() => {
    const list = data ?? [];
    if (filter === 'unlocked') {
      return list.filter((item) => item.unlocked);
    }
    if (filter === 'locked') {
      return list.filter((item) => !item.unlocked);
    }
    if (filter !== 'all') {
      return list.filter((item) => item.category === filter);
    }
    return list;
  }, [data, filter]);

  if (isLoading) {
    return <LoadingState label="Збираємо перемоги..." />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Перемоги ще попереду"
        description="Виконуй завдання і відкривай нові нагороди."
      />
    );
  }

  const filters: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: 'Усі' },
    { key: 'unlocked', label: 'Відкриті' },
    { key: 'locked', label: 'Ще попереду' },
    ...categories.map((category) => ({
      key: category,
      label: category,
    })),
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
          <h1>Мої перемоги</h1>
          <p className={styles.lead}>
            Маленькі кроки, які вже твої. Без порівнянь з іншими — лише твоя
            історія.
          </p>
          <p className={styles.progress}>
            Відкрито <strong>{unlockedCount}</strong> з {total}
          </p>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <Image
            src="/brand/dash-wins.png"
            alt=""
            width={120}
            height={120}
            className={styles.heroIcon}
          />
        </div>
      </motion.section>

      <div className={styles.filters} role="tablist" aria-label="Фільтр перемог">
        {filters.map((item) => {
          const active = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.chip} ${active ? styles.chipActive : ''}`}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Тут поки порожньо"
          description="Спробуй інший фільтр або виконай ще одне завдання."
        />
      ) : (
        <div className={styles.gallery}>
          {visible.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.28,
                delay: Math.min(index * 0.04, 0.24),
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <AchievementCard achievement={achievement} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
