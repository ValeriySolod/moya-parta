import { HTTP_STATUS } from '@/server/constants';
import { fail, getAuthUser, handle, ok } from '@/server/http';
import * as notificationsService from '@/server/services/notifications.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path?: string[] }> };
const keyOf = (path: string[]) => path.join('/');

export async function POST(req: Request, ctx: Ctx) {
  const path = (await ctx.params).path ?? [];
  const key = keyOf(path);

  return handle(async () => {
    const user = await getAuthUser(req);

    if (key === 'read-all') {
      return ok(await notificationsService.markAllRead(user.id));
    }

    if (path[1] === 'read' && path[0]) {
      const notification = await notificationsService.markNotificationRead(
        path[0],
        user.id,
      );
      if (!notification) {
        return fail('Сповіщення не знайдено', HTTP_STATUS.NOT_FOUND);
      }
      return ok(notification);
    }

    return fail('Такої сторінки немає', HTTP_STATUS.NOT_FOUND);
  });
}
