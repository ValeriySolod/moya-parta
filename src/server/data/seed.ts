import bcrypt from 'bcryptjs';
import type {
  Achievement,
  BackpackItem,
  ChatMessage,
  ClassEvent,
  ClassRoom,
  Homework,
  HomeworkSubmission,
  LearningMaterial,
  NotificationItem,
  Post,
  Quest,
  QuestProgress,
  Quiz,
  QuizAttempt,
  QuizTemplate,
  School,
  StudentAchievement,
  StudentProfile,
  User,
  XPTransaction,
} from '../types';

const passwordHash = bcrypt.hashSync('demo1234', 8);

export const schools: School[] = [
  { id: 'school-12', name: 'Школа №12' },
];

export const users: User[] = [
  {
    id: 'user-teacher',
    email: 'teacher@example.com',
    passwordHash,
    role: 'teacher',
    firstName: 'Олена',
    lastName: 'Іванівна',
    displayName: 'Олена Іванівна',
    schoolId: 'school-12',
    classId: 'class-3b',
    avatarColor: '#7BC6A4',
    avatarEmoji: '👩‍🏫',
  },
  {
    id: 'user-mariyka',
    email: 'student@example.com',
    passwordHash,
    role: 'student',
    firstName: 'Марійка',
    lastName: 'Коваленко',
    displayName: 'Марійка',
    schoolId: 'school-12',
    classId: 'class-3b',
    avatarColor: '#E9A6B8',
    avatarEmoji: '🦊',
  },
  {
    id: 'user-andriy',
    email: 'andriy@example.com',
    passwordHash,
    role: 'student',
    firstName: 'Андрій',
    lastName: 'Шевченко',
    displayName: 'Андрій',
    schoolId: 'school-12',
    classId: 'class-3b',
    avatarColor: '#B8DDF5',
    avatarEmoji: '🐻',
  },
  {
    id: 'user-sofiya',
    email: 'sofiya@example.com',
    passwordHash,
    role: 'student',
    firstName: 'Софійка',
    lastName: 'Мельник',
    displayName: 'Софійка',
    schoolId: 'school-12',
    classId: 'class-3b',
    avatarColor: '#C9B8EA',
    avatarEmoji: '🐰',
  },
  {
    id: 'user-maksym',
    email: 'maksym@example.com',
    passwordHash,
    role: 'student',
    firstName: 'Максим',
    lastName: 'Бондар',
    displayName: 'Максим',
    schoolId: 'school-12',
    classId: 'class-3b',
    avatarColor: '#F4C95D',
    avatarEmoji: '🐯',
  },
  {
    id: 'user-danylo',
    email: 'danylo@example.com',
    passwordHash,
    role: 'student',
    firstName: 'Данило',
    lastName: 'Ткаченко',
    displayName: 'Данило',
    schoolId: 'school-12',
    classId: 'class-3b',
    avatarColor: '#7BC6A4',
    avatarEmoji: '🐸',
  },
];

export const classes: ClassRoom[] = [
  {
    id: 'class-3b',
    schoolId: 'school-12',
    name: '3-Б',
    teacherId: 'user-teacher',
    inviteCode: '3B-DEMO',
    studentIds: [
      'user-mariyka',
      'user-andriy',
      'user-sofiya',
      'user-maksym',
      'user-danylo',
    ],
    goalTargetXp: 1000,
    goalCurrentXp: 720,
    goalTitle: 'Разом збираємо 1000 XP',
  },
];

export const studentProfiles: StudentProfile[] = [
  {
    userId: 'user-mariyka',
    level: 4,
    xp: 780,
    xpToNextLevel: 1000,
    unlockedItems: ['sticker-star', 'sticker-pencil', 'reward-badge-1', 'avatar-hat'],
    onboardingCompleted: true,
  },
  {
    userId: 'user-andriy',
    level: 3,
    xp: 420,
    xpToNextLevel: 1000,
    unlockedItems: ['sticker-star'],
    onboardingCompleted: true,
  },
  {
    userId: 'user-sofiya',
    level: 4,
    xp: 650,
    xpToNextLevel: 1000,
    unlockedItems: ['sticker-book', 'sticker-star'],
    onboardingCompleted: true,
  },
  {
    userId: 'user-maksym',
    level: 3,
    xp: 510,
    xpToNextLevel: 1000,
    unlockedItems: ['sticker-rocket'],
    onboardingCompleted: true,
  },
  {
    userId: 'user-danylo',
    level: 2,
    xp: 280,
    xpToNextLevel: 1000,
    unlockedItems: [],
    onboardingCompleted: false,
  },
];

