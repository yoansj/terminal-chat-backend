import { FastifyInstance } from 'fastify';
import { Server, Socket } from 'socket.io';
import { MessageModel } from '../schemas/Message';
import { SocketMessage } from '../types/SocketMessage';

interface Params {
  socket: Socket;
  io: Server;
  fastify: FastifyInstance;
}

export default function MessageManager({ socket, io }: Params) {
  socket.on('message', (message: SocketMessage) => {
    if (message.customSender === 'room') {
      io.to(message.to).emit('message', message);
    } else if (message.privateMessage) {
      socket.to(message.to).emit('message', message);
    } else {
      io.to(message.to).emit('message', message);
      const newMessage = new MessageModel({
        ...message,
        time: new Date().toISOString(),
      });
      newMessage.save();
    }
  });
}
