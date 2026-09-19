import { prisma } from '../db';
import { asStringArray, toEvent } from '../db/map';
import { createId } from '../helpers/response';
import type { AuthUser } from '../types';
import { eventEndsAt } from '../helpers/events';

export type NavSection =
  | 'chat'
  | 'board'
  | 'learning'
  | 'tasks'
  | 'events'
  | 'notifications'
  | 'wins';

export interface NavBadges {
  chat: number;
  board: number;
  learning: number;
  tasks: number;
  events: number;
  notifications: number;
  wins: number;
}

const EMPTY: NavBadges = {
  chat: 0,
  board: 0,
  learning: 0,
  tasks: 0,
  events: 0,
  notifications: 0,
  wins: 0,
};

const seenAt = async (userId: string, section: NavSection): Promise<number> => {
  const row = await prisma.navSeen.findUnique({
    where: { userId_section: { userId, section } },
  });
  return row ? row.seenAt.getTime() : 0;
};

const unreadNotifications = (userId: string, type?: string) =>
  prisma.notification.count({
    where: {
      userId,
      read: false,
      ...(type ? { type } : {}),
    },
  });

const countUnreadChat = async (user: AuthUser): Promise<number> => {
  if (!user.classId) {
    return 0;
  }

  const since = await seenAt(user.id, 'chat');

  return prisma.chatMessage.count({
    where: {
      classId: user.classId,
      senderId: { not: user.id },
      ...(since > 0 ? { createdAt: { gt: new Date(since) } } : {}),
      OR: [{ kind: 'class' }, { kind: 'direct', recipientId: user.id }],
    },
  });
};

const countNewPosts = async (user: AuthUser): Promise<number> => {
  if (!user.classId) {
    return 0;
  }

  const since = await seenAt(user.id, 'board');

  return prisma.post.count({
    where: {
      classId: user.classId,
      status: 'published',
      authorId: { not: user.id },
      createdAt: { gt: new Date(since) },
    },
  });
};

const countStudentLearning = async (user: AuthUser): Promise<number> => {
  if (!user.classId) {
    return 0;
  }

  const day = 1000 * 60 * 60 * 24;
  const now = Date.now();
  const [homeworks, quizzes] = await Promise.all([
    prisma.homework.findMany({ where: { classId: user.classId } }),
    prisma.quiz.findMany({
      where: { classId: user.classId },
      select: { id: true },
    }),
  ]);

  const homeworkIds = homeworks.map((item) => item.id);
  const quizIds = quizzes.map((item) => item.id);

  const [submissions, attempts] = await Promise.all([
    homeworkIds.length > 0
      ? prisma.homeworkSubmission.findMany({
          where: { studentId: user.id, homeworkId: { in: homeworkIds } },
        })
      : Promise.resolve([]),
    quizIds.length > 0
      ? prisma.quizAttempt.findMany({
          where: { studentId: user.id, quizId: { in: quizIds } },
          select: { quizId: true },
        })
      : Promise.resolve([]),
  ]);

  const submissionByHomework = new Map(
    submissions.map((item) => [item.homeworkId, item]),
  );
  let count = 0;

  for (const homework of homeworks) {
    const submission = submissionByHomework.get(homework.id);

    if (submission?.status === 'revise') {
      count += 1;
      continue;
    }

    if (!submission || submission.status === 'new') {
      const due = homework.dueDate.getTime();
      if (due < now + day * 2) {
        count += 1;
      }
    }
  }

  const attempted = new Set(attempts.map((item) => item.quizId));
  for (const quiz of quizzes) {
    if (!attempted.has(quiz.id)) {
      count += 1;
    }
  }

  return count;
};

const countTeacherTasks = async (user: AuthUser): Promise<number> => {
  if (!user.classId) {
    return 0;
  }

  return prisma.homeworkSubmission.count({
    where: {
      status: 'checking',
      Homework: { classId: user.classId },
    },
  });
};

const countEvents = async (user: AuthUser): Promise<number> => {
  if (!user.classId) {
    return 0;
  }

  const now = Date.now();
  const since = await seenAt(user.id, 'events');

  const rows = await prisma.classEvent.findMany({
    where: { classId: user.classId },
  });

  return rows.filter((row) => {
    const event = toEvent(row);
    if (new Date(eventEndsAt(event)).getTime() < now) {
      return false;
    }

    if (event.publishedPostId) {
      return false;
    }

    if (user.role === 'student' && asStringArray(row.participantIds).includes(user.id)) {
      return false;
    }

    // Without createdAt — show upcoming until user opens events once
    // After first visit, only unread event notifications keep the badge warm
    if (since === 0) {
      return true;
    }

    return false;
  }).length;
};

export const getNavBadges = async (user: AuthUser): Promise<NavBadges> => {
  if (!user.classId && user.role === 'teacher') {
    return { ...EMPTY };
  }

  const eventsSeen = await seenAt(user.id, 'events');
  const [
    chat,
    board,
    learning,
    tasks,
    upcomingEvents,
    eventNotifs,
    notifications,
    wins,
  ] = await Promise.all([
    countUnreadChat(user),
    countNewPosts(user),
    user.role === 'student' ? countStudentLearning(user) : Promise.resolve(0),
    user.role === 'teacher' ? countTeacherTasks(user) : Promise.resolve(0),
    countEvents(user),
    eventsSeen > 0 ? unreadNotifications(user.id, 'event') : Promise.resolve(0),
    unreadNotifications(user.id),
    user.role === 'student'
      ? unreadNotifications(user.id, 'achievement')
      : Promise.resolve(0),
  ]);

  return {
    chat,
    board,
    learning,
    tasks,
    events: upcomingEvents + eventNotifs,
    notifications,
    wins,
  };
};

const markNotificationsRead = async (
  userId: string,
  type?: string,
) => {
  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
      ...(type ? { type } : {}),
    },
    data: { read: true },
  });
};

export const markNavSectionSeen = async (
  user: AuthUser,
  section: NavSection,
): Promise<NavBadges> => {
  await prisma.navSeen.upsert({
    where: {
      userId_section: { userId: user.id, section },
    },
    create: {
      id: createId('nav'),
      userId: user.id,
      section,
      seenAt: new Date(),
    },
    update: {
      seenAt: new Date(),
    },
  });

  if (section === 'notifications') {
    await markNotificationsRead(user.id);
  }

  if (section === 'chat') {
    await markNotificationsRead(user.id, 'chat');
  }

  if (section === 'wins') {
    await markNotificationsRead(user.id, 'achievement');
  }

  if (section === 'events') {
    await markNotificationsRead(user.id, 'event');
  }

  return getNavBadges(user);
};
