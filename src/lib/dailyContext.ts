import type { ClassEvent, Homework, Quest } from '@/types';

export type DailyContextKind =
  | 'unfinishedTask'
  | 'nextTask'
  | 'nearestEvent'
  | 'newQuest';

export type DailyContextEntry =
  | { kind: 'unfinishedTask'; homework: Homework }
  | { kind: 'nextTask'; homework: Homework }
  | { kind: 'nearestEvent'; event: ClassEvent }
  | { kind: 'newQuest'; quest: Quest };

export interface DailyContextInput {
  homework?: Homework[] | null;
  events?: ClassEvent[] | null;
  quests?: Quest[] | null;
  now?: number;
}

const MAX_ITEMS = 3;

/** unfinished > next > nearest event > new quest */
const PRIORITY: DailyContextKind[] = [
  'unfinishedTask',
  'nextTask',
  'nearestEvent',
  'newQuest',
];

const byEarliestDueDate = (a: Homework, b: Homework): number =>
  new Date(a.endsAt ?? a.dueDate).getTime() -
  new Date(b.endsAt ?? b.dueDate).getTime();

const byEarliestStart = (a: ClassEvent, b: ClassEvent): number =>
  new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();

const pickUnfinishedTask = (homework: Homework[]): Homework | null =>
  [...homework]
    .filter((item) => item.status === 'revise')
    .sort(byEarliestDueDate)[0] ?? null;

const pickNextTask = (homework: Homework[]): Homework | null =>
  [...homework]
    .filter((item) => (item.status === 'new' || !item.status) && !item.ended)
    .sort(byEarliestDueDate)[0] ?? null;

const pickNearestEvent = (events: ClassEvent[]): ClassEvent | null =>
  [...events]
    .filter((event) => event.status === 'upcoming' || event.status === 'live')
    .sort(byEarliestStart)[0] ?? null;

const pickNewQuest = (quests: Quest[]): Quest | null =>
  quests.find((quest) => !quest.completed && (quest.currentStep ?? 0) === 0) ??
  null;

/**
 * Pure selection of "Твій день" items: builds one candidate per kind,
 * ranks by fixed priority, dedupes by underlying entity id, caps at 3.
 */
export function selectDailyContextEntries(
  input: DailyContextInput,
): DailyContextEntry[] {
  const homework = input.homework ?? [];
  const events = input.events ?? [];
  const quests = input.quests ?? [];

  const candidates: Record<DailyContextKind, DailyContextEntry | null> = {
    unfinishedTask: null,
    nextTask: null,
    nearestEvent: null,
    newQuest: null,
  };

  const unfinishedTask = pickUnfinishedTask(homework);
  if (unfinishedTask) {
    candidates.unfinishedTask = { kind: 'unfinishedTask', homework: unfinishedTask };
  }

  const nextTask = pickNextTask(homework);
  if (nextTask && nextTask.id !== unfinishedTask?.id) {
    candidates.nextTask = { kind: 'nextTask', homework: nextTask };
  }

  const nearestEvent = pickNearestEvent(events);
  if (nearestEvent) {
    candidates.nearestEvent = { kind: 'nearestEvent', event: nearestEvent };
  }

  const newQuest = pickNewQuest(quests);
  if (newQuest) {
    candidates.newQuest = { kind: 'newQuest', quest: newQuest };
  }

  const seenIds = new Set<string>();
  const ordered: DailyContextEntry[] = [];

  for (const kind of PRIORITY) {
    const entry = candidates[kind];
    if (!entry) {
      continue;
    }

    const dedupeKey =
      entry.kind === 'nearestEvent'
        ? `event:${entry.event.id}`
        : entry.kind === 'newQuest'
          ? `quest:${entry.quest.id}`
          : `homework:${entry.homework.id}`;

    if (seenIds.has(dedupeKey)) {
      continue;
    }
    seenIds.add(dedupeKey);
    ordered.push(entry);
  }

  return ordered.slice(0, MAX_ITEMS);
}
