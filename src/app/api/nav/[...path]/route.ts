import { z } from 'zod';
import { HTTP_STATUS } from '@/server/constants';
import { fail, getAuthUser, handle, ok, readJson } from '@/server/http';
import * as navService from '@/server/services/nav.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path?: string[] }> };
const keyOf = (path: string[]) => path.join('/');

const seenSchema = z.object({
  section: z.enum([
    'chat',
    'board',
    'learning',
    'tasks',
    'events',
    'notifications',
    'wins',
  ]),
});

export async function GET(req: Request, ctx: Ctx) {
  const path = (await ctx.params).path ?? [];

  return handle(async () => {
    const user = await getAuthUser(req);
    if (keyOf(path) !== 'badges') {
      return fail('Такої сторінки немає', HTTP_STATUS.NOT_FOUND);
    }
    return ok(await navService.getNavBadges(user));
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const path = (await ctx.params).path ?? [];
  const body = await readJson(req);

  return handle(async () => {
    const user = await getAuthUser(req);
    if (keyOf(path) !== 'seen') {
      return fail('Такої сторінки немає', HTTP_STATUS.NOT_FOUND);
    }
    const parsed = seenSchema.safeParse(body);
    if (!parsed.success) {
      return fail('Невідома вкладка');
    }
    return ok(await navService.markNavSectionSeen(user, parsed.data.section));
  });
}
