import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { withTimeout } from './timeout';

const CONNECT_TIMEOUT_MS = 4000;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const connectDatabase = async (): Promise<boolean> => {
  try {
    const started = Date.now();
    await withTimeout(prisma.$connect(), CONNECT_TIMEOUT_MS, 'MySQL connect');
    await withTimeout(prisma.$queryRaw`SELECT 1`, CONNECT_TIMEOUT_MS, 'MySQL ping');
    console.log(`[db] MySQL connected (${Date.now() - started}ms)`);
    return true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    console.error(
      '[db] MySQL unreachable. Локально: SSH-тунель, DATABASE_URL → 127.0.0.1:3307.',
    );
    console.error(`[db] ${detail}`);
    return false;
  }
};
