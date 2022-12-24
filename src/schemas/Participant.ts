import { Static, Type } from '@sinclair/typebox';
import { User } from './User';

export const Participant = Type.Object({
  user: User,
  socketId: Type.String(),
});

export type ParticipantType = Static<typeof Participant>;
