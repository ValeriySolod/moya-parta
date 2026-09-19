'use client';

import styles from './NavCount.module.css';

interface NavCountProps {
  count?: number;
  /** Для aria на батьківському лінку */
  label?: string;
}

export function NavCount({ count = 0, label }: NavCountProps) {
  if (!count || count < 1) {
    return null;
  }

  const text = count > 9 ? '9+' : String(count);

  return (
    <span
      className={styles.count}
      aria-label={label ? `${label}: ${count}` : undefined}
    >
      {text}
    </span>
  );
}
