import type { Prisma } from '@prisma/client';
import { prisma, notifyMany, studentIdsOf, loadClass } from '../db';
import { toClassRoom, toEvent, toHomework, toPost, toQuest, toSubject, toSubmission } from '../db/map';
import { createId } from '../helpers/response';
import { enrichEvent, eventEndsAt, eventStartsAt } from '../helpers/events';
import type { AuthUser, Quest } from '../types';
import { createInviteCode, normalizeInviteCode } from './auth.service';
import * as postsService from './posts.service';

const emptyDashboard = (greetingName: string) => ({
  greetingName,
  className: '',
  hasClass: false,
  today: {
    newWorks: 0,
    doneTasks: 0,
    activeQuest: 0,
    nextEventTitle: null,
    nextEventDate: null,
    nextEventEndsAt: null,
    pendingPosts: 0,
  },
  homeworks: [],
  checkingWorks: [],
  goal: null,
  recentPosts: [],
});

export const getTeacherDashboard = async (teacher: AuthUser) => {
  if (!teacher.classId) {
    return emptyDashboard(teacher.displayName);
  }

  const classId = teacher.classId;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  const [
    classRoom,
    pendingPosts,
    checkingWorkRows,
    doneTasks,
    activeQuest,
    nextEventRow,
    homeworkRows,
    recentPostRows,
  ] = await Promise.all([
    prisma.classRoom.findUnique({ where: { id: classId } }),
    prisma.post.count({ where: { classId, status: 'pending' } }),
    prisma.homeworkSubmission.findMany({
      where: { status: 'checking', Homework: { classId } },
      include: { User: true, Homework: true },
    }),
    prisma.homeworkSubmission.count({
      where: {
        submittedAt: { gte: startOfDay, lt: startOfTomorrow },
        Homework: { classId },
      },
    }),
    prisma.quest.findFirst({ where: { classId } }),
    prisma.classEvent.findFirst({
      where: {
        classId,
        publishedPostId: null,
        endsAt: { gte: now },
      },
      orderBy: { startsAt: 'asc' },
    }),
    prisma.homework.findMany({ where: { classId } }),
    prisma.post.findMany({
      where: { classId, status: 'published' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { User: true },
    }),
  ]);

  const nextEvent = nextEventRow ? toEvent(nextEventRow) : null;

  return {
    greetingName: teacher.displayName,
    className: classRoom?.name ?? '',
    hasClass: true,
    today: {
      newWorks: checkingWorkRows.length,
      doneTasks,
      activeQuest: activeQuest ? 1 : 0,
      nextEventTitle: nextEvent?.title ?? null,
      nextEventDate: nextEvent ? eventStartsAt(nextEvent) : null,
      nextEventEndsAt: nextEvent ? eventEndsAt(nextEvent) : null,
      pendingPosts,
    },
    homeworks: homeworkRows.map(toHomework),
    checkingWorks: checkingWorkRows.map((sub) => ({
      ...toSubmission(sub),
      studentName: sub.User.displayName,
      homeworkTitle: sub.Homework.title,
      linkedQuizId: sub.Homework.linkedQuizId ?? undefined,
      subject: toSubject(sub.Homework.subject),
    })),
    goal: classRoom
      ? {
          title: classRoom.goalTitle,
          current: classRoom.goalCurrentXp,
          target: classRoom.goalTargetXp,
        }
      : null,
    recentPosts: recentPostRows.map((post) => ({
      ...toPost(post),
      authorName: post.User.displayName || 'Учень',
    })),
  };
};

export const createQuest = async (
  teacher: AuthUser,
  payload: Omit<Quest, 'id' | 'classId'>,
) => {
  if (!teacher.classId) {
    throw new Error('NO_CLASS');
  }

  const row = await prisma.quest.create({
    data: {
      id: createId('quest'),
      classId: teacher.classId,
      title: payload.title,
      description: payload.description,
      illustration: payload.illustration,
      xpReward: payload.xpReward,
      totalSteps: payload.totalSteps,
    },
  });

  return toQuest(row);
};

export const createEvent = async (
  teacher: AuthUser,
  payload: {
    title: string;
    description: string;
    startsAt: string;
    endsAt: string;
    materials?: string[];
  },
) => {
  if (!teacher.classId) {
    throw new Error('NO_CLASS');
  }

  if (new Date(payload.endsAt).getTime() <= new Date(payload.startsAt).getTime()) {
    throw new Error('INVALID_RANGE');
  }

  const startsAt = new Date(payload.startsAt);
  const materials = payload.materials ?? [];

  const row = await prisma.classEvent.create({
    data: {
      id: createId('event'),
      classId: teacher.classId,
      title: payload.title,
      description: payload.description,
      startsAt,
      endsAt: new Date(payload.endsAt),
      date: startsAt,
      participantIds: [] as Prisma.InputJsonValue,
      progress: 0,
      materials: materials as Prisma.InputJsonValue,
    },
  });

  const event = toEvent(row);
  await notifyMany(await studentIdsOf(teacher.classId), {
    title: 'Подія класу',
    body: `У класі нова подія — ${event.title}`,
    type: 'event',
  });

  return enrichEvent(event);
};

export const getTeacherEvents = async (teacher: AuthUser) => {
  if (!teacher.classId) {
    return [];
  }

  const rows = await prisma.classEvent.findMany({
    where: { classId: teacher.classId },
    orderBy: { startsAt: 'desc' },
  });

  return Promise.all(rows.map((row) => enrichEvent(toEvent(row))));
};

export const publishEventReview = async (
  teacher: AuthUser,
  eventId: string,
  payload: { comment: string; materials: string[] },
) => {
  if (!teacher.classId) {
    throw new Error('NO_CLASS');
  }

  const row = await prisma.classEvent.findFirst({
    where: { id: eventId, classId: teacher.classId },
  });

  if (!row) {
    return null;
  }

  const event = toEvent(row);

  if (new Date(eventEndsAt(event)).getTime() > Date.now()) {
    throw new Error('EVENT_NOT_ENDED');
  }

  if (event.publishedPostId) {
    throw new Error('ALREADY_PUBLISHED');
  }

  const comment = payload.comment.trim();
  if (!comment) {
    throw new Error('NO_COMMENT');
  }

  const materials = payload.materials
    .map((item) => item.trim())
    .filter(Boolean);

  const participantUsers =
    event.participantIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: event.participantIds } },
        })
      : [];
  const nameById = new Map(
    participantUsers.map((user) => [user.id, user.displayName]),
  );
  const participants = event.participantIds
    .map((id) => nameById.get(id))
    .filter((name): name is string => Boolean(name));

  const start = new Date(eventStartsAt(event));
  const end = new Date(eventEndsAt(event));
  const rangeLabel = `${start.toLocaleString('uk-UA', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })} — ${end.toLocaleString('uk-UA', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const materialsBlock =
    materials.length > 0
      ? `\n\nМатеріали:\n${materials.map((item) => `• ${item}`).join('\n')}`
      : '';

  const participantsBlock =
    participants.length > 0
      ? `\n\nБрали участь (${participants.length}): ${participants.join(', ')}`
      : '\n\nУчасників поки не було.';

  const post = await postsService.createPost(teacher, {
    text: `${comment}\n\n📅 ${event.title}\n${rangeLabel}${participantsBlock}${materialsBlock}`,
    imageEmoji: '🎉',
    category: 'подія',
  });

  const updated = await prisma.classEvent.update({
    where: { id: event.id },
    data: {
      materials: materials as Prisma.InputJsonValue,
      reviewComment: comment,
      reviewedAt: new Date(),
      progress: 100,
      publishedPostId: post.id,
    },
  });

  await notifyMany(await studentIdsOf(teacher.classId), {
    title: 'Підсумок події',
    body: `Учитель опублікував підсумок «${event.title}» на дошці`,
    type: 'event',
  });

  return {
    event: await enrichEvent(toEvent(updated)),
    post,
  };
};

const gradeFromName = (name: string): number => {
  const match = name.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 1;
};

export const createClassForTeacher = async (
  teacher: AuthUser,
  payload: { name: string },
) => {
  if (teacher.classId) {
    const existing = await prisma.classRoom.findUnique({
      where: { id: teacher.classId },
    });
    if (existing) {
      throw new Error('CLASS_EXISTS');
    }
  }

  const name = payload.name.trim();
  const row = await prisma.classRoom.create({
    data: {
      id: createId('class'),
      schoolId: teacher.schoolId,
      name,
      grade: gradeFromName(name),
      teacherId: teacher.id,
      inviteCode: createInviteCode(name),
      goalTargetXp: 1000,
      goalCurrentXp: 0,
      goalTitle: 'Разом збираємо 1000 XP',
    },
  });

  await prisma.user.update({
    where: { id: teacher.id },
    data: { classId: row.id },
  });

  return toClassRoom(row, []);
};

export const getTeacherInvite = async (teacher: AuthUser) => {
  if (!teacher.classId) {
    return null;
  }

  const classRoom = await loadClass(teacher.classId);

  if (!classRoom) {
    return null;
  }

  // Старі коди з кирилицею ламали посилання — одразу замінюємо на латиницю
  if (classRoom.inviteCode !== normalizeInviteCode(classRoom.inviteCode)) {
    const inviteCode = createInviteCode(classRoom.name);
    await prisma.classRoom.update({
      where: { id: classRoom.id },
      data: { inviteCode },
    });
    classRoom.inviteCode = inviteCode;
  }

  return {
    classId: classRoom.id,
    className: classRoom.name,
    inviteCode: classRoom.inviteCode,
    invitePath: `/join/${encodeURIComponent(classRoom.inviteCode)}`,
    studentsCount: classRoom.studentIds.length,
  };
};

export const regenerateInvite = async (teacher: AuthUser) => {
  if (!teacher.classId) {
    throw new Error('NO_CLASS');
  }

  const classRoom = await prisma.classRoom.findUnique({
    where: { id: teacher.classId },
  });

  if (!classRoom) {
    throw new Error('NO_CLASS');
  }

  await prisma.classRoom.update({
    where: { id: classRoom.id },
    data: { inviteCode: createInviteCode(classRoom.name) },
  });

  return getTeacherInvite(teacher);
};
