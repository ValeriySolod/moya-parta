import styles from './Card.module.css';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  className = '',
  padding = 'md',
}: CardProps) {
  return (
    <div className={`${styles.card} ${styles[padding]} ${className}`.trim()}>
      {children}
    </div>
  );
}
