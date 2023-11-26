import { config } from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' });
} else {
  config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  DATABASE_CLIENT: z.enum(['sqlite', 'pg']),
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3333),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  const message = `Invalid environment variable. Check your env file.\n${parseResult.error.format()}`;
  throw new Error(message);
}

export const env = parseResult.data;