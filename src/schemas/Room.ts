import { Static, Type } from '@sinclair/typebox';
import { model, Schema, Types } from 'mongoose';

export const Room = Type.Object({
  name: Type.String(),
  password: Type.Optional(Type.String()),
  subject: Type.Optional(Type.String()),
  participants: Type.Array(Type.String()),
});

export type RoomType = Static<typeof Room>;

export const roomSchema = new Schema<RoomType>({
  name: { type: String, required: true },
  password: { type: String, required: false },
  subject: { type: String, required: false },
  participants: [{ type: Types.ObjectId, ref: 'User' }],
});

export const RoomModel = model<RoomType>('Room', roomSchema);
