import { Document } from './Document';
import { Static, Type } from '@sinclair/typebox';


export const User = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  password: Type.String(),
  _id: Type.Optional(Type.String()),
  _rev: Type.Optional(Type.String()),
});

export type UserType = Static<typeof User>;
