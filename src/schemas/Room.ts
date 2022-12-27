import { Static, Type } from '@sinclair/typebox';
import { model, Schema, Types } from 'mongoose';
import { Participant } from './Participant';

export const Room = Type.Object({
  name: Type.String(),
  password: Type.Optional(Type.String()),
  subject: Type.Optional(Type.String()),
  participants: Type.Array(Participant),
  protected: Type.Optional(Type.Boolean()),
});

export type RoomType = Static<typeof Room>;

export const roomSchema = new Schema<RoomType>({
  name: { type: String, required: true },
  password: { type: String, required: false },
  subject: { type: String, required: false },
  participants: [
    {
      user: { type: Types.ObjectId, ref: 'User' },
      socketId: { type: String, required: true },
    },
  ],
  protected: { type: Boolean, required: false },
});

export const RoomModel = model<RoomType>('Room', roomSchema);
