import { Service, IService } from '../models/services.model';
import mongoose from 'mongoose';


export class ServiceRepository {
  async create(serviceData: Omit<IService, '_id' | 'createdAt'  | 'updatedAt'| 'features'| 'trial_period_days' | 'status' | 'metadata'>): Promise<IService> {
    const service = new Service({
      _id: new mongoose.Types.ObjectId(),
      ...serviceData,
    });
    return await service.save();
  }

  async findById(id: string): Promise<IService | null> {
    return await Service.findById(new mongoose.Types.ObjectId(id))
      .populate('provider_id')
      .exec();
  }

  async findByProviderId(providerId: string): Promise<IService[]> {
    return await Service.find({ provider_id: new mongoose.Types.ObjectId(providerId) })
      .populate('provider_id')
      .exec();
  }
  async findByEndpoint(endpoint: string): Promise<IService | null> {
    return await Service.findOne({ 'x402_config.endpoint': endpoint })
      .populate('provider_id')
      .exec();
  }

  async findActiveServices(): Promise<IService[]> {
    return await Service.find({ status: 'active' })
      .populate('provider_id')
      .exec();
  }

  async updateService(id: string, updates: Partial<IService>): Promise<IService | null> {
    return await Service.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { $set: updates },
      { new: true }
    ).populate('provider_id').exec();
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await Service.deleteOne({ _id: new mongoose.Types.ObjectId(id) }).exec();
    return result.deletedCount > 0;
  }

  async searchServices(query: string, category?: string): Promise<IService[]> {
    const searchCriteria: any = {
      status: 'active',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };

    if (category) {
      searchCriteria.category = category;
    }

    return await Service.find(searchCriteria)
      .populate('provider_id')
      .exec();
  }
}