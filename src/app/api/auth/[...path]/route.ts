import { z } from 'zod';
import { HTTP_STATUS } from '@/server/constants';
import { fail, getAuthUser, handle, ok, readJson } from '@/server/http';
import * as authService from '@/server/services/auth.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().min(3, 'Введи логін'),
  password: z.string().min(4, 'Пароль занадто короткий'),
});

const teacherRegisterSchema = z.object({
  displayName: z.string().min(2, 'Напиши своє імʼя'),
  login: z.string().min(3, 'Придумай логін'),
  password: z.string().min(4, 'Пароль занадто короткий'),
  avatarEmoji: z.string().optional(),
});

const studentRegisterSchema = z.object({
  inviteCode: z.string().min(3, 'Введи код класу'),
  displayName: z.string().min(2, 'Напиши своє імʼя'),
  login: z.string().min(3, 'Придумай логін'),
  password: z.string().min(4, 'Пароль занадто короткий'),
  avatarEmoji: z.string().optional(),
});

type Ctx = { params: Promise<{ path?: string[] }> };

const keyOf = (path: string[]) => path.join('/');

export async function GET(req: Request, ctx: Ctx) {
  const path = (await ctx.params).path ?? [];
  const key = keyOf(path);

  return handle(async () => {
    if (key === 'me') {
      const user = await getAuthUser(req);
      const current = await authService.getCurrentUser(user.id);
      if (!current) {
        return fail('Користувача не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      return ok(current);
    }

    if (path[0] === 'invite' && path[1]) {
      const preview = await authService.getInvitePreview(path[1]);
      if (!preview) {
        return fail('Такого коду класу немає', HTTP_STATUS.NOT_FOUND);
      }
      return ok(preview);
    }

    return fail('Такої сторінки немає', HTTP_STATUS.NOT_FOUND);
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const path = (await ctx.params).path ?? [];
  const key = keyOf(path);
  const body = await readJson(req);

  return handle(async () => {
    if (key === 'login') {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return fail(parsed.error.issues[0]?.message ?? 'Перевір дані');
      }
      const result = await authService.loginUser(
        parsed.data.email,
        parsed.data.password,
      );
      if (!result) {
        return fail('Невірний логін або пароль', HTTP_STATUS.UNAUTHORIZED);
      }
      return ok(result);
    }

    if (key === 'register/teacher') {
      const parsed = teacherRegisterSchema.safeParse(body);
      if (!parsed.success) {
        return fail(parsed.error.issues[0]?.message ?? 'Перевір дані');
      }
      try {
        const result = await authService.registerTeacher(parsed.data);
        return ok(result, HTTP_STATUS.CREATED);
      } catch (error) {
        if (error instanceof Error && error.message === 'LOGIN_TAKEN') {
          return fail('Такий логін уже зайнятий', HTTP_STATUS.CONFLICT);
        }
        throw error;
      }
    }

    if (key === 'register/student') {
      const parsed = studentRegisterSchema.safeParse(body);
      if (!parsed.success) {
        return fail(parsed.error.issues[0]?.message ?? 'Перевір дані');
      }
      try {
        const result = await authService.registerStudentByInvite(parsed.data);
        return ok(result, HTTP_STATUS.CREATED);
      } catch (error) {
        if (error instanceof Error && error.message === 'INVITE_NOT_FOUND') {
          return fail('Такого коду класу немає', HTTP_STATUS.NOT_FOUND);
        }
        if (error instanceof Error && error.message === 'LOGIN_TAKEN') {
          return fail('Такий логін уже зайнятий', HTTP_STATUS.CONFLICT);
        }
        throw error;
      }
    }

    return fail('Такої сторінки немає', HTTP_STATUS.NOT_FOUND);
  });
}
