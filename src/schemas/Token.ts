import { Schema, model, Types } from 'mongoose';

export type Token = {
  user: Types.ObjectId;
  createdAt: string;
  expiresAt: string;
};

export const tokenSchema = new Schema<Token>({
  user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  createdAt: { type: String, required: true },
  expiresAt: { type: String, required: true },
});

export const TokenModel = model<Token>('Token', tokenSchema);
