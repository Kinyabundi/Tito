import mongoose from 'mongoose';
import { ServiceProvider, IServiceProvider } from '../models/service-provider.model';
import { logger } from 'src/logger/winston';

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
  try {
    const provider = await ServiceProvider.findOne({ 	
      wallet_address: { $regex: `^${walletAddress}$`, $options: "i" }
    }).exec();
    
      return provider;
  } catch (error) {
    console.log(error)
    throw new Error(`Failed to find service provider: ${error.message}`);
  }
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

  async searchByName(name: string): Promise<IServiceProvider[]> {
    return await ServiceProvider.find({ $text: { $search: name } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .exec();
  }
}

