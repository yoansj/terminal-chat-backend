import { TokenModel } from '../schemas/Token';

/**
 * Creates a new token to be used for authentication
 */
export const createToken = async (user: string) => {
  const token = await new TokenModel({
    user: user,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24,
    ).toISOString(),
  });

  await token.save();

  return token._id;
};
