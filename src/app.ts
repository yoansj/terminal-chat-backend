import { join } from 'path';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';
import fastifyIO from 'fastify-socket.io';
// @ts-ignore
import fastifySwagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { Room } from './schemas/Room';
import { User } from './schemas/User';

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  try {
    if (process.env.PROD === 'true') {
      if (process.env.DB_PROD) {
        await mongoose.connect(process.env.DB_PROD, {});
      }
    } else if (process.env.TEST === 'true') {
      if (process.env.DB_TEST) {
        await mongoose.connect(process.env.DB_TEST, {});
      }
    } else if (process.env.DB_DEV) {
      await mongoose.connect(process.env.DB_DEV, {});
    }
  } catch (err) {
    throw new Error("Can't connect to the database");
  }

  await fastify.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'Terminal Chat Backend Documentation',
        description: 'Documentation for the Terminal Chat Backend project',
        version: '0.4.0',
      },
      definitions: {
        User,
        Room,
      },
      tags: [
        {
          name: 'Health',
          description: 'Health related endpoints',
        },
        {
          name: 'User',
          description: 'User management endpoints',
        },
        {
          name: 'Room',
          description: 'Room management endpoints',
        },
        {
          name: 'Accounts',
          description: 'Account management endpoints',
        },
      ],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
    },
  });

  await fastify.register(swaggerUI, {});

  await fastify.register(fastifyIO);

  fastify.ready().then(() => {
    fastify.io.on('connection', (socket) => {
      socket.emit('hello !', {
        res: 'hello',
      });
    });
  });

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts,
  });
};

export default app;
export { app, options };
