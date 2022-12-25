import { Static, Type } from '@sinclair/typebox';
import { model, Schema, Types } from 'mongoose';
import { Room } from './Room';
import { User } from './User';

export const Message = Type.Object({
  user: User,
  message: Type.String(),
  to: Room,
  privateMessage: Type.Optional(Type.Boolean()),
  customSender: Type.Optional(Type.String()),
  time: Type.Optional(Type.String()),
});

export type MessageType = Static<typeof Message>;

export const messageSchema = new Schema<MessageType>({
  user: { type: Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  to: { type: Types.ObjectId, ref: 'Room', required: true },
  privateMessage: { type: Boolean, required: false },
  customSender: { type: String, required: false },
  time: { type: String, required: false },
});

export const MessageModel = model<MessageType>('Message', messageSchema);
