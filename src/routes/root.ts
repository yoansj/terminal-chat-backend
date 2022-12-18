import { FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    '/',
    {
      schema: {
        summary: 'Check if the server is running',
        description: 'This route is used to check if the server is running',
        tags: ['Health'],
      },
    },
    async () => `Server is running at: ${new Date().toUTCString()}`,
  );
};

export default root;
