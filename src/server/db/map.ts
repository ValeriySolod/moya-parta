import type { Prisma } from '@prisma/client';
import type {
  Achievement,
  ChatMessage,
  ClassEvent,
  ClassRoom,
  Homework,
  HomeworkSubmission,
  LearningMaterial,
  NotificationItem,
  Post,
  PostStatus,
  Quest,
  QuestProgress,
  Quiz,
  QuizQuestion,
  QuizTemplate,
  StudentProfile,
  Subject,
  User,
  UserRole,
} from '../types';

export const iso = (value: Date | null | undefined): string | undefined =>
  value ? value.toISOString() : undefined;

export const isoRequired = (value: Date): string => value.toISOString();

export const asStringArray = (value: Prisma.JsonValue | null | undefined): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

export const asNumberArray = (value: Prisma.JsonValue | null | undefined): number[] =>
  Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number')
    : [];

export const asReactions = (
  value: Prisma.JsonValue | null | undefined,
): Record<string, string[]> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([emoji, users]) => [
      emoji,
      Array.isArray(users)
        ? users.filter((item): item is string => typeof item === 'string')
        : [],
    ]),
  );
};

export const asQuestions = (value: Prisma.JsonValue | null | undefined): QuizQuestion[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return [];
    }

    const row = item as Record<string, unknown>;
    const options = Array.isArray(row.options)
      ? row.options.filter((option): option is string => typeof option === 'string')
      : [];

    return [
      {
        id: typeof row.id === 'string' ? row.id : 'q',
        text: typeof row.text === 'string' ? row.text : '',
        options,
        correctIndex: typeof row.correctIndex === 'number' ? row.correctIndex : 0,
      },
    ];
  });
};

export const toRole = (value: string): UserRole =>
  value === 'teacher' ? 'teacher' : 'student';

export const toSubject = (value: string): Subject => {
  const allowed: Subject[] = [
    'math',
    'ukrainian',
    'reading',
    'science',
    'art',
    'other',
  ];
  return allowed.includes(value as Subject) ? (value as Subject) : 'other';
};

export const toUser = (row: {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  firstName: string;
  lastName: string;
  displayName: string;
  schoolId: string;
  classId: string | null;
  avatarColor: string;
  avatarEmoji: string;
}): User => ({
  id: row.id,
  email: row.email,
  passwordHash: row.passwordHash,
  role: toRole(row.role),
  firstName: row.firstName,
  lastName: row.lastName,
  displayName: row.displayName,
  schoolId: row.schoolId,
  classId: row.classId ?? undefined,
  avatarColor: row.avatarColor,
  avatarEmoji: row.avatarEmoji,
});

export const toClassRoom = (
  row: {
    id: string;
    schoolId: string;
    name: string;
    teacherId: string;
    inviteCode: string;
    goalTargetXp: number;
    goalCurrentXp: number;
    goalTitle: string;
  },
  studentIds: string[],
): ClassRoom => ({
  id: row.id,
  schoolId: row.schoolId,
  name: row.name,
  teacherId: row.teacherId,
  inviteCode: row.inviteCode,
  studentIds,
  goalTargetXp: row.goalTargetXp,
  goalCurrentXp: row.goalCurrentXp,
  goalTitle: row.goalTitle,
});

export const toProfile = (row: {
  userId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  unlockedItems: Prisma.JsonValue;
  onboardingCompleted: boolean;
}): StudentProfile => ({
  userId: row.userId,
  level: row.level,
  xp: row.xp,
  xpToNextLevel: row.xpToNextLevel,
  unlockedItems: asStringArray(row.unlockedItems),
  onboardingCompleted: row.onboardingCompleted,
});

export const toPost = (row: {
  id: string;
  authorId: string;
  classId: string;
  schoolId: string;
  text: string;
  imageEmoji: string | null;
  category: string | null;
  status: string;
  createdAt: Date;
  reactions: Prisma.JsonValue;
}): Post => ({
  id: row.id,
  authorId: row.authorId,
  classId: row.classId,
  schoolId: row.schoolId,
  text: row.text,
  imageEmoji: row.imageEmoji ?? undefined,
  category: row.category ?? undefined,
  status: row.status as PostStatus,
  createdAt: isoRequired(row.createdAt),
  reactions: asReactions(row.reactions),
});

