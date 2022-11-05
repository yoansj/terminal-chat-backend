import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { User, UserModel, UserType } from '../../schemas/User';
import { Type } from '@sinclair/typebox';

const login: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
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
  }>('/', { schema: { body: LoginSchema } }, async (request, reply) => {
    const { mail, password } = request.body;

    const user = await UserModel.findOne({ mail, password }).exec();

    if (user) {
      const oldToken = await fastify.utils.getExistingToken(
        user._id.toString(),
      );

      if (oldToken) {
        return { ...user.toObject(), token: oldToken };
      } else {
        const newToken = await fastify.utils.createToken(user._id.toString());
        return { ...user.toObject(), token: newToken };
      }
    } else {
      reply.status(401).send({ errorCode: 70, success: false });
    }
  });
};

export default login;
