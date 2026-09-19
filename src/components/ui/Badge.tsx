import styles from './Badge.module.css';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'primary' | 'secondary' | 'warm' | 'muted' | 'success' | 'warning';
}

export function Badge({ children, tone = 'primary' }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
