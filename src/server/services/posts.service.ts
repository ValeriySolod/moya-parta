import type { Prisma } from '@prisma/client';
import { loadClass, prisma } from '../db';
import { asReactions, toEvent, toPost, toQuest, toUser } from '../db/map';
import { notify } from '../db/notify';
import { enrichEvent } from '../helpers/events';
import { createId, toPublicUser } from '../helpers/response';
import type { AuthUser, Post, PostStatus } from '../types';

const SAFE_REACTIONS = ['❤️', '👏', '⭐', '😊', '🎉', '👍'] as const;

const authorPreview = (author: {
  id: string;
  displayName: string;
  avatarColor: string;
  avatarEmoji: string;
} | null) =>
  author
    ? {
        id: author.id,
        displayName: author.displayName,
        avatarColor: author.avatarColor,
        avatarEmoji: author.avatarEmoji,
      }
    : null;

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
  author: authorPreview(author),
  reactionCounts: Object.fromEntries(
    Object.entries(post.reactions).map(([emoji, users]) => [emoji, users.length]),
  ),
});

export const getClassBoard = async (classId: string, schoolId: string) => {
  const rows = await prisma.post.findMany({
    where: { classId, schoolId, status: 'published' },
    orderBy: { createdAt: 'desc' },
    include: { User: true },
  });

  return rows.map((row) => enrichPost(toPost(row), row.User));
};

export const getMyPosts = async (userId: string) => {
  const rows = await prisma.post.findMany({
    where: { authorId: userId, status: { not: 'rejected' } },
    orderBy: { createdAt: 'desc' },
    include: { User: true },
  });

  return rows.map((row) => enrichPost(toPost(row), row.User));
};

export const createPost = async (
  user: AuthUser,
  payload: { text: string; imageEmoji?: string; category?: string },
) => {
  if (!user.classId) {
    throw new Error('NO_CLASS');
  }

  const row = await prisma.post.create({
    data: {
      id: createId('post'),
      authorId: user.id,
      classId: user.classId,
      schoolId: user.schoolId,
      text: payload.text.trim(),
      imageEmoji: payload.imageEmoji,
      category: payload.category,
      status: 'published',
      reactions: {},
    },
    include: { User: true },
  });

  return enrichPost(toPost(row), row.User);
};

export const reactToPost = async (
  postId: string,
  userId: string,
  reaction: string,
) => {
  if (!SAFE_REACTIONS.includes(reaction as (typeof SAFE_REACTIONS)[number])) {
    throw new Error('INVALID_REACTION');
  }

  const row = await prisma.post.findFirst({
    where: { id: postId, status: 'published' },
    include: { User: true },
  });

  if (!row) {
    return null;
  }

  const reactions = asReactions(row.reactions);

  for (const key of Object.keys(reactions)) {
    reactions[key] = reactions[key].filter((id) => id !== userId);
    if (reactions[key].length === 0) {
      delete reactions[key];
    }
  }

  if (!reactions[reaction]) {
    reactions[reaction] = [];
  }

  reactions[reaction].push(userId);

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { reactions: reactions as Prisma.InputJsonValue },
    include: { User: true },
  });

  if (updated.authorId !== userId) {
    const reactor = await prisma.user.findUnique({ where: { id: userId } });
    await notify({
      userId: updated.authorId,
      title: 'Підтримка',
      body: `${reactor?.displayName ?? 'Хтось'} підтримав твою публікацію`,
      type: 'reaction',
    });
  }

  return enrichPost(toPost(updated), updated.User);
};

export const moderatePost = async (
  postId: string,
  status: PostStatus,
  moderator: AuthUser,
) => {
  const row = await prisma.post.findUnique({
    where: { id: postId },
    include: { User: true },
  });

  if (!row || row.schoolId !== moderator.schoolId) {
    return null;
  }

  if (moderator.role === 'teacher' && row.classId !== moderator.classId) {
    return null;
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status },
    include: { User: true },
  });

  if (status === 'published') {
    await notify({
      userId: updated.authorId,
      title: 'Твою роботу показали!',
      body: 'Учитель відкрив твою публікацію для класу',
      type: 'moderation',
    });
  }

  return enrichPost(toPost(updated), updated.User);
};

export const getPendingPosts = async (classId: string, schoolId: string) => {
  const rows = await prisma.post.findMany({
    where: { classId, schoolId, status: 'pending' },
    include: { User: true },
  });

  return rows.map((row) => enrichPost(toPost(row), row.User));
};

export const getClassOverview = async (classId: string, schoolId: string) => {
  const classRoom = await loadClass(classId);

  if (!classRoom || classRoom.schoolId !== schoolId) {
    return null;
  }

  const [teacherRow, studentRows, board, eventRows, questRows] = await Promise.all([
    prisma.user.findUnique({ where: { id: classRoom.teacherId } }),
    prisma.user.findMany({
      where: { id: { in: classRoom.studentIds } },
    }),
    getClassBoard(classId, schoolId),
    prisma.classEvent.findMany({ where: { classId } }),
    prisma.quest.findMany({ where: { classId } }),
  ]);

  const students = studentRows.map((row) => toPublicUser(toUser(row)));
  const events = await Promise.all(eventRows.map((row) => enrichEvent(toEvent(row))));

  return {
    class: classRoom,
    teacher: teacherRow ? toPublicUser(toUser(teacherRow)) : null,
    students,
    board,
    events,
    quests: questRows.map(toQuest),
    goal: {
      title: classRoom.goalTitle,
      current: classRoom.goalCurrentXp,
      target: classRoom.goalTargetXp,
    },
  };
};
