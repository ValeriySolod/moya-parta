import { prisma } from './prisma';
import { withTimeout } from './timeout';

export type DatabaseHealth = {
  ok: boolean;
  latencyMs: number | null;
};

const PING_TIMEOUT_MS = 4000;

let cached:
  | { expiresAt: number; result: DatabaseHealth }
  | null = null;

export const pingDatabase = async (): Promise<DatabaseHealth> => {
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const started = Date.now();
  let result: DatabaseHealth;

  try {
    await withTimeout(
      prisma.$queryRaw`SELECT 1`,
      PING_TIMEOUT_MS,
      'MySQL health',
    );
    result = { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    console.error(`[db] health ping failed: ${detail}`);
    result = { ok: false, latencyMs: null };
  }

  cached = {
    expiresAt: Date.now() + (result.ok ? 3000 : 8000),
    result,
  };

  return result;
};
