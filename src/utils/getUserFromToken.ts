import { UserType } from '../schemas/User';
import { TokenModel } from '../schemas/Token';

const getUserFromToken = async (tokenHeader: string) => {
  const tokenId = tokenHeader.split('Bearer ')[1];
  const token = await TokenModel.findById(tokenId)
    .populate<{ user: UserType }>('user')
    .exec();
  if (token) {
    return token.user;
  }
  return null;
};

export default getUserFromToken;
