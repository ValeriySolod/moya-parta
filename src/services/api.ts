import { apiRequest } from '@/lib/api';
import type {
  Achievement,
  AuthUser,
  BackpackItem,
  ClassEvent,
  DeskData,
  Grade,
  Homework,
  HomeworkAnalytics,
  NotificationItem,
  Post,
  Quest,
  Quiz,
  QuizTemplate,
  StudentProfile,
} from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  registerTeacher: (payload: {
    displayName: string;
    login: string;
    password: string;
    avatarEmoji?: string;
  }) =>
    apiRequest<{ token: string; user: AuthUser }>('/auth/register/teacher', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  registerStudent: (payload: {
    inviteCode: string;
    displayName: string;
    login: string;
    password: string;
    avatarEmoji?: string;
  }) =>
    apiRequest<{ token: string; user: AuthUser }>('/auth/register/student', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getInvitePreview: (code: string) =>
    apiRequest<{
      classId: string;
      className: string;
      inviteCode: string;
      teacherName: string;
      studentsCount: number;
    }>(`/auth/invite/${encodeURIComponent(code)}`),
  me: () => apiRequest<AuthUser>('/auth/me'),
};

export const studentApi = {
  getDesk: () => apiRequest<DeskData>('/student/desk'),
  getBackpack: () => apiRequest<BackpackItem[]>('/student/backpack'),
  completeOnboarding: () =>
    apiRequest<StudentProfile>('/student/onboarding/complete', {
      method: 'POST',
    }),
  getClass: () =>
    apiRequest<{
      class: {
        id: string;
        name: string;
        goalTitle: string;
        goalCurrentXp: number;
        goalTargetXp: number;
      };
      teacher: AuthUser | null;
      students: AuthUser[];
      board: Post[];
      events: ClassEvent[];
      quests: Quest[];
      goal: { title: string; current: number; target: number };
    }>('/student/class'),
  getBoard: () => apiRequest<Post[]>('/student/board'),
  createPost: (payload: {
    text: string;
    imageEmoji?: string;
    category?: string;
  }) =>
    apiRequest<Post>('/student/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  react: (postId: string, reaction: string) =>
    apiRequest<Post>(`/student/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ reaction }),
    }),
  getLearning: () =>
    apiRequest<{
      homework: Homework[];
      quizzes: Quiz[];
      quests: Quest[];
      materials: Array<{
        id: string;
        subject: string;
        title: string;
        summary: string;
        missedLesson: boolean;
      }>;
    }>('/student/learning'),
  submitHomework: (id: string, answer: string) =>
    apiRequest<{
      message: string;
      xpEarned: number;
      profile: StudentProfile;
    }>(`/student/homework/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }),
  getQuiz: (id: string) => apiRequest<Quiz>(`/student/quizzes/${id}`),
  submitQuiz: (id: string, answers: number[]) =>
    apiRequest<{
      message: string;
      attempt: { score: number; total: number; xpEarned: number };
      review: Array<{
        questionId: string;
        text: string;
        selected: number;
        correctIndex: number;
        isCorrect: boolean;
        options: string[];
      }>;
      profile: StudentProfile;
    }>(`/student/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
  advanceQuest: (id: string) =>
    apiRequest<{
      message: string;
      xpEarned: number;
      progress: { currentStep: number; completed: boolean };
    }>(`/student/quests/${id}/advance`, { method: 'POST' }),
  getQuest: (id: string) => apiRequest<Quest>(`/student/quests/${id}`),
  answerQuest: (id: string, stepIndex: number, optionIndex: number) =>
    apiRequest<{
      correct: boolean;
      message: string;
      xpEarned: number;
      progress: { currentStep: number; completed: boolean };
      profile: StudentProfile | null;
    }>(`/student/quests/${id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ stepIndex, optionIndex }),
    }),
  getAchievements: () => apiRequest<Achievement[]>('/student/achievements'),
  getEvents: () => apiRequest<ClassEvent[]>('/student/events'),
  joinEvent: (id: string) =>
    apiRequest<ClassEvent>(`/student/events/${id}/join`, { method: 'POST' }),
};

