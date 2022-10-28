import { PrismaClient } from '@prisma/client';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

// Types pour prisma
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (server) => {
  const prisma = new PrismaClient();

  await prisma.$connect();
  // Rend prisma dispo sur les routes
  server.decorate('prisma', prisma);

  server.addHook('onClose', async (s) => {
    await s.prisma.$disconnect();
  });
});

export default prismaPlugin;
