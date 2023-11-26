import { randomUUID } from 'node:crypto';

import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { checkUserIdExists } from '../middlewares/check-user-id-exists';
import { knex } from '../database';

export function mealsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkUserIdExists] }, async (request, reply) => {
    const { userId } = request.cookies;
    const meals = await knex('meals').where('user_id', userId);
    reply.code(200).send({
      meals: meals
    });
  });

  app.get('/:id', { preHandler: [checkUserIdExists] }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { userId } = request.cookies;

    const meal = await knex('meals')
      .where('user_id', userId)
      .where('id', id)
      .first();

    if (meal) {
      return reply.code(200).send({ meal });
    } else {
      return reply.code(404).send();
    }
  });

  app.post('/', { preHandler: [checkUserIdExists] }, async (request, reply) => {
    const { userId } = request.cookies;
    const mealSchema = z.object({
      name: z.string(),
      description: z.string().optional(),
      planned: z.boolean()
    });

    const { name, description, planned } = mealSchema.parse(request.body);

    const mealId = randomUUID();
    await knex('meals').insert({
      id: mealId,
      name,
      description,
      planned,
      user_id: userId
    });

    return reply.code(201).send();
  });
}