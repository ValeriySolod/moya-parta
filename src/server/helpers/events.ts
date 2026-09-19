import { prisma } from '../db/prisma';
import type { ClassEvent } from '../types';

export type EventLifecycle = 'upcoming' | 'live' | 'ended' | 'published';

export const eventStartsAt = (event: ClassEvent): string =>
  event.startsAt ?? event.date ?? new Date().toISOString();

export const eventEndsAt = (event: ClassEvent): string =>
  event.endsAt ?? event.startsAt ?? event.date ?? new Date().toISOString();

export const getEventLifecycle = (event: ClassEvent): EventLifecycle => {
  if (event.publishedPostId) {
    return 'published';
  }

  const now = Date.now();
  const start = new Date(eventStartsAt(event)).getTime();
  const end = new Date(eventEndsAt(event)).getTime();

  if (now < start) {
    return 'upcoming';
  }

  if (now <= end) {
    return 'live';
  }

  return 'ended';
};

export const enrichEvent = async (event: ClassEvent) => {
  const users =
    event.participantIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: event.participantIds } },
        })
      : [];

  const byId = new Map(users.map((user) => [user.id, user]));
  const participants = event.participantIds.flatMap((id) => {
    const user = byId.get(id);
    if (!user) {
      return [];
    }

    return [
      {
        id: user.id,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        avatarEmoji: user.avatarEmoji,
      },
    ];
  });

  return {
    ...event,
    startsAt: eventStartsAt(event),
    endsAt: eventEndsAt(event),
    date: eventStartsAt(event),
    materials: event.materials ?? [],
    status: getEventLifecycle(event),
    participants,
  };
};
