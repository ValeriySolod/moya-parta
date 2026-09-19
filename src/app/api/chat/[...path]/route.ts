import { z } from 'zod';
import { HTTP_STATUS } from '@/server/constants';
import { fail, getAuthUser, handle, ok, readJson, requireRoles } from '@/server/http';
import * as chatService from '@/server/services/chat.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path?: string[] }> };
const keyOf = (path: string[]) => path.join('/');

const messageSchema = z.object({
  text: z.string().min(1, 'Напиши повідомлення').max(500),
});

const chatUser = async (req: Request) => {
  const user = await getAuthUser(req);
  requireRoles(user, 'student', 'teacher');
  return user;
};

export async function GET(req: Request, ctx: Ctx) {
  const path = (await ctx.params).path ?? [];
  const key = keyOf(path);

  return handle(async () => {
    const user = await chatUser(req);

    if (key === 'contacts') {
      return ok(await chatService.getChatContacts(user));
    }

    if (key === 'class') {
      return ok(await chatService.getClassChat(user));
    }

    if (path[0] === 'direct' && path[1] && path.length === 2) {
      const thread = await chatService.getDirectThread(user, path[1]);
      if (!thread) {
        return fail('Цю людину не знайдено у твоєму класі', HTTP_STATUS.NOT_FOUND);
      }
      return ok(thread);
    }

    return fail('Такої сторінки немає', HTTP_STATUS.NOT_FOUND);
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const path = (await ctx.params).path ?? [];
  const key = keyOf(path);
  const body = await readJson(req);

  return handle(async () => {
    const user = await chatUser(req);
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Перевір дані');
    }

    if (key === 'class') {
      try {
        return ok(
          await chatService.sendClassMessage(user, parsed.data.text),
          HTTP_STATUS.CREATED,
        );
      } catch {
        return fail('Не вдалося надіслати');
      }
    }

    if (path[0] === 'direct' && path[1] && path.length === 2) {
      try {
        return ok(
          await chatService.sendDirectMessage(user, path[1], parsed.data.text),
          HTTP_STATUS.CREATED,
        );
      } catch (error) {
        if (error instanceof Error && error.message === 'NOT_CLASSMATE') {
          return fail(
            'Можна писати лише однокласникам і вчителю',
            HTTP_STATUS.FORBIDDEN,
          );
        }
        return fail('Не вдалося надіслати');
      }
    }

    return fail('Такої сторінки немає', HTTP_STATUS.NOT_FOUND);
  });
}
