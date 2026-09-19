import { z } from 'zod';
import { HTTP_STATUS } from '@/server/constants';
import { fail, getAuthUser, handle, ok, readJson, requireRoles } from '@/server/http';
import * as learningService from '@/server/services/learning.service';
import * as postsService from '@/server/services/posts.service';
import * as studentService from '@/server/services/student.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path?: string[] }> };
const keyOf = (path: string[]) => path.join('/');

const createPostSchema = z.object({
  text: z.string().min(1, 'Напиши щось у публікації'),
  imageEmoji: z.string().optional(),
  category: z.string().optional(),
});

const reactionSchema = z.object({
  reaction: z.string().min(1),
});

const submitHomeworkSchema = z.object({
  answer: z.string().min(1, 'Напиши відповідь або як ти виконав завдання'),
});

const submitQuizSchema = z.object({
  answers: z.array(z.number()),
});

export async function GET(req: Request, ctx: Ctx) {
  const path = (await ctx.params).path ?? [];
  const key = keyOf(path);

  return handle(async () => {
    const user = await getAuthUser(req);

    if (key === 'desk') {
      requireRoles(user, 'student');
      const desk = await studentService.getStudentDesk(user.id);
      if (!desk) {
        return fail('Парту не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      return ok(desk);
    }

    if (key === 'backpack') {
      requireRoles(user, 'student');
      return ok(await studentService.getBackpack(user.id));
    }

    if (key === 'class') {
      requireRoles(user, 'student', 'teacher');
      if (!user.classId) {
        return fail('Клас не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      const overview = await postsService.getClassOverview(user.classId, user.schoolId);
      if (!overview) {
        return fail('Клас не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      return ok(overview);
    }

    if (key === 'board') {
      requireRoles(user, 'student');
      return ok(await postsService.getMyPosts(user.id));
    }

    if (key === 'learning') {
      requireRoles(user, 'student');
      if (!user.classId) {
        return fail('Клас не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      return ok(await learningService.getLearningForStudent(user.id, user.classId));
    }

    if (path[0] === 'quizzes' && path[1] && path.length === 2) {
      requireRoles(user, 'student');
      const quiz = await learningService.getQuizById(path[1]);
      if (!quiz) {
        return fail('Тест не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      return ok({
        ...quiz,
        questions: quiz.questions.map(({ correctIndex: _correctIndex, ...rest }) => rest),
      });
    }

    if (key === 'achievements') {
      requireRoles(user, 'student');
      return ok(await learningService.getAchievementsForStudent(user.id));
    }

    if (key === 'events') {
      requireRoles(user, 'student', 'teacher');
      if (!user.classId) {
        return fail('Клас не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      return ok(await learningService.getEvents(user.classId));
    }

    return fail('Такої сторінки немає', HTTP_STATUS.NOT_FOUND);
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const path = (await ctx.params).path ?? [];
  const key = keyOf(path);
  const body = await readJson(req);

  return handle(async () => {
    const user = await getAuthUser(req);

    if (key === 'onboarding/complete') {
      requireRoles(user, 'student');
      const profile = await studentService.completeOnboarding(user.id);
      if (!profile) {
        return fail('Профіль не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      return ok(profile);
    }

    if (key === 'posts') {
      requireRoles(user, 'student', 'teacher');
      const parsed = createPostSchema.safeParse(body);
      if (!parsed.success) {
        return fail(parsed.error.issues[0]?.message ?? 'Перевір дані');
      }
      try {
        return ok(await postsService.createPost(user, parsed.data), HTTP_STATUS.CREATED);
      } catch {
        return fail('Не вдалося поділитися', HTTP_STATUS.BAD_REQUEST);
      }
    }

    if (path[0] === 'posts' && path[2] === 'reactions' && path[1]) {
      requireRoles(user, 'student', 'teacher');
      const parsed = reactionSchema.safeParse(body);
      if (!parsed.success) {
        return fail('Обери реакцію');
      }
      try {
        const post = await postsService.reactToPost(path[1], user.id, parsed.data.reaction);
        if (!post) {
          return fail('Публікацію не знайдено', HTTP_STATUS.NOT_FOUND);
        }
        return ok(post);
      } catch {
        return fail('Цю реакцію не можна використати');
      }
    }

    if (path[0] === 'homework' && path[2] === 'submit' && path[1]) {
      requireRoles(user, 'student');
      const parsed = submitHomeworkSchema.safeParse(body);
      if (!parsed.success) {
        return fail(parsed.error.issues[0]?.message ?? 'Перевір дані');
      }
      const result = await learningService.submitHomework(path[1], user.id, parsed.data.answer);
      if (!result) {
        return fail('Завдання не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      return ok(result);
    }

    if (path[0] === 'quizzes' && path[2] === 'submit' && path[1]) {
      requireRoles(user, 'student');
      const parsed = submitQuizSchema.safeParse(body);
      if (!parsed.success) {
        return fail('Обери відповіді');
      }
      const result = await learningService.submitQuizAttempt(
        path[1],
        user.id,
        parsed.data.answers,
      );
      if (!result) {
        return fail('Тест не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      return ok(result);
    }

    if (path[0] === 'quests' && path[2] === 'advance' && path[1]) {
      requireRoles(user, 'student');
      const result = await learningService.advanceQuest(path[1], user.id);
      if (!result) {
        return fail('Квест не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      return ok(result);
    }

    if (path[0] === 'events' && path[2] === 'join' && path[1]) {
      requireRoles(user, 'student');
      try {
        const event = await learningService.joinEvent(path[1], user.id);
        if (!event) {
          return fail('Подію не знайдено', HTTP_STATUS.NOT_FOUND);
        }
        return ok(event);
      } catch (error) {
        if (error instanceof Error && error.message === 'EVENT_ENDED') {
          return fail('Подія вже завершилась');
        }
        return fail('Не вдалося приєднатися');
      }
    }

    return fail('Такої сторінки немає', HTTP_STATUS.NOT_FOUND);
  });
}
