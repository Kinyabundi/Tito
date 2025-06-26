import { SubscriptionRepository } from "../repositories/subscription.repository";
import { ISubscription, SubscriptionStatus } from "../models/subscription.model";
import { logger } from "../logger/winston";
import mongoose from "mongoose";

export class SubscriptionManagementService {
	private subscriptionRepository: SubscriptionRepository;

	constructor() {
		this.subscriptionRepository = new SubscriptionRepository();
	}

	async createSubscription(subscriptionData: { userId: string; serviceId: string, startDate: string }): Promise<ISubscription> {
		const start_date = new Date(subscriptionData.startDate);

		const subscription_data = {
			user_id: new mongoose.Types.ObjectId(subscriptionData.userId),
			service_id: new mongoose.Types.ObjectId(subscriptionData.serviceId),
			status: SubscriptionStatus.PENDING,
			start_date: start_date,
			auto_renew: true,
		};

		return await this.subscriptionRepository.create(subscription_data);
	}

	async getSubscriptionById(subscriptionId: string): Promise<ISubscription | null> {
		return await this.subscriptionRepository.findById(subscriptionId);
	}

	async getUserSubscriptions(userId: string): Promise<ISubscription[]> {
		return await this.subscriptionRepository.findByUserId(userId);
	}

	async getActiveUserSubscriptions(userId: string): Promise<ISubscription[]> {
		return await this.subscriptionRepository.findActiveByUserId(userId);
	}

	async cancelSubscription(subscriptionId: string): Promise<ISubscription | null> {
		const subscription = await this.subscriptionRepository.cancelSubscription(subscriptionId);
		if (subscription) {
			logger.info(`Subscription cancelled: ${subscriptionId}}`);
		}
		return subscription;
	}
}
