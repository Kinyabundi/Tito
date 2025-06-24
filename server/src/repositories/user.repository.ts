import mongoose from 'mongoose';
import { User, IUser } from '../models/user.model';

export class UserRepository {
  async create(userData: Omit<IUser, '_id' |'createdAt'| 'updatedAt'>): Promise<IUser> {
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      ...userData,
    });
    return await user.save();
  }

  async findByTelegramId(tg_user_id: string): Promise<IUser | null> {
    return await User.findOne({ tg_user_id }).exec();
  }

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(new mongoose.Types.ObjectId(id)).exec();
  }

   async findByWalletAddress(primary_wallet_address: string): Promise<IUser | null> {
    return await User.findOne({
			primary_wallet_address: { $regex: `^${primary_wallet_address}$`, $options: "i" },
		});
  }

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { $set: updates },
      { new: true }
    ).exec();
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await User.deleteOne({ _id: new mongoose.Types.ObjectId(id) }).exec();
    return result.deletedCount > 0;
  }

  async findAll(): Promise<IUser[]> {
    return await User.find().exec();
  }
}