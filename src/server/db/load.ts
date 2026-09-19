import { toClassRoom, toUser } from './map';
import { studentIdsOf } from './notify';
import { prisma } from './prisma';

export const loadClass = async (classId: string) => {
  const row = await prisma.classRoom.findUnique({ where: { id: classId } });
  if (!row) {
    return null;
  }

  const studentIds = await studentIdsOf(classId);
  return toClassRoom(row, studentIds);
};

export const loadUser = async (id: string) => {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toUser(row) : null;
};
