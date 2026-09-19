'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/navigation/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { EventCard } from '@/components/events/EventCard';
import { studentApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import styles from './events.module.css';

export default function EventsPage() {
  return (
    <AppShell title="Події класу" allowedRoles={['student']}>
      <EventsContent />
    </AppShell>
  );
}

function EventsContent() {
  const user = useAuthStore((state) => state.user);
  const showToast = useUiStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: studentApi.getEvents,
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => studentApi.joinEvent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      showToast('Ти з нами! +10 XP');
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Подій поки немає"
        description="Скоро клас організує щось цікаве."
      />
    );
  }

  return (
    <div className={styles.page}>
      <p className={styles.lead}>
        Усі події класу — можна приєднатися і стежити за прогресом.
      </p>
      {data.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          joined={Boolean(user && event.participantIds.includes(user.id))}
          onJoin={() => joinMutation.mutate(event.id)}
        />
      ))}
    </div>
  );
}
