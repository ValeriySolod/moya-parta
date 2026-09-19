import type { BackpackItem } from '@/types';

export interface XpProgressSummary {
  xp: number;
  xpToNextLevel: number;
  xpRemaining: number;
  percent: number;
  isLevelComplete: boolean;
  hasValidData: boolean;
}

const toFiniteNumber = (value: unknown): number => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : NaN;
};

/**
 * Sanitizes raw XP values into a display-safe summary. Never trusts the
 * server to send a positive target or a non-negative current value, since
 * the visible progress must stay valid even for missing/negative/excessive input.
 */
export function computeXpProgress(
  rawXp: unknown,
  rawXpToNextLevel: unknown,
): XpProgressSummary {
  const xpInput = toFiniteNumber(rawXp);
  const targetInput = toFiniteNumber(rawXpToNextLevel);

  const hasValidData = Number.isFinite(targetInput) && targetInput > 0;
  const safeXp = Math.max(0, Number.isFinite(xpInput) ? xpInput : 0);
  const target = hasValidData ? targetInput : Math.max(safeXp, 1);
  const clampedXp = Math.min(safeXp, target);

  const percent = hasValidData
    ? Math.min(100, Math.max(0, Math.round((clampedXp / target) * 100)))
    : 0;
  const xpRemaining = hasValidData ? Math.max(0, Math.round(target - safeXp)) : 0;
  const isLevelComplete = hasValidData && safeXp >= targetInput;

  return {
    xp: Math.round(safeXp),
    xpToNextLevel: Math.round(target),
    xpRemaining,
    percent,
    isLevelComplete,
    hasValidData,
  };
}

/** Builds a screen-reader-friendly sentence describing the current progress state. */
export function describeXpProgress(summary: XpProgressSummary): string {
  if (!summary.hasValidData) {
    return 'Дані про прогрес рівня зараз недоступні.';
  }
  if (summary.isLevelComplete) {
    return `Рівень завершено: ${summary.xp} із ${summary.xpToNextLevel} XP.`;
  }
  return `Прогрес рівня: ${summary.xp} із ${summary.xpToNextLevel} XP (${summary.percent}%). Залишилось ${summary.xpRemaining} XP до наступного рівня.`;
}

/** Picks the nearest still-locked reward from the student's backpack, if any. */
export function pickNextReward(
  items: BackpackItem[] | null | undefined,
): BackpackItem | null {
  if (!items || items.length === 0) {
    return null;
  }
  return items.find((item) => item.category === 'reward' && !item.unlocked) ?? null;
}

/** Short explanation of how XP is earned, reusing the student's actual daily goal when known. */
export function describeHowToEarnXp(
  dailyGoal?: { title: string; xp: number } | null,
): string {
  const base = 'Виконуй домашні завдання, квести та бери участь у житті класу, щоб отримувати XP.';
  if (dailyGoal && Number.isFinite(dailyGoal.xp) && dailyGoal.xp > 0) {
    return `${base} Наприклад, ціль «${dailyGoal.title}» дає +${dailyGoal.xp} XP.`;
  }
  return base;
}
