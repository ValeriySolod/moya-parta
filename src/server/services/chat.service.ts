import { loadClass, notify, prisma } from '../db';
import { toChat, toUser } from '../db/map';
import { createId, toPublicUser } from '../helpers/response';
import type { AuthUser, ChatMessage } from '../types';

const enrichMessage = (
  message: ChatMessage,
  sender: {
    id: string;
    displayName: string;
    avatarColor: string;
    avatarEmoji: string;
    role: string;
  } | null,
) => ({
  ...message,
  sender: sender
    ? {
        id: sender.id,
        displayName: sender.displayName,
        avatarColor: sender.avatarColor,
        avatarEmoji: sender.avatarEmoji,
        role: sender.role,
      }
    : null,
});

const assertSameClass = async (user: AuthUser, otherId: string): Promise<boolean> => {
  if (!user.classId) {
    return false;
  }

  const other = await prisma.user.findUnique({ where: { id: otherId } });

  if (!other || other.classId !== user.classId || other.schoolId !== user.schoolId) {
    return false;
  }

  return true;
};

const loadSenders = async (messages: ChatMessage[]) => {
  const ids = [...new Set(messages.map((item) => item.senderId))];
  if (ids.length === 0) {
    return new Map<string, ReturnType<typeof toUser>>();
  }

  const rows = await prisma.user.findMany({ where: { id: { in: ids } } });
  return new Map(rows.map((row) => [row.id, toUser(row)]));
};

export const getChatContacts = async (user: AuthUser) => {
  if (!user.classId) {
    return [];
  }

  const classRoom = await loadClass(user.classId);

  if (!classRoom) {
    return [];
  }

  const ids = new Set<string>([...classRoom.studentIds, classRoom.teacherId]);
  ids.delete(user.id);

  const [contacts, lastRows] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: [...ids] } } }),
    prisma.chatMessage.findMany({
      where: {
        kind: 'direct',
        classId: user.classId,
        OR: [{ senderId: user.id }, { recipientId: user.id }],
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const lastByContact = new Map<string, ChatMessage>();
  for (const row of lastRows) {
    const otherId = row.senderId === user.id ? row.recipientId : row.senderId;
    if (!otherId || lastByContact.has(otherId)) {
      continue;
    }
    lastByContact.set(otherId, toChat(row));
  }

  const lastMessages = [...lastByContact.values()];
  const senders = await loadSenders(lastMessages);

  return contacts
    .map((item) => {
      const contact = toPublicUser(toUser(item));
      const lastMessage = lastByContact.get(contact.id) ?? null;

      return {
        ...contact,
        lastMessage: lastMessage
          ? enrichMessage(lastMessage, senders.get(lastMessage.senderId) ?? null)
          : null,
      };
    })
    .sort((a, b) => {
      const aTime = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const bTime = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return bTime - aTime;
    });
};

export const getClassChat = async (user: AuthUser) => {
  if (!user.classId) {
    return [];
  }

  const rows = await prisma.chatMessage.findMany({
    where: {
      kind: 'class',
      classId: user.classId,
      schoolId: user.schoolId,
    },
    orderBy: { createdAt: 'asc' },
  });

  const messages = rows.map(toChat);
  const senders = await loadSenders(messages);

  return messages.map((message) =>
    enrichMessage(message, senders.get(message.senderId) ?? null),
  );
};

export const sendClassMessage = async (user: AuthUser, text: string) => {
  if (!user.classId) {
    throw new Error('NO_CLASS');
  }

  const row = await prisma.chatMessage.create({
    data: {
      id: createId('msg'),
      classId: user.classId,
      schoolId: user.schoolId,
      kind: 'class',
      senderId: user.id,
      recipientId: null,
      text: text.trim(),
    },
  });

  return enrichMessage(toChat(row), user);
};

export const getDirectThread = async (user: AuthUser, otherId: string) => {
  if (!(await assertSameClass(user, otherId))) {
    return null;
  }

  const rows = await prisma.chatMessage.findMany({
    where: {
      kind: 'direct',
      classId: user.classId!,
      OR: [
        { senderId: user.id, recipientId: otherId },
        { senderId: otherId, recipientId: user.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  const messages = rows.map(toChat);
  const senders = await loadSenders(messages);

  return messages.map((message) =>
    enrichMessage(message, senders.get(message.senderId) ?? null),
  );
};

export const sendDirectMessage = async (
  user: AuthUser,
  recipientId: string,
  text: string,
) => {
  if (!user.classId) {
    throw new Error('NO_CLASS');
  }

  if (!(await assertSameClass(user, recipientId))) {
    throw new Error('NOT_CLASSMATE');
  }

  const row = await prisma.chatMessage.create({
    data: {
      id: createId('msg'),
      classId: user.classId,
      schoolId: user.schoolId,
      kind: 'direct',
      senderId: user.id,
      recipientId,
      text: text.trim(),
    },
  });

  await notify({
    userId: recipientId,
    title: 'Нове повідомлення',
    body: `${user.displayName} надіслав повідомлення`,
    type: 'chat',
  });

  return enrichMessage(toChat(row), user);
};
