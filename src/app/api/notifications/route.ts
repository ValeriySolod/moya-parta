import { getAuthUser, handle, ok } from '@/server/http';
import * as notificationsService from '@/server/services/notifications.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return handle(async () => {
    const user = await getAuthUser(req);
    return ok(await notificationsService.getNotifications(user.id));
  });
}
