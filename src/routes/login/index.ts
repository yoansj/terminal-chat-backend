import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { User, UserModel, UserType } from '../../schemas/User';

const login: FastifyPluginAsync = async (fastify): Promise<void> => {
  /**
   * Login to the website
   */
  type LoginType = Pick<UserType, 'mail' | 'password'>;
  const LoginSchema = Type.Object({
    mail: User.properties.mail,
    password: User.properties.password,
  });

  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Body: LoginType;
  }>(
    '/',
    {
      schema: {
        body: LoginSchema,
        tags: ['Accounts'],
        summary: 'Login to the website',
        response: {
          200: {
            type: 'object',
            description: 'User was logged in successfully',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              mail: { type: 'string' },
              bio: { type: 'string' },
              token: { type: 'string' },
              success: { type: 'boolean' },
            },
          },
          401: {
            type: 'object',
            description: 'User was not found (70)',
            properties: {
              errorCode: { type: 'number' },
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { mail, password } = request.body;

      const user = await UserModel.findOne({ mail, password }).exec();

      if (user) {
        const oldToken = await fastify.utils.getExistingToken(
          user._id.toString(),
        );

        if (oldToken) {
          reply.status(200).send({
            ...user.toObject(),
            token: oldToken._id.toString(),
            success: true,
          });
        }
        const newToken = await fastify.utils.createToken(user._id.toString());
        reply
          .status(200)
          .send({ ...user.toObject(), token: newToken, success: true });
      }
      reply.status(401).send({ errorCode: 70, success: false });
    },
  );
};

export default login;
