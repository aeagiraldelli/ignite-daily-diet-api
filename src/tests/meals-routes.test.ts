import { execSync } from 'child_process';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync('npm run knex -- migrate:rollback --all');
    execSync('npm run knex -- migrate:latest');
  });

  it('should list all meals for the authenticated user', async () => {
    const createUserResponse = await request(app.server).post('/users/signup').send({
      fullname: 'User test',
      email: 'usertest@emailtest.com',
      password: '123456',
    });

    expect(createUserResponse.statusCode).toEqual(201);

    const cookie = createUserResponse.get('Set-Cookie');
    const mealsResponse = await request(app.server).get('/meals').set('Cookie', cookie).send();
    expect(mealsResponse.body.meals).toEqual(
      expect.objectContaining([]),
    );
  });

  it('should create a meal for the authenticated user', async () => {
    const createUserResponse = await request(app.server).post('/users/signup').send({
      fullname: 'User test',
      email: 'usertest@emailtest.com',
      password: '123456',
    });

    expect(createUserResponse.statusCode).toEqual(201);

    const cookie = createUserResponse.get('Set-Cookie');
    const createMealResponse = await request(app.server).post('/meals').set('Cookie', cookie)
      .send({
        name: 'Breakfast',
        description: 'bacon with eggs',
        planned: true
      });
    expect(createMealResponse.statusCode).toEqual(201);
  });
});