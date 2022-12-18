import { RoomModel } from './../../schemas/Room';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync } from 'fastify';
import { User } from '../../schemas/User';
import { RoomType } from '../../schemas/Room';

const rooms: FastifyPluginAsync = async (fastify): Promise<void> => {
  /**
   * Create a new room
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Body: RoomType;
  }>('/', { schema: { body: User }, config: { protected: true } }, async (request, reply) => {
    const { name, participants, password, subject } = request.body;

    const room = new RoomModel({
      name,
      participants,
      password,
      subject,
    });
    await room.save();

    reply.status(200).send({ ...room });
  });

  /**
   * Gets all rooms
   */
  fastify
    .withTypeProvider<TypeBoxTypeProvider>()
    .get('/', { config: { protected: true } }, async (request, reply) => {
      const rooms = await RoomModel.find({}).exec();

      reply.status(200).send(rooms);
    });

  /**
   * Join a room
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Body: { password: string };
    Params: {
      id: string;
    };
  }>('/:id', { schema: { body: User }, config: { protected: true } }, async (request, reply) => {
    const { id } = request.params;
    const { password } = request.body;

    const room = await RoomModel.findById(id).exec();

    if (room) {
      if (room.password === password) {
        if (request.headers.authorization) {
          const user = await fastify.utils.getUserFromToken(
            request.headers.authorization,
          );
          if (user) {
            room.participants.push(user._id || '');
            await room.save();
            reply.status(200).send({ ...room });
          } else {
            reply.status(401).send({ errorCode: 40 });
          }
        }
      } else {
        reply.status(401).send({ errorCode: 40 });
      }
    } else {
      reply.status(404).send({ errorCode: 40 });
    }
  });
};

export default rooms;
