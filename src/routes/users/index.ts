import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { User, UserModel, UserType } from '../../schemas/User';
import { Type } from '@sinclair/typebox';
import { createToken } from '../../utils/createToken';

const users: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  /**
   * Create a new user
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Body: UserType;
  }>('/', { schema: { body: User } }, async (request, reply) => {
    const { name, mail, password } = request.body;

    if (await UserModel.findOne({ mail }).exec()) {
      reply.status(409).send({ errorCode: 40 });
    }

    const user = new UserModel({
      name,
      mail,
      password,
      bio: "Hey ! I'm new there :)",
    });
    await user.save();
    const token = await createToken(user._id.toString());

    // @ts-ignore
    reply.status(200).send({ ...user.toObject(), token: token._id.toString() });
  });

  /**
   * Gets a user by its id
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().get<{
    Params: {
      id: string;
    };
  }>('/:id', { schema: { params: Type.Object({ id: Type.String() }) }, config: { protected: true } }, async (request, reply) => {
    const { id } = request.params;

    const user = await UserModel.findById(id).exec();

    reply.status(200).send(user);
  });
};

export default users;
