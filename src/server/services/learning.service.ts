import type { Prisma } from '@prisma/client';
import { prisma, notify, notifyMany, studentIdsOf } from '../db';
import {
  toEvent,
  toHomework,
  toMaterial,
  toQuest,
  toQuestProgress,
  toQuiz,
  toQuizTemplate,
  toSubmission,
} from '../db/map';
import { createId } from '../helpers/response';
import { enrichEvent, getEventLifecycle } from '../helpers/events';
import { addXp } from './student.service';
import type { AuthUser, Homework, Quiz } from '../types';

export const getLearningForStudent = async (
  studentId: string,
  classId: string,
) => {
  const [homeworkRows, submissionRows, quizRows, questRows, progressRows, materialRows] =
    await Promise.all([
      prisma.homework.findMany({ where: { classId } }),
      prisma.homeworkSubmission.findMany({ where: { studentId } }),
      prisma.quiz.findMany({ where: { classId } }),
      prisma.quest.findMany({ where: { classId } }),
      prisma.questProgress.findMany({ where: { studentId } }),
      prisma.learningMaterial.findMany({ where: { classId } }),
    ]);

  const submissionByHomework = new Map(
    submissionRows.map((row) => [row.homeworkId, toSubmission(row)]),
  );
  const progressByQuest = new Map(
    progressRows.map((row) => [row.questId, toQuestProgress(row)]),
  );

  const homework = homeworkRows.map((row) => {
    const hw = toHomework(row);
    const submission = submissionByHomework.get(hw.id);
    const due = new Date(hw.dueDate).getTime();
    const now = Date.now();
    let bucket: 'today' | 'waiting' | 'later' | 'done' = 'later';

    if (submission?.status === 'revise') {
      bucket = 'waiting';
    } else if (submission && submission.status !== 'new') {
      bucket = 'done';
    } else if (due < now) {
      bucket = 'waiting';
    } else if (due - now < 1000 * 60 * 60 * 24) {
      bucket = 'today';
    }

    return {
      ...hw,
      status: submission?.status ?? 'new',
      teacherComment: submission?.teacherComment,
      bucket,
      linkedQuizId: hw.linkedQuizId,
    };
  });

  const quests = questRows.map((row) => {
    const quest = toQuest(row);
    const progress = progressByQuest.get(quest.id);
    return {
      ...quest,
      currentStep: progress?.currentStep ?? 0,
      completed: progress?.completed ?? false,
    };
  });

  return {
    homework,
    quizzes: quizRows.map(toQuiz),
    quests,
    materials: materialRows.map(toMaterial),
  };
};

export const submitHomework = async (
  homeworkId: string,
  studentId: string,
  answer: string,
) => {
  const homeworkRow = await prisma.homework.findUnique({
    where: { id: homeworkId },
  });

  if (!homeworkRow) {
    return null;
  }

  const homework = toHomework(homeworkRow);
  const existing = await prisma.homeworkSubmission.findUnique({
    where: {
      homeworkId_studentId: { homeworkId, studentId },
    },
  });

  if (!existing) {
    const created = await prisma.homeworkSubmission.create({
      data: {
        id: createId('sub'),
        homeworkId,
        studentId,
        status: 'checking',
        answer,
        submittedAt: new Date(),
      },
    });
    const profile = await addXp(
      studentId,
      homework.xpReward,
      `Завдання: ${homework.title}`,
    );

    await notify({
      userId: homework.createdBy,
      title: 'Нова робота',
      body: 'Учень надіслав роботу на перевірку',
      type: 'homework',
    });

    return {
      submission: toSubmission(created),
      xpEarned: homework.xpReward,
      profile,
      message: `Готово! +${homework.xpReward} XP`,
    };
  }

  const updated = await prisma.homeworkSubmission.update({
    where: { id: existing.id },
    data: {
      status: 'checking',
      answer,
      submittedAt: new Date(),
      teacherComment: null,
    },
  });

  await notify({
    userId: homework.createdBy,
    title: 'Роботу оновлено',
    body: 'Учень надіслав роботу знову',
    type: 'homework',
  });

  return {
    submission: toSubmission(updated),
    xpEarned: 0,
    profile: null,
    message: 'Надіслано на перевірку!',
  };
};

