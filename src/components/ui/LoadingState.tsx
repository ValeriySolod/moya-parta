import styles from './LoadingState.module.css';

export function LoadingState({ label = 'Завантажуємо...' }: { label?: string }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.dot} />
      <p>{label}</p>
    </div>
  );
}
