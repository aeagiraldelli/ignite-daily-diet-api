// eslint-disable-next-line
import { Knex } from 'knex';

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string,
      fullname: string,
      email: string,
      password: string,
      created_at: string,
      updated_at: string
    },
    meals: {
      id: string,
      name: string,
      description: string,
      planned: boolean,
      user_id: string,
      created_at: string,
      updated_at: string,
    }
  }
}