export const toEvent = (row: {
  id: string;
  classId: string;
  title: string;
  description: string;
  date: Date | null;
  startsAt: Date;
  endsAt: Date;
  participantIds: Prisma.JsonValue;
  progress: number;
  materials: Prisma.JsonValue;
  reviewComment: string | null;
  reviewedAt: Date | null;
  publishedPostId: string | null;
}): ClassEvent => ({
  id: row.id,
  classId: row.classId,
  title: row.title,
  description: row.description,
  date: iso(row.date ?? row.startsAt),
  startsAt: isoRequired(row.startsAt),
  endsAt: isoRequired(row.endsAt),
  participantIds: asStringArray(row.participantIds),
  progress: row.progress,
  materials: asStringArray(row.materials),
  reviewComment: row.reviewComment ?? undefined,
  reviewedAt: iso(row.reviewedAt),
  publishedPostId: row.publishedPostId ?? undefined,
});

export const toHomework = (row: {
  id: string;
  classId: string;
  subject: string;
  title: string;
  description: string;
  dueDate: Date;
  xpReward: number;
  createdBy: string;
  linkedQuizId: string | null;
}): Homework => ({
  id: row.id,
  classId: row.classId,
  subject: toSubject(row.subject),
  title: row.title,
  description: row.description,
  dueDate: isoRequired(row.dueDate),
  xpReward: row.xpReward,
  createdBy: row.createdBy,
  linkedQuizId: row.linkedQuizId ?? undefined,
});

export const toSubmission = (row: {
  id: string;
  homeworkId: string;
  studentId: string;
  status: string;
  answer: string | null;
  teacherComment: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
}): HomeworkSubmission => ({
  id: row.id,
  homeworkId: row.homeworkId,
  studentId: row.studentId,
  status: row.status as HomeworkSubmission['status'],
  answer: row.answer ?? undefined,
  teacherComment: row.teacherComment ?? undefined,
  submittedAt: iso(row.submittedAt),
  reviewedAt: iso(row.reviewedAt),
});

export const toQuiz = (row: {
  id: string;
  classId: string;
  subject: string;
  title: string;
  xpReward: number;
  questions: Prisma.JsonValue;
  templateId: string | null;
}): Quiz => ({
  id: row.id,
  classId: row.classId,
  subject: toSubject(row.subject),
  title: row.title,
  xpReward: row.xpReward,
  questions: asQuestions(row.questions),
  templateId: row.templateId ?? undefined,
});

export const toQuizTemplate = (row: {
  id: string;
  subject: string;
  title: string;
  description: string;
  xpReward: number;
  questions: Prisma.JsonValue;
}): QuizTemplate => ({
  id: row.id,
  subject: toSubject(row.subject),
  title: row.title,
  description: row.description,
  xpReward: row.xpReward,
  questions: asQuestions(row.questions),
});

export const toQuest = (row: {
  id: string;
  classId: string;
  title: string;
  description: string;
  illustration: string;
  xpReward: number;
  totalSteps: number;
}): Quest => ({
  id: row.id,
  classId: row.classId,
  title: row.title,
  description: row.description,
  illustration: row.illustration,
  xpReward: row.xpReward,
  totalSteps: row.totalSteps,
});

export const toQuestProgress = (row: {
  questId: string;
  studentId: string;
  currentStep: number;
  completed: boolean;
}): QuestProgress => ({
  questId: row.questId,
  studentId: row.studentId,
  currentStep: row.currentStep,
  completed: row.completed,
});

export const toAchievement = (row: {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  hidden: boolean;
}): Achievement => row;

export const toNotification = (row: {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  type: string;
}): NotificationItem => ({
  id: row.id,
  userId: row.userId,
  title: row.title,
  body: row.body,
  read: row.read,
  createdAt: isoRequired(row.createdAt),
  type: row.type,
});

export const toChat = (row: {
  id: string;
  classId: string;
  schoolId: string;
  kind: string;
  senderId: string;
  recipientId: string | null;
  text: string;
  createdAt: Date;
}): ChatMessage => ({
  id: row.id,
  classId: row.classId,
  schoolId: row.schoolId,
  kind: row.kind === 'direct' ? 'direct' : 'class',
  senderId: row.senderId,
  recipientId: row.recipientId,
  text: row.text,
  createdAt: isoRequired(row.createdAt),
});

export const toMaterial = (row: {
  id: string;
  classId: string;
  subject: string;
  title: string;
  summary: string;
  missedLesson: boolean;
}): LearningMaterial => ({
  id: row.id,
  classId: row.classId,
  subject: toSubject(row.subject),
  title: row.title,
  summary: row.summary,
  missedLesson: row.missedLesson,
});
