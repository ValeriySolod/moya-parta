import path from 'path';
import dotenv from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';
import { db } from '../src/server/data/seed';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const asJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

const gradeFromClassName = (name: string): number => {
  const match = name.match(/\d+/);
  return match ? Number(match[0]) : 1;
};

async function seedCore() {
  for (const school of db.schools) {
    await prisma.school.upsert({
      where: { id: school.id },
      create: school,
      update: { name: school.name },
    });
  }

  for (const user of db.users) {
    const data = {
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      schoolId: user.schoolId,
      avatarColor: user.avatarColor,
      avatarEmoji: user.avatarEmoji,
    };

    await prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, ...data },
      update: data,
    });
  }

  for (const classRoom of db.classes) {
    const data = {
      schoolId: classRoom.schoolId,
      name: classRoom.name,
      grade: gradeFromClassName(classRoom.name),
      teacherId: classRoom.teacherId,
      inviteCode: classRoom.inviteCode,
      goalTargetXp: classRoom.goalTargetXp,
      goalCurrentXp: classRoom.goalCurrentXp,
      goalTitle: classRoom.goalTitle,
    };

    await prisma.classRoom.upsert({
      where: { id: classRoom.id },
      create: { id: classRoom.id, ...data },
      update: data,
    });

    await prisma.user.update({
      where: { id: classRoom.teacherId },
      data: { classId: classRoom.id },
    });

    for (const studentId of classRoom.studentIds) {
      await prisma.user.update({
        where: { id: studentId },
        data: { classId: classRoom.id },
      });

      await prisma.classMembership.upsert({
        where: {
          classId_studentId: { classId: classRoom.id, studentId },
        },
        create: {
          id: `cm-${classRoom.id}-${studentId}`,
          classId: classRoom.id,
          studentId,
        },
        update: {},
      });
    }
  }

  for (const profile of db.studentProfiles) {
    const data = {
      level: profile.level,
      xp: profile.xp,
      xpToNextLevel: profile.xpToNextLevel,
      unlockedItems: asJson(profile.unlockedItems),
      onboardingCompleted: profile.onboardingCompleted,
    };

    await prisma.studentProfile.upsert({
      where: { userId: profile.userId },
      create: { userId: profile.userId, ...data },
      update: data,
    });
  }
}

async function seedCatalog() {
  for (const item of db.backpackItems) {
    await prisma.backpackItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        title: item.title,
        category: item.category,
        icon: item.icon,
        unlocked: item.unlocked,
      },
      update: {
        title: item.title,
        category: item.category,
        icon: item.icon,
        unlocked: item.unlocked,
      },
    });
  }

  for (const achievement of db.achievements) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      create: achievement,
      update: {
        title: achievement.title,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        hidden: achievement.hidden,
      },
    });
  }

  for (const template of db.quizTemplates) {
    const data = {
      subject: template.subject,
      title: template.title,
      description: template.description,
      xpReward: template.xpReward,
      questions: asJson(template.questions),
    };

    await prisma.quizTemplate.upsert({
      where: { id: template.id },
      create: { id: template.id, ...data },
      update: data,
    });
  }
}

async function seedLearning() {
  for (const quiz of db.quizzes) {
    const data = {
      classId: quiz.classId,
      subject: quiz.subject,
      title: quiz.title,
      xpReward: quiz.xpReward,
      questions: asJson(quiz.questions),
      templateId: quiz.templateId ?? null,
    };

    await prisma.quiz.upsert({
      where: { id: quiz.id },
      create: { id: quiz.id, ...data },
      update: data,
    });
  }

  for (const homework of db.homeworks) {
    const due = new Date(homework.dueDate);
    const data = {
      classId: homework.classId,
      subject: homework.subject,
      title: homework.title,
      description: homework.description,
      dueDate: due,
      startsAt: due,
      endsAt: due,
      xpReward: homework.xpReward,
      createdBy: homework.createdBy,
      linkedQuizId: homework.linkedQuizId ?? null,
    };

    await prisma.homework.upsert({
      where: { id: homework.id },
      create: { id: homework.id, ...data },
      update: data,
    });
  }

  for (const submission of db.homeworkSubmissions) {
    const data = {
      homeworkId: submission.homeworkId,
      studentId: submission.studentId,
      status: submission.status,
      answer: submission.answer ?? null,
      teacherComment: submission.teacherComment ?? null,
      submittedAt: submission.submittedAt
        ? new Date(submission.submittedAt)
        : null,
      reviewedAt: submission.reviewedAt
        ? new Date(submission.reviewedAt)
        : null,
    };

    await prisma.homeworkSubmission.upsert({
      where: { id: submission.id },
      create: { id: submission.id, ...data },
      update: data,
    });
  }

  for (const quest of db.quests) {
    const data = {
      classId: quest.classId,
      title: quest.title,
      description: quest.description,
      illustration: quest.illustration,
      xpReward: quest.xpReward,
      totalSteps: quest.totalSteps,
    };

    await prisma.quest.upsert({
      where: { id: quest.id },
      create: { id: quest.id, ...data },
      update: data,
    });
  }

  for (const progress of db.questProgress) {
    await prisma.questProgress.upsert({
      where: {
        questId_studentId: {
          questId: progress.questId,
          studentId: progress.studentId,
        },
      },
      create: {
        id: `qp-${progress.questId}-${progress.studentId}`,
        questId: progress.questId,
        studentId: progress.studentId,
        currentStep: progress.currentStep,
        completed: progress.completed,
      },
      update: {
        currentStep: progress.currentStep,
        completed: progress.completed,
      },
    });
  }

  for (const unlock of db.studentAchievements) {
    await prisma.studentAchievement.upsert({
      where: {
        studentId_achievementId: {
          studentId: unlock.studentId,
          achievementId: unlock.achievementId,
        },
      },
      create: {
        id: `sa-${unlock.studentId}-${unlock.achievementId}`,
        studentId: unlock.studentId,
        achievementId: unlock.achievementId,
        unlockedAt: new Date(unlock.unlockedAt),
      },
      update: { unlockedAt: new Date(unlock.unlockedAt) },
    });
  }
}