export const getQuizById = async (quizId: string): Promise<Quiz | null> => {
  const row = await prisma.quiz.findUnique({ where: { id: quizId } });
  return row ? toQuiz(row) : null;
};

export const submitQuizAttempt = async (
  quizId: string,
  studentId: string,
  answers: number[],
) => {
  const quizRow = await prisma.quiz.findUnique({ where: { id: quizId } });

  if (!quizRow) {
    return null;
  }

  const quiz = toQuiz(quizRow);
  let score = 0;
  const review = quiz.questions.map((question, index) => {
    const selected = answers[index] ?? -1;
    const isCorrect = selected === question.correctIndex;
    if (isCorrect) {
      score += 1;
    }
    return {
      questionId: question.id,
      text: question.text,
      selected,
      correctIndex: question.correctIndex,
      isCorrect,
      options: question.options,
    };
  });

  const ratio = score / quiz.questions.length;
  const xpEarned = Math.round(quiz.xpReward * Math.max(ratio, 0.3));
  const profile = await addXp(studentId, xpEarned, `Тест: ${quiz.title}`);

  const created = await prisma.quizAttempt.create({
    data: {
      id: createId('attempt'),
      quizId,
      studentId,
      answers: answers as Prisma.InputJsonValue,
      score,
      total: quiz.questions.length,
      xpEarned,
    },
  });

  return {
    attempt: {
      id: created.id,
      quizId: created.quizId,
      studentId: created.studentId,
      answers,
      score: created.score,
      total: created.total,
      xpEarned: created.xpEarned,
      completedAt: created.completedAt.toISOString(),
    },
    review,
    profile,
    message: 'Ти завершив тест!',
  };
};

export const advanceQuest = async (questId: string, studentId: string) => {
  const questRow = await prisma.quest.findUnique({ where: { id: questId } });

  if (!questRow) {
    return null;
  }

  const quest = toQuest(questRow);
  let progressRow = await prisma.questProgress.findUnique({
    where: { questId_studentId: { questId, studentId } },
  });

  if (!progressRow) {
    progressRow = await prisma.questProgress.create({
      data: {
        id: createId('qp'),
        questId,
        studentId,
        currentStep: 0,
        completed: false,
      },
    });
  }

  const progress = toQuestProgress(progressRow);

  if (progress.completed) {
    return { quest, progress, xpEarned: 0, profile: null };
  }

  progress.currentStep += 1;

  if (progress.currentStep >= quest.totalSteps) {
    progress.completed = true;
    progress.currentStep = quest.totalSteps;
    const updated = await prisma.questProgress.update({
      where: { id: progressRow.id },
      data: {
        currentStep: progress.currentStep,
        completed: true,
      },
    });
    const profile = await addXp(studentId, quest.xpReward, `Квест: ${quest.title}`);
    return {
      quest,
      progress: toQuestProgress(updated),
      xpEarned: quest.xpReward,
      profile,
      message: `Квест завершено! +${quest.xpReward} XP`,
    };
  }

  const updated = await prisma.questProgress.update({
    where: { id: progressRow.id },
    data: { currentStep: progress.currentStep },
  });

  return {
    quest,
    progress: toQuestProgress(updated),
    xpEarned: 0,
    profile: null,
    message: 'Ще один маленький крок!',
  };
};

