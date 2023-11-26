import { execSync } from 'child_process';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('User routes', () => {
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

  it('should signup a new user', async () => {
    const response = await request(app.server).post('/users/signup').send({
      fullname: 'User test',
      email: 'usertest@emailtest.com',
      password: '123456',
    });

    expect(response.statusCode).toEqual(201);
  });

  it('should list user info by id', async () => {
    const signupResponse = await request(app.server).post('/users/signup').send({
      fullname: 'User test',
      email: 'usertest@emailtest.com',
      password: '123456',
    });

    const cookie = signupResponse.get('Set-Cookie');

    const userResponse = await request(app.server).get('/users').set('Cookie', cookie);
    expect(userResponse.body.user).toEqual(
      expect.objectContaining({
        fullname: 'User test',
        email: 'usertest@emailtest.com'
      }),
    );
  });

  it('should authenticate user', async () => {
    const createUserResponse = await request(app.server).post('/users/signup').send({
      fullname: 'User test',
      email: 'usertest@emailtest.com',
      password: '123456',
    });
    expect(createUserResponse.statusCode).toEqual(201);

    const authResponse = await request(app.server).post('/users/auth').send({
      email: 'usertest@emailtest.com',
      password: '123456',
    });
    expect(authResponse.statusCode).toEqual(200);
  });

  it('should update user info', async () => {
    const createUserResponse = await request(app.server).post('/users/signup').send({
      fullname: 'User test',
      email: 'usertest@emailtest.com',
      password: '123456',
    });
    expect(createUserResponse.statusCode).toEqual(201);
    const cookie = createUserResponse.get('Set-Cookie');

    const updateResponse = await request(app.server)
      .post('/users/update')
      .set('Cookie', cookie)
      .send({
        fullname: 'Full User Tester',
        email: 'fullusertester@email.com',
        oldPassword: '123456',
        newPassword: '1234567'
      });
    expect(updateResponse.statusCode).toEqual(200);



    const infoResponse = await request(app.server).get('/users').set('Cookie', cookie);
    expect(infoResponse.body.user).toEqual(
      expect.objectContaining({
        fullname: 'Full User Tester',
        email: 'fullusertester@email.com',
      }),
    );
  });
});