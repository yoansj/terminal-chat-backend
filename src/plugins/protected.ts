import fp from 'fastify-plugin';
import { ERROR_CODES } from '../utils/errorCodes';

/**
 * Simple plugin that protects routes that need login
 */
export default fp(async (fastify) => {
  fastify.addHook('onRoute', (routeOptions) => {
    if (routeOptions.config && routeOptions.config.protected) {
      if (!routeOptions.preHandler) {
        // eslint-disable-next-line no-param-reassign
        routeOptions.preHandler = async (request, reply) => {
          if (!request.headers.authorization) {
            reply.status(401).send({ errorCode: 70, success: false });
            return;
          }
          const tokenId = request.headers.authorization.split('Bearer ')[1];
          if (tokenId) {
            const isValid = await fastify.utils.isTokenValid(tokenId);
            if (isValid) {
              return;
            }
          }
          reply
            .status(401)
            .send({ errorCode: ERROR_CODES.InvalidToken, success: false });
        };
        return;
      }
      if (Array.isArray(routeOptions.preHandler)) {
        routeOptions.preHandler.push(async (request, reply) => {
          if (!request.headers.authorization) {
            reply
              .status(401)
              .send({ errorCode: ERROR_CODES.InvalidToken, success: false });
            return;
          }
          const tokenId = request.headers.authorization.split('Bearer ')[1];
          if (tokenId) {
            const isValid = await fastify.utils.isTokenValid(tokenId);
            if (isValid) {
              return;
            }
          }
          reply
            .status(401)
            .send({ errorCode: ERROR_CODES.InvalidToken, success: false });
        });
      }
    }
  });
});

declare module 'fastify' {
  export interface FastifyContextConfig {
    /**
     * This route requires login and token auth
     */
    protected?: boolean;
  }
}