export const posts: Post[] = [
  {
    id: 'post-1',
    authorId: 'user-andriy',
    classId: 'class-3b',
    schoolId: 'school-12',
    text: 'Я зібрав LEGO-ракету 🚀',
    imageEmoji: '🚀',
    category: 'творчість',
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    reactions: {
      '👏': ['user-mariyka', 'user-sofiya'],
      '❤️': ['user-maksym'],
      '⭐': ['user-mariyka'],
    },
  },
  {
    id: 'post-2',
    authorId: 'user-mariyka',
    classId: 'class-3b',
    schoolId: 'school-12',
    text: 'На вихідних я ходила у ліс з родиною 🌳',
    imageEmoji: '🌳',
    category: 'пригода',
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    reactions: {
      '😊': ['user-andriy', 'user-sofiya', 'user-danylo'],
      '🎉': ['user-maksym'],
    },
  },
  {
    id: 'post-3',
    authorId: 'user-sofiya',
    classId: 'class-3b',
    schoolId: 'school-12',
    text: 'Прочитала нову книгу про космос 📚',
    imageEmoji: '📚',
    category: 'читання',
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    reactions: {
      '👍': ['user-mariyka'],
      '⭐': ['user-andriy'],
    },
  },
  {
    id: 'post-4',
    authorId: 'user-maksym',
    classId: 'class-3b',
    schoolId: 'school-12',
    text: 'Познайомтеся з моїм песиком 🐶',
    imageEmoji: '🐶',
    category: 'друзі',
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
    reactions: {
      '❤️': ['user-mariyka', 'user-sofiya', 'user-andriy', 'user-danylo'],
    },
  },
  {
    id: 'post-5',
    authorId: 'user-danylo',
    classId: 'class-3b',
    schoolId: 'school-12',
    text: 'Я намалював картину 🎨',
    imageEmoji: '🎨',
    category: 'творчість',
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    reactions: {},
  },
];

export const homeworks: Homework[] = [
  {
    id: 'hw-1',
    classId: 'class-3b',
    subject: 'math',
    title: 'Дроби',
    description: 'Розвʼяжи 5 прикладів із дробами у зошиті.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    xpReward: 20,
    createdBy: 'user-teacher',
    linkedQuizId: 'quiz-1',
  },
  {
    id: 'hw-2',
    classId: 'class-3b',
    subject: 'reading',
    title: 'Читаємо казку',
    description: 'Прочитай 2 сторінки та намалюй улюбленого героя.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    xpReward: 15,
    createdBy: 'user-teacher',
  },
  {
    id: 'hw-3',
    classId: 'class-3b',
    subject: 'ukrainian',
    title: 'Слова з мʼяким знаком',
    description: 'Знайди 8 слів із мʼяким знаком у підручнику.',
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    xpReward: 15,
    createdBy: 'user-teacher',
  },
  {
    id: 'hw-4',
    classId: 'class-3b',
    subject: 'science',
    title: 'Спостерігаємо за погодою',
    description: 'Запиши, яка сьогодні погода, і намалюй її.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    xpReward: 20,
    createdBy: 'user-teacher',
  },
];

