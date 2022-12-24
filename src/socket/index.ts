import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { RoomModel } from '../schemas/Room';
import { ERROR_CODES } from '../utils/errorCodes';

interface Params {
  fastify: FastifyInstance;
}

interface Handlers extends Params {
  socket: Socket;
}

function setHandlers({ socket }: Handlers) {
  socket.on('disconnecting', async () => {
    socket.rooms.forEach(async (room) => {
      if (room !== socket.id) {
        const roomDb = await RoomModel.findById(room).exec();

        if (roomDb) {
          roomDb.participants = roomDb.participants.filter(
            (participant) => participant.toString() !== socket.id,
          );
          await roomDb.save();
          socket.to(room).emit('userLeft', socket.id);
        }
      }
    });
  });
}

export default function setupSocket({ fastify }: Params) {
  fastify.io.on('connection', async (socket) => {
    if (socket.handshake.auth.token) {
      const valid = await fastify.utils.isTokenValid(
        socket.handshake.auth.token,
      );

      if (valid) {
        const token = await fastify.utils.getExistingToken(
          socket.handshake.auth.token,
        );
        if (token) {
          if (socket.handshake.query.room) {
            const room = await RoomModel.findById(
              socket.handshake.query.room,
            ).exec();

            if (room) {
              if (room.password !== socket.handshake.query.password) {
                socket.emit('error', {
                  errorCode: ERROR_CODES.WrongPassword,
                });
                socket.disconnect();
              } else {
                room.participants.push({
                  user: token.user,
                  socketId: socket.id,
                });
                await room.save();
                socket.join(room._id.toString());
                setHandlers({ socket, fastify });
              }
            } else {
              socket.emit('error', { errorCode: ERROR_CODES.NotFound });
              socket.disconnect();
            }
          }
        } else {
          socket.emit('error', { errorCode: ERROR_CODES.InvalidToken });
          socket.disconnect();
        }
      }
    } else {
      socket.emit('error', { errorCode: ERROR_CODES.InvalidToken });
      socket.disconnect();
    }
  });
}
