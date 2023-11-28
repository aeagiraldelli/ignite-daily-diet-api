import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';

export async function checkUserIdExists(request: FastifyRequest, reply: FastifyReply) {
  const idSchema = z.object({
    userId: z.string().uuid()
  });

  const { userId } = idSchema.parse(request.cookies);
  if (!userId) {
    return reply.status(401).send();
  }

  const user = await knex('users').where({ id: userId }).first();
  if (!user) {
    return reply.status(404).send();
  }
}