'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/navigation/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { QuestCard } from '@/components/quests/QuestCard';
import { studentApi } from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import styles from './quests.module.css';

export default function QuestsPage() {
  return (
    <AppShell title="Квести" allowedRoles={['student']}>
      <QuestsContent />
    </AppShell>
  );
}

function QuestsContent() {
  const showToast = useUiStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['learning'],
    queryFn: studentApi.getLearning,
  });

  const questMutation = useMutation({
    mutationFn: (id: string) => studentApi.advanceQuest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['learning'] });
      void queryClient.invalidateQueries({ queryKey: ['class'] });
      void queryClient.invalidateQueries({ queryKey: ['desk'] });
      showToast('Крок квесту зараховано!');
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  const quests = data?.quests ?? [];

  if (quests.length === 0) {
    return (
      <EmptyState
        title="Квестів поки немає"
        description="Коли вчитель додасть квест, він зʼявиться тут."
      />
    );
  }

  return (
    <div className={styles.page}>
      <p className={styles.lead}>
        Тут усі квести класу. Можеш почати або продовжити крок за кроком.
      </p>
      <div className={styles.stack}>
        {quests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            onContinue={() => questMutation.mutate(quest.id)}
          />
        ))}
      </div>
    </div>
  );
}
