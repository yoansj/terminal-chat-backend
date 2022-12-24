import { Static, Type } from '@sinclair/typebox';
import { UserType } from './../../schemas/User';
import { RoomModel } from './../../schemas/Room';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { RoomType, Room } from '../../schemas/Room';

const rooms: FastifyPluginAsync = async (fastify): Promise<void> => {
  /**
   * Create a new room
   */
  const createRoom = Type.Pick(Room, ['name', 'password', 'subject']);
  type createRoomType = Static<typeof createRoom>;
  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Body: createRoomType;
  }>(
    '/',
    {
      schema: {
        body: createRoom,
        summary: 'Creates a room',
        description: `Creates a room\n\n
          name: Is required\n
          subject: Is optionnal\n
          password: Is optionnal\n
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
      const { name, password, subject } = request.body;

      const room = new RoomModel({
        name,
        password,
        subject,
        protected: password !== undefined && password !== '',
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
};

export default rooms;
