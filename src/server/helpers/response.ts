export const createId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const toPublicUser = (user: {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  displayName: string;
  schoolId: string;
  classId?: string;
  avatarColor: string;
  avatarEmoji: string;
}) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  firstName: user.firstName,
  lastName: user.lastName,
  displayName: user.displayName,
  schoolId: user.schoolId,
  classId: user.classId,
  avatarColor: user.avatarColor,
  avatarEmoji: user.avatarEmoji,
});
