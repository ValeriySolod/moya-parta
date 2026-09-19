import styles from './XPBar.module.css';
import { ProgressBar } from './ProgressBar';

interface XPBarReward {
  icon: string;
  title: string;
}

interface XPBarProps {
  level: number;
  xp: number;
  xpToNextLevel: number;
  xpRemaining: number;
  isLevelComplete: boolean;
  hasValidData: boolean;
  progressDescription: string;
  howToEarnXp: string;
  nextReward?: XPBarReward | null;
  inverted?: boolean;
}

export function XPBar({
  level,
  xp,
  xpToNextLevel,
  xpRemaining,
  isLevelComplete,
  hasValidData,
  progressDescription,
  howToEarnXp,
  nextReward,
  inverted = false,
}: XPBarProps) {
  return (
    <div className={`${styles.wrap} ${inverted ? styles.inverted : ''}`}>
      <div className={styles.meta}>
        <span className={styles.level}>Рівень {level}</span>
        <span className={styles.xp}>
          {hasValidData ? `${xp} / ${xpToNextLevel} XP` : `${xp} XP`}
        </span>
      </div>
      <ProgressBar
        value={hasValidData ? xp : 0}
        max={hasValidData ? xpToNextLevel : 1}
        tone="warm"
        onDark={inverted}
        ariaLabel={progressDescription}
      />
      <p className={styles.status}>
        {!hasValidData
          ? 'Дані про прогрес рівня тимчасово недоступні.'
          : isLevelComplete
            ? 'Рівень завершено! Незабаром новий рівень.'
            : `Залишилось ${xpRemaining} XP до наступного рівня`}
      </p>

      {nextReward ? (
        <p className={styles.reward}>
          <span aria-hidden="true">{nextReward.icon}</span> Наступна нагорода:{' '}
          <strong>{nextReward.title}</strong>
        </p>
      ) : null}

      <details className={styles.disclosure}>
        <summary>Як заробити XP?</summary>
        <p>{howToEarnXp}</p>
      </details>
    </div>
  );
}
