import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const envSchema = z.object({
  JWT_SECRET: z.string().min(16, 'JWT_SECRET має бути щонайменше 16 символів'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL обовʼязковий')
    .refine((value) => value.startsWith('mysql://'), {
      message: 'DATABASE_URL має бути mysql://…',
    }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const fields = parsed.error.flatten().fieldErrors;
  throw new Error(`Невалідний .env: ${JSON.stringify(fields)}`);
}

export const env = parsed.data;
