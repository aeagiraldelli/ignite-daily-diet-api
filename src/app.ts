import fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';

export const app = fastify();
app.register(fastifyCookie);