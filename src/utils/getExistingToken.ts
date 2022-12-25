import { TokenModel } from '../schemas/Token';
import { UserType } from '../schemas/User';

/**
 * Gets an existing token from the database
 */
export const getExistingToken = async (userId: string) => {
  const token = await TokenModel.findOne({ user: userId })
    .populate<{ user: UserType }>('user')
    .exec();

  if (token) {
    if (new Date(token.expiresAt) > new Date()) {
      return token;
    }
    await token.remove();
    return null;
  }
  return null;
};

export const getExistingTokenId = async (token: string) => {
  const t = await TokenModel.findById(token)
    .populate<{ user: UserType }>('user')
    .exec();

  if (t) {
    if (new Date(t.expiresAt) > new Date()) {
      return t;
    }
    await t.remove();
    return null;
  }
  return null;
};

export default getExistingToken;
