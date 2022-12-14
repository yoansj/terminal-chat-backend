import { Static, Type } from '@sinclair/typebox';
import { UserType } from './../../schemas/User';
import { RoomModel } from './../../schemas/Room';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { RoomType, Room } from '../../schemas/Room';
import ERROR_CODES from '../../utils/errorCodes';
import { MessageModel } from '../../schemas/Message';

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

  /**
   * Get messages from a room
   * User needs to be in the room
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/:id/messages',
    {
      config: { protected: true },
      schema: {
        tags: ['Room'],
        security: [{ Bearer: ['Bearer [token'] }],
        summary: 'Gets messages from a room',
        params: Type.Object({ id: Type.String() }),
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                from: { type: 'string' },
                to: { type: 'string' },
                message: { type: 'string' },
                time: { type: 'string' },
                customSender: { type: 'string' },
                privateMessage: { type: 'boolean' },
                user: {
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
          401: {
            type: 'object',
            description: 'Unauthorized (70)',
            properties: {
              errorCode: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      if (request.headers.authorization) {
        const tokenId = request.headers.authorization.split('Bearer ')[1];
        const valid = await fastify.utils.isTokenValid(tokenId);
        if (valid) {
          const token = await fastify.utils.getExistingTokenId(tokenId);
          const room = await RoomModel.findById(request.params.id)
            .populate<{ participants: { user: UserType; socketId: string }[] }>(
              'participants.user',
            )
            .exec();
          if (room !== null && token !== null) {
            if (room.participants.find((p) => p.user._id)) {
              const messages = await MessageModel.find({ to: room._id })
                .populate<{ user: UserType }>('user')
                .exec();
              return messages.map((m) => m.toObject());
            }
          } else {
            reply
              .status(401)
              .send({ errorCode: ERROR_CODES.InvalidToken, success: false });
          }
        }
        reply
          .status(401)
          .send({ errorCode: ERROR_CODES.InvalidToken, success: false });
      } else {
        reply
          .status(401)
          .send({ errorCode: ERROR_CODES.InvalidToken, success: false });
      }
    },
  );
};

export default rooms;
