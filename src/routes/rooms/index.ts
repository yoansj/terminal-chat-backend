import { UserType } from './../../schemas/User';
import { RoomModel } from './../../schemas/Room';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { RoomType, Room } from '../../schemas/Room';

const rooms: FastifyPluginAsync = async (fastify): Promise<void> => {
  /**
   * Create a new room
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Body: Omit<RoomType, '_id'>;
  }>(
    '/',
    {
      schema: {
        body: Room,
        summary: 'Creates a room',
        description: `Creates a room\n\n
          _id: Is not used\n
          subject: Is optionnal\n
          password: Is optionnal\n
          participants: Must be an array of user ids
        `,
        tags: ['Room'],
        security: [{ Bearer: ['Bearer [token'] }],
        response: {
          200: {
            type: 'object',
            description: 'Room was created successfully',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              subject: { type: 'string' },
              password: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
      config: { protected: true },
    },
    async (request, reply) => {
      const { name, participants, password, subject } = request.body;

      const room = new RoomModel({
        name,
        participants,
        password,
        subject,
      });
      await room.save();

      reply.status(200).send({ ...room });
    },
  );

  /**
   * Gets all rooms
   */
  fastify
    .withTypeProvider<TypeBoxTypeProvider>()
    .get<{ Params: {}; Response: RoomType }>(
      '/',
      {
        config: { protected: true },
        schema: {
          summary: 'Gets all rooms',
          tags: ['Room'],
          security: [{ Bearer: ['Bearer [token'] }],
          response: {
            200: {
              type: 'array',
              description: 'Returns all rooms',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  subject: { type: 'string' },
                  password: { type: 'string' },
                  participants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        mail: { type: 'string' },
                        bio: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const rooms = await RoomModel.find({})
          .populate<{ participants: UserType[] }>('participants')
          .exec();

        reply.status(200).send(rooms);
      },
    );

  /**
   * Join a room
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Body: { password: string };
    Params: {
      id: string;
    };
  }>(
    '/join/:id',
    {
      schema: {
        body: { password: { type: 'string' } },
        summary: 'Join a room',
        params: {
          id: { type: 'string' },
        },
        tags: ['Room'],
        security: [{ Bearer: ['Bearer [token'] }],
        response: {
          200: {
            type: 'object',
            description: 'Room was joined successfully',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              subject: { type: 'string' },
              password: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } },
            },
          },
          401: {
            type: 'object',
            description: 'Unauthorized',
            properties: {
              errorCode: { type: 'number' },
            },
          },
          404: {
            type: 'object',
            description: 'Room not found',
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
      const { password } = request.body;

      const room = await RoomModel.findById(id).exec();

      if (room) {
        if (room.password === password) {
          if (request.headers.authorization) {
            const user = await fastify.utils.getUserFromToken(
              request.headers.authorization,
            );
            if (user) {
              room.participants.push(user._id || '');
              await room.save();
              reply.status(200).send({ ...room });
            } else {
              reply.status(401).send({ errorCode: 40 });
            }
          }
        } else {
          reply.status(401).send({ errorCode: 40 });
        }
      } else {
        reply.status(404).send({ errorCode: 40 });
      }
    },
  );
};

export default rooms;
