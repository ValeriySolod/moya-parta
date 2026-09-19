export type UserRole = 'student' | 'teacher';

export type Subject =
  | 'math'
  | 'ukrainian'
  | 'reading'
  | 'science'
  | 'art'
  | 'other';

export type HomeworkStatus =
  | 'new'
  | 'done'
  | 'checking'
  | 'reviewed'
  | 'revise';

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

export interface StudentProfile {
  userId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  unlockedItems: string[];
  onboardingCompleted: boolean;
}

export interface PostAuthor {
  id: string;
  displayName: string;
  avatarColor: string;
  avatarEmoji: string;
}

export interface Post {
  id: string;
  authorId: string;
  classId: string;
  text: string;
  imageEmoji?: string;
  category?: string;
  status: string;
  createdAt: string;
  reactions: Record<string, string[]>;
  reactionCounts?: Record<string, number>;
  author?: PostAuthor | null;
}

export interface Homework {
  id: string;
  classId: string;
  subject: Subject;
  title: string;
  description: string;
  dueDate: string;
  startsAt?: string;
  endsAt?: string;
  xpReward: number;
  status?: HomeworkStatus;
  bucket?: 'today' | 'waiting' | 'later' | 'done';
  linkedQuizId?: string;
  teacherComment?: string;
  active?: boolean;
  ended?: boolean;
}

export interface HomeworkAnalytics {
  homework: Homework & {
    isQuizLinked?: boolean;
  };
  studentsTotal: number;
  participatedCount: number;
  checkingCount: number;
  participants: Array<{
    studentId: string;
    displayName: string;
    avatarEmoji: string;
    avatarColor: string;
    status: string;
    submittedAt?: string;
    answerPreview?: string;
    quizScore: number | null;
    quizTotal: number | null;
    quizPercent: number | null;
    participated: boolean;
    rank: number | null;
  }>;
  quizSummary: {
    quizId: string;
    quizTitle: string;
    questionsCount: number;
    completedCount: number;
    averagePercent: number | null;
    topScorers: Array<{
      studentId: string;
      displayName: string;
      quizPercent: number | null;
      quizScore: number | null;
      quizTotal: number | null;
      rank?: number;
    }>;
  } | null;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex?: number;
}

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

export interface QuestQuestion {
  id: string;
  text: string;
  options: string[];
}

export type Grade = 1 | 2 | 3 | 4;

export interface Quest {
  id: string;
  classId: string;
  title: string;
  description: string;
  illustration: string;
  xpReward: number;
  totalSteps: number;
  currentStep?: number;
  completed?: boolean;
  questions?: QuestQuestion[];
  /** Present only for the grade-driven math quest; the student's own class grade. */
  grade?: Grade;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  hidden: boolean;
  unlocked?: boolean;
  unlockedAt?: string;
}

export interface ClassEvent {
  id: string;
  classId: string;
  title: string;
  description: string;
  /** @deprecated use startsAt */
  date?: string;
  startsAt: string;
  endsAt: string;
  participantIds: string[];
  progress: number;
  materials?: string[];
  reviewComment?: string;
  reviewedAt?: string;
  publishedPostId?: string;
  status?: 'upcoming' | 'live' | 'ended' | 'published';
  participants?: Array<{
    id: string;
    displayName: string;
    avatarColor: string;
    avatarEmoji: string;
  }>;
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

export interface BackpackItem {
  id: string;
  title: string;
  category: 'sticker' | 'reward' | 'item' | 'avatar';
  icon: string;
  unlocked: boolean;
}

export interface DeskData {
  user: AuthUser;
  profile: StudentProfile;
  className: string;
  teacherName: string;
  todayHomework: Homework[];
  latestPosts: Post[];
  nextEvent?: ClassEvent;
  recentAchievements: Achievement[];
  classGoal: { title: string; current: number; target: number };
  dailyGoal: { title: string; xp: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: 'Математика',
  ukrainian: 'Українська мова',
  reading: 'Читання',
  science: 'Я досліджую світ',
  art: 'Мистецтво',
  other: 'Інше',
};

export const SUBJECT_ICONS: Record<Subject, string> = {
  math: '🔢',
  ukrainian: '✍️',
  reading: '📖',
  science: '🌍',
  art: '🎨',
  other: '📘',
};

export const SAFE_REACTIONS = ['❤️', '👏', '⭐', '😊', '🎉', '👍'] as const;
