import mongoose from "mongoose";
import { Subscription, ISubscription } from "../models/subscription.model";
import { ObjectId } from "mongodb";

export class SubscriptionRepository {
	async create(subscriptionData: Omit<ISubscription, "_id" | "createdAt" | "updatedAt" | "metadata">): Promise<ISubscription> {
		const subscription = new Subscription({
			_id: new mongoose.Types.ObjectId(),
			...subscriptionData,
		});
		return await subscription.save();
	}

	async findById(id: string): Promise<ISubscription | null> {
		return await Subscription.findById(new mongoose.Types.ObjectId(id)).exec();
	}

	async findByUserId(userId: string): Promise<ISubscription[]> {
		return await Subscription.find({ user_id: userId }).sort({ createdAt: -1 }).exec();
	}

	async findActiveByUserId(userId: string): Promise<ISubscription[]> {
		return await Subscription.find({
			user_id: new ObjectId(userId),
			status: { $in: ["active", "pending"] },
		}).exec();
	}

	async findByServiceId(serviceId: string): Promise<ISubscription[]> {
		return await Subscription.find({ service_id: new mongoose.Types.ObjectId(serviceId) }).exec();
	}

	async updateSubscription(id: string, updates: Partial<ISubscription>): Promise<ISubscription | null> {
		return await Subscription.findByIdAndUpdate(new mongoose.Types.ObjectId(id), { $set: updates }, { new: true }).populate("service_id").exec();
	}

	async cancelSubscription(id: string, reason?: string): Promise<ISubscription | null> {
		return await Subscription.findByIdAndUpdate(
			new mongoose.Types.ObjectId(id),
			{
				$set: {
					status: "cancelled",
					cancellation_date: new Date(),
					cancellation_reason: reason || "User requested",
					auto_renew: false,
				},
			},
			{ new: true }
		).exec();
	}

	async findUserServiceSubscription(userId: string, serviceId: string): Promise<ISubscription | null> {
		return await Subscription.findOne({
			user_id: userId,
			service_id: new mongoose.Types.ObjectId(serviceId),
			status: { $in: ["active", "pendind"] },
		}).exec();
	}
}
