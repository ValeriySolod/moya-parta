import styles from './AchievementCard.module.css';
import type { Achievement } from '@/types';

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const locked = !achievement.unlocked;

  return (
    <article className={`${styles.card} ${locked ? styles.locked : ''}`}>
      <div className={styles.icon} aria-hidden="true">
        {achievement.icon}
      </div>
      <h3>{achievement.title}</h3>
      <p>{achievement.description}</p>
      <span className={styles.category}>{achievement.category}</span>
    </article>
  );
}
