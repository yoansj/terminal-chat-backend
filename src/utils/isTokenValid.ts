import { TokenModel } from '../schemas/Token';

/**
 * Checks if a token is valid
 */
export const isTokenValid = async (tokenId: string) => {
  const token = await TokenModel.findById(tokenId).exec();

  if (token) {
    if (new Date(token.expiresAt) > new Date()) {
      return true;
    } else {
      await token.remove();
      return false;
    }
  }
  return false;
};
