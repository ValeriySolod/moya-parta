export type UserRole = 'student' | 'teacher';

export type PostStatus = 'pending' | 'published' | 'rejected' | 'hidden';

export type HomeworkStatus =
  | 'new'
  | 'done'
  | 'checking'
  | 'reviewed'
  | 'revise';

export type Subject =
  | 'math'
  | 'ukrainian'
  | 'reading'
  | 'science'
  | 'art'
  | 'other';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  displayName: string;
  schoolId: string;
  classId?: string;
  avatarColor: string;
  avatarEmoji: string;
}

export interface School {
  id: string;
  name: string;
}

export interface ClassRoom {
  id: string;
  schoolId: string;
  name: string;
  teacherId: string;
  inviteCode: string;
  studentIds: string[];
  goalTargetXp: number;
  goalCurrentXp: number;
  goalTitle: string;
}

export interface StudentProfile {
  userId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  unlockedItems: string[];
  onboardingCompleted: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  classId: string;
  schoolId: string;
  text: string;
  imageEmoji?: string;
  category?: string;
  status: PostStatus;
  createdAt: string;
  reactions: Record<string, string[]>;
}

export interface Homework {
  id: string;
  classId: string;
  subject: Subject;
  title: string;
  description: string;
  dueDate: string;
  xpReward: number;
  createdBy: string;
  linkedQuizId?: string;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  status: HomeworkStatus;
  answer?: string;
  teacherComment?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

/** Шаблон тесту в спільній базі (ще не привʼязаний до класу) */
export interface QuizTemplate {
  id: string;
  subject: Subject;
  title: string;
  description: string;
  xpReward: number;
  questions: QuizQuestion[];
}

export interface Quiz {
  id: string;
  classId: string;
  subject: Subject;
  title: string;
  xpReward: number;
  questions: QuizQuestion[];
  templateId?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: number[];
  score: number;
  total: number;
  xpEarned: number;
  completedAt: string;
}

export interface Quest {
  id: string;
  classId: string;
  title: string;
  description: string;
  illustration: string;
  xpReward: number;
  totalSteps: number;
}

export interface QuestProgress {
  questId: string;
  studentId: string;
  currentStep: number;
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  hidden: boolean;
}

export interface StudentAchievement {
  studentId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface ClassEvent {
  id: string;
  classId: string;
  title: string;
  description: string;
  /** @deprecated use startsAt — kept briefly for migration safety */
  date?: string;
  startsAt: string;
  endsAt: string;
  participantIds: string[];
  progress: number;
  /** Короткі матеріали / підсумки події */
  materials: string[];
  reviewComment?: string;
  reviewedAt?: string;
  publishedPostId?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  type: string;
}

export interface XPTransaction {
  id: string;
  studentId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface BackpackItem {
  id: string;
  title: string;
  category: 'sticker' | 'reward' | 'item' | 'avatar';
  icon: string;
  unlocked: boolean;
}

export interface LearningMaterial {
  id: string;
  classId: string;
  subject: Subject;
  title: string;
  summary: string;
  missedLesson: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  displayName: string;
  schoolId: string;
  classId?: string;
  avatarColor: string;
  avatarEmoji: string;
}

/** class = чат усього класу; direct = особисте повідомлення */
export interface ChatMessage {
  id: string;
  classId: string;
  schoolId: string;
  kind: 'class' | 'direct';
  senderId: string;
  recipientId: string | null;
  text: string;
  createdAt: string;
}
