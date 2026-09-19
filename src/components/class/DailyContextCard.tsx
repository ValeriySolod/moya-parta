import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import type { DailyContextEntry } from '@/lib/dailyContext';
import { formatDate, formatEventRange } from '@/lib/format';
import { SUBJECT_ICONS, SUBJECT_LABELS } from '@/types';
import styles from './DailyContextCard.module.css';

interface DailyContextCardProps {
  isLoading: boolean;
  entries: DailyContextEntry[];
  joinedEventIds: Set<string>;
  joinBusy: boolean;
  onJoinEvent: (eventId: string) => void;
}

const KICKER_LABEL: Record<DailyContextEntry['kind'], string> = {
  unfinishedTask: 'Доробити',
  nextTask: 'Наступне завдання',
  nearestEvent: 'Найближча подія',
  newQuest: 'Новий квест',
};

export function DailyContextCard({
  isLoading,
  entries,
  joinedEventIds,
  joinBusy,
  onJoinEvent,
}: DailyContextCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <h2>Твій день</h2>
        <p className={styles.hint}>Найважливіше зараз — в одному місці.</p>
      </div>

      {isLoading ? (
        <LoadingState label="Дивимось, що на сьогодні..." />
      ) : entries.length === 0 ? (
        <p className={styles.empty}>
          На сьогодні все спокійно. Можеш зазирнути в дошку класу нижче.
        </p>
      ) : (
        <div className={styles.list}>
          {entries.map((entry, index) => (
            <DailyContextRow
              key={entryKey(entry)}
              entry={entry}
              primary={index === 0}
              joined={
                entry.kind === 'nearestEvent'
                  ? joinedEventIds.has(entry.event.id)
                  : false
              }
              joinBusy={joinBusy}
              onJoinEvent={onJoinEvent}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function entryKey(entry: DailyContextEntry): string {
  if (entry.kind === 'nearestEvent') {
    return `event:${entry.event.id}`;
  }
  if (entry.kind === 'newQuest') {
    return `quest:${entry.quest.id}`;
  }
  return `${entry.kind}:${entry.homework.id}`;
}

function DailyContextRow({
  entry,
  primary,
  joined,
  joinBusy,
  onJoinEvent,
}: {
  entry: DailyContextEntry;
  primary: boolean;
  joined: boolean;
  joinBusy: boolean;
  onJoinEvent: (eventId: string) => void;
}) {
  const rowClassName = `${styles.row} ${primary ? styles.rowPrimary : ''}`.trim();

  if (entry.kind === 'nearestEvent') {
    const { event } = entry;
    return (
      <div className={rowClassName}>
        <span className={styles.emoji} aria-hidden="true">
          📅
        </span>
        <div className={styles.copy}>
          <Badge tone="secondary">{KICKER_LABEL[entry.kind]}</Badge>
          <strong>{event.title}</strong>
          <span className={styles.meta}>{formatEventRange(event.startsAt, event.endsAt)}</span>
        </div>
        {event.status === 'upcoming' || event.status === 'live' ? (
          <button
            type="button"
            className={styles.action}
            disabled={joined || joinBusy}
            onClick={() => onJoinEvent(event.id)}
          >
            {joined ? 'Ти з нами' : 'Приєднатися'}
          </button>
        ) : (
          <Link href="/events" className={styles.actionLink}>
            Переглянути
          </Link>
        )}
      </div>
    );
  }

  if (entry.kind === 'newQuest') {
    const { quest } = entry;
    return (
      <div className={rowClassName}>
        <span className={styles.emoji} aria-hidden="true">
          {quest.illustration}
        </span>
        <div className={styles.copy}>
          <Badge tone="warm">{KICKER_LABEL[entry.kind]}</Badge>
          <strong>{quest.title}</strong>
          <span className={styles.meta}>Крок 0 із {quest.totalSteps}</span>
        </div>
        <Link href="/quests" className={styles.actionLink}>
          Почати
        </Link>
      </div>
    );
  }

  const { homework } = entry;

  return (
    <div className={rowClassName}>
      <span className={styles.emoji} aria-hidden="true">
        {SUBJECT_ICONS[homework.subject]}
      </span>
      <div className={styles.copy}>
        <Badge tone={entry.kind === 'unfinishedTask' ? 'warning' : 'primary'}>
          {KICKER_LABEL[entry.kind]}
        </Badge>
        <strong>{homework.title}</strong>
        <span className={styles.meta}>
          {SUBJECT_LABELS[homework.subject]} · до{' '}
          {formatDate(homework.endsAt ?? homework.dueDate)}
        </span>
      </div>
      <Link href={`/learning/homework/${homework.id}`} className={styles.actionLink}>
        {entry.kind === 'unfinishedTask' ? 'Доробити' : 'Виконати'}
      </Link>
    </div>
  );
}
