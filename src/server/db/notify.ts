import { prisma } from './prisma';
import { createId } from '../helpers/response';

export const notify = async (payload: {
  userId: string;
  title: string;
  body: string;
  type: string;
}) => {
  await prisma.notification.create({
    data: {
      id: createId('notif'),
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      read: false,
    },
  });
};

export const notifyMany = async (
  userIds: string[],
  payload: { title: string; body: string; type: string },
) => {
  if (userIds.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      id: createId('notif'),
      userId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      read: false,
    })),
  });
};

export const studentIdsOf = async (classId: string): Promise<string[]> => {
  const members = await prisma.classMembership.findMany({
    where: { classId },
    select: { studentId: true },
  });
  return members.map((item) => item.studentId);
};
