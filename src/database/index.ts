import { knex as setup, Knex } from 'knex';
import { env } from '../env';

export const config: Knex.Config = {
  client: env.DATABASE_CLIENT,
  connection: env.NODE_ENV === 'test'
    ? {
      filename: env.DATABASE_URL
    }
    : env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './db/migrations',
  },
};

export const knex = setup(config);