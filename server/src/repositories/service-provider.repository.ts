import mongoose from 'mongoose';
import { ServiceProvider, IServiceProvider } from '../models/service-provider.model';

export class ServiceProviderRepository {
  async create(providerData: Omit<IServiceProvider, '_id' | 'createdAt' | 'updatedAt'>): Promise<IServiceProvider> {
    const provider = new ServiceProvider({
      _id: new mongoose.Types.ObjectId(),
      ...providerData,
    });
    return await provider.save();
  }

  async findById(id: string): Promise<IServiceProvider | null> {
    return await ServiceProvider.findById(new mongoose.Types.ObjectId(id)).exec();
  }

  async findByWalletAddress(walletAddress: string): Promise<IServiceProvider | null> {
    return await ServiceProvider.findOne({ wallet_address: walletAddress }).exec();
  }

  async updateProvider(id: string, updates: Partial<IServiceProvider>): Promise<IServiceProvider | null> {
    return await ServiceProvider.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { $set: updates },
      { new: true }
    ).exec();
  }

  async deleteProvider(id: string): Promise<boolean> {
    const result = await ServiceProvider.deleteOne({ _id: new mongoose.Types.ObjectId(id) }).exec();
    return result.deletedCount > 0;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ providers: IServiceProvider[], total: number }> {
    const skip = (page - 1) * limit;
    const [providers, total] = await Promise.all([
      ServiceProvider.find().skip(skip).limit(limit).exec(),
      ServiceProvider.countDocuments().exec()
    ]);
    return { providers, total };
  }
}

