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
import { LoadingState } from '@/components/ui/LoadingState';
import { teacherApi } from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import { formatEventRange, toLocalDateTimeInput } from '@/lib/format';
import type { ClassEvent } from '@/types';
import styles from './events.module.css';

function defaultEventRange() {
  const start = Date.now() + 86400000;
  return {
    startsAt: toLocalDateTimeInput(new Date(start).toISOString()),
    endsAt: toLocalDateTimeInput(new Date(start + 1000 * 60 * 60 * 2).toISOString()),
  };
}

const schema = z
  .object({
    title: z.string().min(1, 'Напиши назву події'),
    description: z.string().min(1, 'Додай опис'),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
  })
  .refine((values) => new Date(values.endsAt) > new Date(values.startsAt), {
    message: 'Кінець має бути пізніше за початок',
    path: ['endsAt'],
  });

type FormValues = z.infer<typeof schema>;

const statusLabel: Record<
  NonNullable<ClassEvent['status']>,
  { label: string; tone: 'primary' | 'success' | 'warning' | 'secondary' }
> = {
  upcoming: { label: 'Незабаром', tone: 'primary' },
  live: { label: 'Триває', tone: 'success' },
  ended: { label: 'Завершена', tone: 'warning' },
  published: { label: 'На дошці', tone: 'secondary' },
};

export default function TeacherEventsPage() {
  return (
    <AppShell title="Події класу" allowedRoles={['teacher']}>
      <EventsContent />
    </AppShell>
  );
}

function EventsContent() {
  const showToast = useUiStore((state) => state.showToast);
  const queryClient = useQueryClient();
  const [eventDefaults] = useState(defaultEventRange);

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-events'],
    queryFn: teacherApi.getEvents,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: eventDefaults,
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      teacherApi.createEvent({
        title: values.title,
        description: values.description,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
      }),
    onSuccess: () => {
      reset({
        title: '',
        description: '',
        ...defaultEventRange(),
      });
      void queryClient.invalidateQueries({ queryKey: ['teacher-events'] });
      void queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['nav-badges'] });
      showToast('Подію створено');
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Помилка', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: teacherApi.deleteEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher-events'] });
      void queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['nav-badges'] });
      showToast('Подію видалено');
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({
      id,
      comment,
      materials,
    }: {
      id: string;
      comment: string;
      materials: string[];
    }) => teacherApi.publishEventReview(id, { comment, materials }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher-events'] });
      void queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['nav-badges'] });
      showToast('Підсумок опубліковано на дошці');
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Помилка', 'error');
    },
  });

  const sorted = useMemo(() => {
    const list = data ?? [];
    return [...list].sort((a, b) => {
      const order = { ended: 0, live: 1, upcoming: 2, published: 3 };
      const aStatus = a.status ?? 'upcoming';
      const bStatus = b.status ?? 'upcoming';
      if (order[aStatus] !== order[bStatus]) {
        return order[aStatus] - order[bStatus];
      }
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });
  }, [data]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className={styles.page}>
      <Card>
        <h2>Створити подію</h2>
        <form
          className={styles.form}
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
        >
          <input placeholder="Назва" {...register('title')} />
          {errors.title ? <em>{errors.title.message}</em> : null}
          <textarea
            placeholder="Опис для класу"
            rows={3}
            {...register('description')}
          />
          <label className={styles.label}>
            Початок
            <input type="datetime-local" {...register('startsAt')} />
          </label>
          <label className={styles.label}>
            Кінець
            <input type="datetime-local" {...register('endsAt')} />
          </label>
          {errors.endsAt ? <em>{errors.endsAt.message}</em> : null}
          <Button type="submit" fullWidth disabled={createMutation.isPending}>
            Додати подію
          </Button>
        </form>
      </Card>

      <section className={styles.list}>
        <h2>Події класу</h2>
        {sorted.length === 0 ? (
          <EmptyState
            title="Подій ще немає"
            description="Створи першу подію для класу."
          />
        ) : (
          sorted.map((event) => (
            <EventTeacherCard
              key={event.id}
              event={event}
              busy={publishMutation.isPending || deleteMutation.isPending}
              onDelete={() => {
                if (confirm('Видалити цю подію?')) {
                  deleteMutation.mutate(event.id);
                }
              }}
              onPublish={(comment, materials) =>
                publishMutation.mutate({ id: event.id, comment, materials })
              }
            />
          ))
        )}
      </section>
    </div>
  );
}

function EventTeacherCard({
  event,
  busy,
  onDelete,
  onPublish,
}: {
  event: ClassEvent;
  busy: boolean;
  onDelete: () => void;
  onPublish: (comment: string, materials: string[]) => void;
}) {
  const status = statusLabel[event.status ?? 'upcoming'];
  const [comment, setComment] = useState(event.reviewComment ?? '');
  const [materialsText, setMaterialsText] = useState(
    (event.materials ?? []).join('\n'),
  );
  const canReview = event.status === 'ended';

  return (
    <Card className={styles.item}>
      <div className={styles.itemHead}>
        <div>
          <Badge tone={status.tone}>{status.label}</Badge>
          <h3>{event.title}</h3>
          <p>{event.description}</p>
          <span className={styles.range}>
            {formatEventRange(event.startsAt, event.endsAt)}
          </span>
        </div>
        <Button variant="secondary" onClick={onDelete} disabled={busy}>
          Видалити
        </Button>
      </div>

      <div className={styles.participants}>
        <strong>
          Учасники ({event.participants?.length ?? event.participantIds.length})
        </strong>
        {(event.participants?.length ?? 0) === 0 ? (
          <p className={styles.muted}>Поки ніхто не приєднався.</p>
        ) : (
          <ul>
            {event.participants?.map((person) => (
              <li key={person.id}>
                <span aria-hidden="true">{person.avatarEmoji}</span>
                {person.displayName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {canReview ? (
        <div className={styles.review}>
          <h4>Ревʼю після події</h4>
          <p className={styles.muted}>
            Напиши коментар і матеріали — опублікуємо підсумок на дошку класу.
          </p>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Що вийшло добре? Що запамʼятати класу?"
          />
          <textarea
            rows={3}
            value={materialsText}
            onChange={(e) => setMaterialsText(e.target.value)}
            placeholder="Матеріали — кожен з нового рядка (фото, посилання, файли…)"
          />
          <Button
            disabled={busy || !comment.trim()}
            onClick={() =>
              onPublish(
                comment,
                materialsText
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
              )
            }
          >
            Опублікувати на дошку
          </Button>
        </div>
      ) : null}

      {event.status === 'published' ? (
        <div className={styles.published}>
          <strong>Підсумок уже на дошці</strong>
          {event.reviewComment ? <p>{event.reviewComment}</p> : null}
          {(event.materials?.length ?? 0) > 0 ? (
            <ul>
              {event.materials?.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
