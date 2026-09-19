import styles from './Avatar.module.css';

interface AvatarProps {
  emoji: string;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
}

export function Avatar({
  emoji,
  color,
  size = 'md',
  label,
}: AvatarProps) {
  return (
    <div
      className={`${styles.avatar} ${styles[size]}`}
      style={{ backgroundColor: color }}
      aria-label={label ?? 'Аватар'}
      role="img"
    >
      <span aria-hidden="true">{emoji}</span>
    </div>
  );
}
