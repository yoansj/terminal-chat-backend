import { FastifyPluginAsync } from 'fastify';

const users: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/', async (request, reply) => 'this is an example');
};

export default users;
