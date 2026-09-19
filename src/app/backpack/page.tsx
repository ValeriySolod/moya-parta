'use client';

import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/navigation/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { studentApi } from '@/services/api';
import styles from './backpack.module.css';

const labels = {
  sticker: 'Наліпки',
  reward: 'Нагороди',
  item: 'Предмети',
  avatar: 'Елементи персонажа',
};

export default function BackpackPage() {
  return (
    <AppShell title="Мій рюкзак" allowedRoles={['student']}>
      <BackpackContent />
    </AppShell>
  );
}

function BackpackContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['backpack'],
    queryFn: studentApi.getBackpack,
  });

  if (isLoading) {
    return <LoadingState label="Відкриваємо рюкзак..." />;
  }

  if (!data) {
    return <EmptyState title="Рюкзак порожній" description="Скоро зʼявляться речі." />;
  }

  const categories = Array.from(new Set(data.map((item) => item.category)));

  return (
    <div className={styles.page}>
      {categories.map((category) => (
        <section key={category}>
          <h2>{labels[category]}</h2>
          <div className={styles.grid}>
            {data
              .filter((item) => item.category === category)
              .map((item) => (
                <article
                  key={item.id}
                  className={`${styles.item} ${item.unlocked ? '' : styles.locked}`}
                >
                  <div className={styles.icon} aria-hidden="true">
                    {item.unlocked ? item.icon : '🔒'}
                  </div>
                  <h3>{item.unlocked ? item.title : 'Ще не відкрито'}</h3>
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
