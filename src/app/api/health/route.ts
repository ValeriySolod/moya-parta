import { pingDatabase } from '@/server/db';
import { ok } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const database = await pingDatabase();

  return ok({
    api: 'ok',
    database: database.ok ? 'ok' : 'down',
    persistence: database.ok ? 'mysql' : 'mysql-down',
    dbLatencyMs: database.latencyMs,
  });
}
