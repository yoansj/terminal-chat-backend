import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { TokenModel } from '../../schemas/Token';

const logout: FastifyPluginAsync = async (fastify): Promise<void> => {
  /**
   * Logout from the website
   */
  fastify
    .withTypeProvider<TypeBoxTypeProvider>()
    .get('/', {}, async (request, reply) => {
      if (request.headers.authorization) {
        const tokenId = request.headers.authorization.split('Bearer ')[1];
        const token = await TokenModel.findById(tokenId).exec();

        if (token) {
          await TokenModel.findByIdAndDelete(tokenId).exec();
          return { success: true };
        }
        reply.status(401).send({ errorCode: 70, success: false });
      } else {
        reply.status(401).send({ errorCode: 70, success: false });
      }
    });
};

export default logout;
