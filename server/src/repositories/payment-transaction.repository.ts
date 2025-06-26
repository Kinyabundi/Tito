import mongoose from 'mongoose';
import { PaymentTransaction, IPaymentTransaction } from '../models/payment-transaction.model';

export class PaymentTransactionRepository {
  async create(transactionData: Omit<IPaymentTransaction, '_id' | 'createdAt' | 'updatedAt'>): Promise<IPaymentTransaction> {
    const transaction = new PaymentTransaction({
      _id: new mongoose.Types.ObjectId(),
      ...transactionData,
    });
    return await transaction.save();
  }

  async findById(id: string): Promise<IPaymentTransaction | null> {
    return await PaymentTransaction.findById(new mongoose.Types.ObjectId(id))
      .populate('subscription_id')
      .populate('service_id')
      .populate('provider_id')
      .exec();
  }

  async findBySubscriptionId(subscriptionId: string): Promise<IPaymentTransaction[]> {
    return await PaymentTransaction.find({ subscription_id: new mongoose.Types.ObjectId(subscriptionId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<{ transactions: IPaymentTransaction[], total: number }> {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      PaymentTransaction.find({ user_id: userId })
        .populate('subscription_id')
        .populate('service_id')
        .populate('provider_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      PaymentTransaction.countDocuments({ user_id: userId }).exec()
    ]);
    return { transactions, total };
  }

  async findByStatus(status: string): Promise<IPaymentTransaction[]> {
    return await PaymentTransaction.find({ status })
      .populate('subscription_id')
      .populate('service_id')
      .populate('provider_id')
      .exec();
  }

  async findFailedTransactions(maxRetries: number = 3): Promise<IPaymentTransaction[]> {
    return await PaymentTransaction.find({
      status: 'failed',
      retry_count: { $lt: maxRetries }
    })
      .populate('subscription_id')
      .populate('service_id')
      .populate('provider_id')
      .exec();
  }

  async updateTransaction(id: string, updates: Partial<IPaymentTransaction>): Promise<IPaymentTransaction | null> {
    return await PaymentTransaction.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { $set: updates },
      { new: true }
    )
      .populate('subscription_id')
      .populate('service_id')
      .populate('provider_id')
      .exec();
  }

  async findCompletedUnwithdrawnByProviderId(providerId: string): Promise<IPaymentTransaction[]> {
    // Find all services for this provider
    const Service = require('../models/services.model').Service;
    const services = await Service.find({ provider_id: providerId }).exec();
    const serviceIds = services.map((s: any) => s._id);
    // Find all subscriptions for these services
    const Subscription = require('../models/subscription.model').Subscription;
    const subs = await Subscription.find({ service_id: { $in: serviceIds } }).exec();
    const subIds = subs.map((s: any) => s._id);
    // Find all completed, unwithdrawn payment transactions for these subscriptions
    return await PaymentTransaction.find({
      subscription_id: { $in: subIds },
      status: "completed",
      withdrawal_id: null,
    }).exec();
  }

  async bulkSetWithdrawalId(paymentTransactionIds: string[], withdrawalId: string): Promise<void> {
    await PaymentTransaction.updateMany(
      { _id: { $in: paymentTransactionIds } },
      { $set: { withdrawal_id: withdrawalId } }
    ).exec();
  }
}