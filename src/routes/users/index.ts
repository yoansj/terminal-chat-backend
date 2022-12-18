import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { User, UserModel, UserType } from '../../schemas/User';
import { createToken } from '../../utils/createToken';
import ERROR_CODES from '../../utils/errorCodes';

const users: FastifyPluginAsync = async (fastify): Promise<void> => {
  /**
   * Create a new user
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Body: Omit<UserType, '_id'>;
    Response: {
      201: UserType & { token: string };
      409: { errorCode: number };
    };
  }>(
    '/',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            description:
              "User was created successfully, returns the user and it's token",
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              mail: { type: 'string' },
              bio: { type: 'string' },
              token: { type: 'string' },
            },
          },
          409: {
            type: 'object',
            description: 'User already exists (40)',
            properties: {
              errorCode: { type: 'number' },
            },
          },
        },
        body: User,
        tags: ['User'],
        description: `Register to the application\n\n
          _id: Is not used\n
          mail: Must be unique\n
          bio: Is not required (User gets a default value)`,
        summary: 'Register to the application',
      },
    },
    async (request, reply) => {
      const { name, mail, password, bio } = request.body;

      if (await UserModel.findOne({ mail }).exec()) {
        reply.status(409).send({ errorCode: 40 });
      }

      const user = new UserModel({
        name,
        mail,
        password,
        bio: bio || "Hey ! I'm new there :)",
      });
      await user.save();
      const token = await createToken(user._id.toString());

      reply
        .status(200)
        .send({ ...user.toObject(), token: token._id.toString() });
    },
  );

  /**
   * Gets a user by its id
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().get<{
    Params: {
      id: string;
    };
    Response: {
      200: UserType;
      404: { errorCode: number };
    };
  }>(
    '/:id',
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        tags: ['User'],
        summary: 'Gets a user with its id',
        security: [
          {
            Bearer: ['Bearer [token]'],
          },
        ],
        response: {
          200: User,
          404: {
            type: 'object',
            description: 'User not found (41)',
            properties: {
              errorCode: { type: 'number' },
            },
          },
        },
      },
      config: { protected: true },
    },
    async (request, reply) => {
      const { id } = request.params;

      const user = await UserModel.findById(id).exec();

      if (!user) {
        reply.status(404).send({ errorCode: ERROR_CODES.NotFound });
      } else {
        reply.status(200).send(user);
      }
    },
  );

  /**
   * Gets login user profile
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().get<{
    Params: {};
    Response: {
      200: UserType;
      401: { errorCode: number };
    };
  }>(
    '/profile',
    {
      schema: {
        tags: ['User'],
        summary: 'Returns connected user profile',
        security: [
          {
            Bearer: ['Bearer [token]'],
          },
        ],
        response: {
          200: User,
          401: {
            type: 'object',
            description: 'User not connected (40)',
            properties: {
              errorCode: { type: 'number' },
            },
          },
        },
      },
      config: { protected: true },
    },
    async (request, reply) => {
      if (request.headers.authorization) {
        const user = await fastify.utils.getUserFromToken(
          request.headers.authorization,
        );
        if (user) {
          reply.status(200).send(user);
        } else {
          reply.status(401).send({ errorCode: ERROR_CODES.InvalidToken });
        }
      } else {
        reply.status(401).send({ errorCode: ERROR_CODES.NotFound });
      }
    },
  );
};

export default users;
