import { Static, Type } from '@sinclair/typebox';
import { Schema, model } from 'mongoose';

export const User = Type.Object({
  name: Type.String(),
  mail: Type.String({ format: 'email' }),
  // Minimum eight characters, at least one letter and one number
  password: Type.String(),
  bio: Type.Optional(Type.String()),
});

export type UserType = Static<typeof User>;

export const userSchema = new Schema<UserType>({
  name: { type: String, required: true },
  mail: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String, required: false },
});

export const UserModel = model<UserType>('User', userSchema);
