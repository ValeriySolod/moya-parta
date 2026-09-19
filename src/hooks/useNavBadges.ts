'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { navApi, type NavBadges } from '@/services/api';

const EMPTY: NavBadges = {
  chat: 0,
  board: 0,
  learning: 0,
  tasks: 0,
  events: 0,
  notifications: 0,
  wins: 0,
};

export type NavSection =
  | 'chat'
  | 'board'
  | 'learning'
  | 'tasks'
  | 'events'
  | 'notifications'
  | 'wins';

export function useNavBadges() {
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ['nav-badges'],
    queryFn: navApi.getBadges,
    enabled: Boolean(user),
    refetchInterval: 12_000,
    staleTime: 5_000,
  });

  return {
    badges: query.data ?? EMPTY,
    isLoading: query.isLoading,
  };
}

export function badgeForHref(
  href: string,
  badges: NavBadges,
  role: 'student' | 'teacher',
): number {
  if (href === '/chat') {
    return badges.chat;
  }

  if (href === '/notifications') {
    return badges.notifications;
  }

  if (role === 'teacher') {
    if (href === '/teacher/tasks') {
      return badges.tasks;
    }
    if (href === '/teacher/moderation' || href === '/teacher/class') {
      return badges.board;
    }
    if (href === '/teacher/events') {
      return badges.events;
    }
    return 0;
  }

  if (href === '/class' || href === '/board') {
    return badges.board;
  }
  if (href === '/learning') {
    return badges.learning;
  }
  if (href === '/wins') {
    return badges.wins;
  }
  if (href === '/events') {
    return badges.events;
  }
  if (href === '/quests') {
    return badges.learning;
  }

  return 0;
}

export function sectionFromPath(pathname: string): NavSection | null {
  if (pathname.startsWith('/chat')) {
    return 'chat';
  }
  if (pathname.startsWith('/notifications')) {
    return 'notifications';
  }
  if (
    pathname.startsWith('/class') ||
    pathname.startsWith('/board') ||
    pathname.startsWith('/teacher/moderation') ||
    pathname.startsWith('/teacher/class')
  ) {
    return 'board';
  }
  if (pathname.startsWith('/learning') || pathname.startsWith('/quests')) {
    return 'learning';
  }
  if (pathname.startsWith('/teacher/tasks')) {
    return 'tasks';
  }
  if (pathname.startsWith('/teacher/events') || pathname.startsWith('/events')) {
    return 'events';
  }
  if (pathname.startsWith('/wins')) {
    return 'wins';
  }
  return null;
}
