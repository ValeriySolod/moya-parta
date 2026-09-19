import { prisma } from '../db';
import { toNotification } from '../db/map';

export const getNotifications = async (userId: string) => {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map(toNotification);
};

export const markNotificationRead = async (notificationId: string, userId: string) => {
  const row = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!row) {
    return null;
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  return toNotification(updated);
};

export const markAllRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return getNotifications(userId);
};
