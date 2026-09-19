import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  /** Overrides the accessible name without changing the visible label text. */
  ariaLabel?: string;
  tone?: 'primary' | 'secondary' | 'warm';
  onDark?: boolean;
}

export function ProgressBar({
  value,
  max,
  label,
  ariaLabel,
  tone = 'primary',
  onDark = false,
}: ProgressBarProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const safeValue = Math.min(
    safeMax,
    Math.max(0, Number.isFinite(value) ? value : 0),
  );
  const percent = Math.round((safeValue / safeMax) * 100);

  return (
    <div className={styles.wrap}>
      {label ? <div className={styles.label}>{label}</div> : null}
      <div
        className={`${styles.track} ${onDark ? styles.trackOnDark : ''}`}
        role="progressbar"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={ariaLabel ?? label ?? 'Прогрес'}
      >
        <div
          className={`${styles.fill} ${styles[tone]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
