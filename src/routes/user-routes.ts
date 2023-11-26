import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { checkUserIdExists } from '../middlewares/check-user-id-exists';

export async function userRoutes(app: FastifyInstance) {

  app.get('/', { preHandler: [checkUserIdExists] }, async (request, reply) => {
    const { userId } = request.cookies;
    const user = await knex('users').where('id', userId).first();
    if (user) {
      return reply.code(200).send({
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
      });
    } else {
      return reply.code(404).send();
    }
  });

  app.post('/signup', async (request, reply) => {
    const userSchema = z.object({
      fullname: z.string(),
      email: z.string().email(),
      password: z.string(),
    });

    const { fullname, email, password } = userSchema.parse(request.body);

    const registeredUser = await knex('users').where('email', email.toLowerCase()).first();
    if (registeredUser) {
      reply.code(401).send({
        error: 'E-mail already in use.'
      });
    }

    const encryptedPassword = await hash(password, 8);
    const userId = randomUUID();
    await knex('users').insert({
      id: userId,
      fullname,
      email: email.toLowerCase(),
      password: encryptedPassword,
    });

    if (userId) {
      reply.cookie('userId', userId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, /* 7 days */
      });
    }

    return reply.code(201).send();
  });

  app.post('/auth', async (request, reply) => {
    const credentialsSchema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const { email, password } = credentialsSchema.parse(request.body);

    const user = await knex('users').where('email', email.toLowerCase()).first();

    if (!user) {
      return reply.code(404).send();
    }

    const passwordOk = await compare(password, user.password);
    if (passwordOk) {
      reply.cookie('userId', user.id, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      return reply.code(200).send();
    } else {
      return reply.code(401).send();
    }
  });

  app.post('/update', { preHandler: [checkUserIdExists] }, async (request, reply) => {
    const userDataSchema = z.object({
      fullname: z.string().optional(),
      email: z.string().email().optional(),
      newPassword: z.string().min(6).optional(),
      oldPassword: z.string(),
    });

    const { fullname, email, newPassword, oldPassword } = userDataSchema.parse(request.body);

    const { userId } = request.cookies;
    const user = await knex('users').where('id', userId).first();

    if (!user) {
      return reply.code(404).send();
    }

    if (email) {
      const registeredUser = await knex('users').where('email', email.toLowerCase()).first();
      if (registeredUser && registeredUser.id !== userId) {
        return reply.code(400).send({ error: 'E-mail already in use' });
      }
    }

    if (oldPassword) {
      const passwordOk = await compare(oldPassword, user.password);
      if (!passwordOk) {
        return reply.code(401).send({ error: 'Wrong old password' });
      }
    }

    if (oldPassword && newPassword) {
      user.password = await hash(newPassword, 8);
    }

    user.fullname = fullname ?? user.fullname;
    user.email = email ?? user.email;

    await knex('users').update({
      fullname: user.fullname,
      email: user.email.toLowerCase(),
      updated_at: knex.fn.now(),
    }).where('id', userId);

    return reply.code(200).send();
  });
}