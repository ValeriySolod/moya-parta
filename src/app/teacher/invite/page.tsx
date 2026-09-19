'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/navigation/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { teacherApi } from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import styles from './invite.module.css';

export default function TeacherInvitePage() {
  return (
    <AppShell title="Запросити учнів" allowedRoles={['teacher']}>
      <InviteContent />
    </AppShell>
  );
}

function InviteContent() {
  const showToast = useUiStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-invite'],
    queryFn: teacherApi.getInvite,
    retry: false,
  });

  const regenerate = useMutation({
    mutationFn: teacherApi.regenerateInvite,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher-invite'] });
      showToast('Новий код готовий');
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Спочатку створи клас"
        description="Зайди на «Сьогодні» і створи клас — тоді зʼявиться код."
      />
    );
  }

  const absoluteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}${data.invitePath}`
      : data.invitePath;

  return (
    <div className={styles.page}>
      <Card>
        <p className={styles.kicker}>Клас {data.className}</p>
        <h1>Поділися з учнями</h1>
        <p className={styles.lead}>
          Напиши код на дошці або надішли посилання. Учень перейде і
          зареєструється у твоєму класі.
        </p>

        <div className={styles.codeBox}>
          <span>Код класу</span>
          <strong>{data.inviteCode}</strong>
        </div>

        <div className={styles.linkBox}>
          <span>Посилання</span>
          <code>{absoluteLink}</code>
        </div>

        <p className={styles.hint}>
          Код лише латинськими літерами — так його легше ввести і він працює в
          посиланні.
        </p>

        <div className={styles.actions}>
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(absoluteLink);
              showToast('Посилання скопійовано');
            }}
          >
            Скопіювати посилання
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(data.inviteCode);
              showToast('Код скопійовано');
            }}
          >
            Скопіювати код
          </Button>
          <Button
            variant="secondary"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
          >
            Новий код
          </Button>
        </div>

        <p className={styles.meta}>У класі зараз {data.studentsCount} учнів</p>
      </Card>
    </div>
  );
}
