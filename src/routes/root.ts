import { FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    '/',
    async () => `Server is running at: ${new Date().toUTCString()}`,
  );
};

export default root;
