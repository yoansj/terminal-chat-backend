import { MessageModel } from './../../schemas/Message';
import { RoomModel } from './../../schemas/Room';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import ERROR_CODES from '../../utils/errorCodes';
import { Type } from '@sinclair/typebox';
import { UserType } from '../../schemas/User';

const messages: FastifyPluginAsync = async (fastify): Promise<void> => {
  /**
   * Get messages from a room
   * User needs to be in the room
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/:roomId',
    {
      config: { protected: true },
      schema: {
        tags: ['Room'],
        security: [{ Bearer: ['Bearer [token'] }],
        summary: 'Gets messages from a room',
        params: Type.Object({ roomId: Type.String() }),
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
          const room = await RoomModel.findById(request.params.roomId)
            .populate<{ participants: { user: UserType; socketId: string }[] }>(
              'participants.user',
            )
            .exec();
          if (room !== null && token !== null) {
            if (room.participants.find((p) => p.user._id)) {
              const messages = await MessageModel.find({ to: room._id }).exec();
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

export default messages;
