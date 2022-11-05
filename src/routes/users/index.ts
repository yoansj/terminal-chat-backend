import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { User, UserModel, UserType } from '../../schemas/User';
import { HydratedDocument } from 'mongoose';

const users: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify
    .withTypeProvider<TypeBoxTypeProvider>()
    .post<{ Body: UserType; Reply: HydratedDocument<UserType> }>(
      '/',
      { schema: { body: User, response: { 200: User } } },
      async (request, reply) => {
        const { name, mail } = request.body;

        const user = new UserModel({ name, mail });
        await user.save();

        reply.status(200).send(user);
      },
    );
};

export default users;
