import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { TokenModel } from '../../schemas/Token';
import ERROR_CODES from '../../utils/errorCodes';

const messages: FastifyPluginAsync = async (fastify): Promise<void> => {
  /**
   * Get messages from a room
   * User needs to be in the room
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/',
    {
      config: { protected: true },
      schema: {
        tags: ['Accounts'],
        security: [{ Bearer: ['Bearer [token'] }],
        summary: 'Gets messages from a room',
        response: {
          200: {},
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
        const token = await TokenModel.findById(tokenId).exec();

        if (token) {
          await TokenModel.findByIdAndDelete(tokenId).exec();
          return { success: true };
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
