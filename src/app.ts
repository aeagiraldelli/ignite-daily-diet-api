import fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { userRoutes } from './routes/user-routes';

export const app = fastify();
app.register(fastifyCookie);

app.register(userRoutes, {
  prefix: '/users',
});