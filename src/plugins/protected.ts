import fp from 'fastify-plugin';

/**
 * Simple plugin that protects routes that need login
 */
export default fp(async (fastify, opts) => {
  fastify.addHook('onRoute', (routeOptions) => {
    if (routeOptions.config && routeOptions.config.protected) {
      if (!routeOptions.preHandler) {
        routeOptions.preHandler = async (request, reply) => {
          const token = request.headers.authorization;
          if (token) {
            const isValid = await fastify.utils.isTokenValid(token);
            if (isValid) {
              return;
            }
          }
          reply.status(401).send({ errorCode: 70, success: false });
        };
        return;
      }
      if (Array.isArray(routeOptions.preHandler)) {
        routeOptions.preHandler.push(async (request, reply) => {
          const token = request.headers.authorization;
          if (token) {
            const isValid = await fastify.utils.isTokenValid(token);
            if (isValid) {
              return;
            }
          }
          reply.status(401).send({ errorCode: 70, success: false });
        });
        return;
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