export const homeworkSubmissions: HomeworkSubmission[] = [
  {
    id: 'sub-1',
    homeworkId: 'hw-3',
    studentId: 'user-mariyka',
    status: 'reviewed',
    answer: 'Знайшла 8 слів!',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: 'sub-2',
    homeworkId: 'hw-2',
    studentId: 'user-andriy',
    status: 'checking',
    answer: 'Прочитав і намалював дракона',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'sub-3',
    homeworkId: 'hw-1',
    studentId: 'user-mariyka',
    status: 'checking',
    answer: 'Зробила 5 прикладів у зошиті',
    submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

export const quizTemplates: QuizTemplate[] = [
  {
    id: 'tpl-math-1',
    subject: 'math',
    title: 'Дружні числа',
    description: 'Прості приклади на додавання і порівняння.',
    xpReward: 30,
    questions: [
      {
        id: 'tq1',
        text: 'Скільки буде 7 + 5?',
        options: ['10', '11', '12', '13'],
        correctIndex: 2,
      },
      {
        id: 'tq2',
        text: 'Яке число більше: 45 чи 54?',
        options: ['45', '54', 'Однакові', 'Не знаю'],
        correctIndex: 1,
      },
      {
        id: 'tq3',
        text: 'Скільки сторін у квадрата?',
        options: ['3', '4', '5', '6'],
        correctIndex: 1,
      },
      {
        id: 'tq4',
        text: '10 − 4 = ?',
        options: ['5', '6', '7', '8'],
        correctIndex: 1,
      },
      {
        id: 'tq5',
        text: 'Половина від 8 — це?',
        options: ['2', '3', '4', '5'],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 'tpl-math-2',
    subject: 'math',
    title: 'Множення для сміливих',
    description: 'Короткий тест на таблицю множення.',
    xpReward: 35,
    questions: [
      {
        id: 'tm1',
        text: '2 × 5 = ?',
        options: ['7', '8', '10', '12'],
        correctIndex: 2,
      },
      {
        id: 'tm2',
        text: '3 × 3 = ?',
        options: ['6', '9', '12', '3'],
        correctIndex: 1,
      },
      {
        id: 'tm3',
        text: '4 × 2 = ?',
        options: ['6', '8', '10', '4'],
        correctIndex: 1,
      },
      {
        id: 'tm4',
        text: '5 × 5 = ?',
        options: ['10', '15', '20', '25'],
        correctIndex: 3,
      },
    ],
  },
  {
    id: 'tpl-reading-1',
    subject: 'reading',
    title: 'Казкові герої',
    description: 'Питання після читання короткої казки.',
    xpReward: 25,
    questions: [
      {
        id: 'tr1',
        text: 'Хто написав «Колобок»?',
        options: ['Народна казка', 'Шевченко', 'Франко', 'Не знаю'],
        correctIndex: 0,
      },
      {
        id: 'tr2',
        text: 'Що любить Колобок робити?',
        options: ['Спати', 'Мандрівки', 'Малювати', 'Плавати'],
        correctIndex: 1,
      },
      {
        id: 'tr3',
        text: 'Який жанр у «Колобка»?',
        options: ['Казка', 'Вірш', 'Газета', 'Рецепт'],
        correctIndex: 0,
      },
    ],
  },
];

export const quizzes: Quiz[] = [
  {
    id: 'quiz-1',
    classId: 'class-3b',
    subject: 'math',
    title: 'Дружні числа',
    xpReward: 30,
    templateId: 'tpl-math-1',
    questions: quizTemplates[0].questions,
  },
];

export const quizAttempts: QuizAttempt[] = [];

export const quests: Quest[] = [
  {
    id: 'quest-1',
    classId: 'class-3b',
    title: 'Математична експедиція',
    description:
      'Знайди всі правильні відповіді та допоможи персонажу дістатися до фінішу.',
    illustration: '🧭',
    xpReward: 50,
    totalSteps: 5,
  },
  {
    id: 'quest-2',
    classId: 'class-3b',
    title: 'Книжковий шлях',
    description: 'Прочитай три короткі історії та розкажи класу улюблену.',
    illustration: '📖',
    xpReward: 40,
    totalSteps: 3,
  },
];

export const questProgress: QuestProgress[] = [
  {
    questId: 'quest-1',
    studentId: 'user-mariyka',
    currentStep: 2,
    completed: false,
  },
  {
    questId: 'quest-2',
    studentId: 'user-mariyka',
    currentStep: 1,
    completed: false,
  },
];

export const achievements: Achievement[] = [
  {
    id: 'ach-1',
    title: 'Перший крок',
    description: 'Виконай своє перше завдання',
    category: 'навчання',
    icon: '🌱',
    hidden: false,
  },
  {
    id: 'ach-2',
    title: 'Математичний дослідник',
    description: 'Заверши 3 математичні активності',
    category: 'математика',
    icon: '🔢',
    hidden: false,
  },
  {
    id: 'ach-3',
    title: 'Книжковий мандрівник',
    description: 'Поділися прочитаною книгою',
    category: 'читання',
    icon: '📚',
    hidden: false,
  },
  {
    id: 'ach-4',
    title: 'Творець',
    description: 'Покажи класу свою творчість',
    category: 'творчість',
    icon: '🎨',
    hidden: false,
  },
  {
    id: 'ach-5',
    title: 'Друг класу',
    description: 'Підтримай роботи друзів',
    category: 'участь',
    icon: '🤝',
    hidden: false,
  },
  {
    id: 'ach-6',
    title: '7 днів разом',
    description: 'Заходь до класу 7 днів поспіль',
    category: 'участь',
    icon: '📅',
    hidden: false,
  },
  {
    id: 'ach-7',
    title: '???',
    description: 'Секретна перемога. Ще трохи — і відкриється!',
    category: 'командні',
    icon: '🔒',
    hidden: true,
  },
];

export const studentAchievements: StudentAchievement[] = [
  {
    studentId: 'user-mariyka',
    achievementId: 'ach-1',
    unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    studentId: 'user-mariyka',
    achievementId: 'ach-3',
    unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    studentId: 'user-mariyka',
    achievementId: 'ach-5',
    unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export const events: ClassEvent[] = [
  {
    id: 'event-1',
    classId: 'class-3b',
    title: 'Математичний марафон',
    description: 'Разом розвʼязуємо цікаві задачі та збираємо XP для класу.',
    startsAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    endsAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    date: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    participantIds: ['user-mariyka', 'user-andriy', 'user-sofiya'],
    progress: 100,
    materials: ['Картки з задачами', 'Фото переможців марафону'],
  },
  {
    id: 'event-2',
    classId: 'class-3b',
    title: 'День малювання',
    description: 'Створи малюнок на тему «Мій улюблений куточок».',
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60 * 3).toISOString(),
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    participantIds: ['user-sofiya', 'user-maksym'],
    progress: 20,
    materials: [],
  },
  {
    id: 'event-3',
    classId: 'class-3b',
    title: 'Читацький виклик',
    description: 'Прочитай коротку історію та поділись враженнями.',
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 7).toISOString(),
    date: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    participantIds: [],
    progress: 0,
    materials: [],
  },
];

export const notifications: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'user-mariyka',
    title: 'Нове завдання',
    body: 'Учитель додав нове завдання з математики',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    type: 'homework',
  },
  {
    id: 'notif-2',
    userId: 'user-mariyka',
    title: 'Нова перемога',
    body: 'Ти отримав нове досягнення «Друг класу»',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    type: 'achievement',
  },
  {
    id: 'notif-3',
    userId: 'user-mariyka',
    title: 'Подія класу',
    body: 'У класі нова подія — Математичний марафон',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    type: 'event',
  },
  {
    id: 'notif-4',
    userId: 'user-mariyka',
    title: 'Підтримка',
    body: 'Андрій підтримав твою публікацію',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    type: 'reaction',
  },
  {
    id: 'notif-5',
    userId: 'user-teacher',
    title: 'Нова робота',
    body: 'Андрій надіслав роботу на перевірку',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    type: 'homework',
  },
  {
    id: 'notif-6',
    userId: 'user-teacher',
    title: 'Нове повідомлення',
    body: 'Андрій надіслав повідомлення',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    type: 'chat',
  },
  {
    id: 'notif-7',
    userId: 'user-mariyka',
    title: 'Нове повідомлення',
    body: 'Софія надіслала повідомлення',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    type: 'chat',
  },
];

export const xpTransactions: XPTransaction[] = [
  {
    id: 'xp-1',
    studentId: 'user-mariyka',
    amount: 15,
    reason: 'Виконане завдання з української',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: 'xp-2',
    studentId: 'user-mariyka',
    amount: 10,
    reason: 'Підтримка друзів у класі',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export const backpackItems: BackpackItem[] = [
  {
    id: 'sticker-star',
    title: 'Зірочка',
    category: 'sticker',
    icon: '⭐',
    unlocked: true,
  },
  {
    id: 'sticker-pencil',
    title: 'Олівець',
    category: 'sticker',
    icon: '✏️',
    unlocked: true,
  },
  {
    id: 'sticker-book',
    title: 'Книжечка',
    category: 'sticker',
    icon: '📘',
    unlocked: false,
  },
  {
    id: 'sticker-rocket',
    title: 'Ракета',
    category: 'sticker',
    icon: '🚀',
    unlocked: false,
  },
  {
    id: 'reward-badge-1',
    title: 'Бейдж дослідника',
    category: 'reward',
    icon: '🏅',
    unlocked: true,
  },
  {
    id: 'reward-badge-2',
    title: 'Бейдж читача',
    category: 'reward',
    icon: '🎖️',
    unlocked: false,
  },
  {
    id: 'item-notebook',
    title: 'Чарівний зошит',
    category: 'item',
    icon: '📓',
    unlocked: false,
  },
  {
    id: 'avatar-hat',
    title: 'Шапка дослідника',
    category: 'avatar',
    icon: '🎩',
    unlocked: true,
  },
  {
    id: 'avatar-scarf',
    title: 'Шарфик',
    category: 'avatar',
    icon: '🧣',
    unlocked: false,
  },
];

export const learningMaterials: LearningMaterial[] = [
  {
    id: 'mat-1',
    classId: 'class-3b',
    subject: 'math',
    title: 'Що я пропустив? Дроби',
    summary: 'Ми вчили, як ділити ціле на рівні частини.',
    missedLesson: true,
  },
  {
    id: 'mat-2',
    classId: 'class-3b',
    subject: 'reading',
    title: 'Казка про ліс',
    summary: 'Коротка історія про дружбу звірят у лісі.',
    missedLesson: false,
  },
];

export const chatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    classId: 'class-3b',
    schoolId: 'school-12',
    kind: 'class',
    senderId: 'user-teacher',
    recipientId: null,
    text: 'Привіт, клас! Завтра математичний марафон 🎉',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'msg-2',
    classId: 'class-3b',
    schoolId: 'school-12',
    kind: 'class',
    senderId: 'user-andriy',
    recipientId: null,
    text: 'Я вже готовий!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
  },
  {
    id: 'msg-3',
    classId: 'class-3b',
    schoolId: 'school-12',
    kind: 'direct',
    senderId: 'user-mariyka',
    recipientId: 'user-sofiya',
    text: 'Хочеш разом читати казку?',
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: 'msg-4',
    classId: 'class-3b',
    schoolId: 'school-12',
    kind: 'direct',
    senderId: 'user-sofiya',
    recipientId: 'user-mariyka',
    text: 'Так! Після уроків 📚',
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: 'msg-5',
    classId: 'class-3b',
    schoolId: 'school-12',
    kind: 'direct',
    senderId: 'user-teacher',
    recipientId: 'user-mariyka',
    text: 'Марійко, гарна робота з читання!',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'msg-6',
    classId: 'class-3b',
    schoolId: 'school-12',
    kind: 'direct',
    senderId: 'user-andriy',
    recipientId: 'user-teacher',
    text: 'Учителю, я вже здав читання!',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
];

/** Коли користувач востаннє відкрив вкладку — для бейджів «нове» */
export const navSeen: Record<
  string,
  Partial<
    Record<
      | 'chat'
      | 'board'
      | 'learning'
      | 'tasks'
      | 'events'
      | 'notifications'
      | 'wins',
      string
    >
  >
> = {
  'user-mariyka': {
    board: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    chat: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  'user-teacher': {
    board: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    chat: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
};

export const db = {
  schools,
  users,
  classes,
  studentProfiles,
  posts,
  homeworks,
  homeworkSubmissions,
  quizzes,
  quizTemplates,
  quizAttempts,
  quests,
  questProgress,
  achievements,
  studentAchievements,
  events,
  notifications,
  xpTransactions,
  backpackItems,
  learningMaterials,
  chatMessages,
  navSeen,
};
