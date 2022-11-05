import { Static, Type } from '@sinclair/typebox';
import { Schema, model } from 'mongoose';

export const User = Type.Object({
  name: Type.String(),
  mail: Type.Optional(Type.String({ format: 'email' })),
});

export type UserType = Static<typeof User>;

export const userSchema = new Schema<UserType>({
  name: { type: String, required: true },
  mail: { type: String, required: false },
});

export const UserModel = model<UserType>('User', userSchema);