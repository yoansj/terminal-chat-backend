import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { UserType } from '../../schemas/User';
import { Token } from '../../schemas/Token';
import { usersDb, tokensDB } from '../../db/dbs';

// // Types pour la db
declare module 'fastify' {
  interface FastifyInstance {
    usersDb: PouchDB.Database<UserType>;
    tokensDB: PouchDB.Database<Token>;
  }
}

const pouchDBPlugin: FastifyPluginAsync = fp(async (server) => {
  server.decorate('usersDb', usersDb);
  server.decorate('tokensDB', tokensDB);
});

export default pouchDBPlugin;
