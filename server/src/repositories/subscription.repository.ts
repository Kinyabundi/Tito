import mongoose from 'mongoose';
import { Subscription, ISubscription } from '../models/subscription.model';

export class SubscriptionRepository {
  async create(subscriptionData: Omit<ISubscription, '_id' | 'createdAt' | 'updatedAt' | 'payment_history'>): Promise<ISubscription> {
    const subscription = new Subscription({
      _id: new mongoose.Types.ObjectId(),
      ...subscriptionData,
    });
    return await subscription.save();
  }

  async findById(id: string): Promise<ISubscription | null> {
    return await Subscription.findById(new mongoose.Types.ObjectId(id))
      .populate('service_id')
      .populate('provider_id')
      .exec();
  }

  async findByUserId(userId: string): Promise<ISubscription[]> {
    return await Subscription.find({ user_id: userId })
      .populate('service_id')
      .populate('provider_id')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActiveByUserId(userId: string): Promise<ISubscription[]> {
    return await Subscription.find({ 
      user_id: userId, 
      status: { $in: ['active', 'trial'] }
    })
      .populate('service_id')
      .populate('provider_id')
      .exec();
  }

  async findByServiceId(serviceId: string): Promise<ISubscription[]> {
    return await Subscription.find({ service_id: new mongoose.Types.ObjectId(serviceId) })
      .populate('service_id')
      .populate('provider_id')
      .exec();
  }

  async findExpiringSubscriptions(beforeDate: Date): Promise<ISubscription[]> {
    return await Subscription.find({
      end_date: { $lte: beforeDate },
      status: { $in: ['active', 'trial'] }
    })
      .populate('service_id')
      .populate('provider_id')
      .exec();
  }

  async findSubscriptionsDueForBilling(beforeDate: Date): Promise<ISubscription[]> {
    return await Subscription.find({
      next_billing_date: { $lte: beforeDate },
      status: 'active',
      auto_renew: true
    })
      .populate('service_id')
      .populate('provider_id')
      .exec();
  }

  async updateSubscription(id: string, updates: Partial<ISubscription>): Promise<ISubscription | null> {
    return await Subscription.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { $set: updates },
      { new: true }
    )
      .populate('service_id')
      .populate('provider_id')
      .exec();
  }

  async addPaymentHistory(id: string, payment: any): Promise<ISubscription | null> {
    return await Subscription.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { $push: { payment_history: payment } },
      { new: true }
    ).exec();
  }

  async cancelSubscription(id: string, reason?: string): Promise<ISubscription | null> {
    return await Subscription.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { 
        $set: { 
          status: 'cancelled',
          cancellation_date: new Date(),
          cancellation_reason: reason || 'User requested',
          auto_renew: false
        }
      },
      { new: true }
    ).exec();
  }

  async findUserServiceSubscription(userId: string, serviceId: string): Promise<ISubscription | null> {
    return await Subscription.findOne({
      user_id: userId,
      service_id: new mongoose.Types.ObjectId(serviceId),
      status: { $in: ['active', 'trial'] }
    })
      .populate('service_id')
      .populate('provider_id')
      .exec();
  }
}