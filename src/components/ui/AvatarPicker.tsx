'use client';

import styles from './AvatarPicker.module.css';

export interface AvatarOption {
  id: string;
  emoji: string;
  label: string;
}

interface AvatarPickerProps {
  options: AvatarOption[];
  value: string;
  onChange: (emoji: string) => void;
}

export function AvatarPicker({ options, value, onChange }: AvatarPickerProps) {
  return (
    <div className={styles.wrap} role="group" aria-label="Обери аватар">
      {options.map((option) => {
        const selected = value === option.emoji;
        return (
          <button
            key={option.id}
            type="button"
            className={`${styles.option} ${selected ? styles.selected : ''}`}
            aria-pressed={selected}
            aria-label={option.label}
            onClick={() => onChange(option.emoji)}
          >
            <span aria-hidden="true">{option.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
