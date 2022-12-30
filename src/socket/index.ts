import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { RoomModel } from '../schemas/Room';
import { UserType } from '../schemas/User';
import { ERROR_CODES } from '../utils/errorCodes';
import MessageManager from './message';

interface Params {
  fastify: FastifyInstance;
}

interface Handlers extends Params {
  socket: Socket;
}

function setHandlers({ socket, fastify }: Handlers) {
  MessageManager({ socket, io: fastify.io, fastify });
  socket.on('disconnecting', async () => {
    socket.rooms.forEach(async (room) => {
      if (room !== socket.id) {
        const roomDb = await RoomModel.findById(room)
          .populate<{ participants: { user: UserType; socketId: string }[] }>(
            'participants.user',
          )
          .exec();

        if (roomDb) {
          const oldUser = roomDb.participants.find(
            (p) => p.socketId === socket.id,
          );
          roomDb.participants = roomDb.participants.filter(
            (participant) => participant.socketId !== socket.id,
          );
          if (oldUser) {
            fastify.io.to(room).emit('message', {
              message: '',
              to: room,
              customSender: 'room',
              event: 'left',
              leftName: oldUser.user.name,
            });
          } else {
            fastify.io.to(room).emit('message', {
              message: 'Someone has left the room',
              to: room,
              customSender: 'room',
              event: 'left',
              leftName: '',
            });
          }
          fastify.io.to(room).emit('participants', roomDb.participants);
          if (roomDb.participants.length === 0) {
            await roomDb.remove();
          } else {
            await roomDb.save();
          }
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
        const token = await fastify.utils.getExistingTokenId(
          socket.handshake.auth.token,
        );
        if (token) {
          if (socket.handshake.query.room) {
            const room = await RoomModel.findById(socket.handshake.query.room)
              .populate<{
                participants: { user: UserType; socketId: string }[];
              }>('participants.user')
              .exec();

            if (room) {
              if (
                room.password !== undefined &&
                room.password !== '' &&
                room.password !== socket.handshake.query.password
              ) {
                socket.emit('error', {
                  errorCode: ERROR_CODES.WrongPassword,
                });
                socket.disconnect();
              } else {
                if (
                  room.participants.find(
                    (p) => p.user._id === token.user._id,
                  ) === undefined
                ) {
                  room.participants.push({
                    user: token.user,
                    socketId: socket.id,
                  });
                  await room.save();
                }
                socket.join(room._id.toString());
                socket.emit('join_ok');
                fastify.io.to(room._id.toString()).emit('message', {
                  message: '',
                  to: room._id.toString(),
                  customSender: 'room',
                  event: 'joined',
                  joinedName: token.user.name,
                });
                fastify.io
                  .to(room._id.toString())
                  .emit('participants', room.participants);
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