export const teacherApi = {
  getDashboard: () =>
    apiRequest<{
      greetingName: string;
      className: string;
      hasClass: boolean;
      today: {
        newWorks: number;
        doneTasks: number;
        activeQuest: number;
        nextEventTitle: string | null;
        nextEventDate: string | null;
        nextEventEndsAt: string | null;
        pendingPosts: number;
      };
      homeworks: Homework[];
      activeHomeworks: Homework[];
      endedHomeworks: Homework[];
      checkingWorks: Array<{
        id: string;
        studentName?: string;
        homeworkTitle?: string;
        answer?: string;
        linkedQuizId?: string;
        subject?: string;
      }>;
      goal: { title: string; current: number; target: number } | null;
      recentPosts: Array<Post & { authorName: string }>;
    }>('/teacher/dashboard'),
  createHomework: (payload: {
    subject: string;
    title: string;
    description: string;
    startsAt: string;
    endsAt: string;
    xpReward: number;
    linkedQuizId?: string;
  }) =>
    apiRequest<Homework>('/teacher/homework', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteHomework: (id: string) =>
    apiRequest<Homework>(`/teacher/homework/${id}`, { method: 'DELETE' }),
  getHomeworkAnalytics: (id: string) =>
    apiRequest<HomeworkAnalytics>(`/teacher/homework/${id}/analytics`),
  reviewSubmission: (
    id: string,
    payload: {
      decision: 'accept' | 'revise' | 'redo_test';
      comment?: string;
    },
  ) =>
    apiRequest(`/teacher/submissions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getQuizTemplates: (subject?: string) =>
    apiRequest<QuizTemplate[]>(
      `/teacher/quiz-templates${subject ? `?subject=${subject}` : ''}`,
    ),
  getQuizzes: () => apiRequest<Quiz[]>('/teacher/quizzes'),
  assignQuizFromTemplate: (templateId: string) =>
    apiRequest<Quiz>('/teacher/quizzes/from-template', {
      method: 'POST',
      body: JSON.stringify({ templateId }),
    }),
  createQuiz: (payload: {
    subject: string;
    title: string;
    xpReward: number;
    questions: Array<{
      text: string;
      options: string[];
      correctIndex: number;
    }>;
  }) =>
    apiRequest<Quiz>('/teacher/quizzes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteQuiz: (id: string) =>
    apiRequest<Quiz>(`/teacher/quizzes/${id}`, { method: 'DELETE' }),
  getPendingPosts: () => apiRequest<Post[]>('/teacher/moderation/posts'),
  moderatePost: (id: string, status: 'published' | 'rejected' | 'hidden') =>
    apiRequest<Post>(`/teacher/moderation/posts/${id}`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  createQuest: (payload: {
    title: string;
    description: string;
    illustration: string;
    xpReward: number;
    totalSteps: number;
  }) =>
    apiRequest<Quest>('/teacher/quests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getEvents: () => apiRequest<ClassEvent[]>('/teacher/events'),
  createEvent: (payload: {
    title: string;
    description: string;
    startsAt: string;
    endsAt: string;
    materials?: string[];
  }) =>
    apiRequest<ClassEvent>('/teacher/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  publishEventReview: (
    id: string,
    payload: { comment: string; materials: string[] },
  ) =>
    apiRequest<{ event: ClassEvent; post: Post }>(
      `/teacher/events/${id}/publish`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),
  deleteEvent: (id: string) =>
    apiRequest<ClassEvent>(`/teacher/events/${id}`, { method: 'DELETE' }),
  createClass: (payload: { name: string; grade: Grade }) =>
    apiRequest<{
      id: string;
      name: string;
      grade: Grade;
      inviteCode: string;
    }>('/teacher/classes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getInvite: () =>
    apiRequest<{
      classId: string;
      className: string;
      inviteCode: string;
      invitePath: string;
      studentsCount: number;
    }>('/teacher/invite'),
  regenerateInvite: () =>
    apiRequest<{
      classId: string;
      className: string;
      inviteCode: string;
      invitePath: string;
      studentsCount: number;
    }>('/teacher/invite/regenerate', { method: 'POST' }),
};

export const notificationsApi = {
  list: () => apiRequest<NotificationItem[]>('/notifications'),
  markRead: (id: string) =>
    apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () =>
    apiRequest('/notifications/read-all', { method: 'POST' }),
};

export type NavSection =
  | 'chat'
  | 'board'
  | 'learning'
  | 'tasks'
  | 'events'
  | 'notifications'
  | 'wins';

export interface NavBadges {
  chat: number;
  board: number;
  learning: number;
  tasks: number;
  events: number;
  notifications: number;
  wins: number;
}

export const navApi = {
  getBadges: () => apiRequest<NavBadges>('/nav/badges'),
  markSeen: (section: NavSection) =>
    apiRequest<NavBadges>('/nav/seen', {
      method: 'POST',
      body: JSON.stringify({ section }),
    }),
};

export interface ChatMessageView {
  id: string;
  kind: 'class' | 'direct';
  senderId: string;
  recipientId: string | null;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    avatarColor: string;
    avatarEmoji: string;
    role: string;
  } | null;
}

export interface ChatContact extends AuthUser {
  lastMessage: ChatMessageView | null;
}

export const chatApi = {
  getContacts: () => apiRequest<ChatContact[]>('/chat/contacts'),
  getClassChat: () => apiRequest<ChatMessageView[]>('/chat/class'),
  sendClassMessage: (text: string) =>
    apiRequest<ChatMessageView>('/chat/class', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  getDirect: (userId: string) =>
    apiRequest<ChatMessageView[]>(`/chat/direct/${userId}`),
  sendDirect: (userId: string, text: string) =>
    apiRequest<ChatMessageView>(`/chat/direct/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};
