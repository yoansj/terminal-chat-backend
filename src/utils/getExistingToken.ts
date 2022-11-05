import { TokenModel } from '../schemas/Token';

/**
 * Gets an existing token from the database
 */
export const getExistingToken = async (userId: string) => {
  const token = await TokenModel.findOne({ user: userId }).exec();

  if (token) {
    if (new Date(token.expiresAt) > new Date()) {
      return token._id;
    } else {
      await token.remove();
      return null;
    }
  }
  return null;
};
