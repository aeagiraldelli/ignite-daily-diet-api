import { randomUUID } from 'node:crypto';

import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { checkUserIdExists } from '../middlewares/check-user-id-exists';
import { knex } from '../database';

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkUserIdExists] }, async (request, reply) => {
    const { userId } = request.cookies;
    const meals = await knex('meals').where('user_id', userId);
    reply.code(200).send({ meals });
  });

  app.get('/:id', { preHandler: [checkUserIdExists] }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { userId } = request.cookies;

    const meal = await knex('meals')
      .where({ user_id: userId, id })
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

  app.put('/:id', { preHandler: [checkUserIdExists] }, async (request, reply) => {
    const paramsSquema = z.object({
      id: z.string().uuid(),
    });
    const bodySchema = z.object({
      name: z.string(),
      description: z.string().optional(),
      planned: z.boolean()
    });

    const { userId } = request.cookies;
    const { id } = paramsSquema.parse(request.params);
    const { name, description, planned } = bodySchema.parse(request.body);

    const registeredMeal = await knex('meals').where({ user_id: userId, id }).first();
    if (!registeredMeal) {
      return reply.code(404).send({ error: 'Meal not found.' });
    }

    await knex('meals').update({
      name,
      description,
      planned,
      updated_at: knex.fn.now(),
    }).where({ id });

    return reply.code(200).send();
  });

  app.delete('/:id', { preHandler: [checkUserIdExists] }, async (request, reply) => {
    const { userId } = request.cookies;
    const paramsSquema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSquema.parse(request.params);

    const registeredMeal = await knex('meals').where({ user_id: userId, id }).first();
    if (!registeredMeal) {
      return reply.code(404).send();
    }

    await knex('meals').where({ user_id: userId, id }).first().delete();

    return reply.code(200).send();
  });

  app.get('/metrics', { preHandler: [checkUserIdExists] }, async (request, reply) => {
    const { userId } = request.cookies;
    const numOfMeals = await knex('meals').where('user_id', userId);
    let numPlannedMeals = 0;
    let bestSequenceCounter = 0;
    let bestSequence = 0;

    numOfMeals.forEach((meal) => {
      if (meal.planned) {
        numPlannedMeals += 1;
        bestSequenceCounter += 1;
      }
      else {
        if (bestSequenceCounter > bestSequence) {
          bestSequence = bestSequenceCounter;
        }

        bestSequenceCounter = 0;
      }
    });

    if (bestSequenceCounter > bestSequence) {
      bestSequence = bestSequenceCounter;
    }

    const data = {
      userId,
      totalOfMeals: numOfMeals.length,
      totalPlannedMeals: numPlannedMeals,
      totalUnplannedMeals: numOfMeals.length - numPlannedMeals,
      bestSequence
    };

    return reply.code(200).send(data);
  });
}