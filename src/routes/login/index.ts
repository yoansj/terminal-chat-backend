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
  }>('/', { schema: { body: LoginSchema } }, async (request, reply) => {
    const { mail, password } = request.body;

    const user = await UserModel.findOne({ mail, password }).exec();

    if (user) {
      const oldToken = await fastify.utils.getExistingToken(
        user._id.toString(),
      );

      if (oldToken) {
        return { ...user.toObject(), token: oldToken };
      }
      const newToken = await fastify.utils.createToken(user._id.toString());
      return { ...user.toObject(), token: newToken };
    }
    reply.status(401).send({ errorCode: 70, success: false });
    return { success: false, statusCode: 401, errorCode: 70 };
  });
};

export default login;
