import { FastifyPluginAsync } from 'fastify';

const users: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{
    Body: {
      name: string;
      email: string;
      password: string;
    };
  }>('/', async (request) => {
    try {
      await fastify.prisma.user.create({
        data: {
          name: request.body.name,
          email: request.body.email,
          password: request.body.password,
        },
      });

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  });
};

export default users;
