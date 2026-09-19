import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import buttonStyles from '@/components/ui/Button.module.css';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Quest } from '@/types';
import styles from './QuestCard.module.css';

interface QuestCardProps {
  quest: Quest;
  onContinue?: () => void;
}

export function QuestCard({ quest, onContinue }: QuestCardProps) {
  const step = quest.currentStep ?? 0;
  const isInteractive = Boolean(quest.questions?.length);

  return (
    <article className={styles.card}>
      <div className={styles.illustration} aria-hidden="true">
        {quest.illustration}
      </div>
      <div className={styles.content}>
        <h3>{quest.title}</h3>
        <p>{quest.description}</p>
        <ProgressBar
          value={step}
          max={quest.totalSteps}
          label={`Крок ${step} із ${quest.totalSteps}`}
          tone="secondary"
        />
        <div className={styles.footer}>
          <span className={styles.xp}>+{quest.xpReward} XP</span>
          {!quest.completed && isInteractive ? (
            <Link
              href={`/quests/${quest.id}/play`}
              className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.md}`}
            >
              {step === 0 ? 'Почати' : 'Продовжити'}
            </Link>
          ) : null}
          {!quest.completed && !isInteractive && onContinue ? (
            <Button size="md" onClick={onContinue}>
              {step === 0 ? 'Почати' : 'Продовжити'}
            </Button>
          ) : null}
          {quest.completed ? <span className={styles.done}>Завершено</span> : null}
        </div>
      </div>
    </article>
  );
}
