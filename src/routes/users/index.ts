import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { User, UserType } from '../../schemas/User';

const users: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify
    .withTypeProvider<TypeBoxTypeProvider>()
    .post<{ Body: UserType; Reply: UserType }>(
      '/',
      { schema: { body: User, response: { 200: User } } },
      async (request, reply) => {
        const { name, mail } = request.body;
        reply.status(200).send({ name, mail });
      },
    );
};

export default users;
