import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SUBJECT_ICONS, SUBJECT_LABELS, type Homework } from '@/types';
import { formatDate, formatEventRange } from '@/lib/format';
import styles from './HomeworkCard.module.css';

interface HomeworkCardProps {
  homework: Homework;
  onAction?: () => void;
  actionLabel?: string;
  compact?: boolean;
  onAnalytics?: () => void;
  analyticsOpen?: boolean;
  onDelete?: () => void;
}

const statusMap = {
  new: { label: 'Нове', tone: 'primary' as const },
  done: { label: 'Виконано', tone: 'success' as const },
  checking: { label: 'Перевіряється', tone: 'warning' as const },
  reviewed: { label: 'Прийнято', tone: 'secondary' as const },
  revise: { label: 'Доробити', tone: 'warning' as const },
};

export function HomeworkCard({
  homework,
  onAction,
  actionLabel = 'Виконати',
  compact = false,
  onAnalytics,
  analyticsOpen = false,
  onDelete,
}: HomeworkCardProps) {
  const status = homework.status ? statusMap[homework.status] : null;
  const rangeLabel =
    homework.startsAt && homework.endsAt
      ? formatEventRange(homework.startsAt, homework.endsAt)
      : formatDate(homework.dueDate);
  const hasTeacherActions = Boolean(onAnalytics || onDelete);

  return (
    <article
      className={`${styles.card} ${compact ? styles.compact : ''}`.trim()}
    >
      <div className={styles.top}>
        <div className={styles.subject}>
          <span aria-hidden="true">{SUBJECT_ICONS[homework.subject]}</span>
          <span>{SUBJECT_LABELS[homework.subject]}</span>
        </div>
        {homework.ended ? (
          <Badge tone="secondary">Завершено</Badge>
        ) : status ? (
          <Badge tone={status.tone}>{status.label}</Badge>
        ) : null}
      </div>

      <h3 className={styles.title}>{homework.title}</h3>
      <p className={styles.description}>{homework.description}</p>

      {homework.teacherComment ? (
        <p className={styles.comment}>
          Коментар учителя: {homework.teacherComment}
        </p>
      ) : null}

      <div className={styles.meta}>
        <span>{rangeLabel}</span>
        <span className={styles.xp}>+{homework.xpReward} XP</span>
      </div>

      {hasTeacherActions ? (
        <div className={styles.actions}>
          {onAnalytics ? (
            <Button variant="secondary" size="md" onClick={onAnalytics}>
              {analyticsOpen ? 'Сховати' : 'Аналітика'}
            </Button>
          ) : null}
          {onDelete ? (
            <Button variant="ghost" size="md" onClick={onDelete}>
              Видалити
            </Button>
          ) : null}
        </div>
      ) : null}

      {onAction &&
      (homework.status === 'new' ||
        homework.status === 'revise' ||
        !homework.status) ? (
        <Button onClick={onAction} fullWidth>
          {homework.status === 'revise' ? 'Доробити' : actionLabel}
        </Button>
      ) : null}
    </article>
  );
}