export const getAchievementsForStudent = async (studentId: string) => {
  const [achievements, unlockedRows] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.studentAchievement.findMany({ where: { studentId } }),
  ]);

  const unlockedAtById = new Map(
    unlockedRows.map((item) => [item.achievementId, item.unlockedAt.toISOString()]),
  );

  return achievements.map((achievement) => {
    const unlockedAt = unlockedAtById.get(achievement.id);
    const isUnlocked = unlockedAt !== undefined;
    return {
      ...achievement,
      title: achievement.hidden && !isUnlocked ? '???' : achievement.title,
      description:
        achievement.hidden && !isUnlocked
          ? 'Секретна перемога. Ще трохи — і відкриється!'
          : achievement.description,
      icon: achievement.hidden && !isUnlocked ? '🔒' : achievement.icon,
      unlocked: isUnlocked,
      unlockedAt,
    };
  });
};

export const joinEvent = async (eventId: string, studentId: string) => {
  const row = await prisma.classEvent.findUnique({ where: { id: eventId } });

  if (!row) {
    return null;
  }

  const event = toEvent(row);
  const lifecycle = getEventLifecycle(event);
  if (lifecycle === 'ended' || lifecycle === 'published') {
    throw new Error('EVENT_ENDED');
  }

  if (!event.participantIds.includes(studentId)) {
    event.participantIds.push(studentId);
    event.progress = Math.min(100, event.progress + 10);
    const updated = await prisma.classEvent.update({
      where: { id: eventId },
      data: {
        participantIds: event.participantIds as Prisma.InputJsonValue,
        progress: event.progress,
      },
    });
    await addXp(studentId, 10, `Подія: ${event.title}`);
    return enrichEvent(toEvent(updated));
  }

  return enrichEvent(event);
};

export const getEvents = async (classId: string) => {
  const rows = await prisma.classEvent.findMany({
    where: { classId },
    orderBy: { startsAt: 'asc' },
  });

  return Promise.all(rows.map((row) => enrichEvent(toEvent(row))));
};

export const createHomework = async (
  teacher: AuthUser,
  payload: Omit<Homework, 'id' | 'classId' | 'createdBy'>,
) => {
  if (!teacher.classId) {
    throw new Error('NO_CLASS');
  }

  const dueDate = new Date(payload.dueDate);
  const row = await prisma.homework.create({
    data: {
      id: createId('hw'),
      classId: teacher.classId,
      createdBy: teacher.id,
      subject: payload.subject,
      title: payload.title,
      description: payload.description,
      dueDate,
      startsAt: dueDate,
      endsAt: dueDate,
      xpReward: payload.xpReward,
      linkedQuizId: payload.linkedQuizId ?? null,
    },
  });

  const homework = toHomework(row);
  await notifyMany(await studentIdsOf(teacher.classId), {
    title: 'Нове завдання',
    body: `Учитель додав: ${homework.title}`,
    type: 'homework',
  });

  return homework;
};

export const deleteHomework = async (homeworkId: string, teacher: AuthUser) => {
  const row = await prisma.homework.findFirst({
    where: { id: homeworkId, classId: teacher.classId ?? '' },
  });

  if (!row) {
    return null;
  }

  await prisma.homework.delete({ where: { id: row.id } });
  return toHomework(row);
};

export const getQuizTemplates = async (subject?: string) => {
  const rows = await prisma.quizTemplate.findMany({
    where: subject ? { subject } : undefined,
  });

  return rows.map(toQuizTemplate);
};

export const assignQuizFromTemplate = async (
  teacher: AuthUser,
  templateId: string,
) => {
  if (!teacher.classId) {
    throw new Error('NO_CLASS');
  }

  const templateRow = await prisma.quizTemplate.findUnique({
    where: { id: templateId },
  });

  if (!templateRow) {
    return null;
  }

  const template = toQuizTemplate(templateRow);
  const questions = template.questions.map((question) => ({
    ...question,
    id: createId('q'),
  }));

  const row = await prisma.quiz.create({
    data: {
      id: createId('quiz'),
      classId: teacher.classId,
      subject: template.subject,
      title: template.title,
      xpReward: template.xpReward,
      templateId: template.id,
      questions: questions as Prisma.InputJsonValue,
    },
  });

  const quiz = toQuiz(row);
  await notifyMany(await studentIdsOf(teacher.classId), {
    title: 'Новий тест',
    body: `Учитель додав тест: ${quiz.title}`,
    type: 'quiz',
  });

  return quiz;
};

