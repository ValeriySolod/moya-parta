import { XP_PER_LEVEL } from '../constants';
import { prisma } from '../db';
import {
  asStringArray,
  isoRequired,
  toEvent,
  toHomework,
  toPost,
  toProfile,
  toUser,
} from '../db/map';
import { createId, toPublicUser } from '../helpers/response';
import { enrichEvent } from '../helpers/events';
import type { BackpackItem, Post, StudentProfile } from '../types';

export const getStudentDesk = async (studentId: string) => {
  const userRow = await prisma.user.findUnique({ where: { id: studentId } });
  if (!userRow?.classId) {
    return null;
  }

  const user = toUser(userRow);
  const [profileRow, classRoom] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: studentId } }),
    prisma.classRoom.findUnique({ where: { id: userRow.classId } }),
  ]);

  if (!profileRow || !classRoom) {
    return null;
  }

  const now = new Date();
  const [
    homeworkRows,
    submissionRows,
    latestPostRows,
    nextEventRow,
    achievementRows,
    teacherRow,
  ] = await Promise.all([
    prisma.homework.findMany({ where: { classId: classRoom.id } }),
    prisma.homeworkSubmission.findMany({ where: { studentId } }),
    prisma.post.findMany({
      where: { classId: classRoom.id, status: 'published' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { User: true },
    }),
    prisma.classEvent.findFirst({
      where: {
        classId: classRoom.id,
        publishedPostId: null,
        endsAt: { gte: now },
      },
      orderBy: { startsAt: 'asc' },
    }),
    prisma.studentAchievement.findMany({
      where: { studentId },
      include: { Achievement: true },
      orderBy: { unlockedAt: 'desc' },
      take: 3,
    }),
    prisma.user.findUnique({ where: { id: classRoom.teacherId } }),
  ]);

  const submissionByHomework = new Map(
    submissionRows.map((row) => [row.homeworkId, row]),
  );

  const todayHomework = homeworkRows
    .map((row) => {
      const hw = toHomework(row);
      const submission = submissionByHomework.get(hw.id);
      return {
        ...hw,
        status: submission?.status ?? 'new',
      };
    })
    .filter((hw) => hw.status === 'new')
    .slice(0, 2);

  const latestPosts = latestPostRows.map((row) =>
    enrichPost(toPost(row), {
      id: row.User.id,
      displayName: row.User.displayName,
      avatarColor: row.User.avatarColor,
      avatarEmoji: row.User.avatarEmoji,
    }),
  );

  const nextEvent = nextEventRow
    ? await enrichEvent(toEvent(nextEventRow))
    : undefined;

  const recentAchievements = achievementRows.map((item) => ({
    ...item.Achievement,
    unlockedAt: isoRequired(item.unlockedAt),
  }));

  return {
    user: toPublicUser(user),
    profile: toProfile(profileRow),
    className: classRoom.name,
    teacherName: teacherRow?.displayName ?? 'Учитель',
    todayHomework,
    latestPosts,
    nextEvent,
    recentAchievements,
    classGoal: {
      title: classRoom.goalTitle,
      current: classRoom.goalCurrentXp,
      target: classRoom.goalTargetXp,
    },
    dailyGoal: {
      title: 'Виконай одне завдання',
      xp: 20,
    },
  };
};

export const getStudentProfile = async (
  studentId: string,
): Promise<StudentProfile | null> => {
  const row = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
  });
  return row ? toProfile(row) : null;
};

export const addXp = async (
  studentId: string,
  amount: number,
  reason: string,
): Promise<StudentProfile | null> => {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.studentProfile.findUnique({
      where: { userId: studentId },
    });

    if (!profile) {
      return null;
    }

    let xp = profile.xp + amount;
    let level = profile.level;
    let xpToNextLevel = profile.xpToNextLevel;

    while (xp >= xpToNextLevel) {
      xp -= xpToNextLevel;
      level += 1;
      xpToNextLevel = XP_PER_LEVEL;
    }

    const updated = await tx.studentProfile.update({
      where: { userId: studentId },
      data: { xp, level, xpToNextLevel },
    });

    await tx.xpTransaction.create({
      data: {
        id: createId('xp'),
        studentId,
        amount,
        reason,
      },
    });

    const membership = await tx.classMembership.findFirst({
      where: { studentId },
    });

    if (membership) {
      const classRoom = await tx.classRoom.findUnique({
        where: { id: membership.classId },
      });

      if (classRoom) {
        await tx.classRoom.update({
          where: { id: classRoom.id },
          data: {
            goalCurrentXp: Math.min(
              classRoom.goalTargetXp,
              classRoom.goalCurrentXp + amount,
            ),
          },
        });
      }
    }

    return toProfile(updated);
  });
};

export const completeOnboarding = async (
  studentId: string,
): Promise<StudentProfile | null> => {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
  });

  if (!profile) {
    return null;
  }

  const updated = await prisma.studentProfile.update({
    where: { userId: studentId },
    data: { onboardingCompleted: true },
  });

  return toProfile(updated);
};

export const getBackpack = async (studentId: string): Promise<BackpackItem[]> => {
  const [profile, items] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: studentId } }),
    prisma.backpackItem.findMany(),
  ]);

  const unlocked = new Set(asStringArray(profile?.unlockedItems));

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category as BackpackItem['category'],
    icon: item.icon,
    unlocked: unlocked.has(item.id) || item.unlocked,
  }));
};

export const getClassmates = async (classId: string, schoolId: string) => {
  const classRoom = await prisma.classRoom.findFirst({
    where: { id: classId, schoolId },
  });

  if (!classRoom) {
    return [];
  }

  const members = await prisma.classMembership.findMany({
    where: { classId },
    include: { User: true },
    orderBy: { joinedAt: 'asc' },
  });

  return members.map((item) => toPublicUser(toUser(item.User)));
};

const enrichPost = (
  post: Post,
  author: {
    id: string;
    displayName: string;
    avatarColor: string;
    avatarEmoji: string;
  } | null,
) => ({
  ...post,
  author: author
    ? {
        id: author.id,
        displayName: author.displayName,
        avatarColor: author.avatarColor,
        avatarEmoji: author.avatarEmoji,
      }
    : null,
});
