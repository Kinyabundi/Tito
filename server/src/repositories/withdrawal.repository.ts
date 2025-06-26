import mongoose from "mongoose";
import { Withdrawal, IWithdrawal } from "../models/withdrawal.model";

export class WithdrawalRepository {
  async create(withdrawalData: Omit<IWithdrawal, '_id' | 'createdAt' | 'updatedAt'>): Promise<IWithdrawal> {
    const withdrawal = new Withdrawal({
      _id: new mongoose.Types.ObjectId(),
      ...withdrawalData,
    });
    return await withdrawal.save();
  }

  async findByProviderId(providerId: string): Promise<IWithdrawal[]> {
    return await Withdrawal.find({ provider_id: new mongoose.Types.ObjectId(providerId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(id: string, status: string, transaction_hash?: string, paid_at?: Date): Promise<IWithdrawal | null> {
    const update: any = { status };
    if (transaction_hash) update.transaction_hash = transaction_hash;
    if (paid_at) update.paid_at = paid_at;
    return await Withdrawal.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { $set: update },
      { new: true }
    ).exec();
  }
} 