export const createClassQuiz = async (
  teacher: AuthUser,
  payload: {
    subject: Homework['subject'];
    title: string;
    xpReward: number;
    questions: Array<{
      text: string;
      options: string[];
      correctIndex: number;
    }>;
  },
) => {
  if (!teacher.classId) {
    throw new Error('NO_CLASS');
  }

  const questions = payload.questions.map((question) => ({
    id: createId('q'),
    ...question,
  }));

  const row = await prisma.quiz.create({
    data: {
      id: createId('quiz'),
      classId: teacher.classId,
      subject: payload.subject,
      title: payload.title,
      xpReward: payload.xpReward,
      questions: questions as Prisma.InputJsonValue,
    },
  });

  const quiz = toQuiz(row);
  await notifyMany(await studentIdsOf(teacher.classId), {
    title: 'Новий тест',
    body: `Учитель додав тест: ${quiz.title}`,
    type: 'quiz',
  });

  return quiz;
};

export const deleteQuiz = async (quizId: string, teacher: AuthUser) => {
  const row = await prisma.quiz.findFirst({
    where: { id: quizId, classId: teacher.classId ?? '' },
  });

  if (!row) {
    return null;
  }

  await prisma.quiz.delete({ where: { id: row.id } });
  return toQuiz(row);
};

export const getClassQuizzes = async (classId: string) => {
  const rows = await prisma.quiz.findMany({ where: { classId } });
  return rows.map(toQuiz);
};

export const reviewSubmission = async (
  submissionId: string,
  teacher: AuthUser,
  payload: {
    decision: 'accept' | 'revise' | 'redo_test';
    comment: string;
  },
) => {
  const submissionRow = await prisma.homeworkSubmission.findUnique({
    where: { id: submissionId },
    include: { Homework: true },
  });

  if (!submissionRow) {
    return null;
  }

  const homework = toHomework(submissionRow.Homework);

  if (homework.classId !== teacher.classId) {
    return null;
  }

  const comment = payload.comment.trim();
  const reviewedAt = new Date();
  const status =
    payload.decision === 'accept' ? 'reviewed' : 'revise';

  if (payload.decision === 'redo_test' && homework.linkedQuizId) {
    await prisma.quizAttempt.deleteMany({
      where: {
        quizId: homework.linkedQuizId,
        studentId: submissionRow.studentId,
      },
    });
  }

  const updated = await prisma.homeworkSubmission.update({
    where: { id: submissionRow.id },
    data: {
      teacherComment: comment,
      reviewedAt,
      status,
    },
  });

  if (payload.decision === 'accept') {
    await notify({
      userId: submissionRow.studentId,
      title: 'Роботу прийнято',
      body: comment || `Учитель прийняв «${homework.title}»`,
      type: 'homework',
    });
  } else if (payload.decision === 'revise') {
    await notify({
      userId: submissionRow.studentId,
      title: 'Потрібно доробити',
      body: comment || `Подивись коментар і дороби «${homework.title}»`,
      type: 'homework',
    });
  } else {
    await notify({
      userId: submissionRow.studentId,
      title: 'Пройди тест ще раз',
      body: comment || `Учитель просить переробити тест до «${homework.title}»`,
      type: 'quiz',
    });
  }

  return toSubmission(updated);
};

export const deleteEvent = async (eventId: string, teacher: AuthUser) => {
  const row = await prisma.classEvent.findFirst({
    where: { id: eventId, classId: teacher.classId ?? '' },
  });

  if (!row) {
    return null;
  }

  await prisma.classEvent.delete({ where: { id: row.id } });
  return toEvent(row);
};
