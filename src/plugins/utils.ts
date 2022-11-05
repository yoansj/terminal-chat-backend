import fp from 'fastify-plugin';
import { createToken } from '../utils/createToken';
import { getExistingToken } from '../utils/getExistingToken';
import { isTokenValid } from '../utils/isTokenValid';

/**
 * Simple plugin that export utils functions
 */
export default fp(async (fastify) => {
  fastify.decorate('utils', {
    createToken,
    getExistingToken,
    isTokenValid,
  });
});

declare module 'fastify' {
  export interface FastifyInstance {
    utils: {
      /**
       * Create a new token for a user
       */
      createToken: typeof createToken;
      /**
       * Get an existing token for a user
       */
      getExistingToken: typeof getExistingToken;
      /**
       * Check if a token is valid
       */
      isTokenValid: typeof isTokenValid;
    };
  }
}