async function seedSocial() {
  for (const post of db.posts) {
    const data = {
      authorId: post.authorId,
      classId: post.classId,
      schoolId: post.schoolId,
      text: post.text,
      imageEmoji: post.imageEmoji ?? null,
      category: post.category ?? null,
      status: post.status,
      createdAt: new Date(post.createdAt),
      reactions: asJson(post.reactions),
    };

    await prisma.post.upsert({
      where: { id: post.id },
      create: { id: post.id, ...data },
      update: data,
    });
  }

  for (const event of db.events) {
    const data = {
      classId: event.classId,
      title: event.title,
      description: event.description,
      date: new Date(event.startsAt),
      startsAt: new Date(event.startsAt),
      endsAt: new Date(event.endsAt),
      participantIds: asJson(event.participantIds),
      progress: event.progress,
      materials: asJson(event.materials),
      reviewComment: event.reviewComment ?? null,
      reviewedAt: event.reviewedAt ? new Date(event.reviewedAt) : null,
      publishedPostId: event.publishedPostId ?? null,
    };

    await prisma.classEvent.upsert({
      where: { id: event.id },
      create: { id: event.id, ...data },
      update: data,
    });
  }

  for (const item of db.notifications) {
    const data = {
      userId: item.userId,
      title: item.title,
      body: item.body,
      read: item.read,
      type: item.type,
      createdAt: new Date(item.createdAt),
    };

    await prisma.notification.upsert({
      where: { id: item.id },
      create: { id: item.id, ...data },
      update: data,
    });
  }

  for (const item of db.xpTransactions) {
    const data = {
      studentId: item.studentId,
      amount: item.amount,
      reason: item.reason,
      createdAt: new Date(item.createdAt),
    };

    await prisma.xpTransaction.upsert({
      where: { id: item.id },
      create: { id: item.id, ...data },
      update: data,
    });
  }

  for (const item of db.learningMaterials) {
    const data = {
      classId: item.classId,
      subject: item.subject,
      title: item.title,
      summary: item.summary,
      missedLesson: item.missedLesson,
    };

    await prisma.learningMaterial.upsert({
      where: { id: item.id },
      create: { id: item.id, ...data },
      update: data,
    });
  }

  for (const message of db.chatMessages) {
    const data = {
      classId: message.classId,
      schoolId: message.schoolId,
      kind: message.kind,
      senderId: message.senderId,
      recipientId: message.recipientId,
      text: message.text,
      createdAt: new Date(message.createdAt),
    };

    await prisma.chatMessage.upsert({
      where: { id: message.id },
      create: { id: message.id, ...data },
      update: data,
    });
  }

  for (const [userId, sections] of Object.entries(db.navSeen)) {
    for (const [section, seenAt] of Object.entries(sections)) {
      if (!seenAt) {
        continue;
      }

      await prisma.navSeen.upsert({
        where: {
          userId_section: { userId, section },
        },
        create: {
          id: `nav-${userId}-${section}`,
          userId,
          section,
          seenAt: new Date(seenAt),
        },
        update: { seenAt: new Date(seenAt) },
      });
    }
  }
}

async function main() {
  console.log(
    '[seed] Upsert demo records only (school-12 / 3B-DEMO). Other rows are left intact.',
  );

  await seedCore();
  await seedCatalog();
  await seedLearning();
  await seedSocial();

  const [users, classes, posts, messages] = await Promise.all([
    prisma.user.count(),
    prisma.classRoom.count(),
    prisma.post.count(),
    prisma.chatMessage.count(),
  ]);

  const demoTeacher = await prisma.user.findUnique({
    where: { email: 'teacher@example.com' },
    select: { id: true, classId: true },
  });

  if (!demoTeacher?.classId) {
    throw new Error('Demo teacher was not linked to a class');
  }

  console.log(
    `[seed] ready — users=${users} classes=${classes} posts=${posts} chat=${messages}`,
  );
}

main()
  .catch((error) => {
    console.error('[seed] failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
