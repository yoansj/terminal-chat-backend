import { Static, Type } from '@sinclair/typebox';
import { UserType } from './../../schemas/User';
import { RoomModel } from './../../schemas/Room';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { RoomType, Room } from '../../schemas/Room';
import ERROR_CODES from '../../utils/errorCodes';

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
              protected: { type: 'boolean' },
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

      reply.status(200).send({ ...room.toObject() });
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
                  protected: { type: 'boolean' },
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
        reply
          .status(200)
          .send(rooms.map((r) => ({ ...r.toObject(), password: undefined })));
      },
    );

  /**
   * Test room password
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Params: {
      id: string;
    };
    Response: { success: boolean };
    Querystring: {
      password: string;
    };
  }>(
    '/:id/password',
    {
      config: { protected: true },
      schema: {
        summary: 'Tests the password of a room',
        params: Type.Object({
          id: Type.String(),
        }),
        querystring: Type.Object({
          password: Type.String(),
        }),
        tags: ['Room'],
        security: [{ Bearer: ['Bearer [token'] }],
        response: {
          200: { success: true },
          400: { success: false },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { password } = request.query;

      const room = await RoomModel.findById(id).exec();

      if (room) {
        if (room.password === password) {
          reply.status(200).send({ success: true });
        } else {
          reply.status(400).send({ success: false });
        }
      } else {
        reply
          .status(404)
          .send({ errorCode: ERROR_CODES.NotFound, success: false });
      }
      const rooms = await RoomModel.find({})
        .populate<{ participants: UserType[] }>('participants')
        .exec();
      reply
        .status(200)
        .send(rooms.map((r) => ({ ...r.toObject(), password: undefined })));
    },
  );
};

export default rooms;
