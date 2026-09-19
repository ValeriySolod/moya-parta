import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { ClassEvent } from '@/types';
import { formatEventRange } from '@/lib/format';
import styles from './EventCard.module.css';

interface EventCardProps {
  event: ClassEvent;
  onJoin?: () => void;
  joined?: boolean;
}

const statusMap = {
  upcoming: { label: 'Незабаром', tone: 'primary' as const },
  live: { label: 'Триває', tone: 'success' as const },
  ended: { label: 'Завершена', tone: 'warning' as const },
  published: { label: 'На дошці', tone: 'secondary' as const },
};

export function EventCard({ event, onJoin, joined }: EventCardProps) {
  const status = statusMap[event.status ?? 'upcoming'];
  const canJoin =
    Boolean(onJoin) &&
    (event.status === 'upcoming' || event.status === 'live');

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div className={styles.date}>
          {formatEventRange(event.startsAt, event.endsAt)}
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <ProgressBar
        value={event.progress}
        max={100}
        label={`Прогрес класу · ${event.participantIds.length} учасників`}
        tone="primary"
      />
      {canJoin ? (
        <Button onClick={onJoin} disabled={joined} fullWidth>
          {joined ? 'Ти вже з нами' : 'Приєднатися'}
        </Button>
      ) : null}
      {event.status === 'ended' || event.status === 'published' ? (
        <p className={styles.endedNote}>
          {event.status === 'published'
            ? 'Підсумок уже на дошці класу'
            : 'Подія завершилась — чекаємо на підсумок від учителя'}
        </p>
      ) : null}
    </article>
  );
}
