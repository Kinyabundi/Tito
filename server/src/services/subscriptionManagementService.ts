import { SubscriptionRepository } from '../repositories/subscription.repository';
import { PaymentTransactionRepository } from '../repositories/payment-transaction.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { ISubscription, SubscriptionStatus } from '../models/subscription.model';
import { IPaymentTransaction } from '../models/payment-transaction.model';
import { logger } from '../logger/winston';
import mongoose from 'mongoose';

export class SubscriptionManagementService {
	private subscriptionRepository: SubscriptionRepository;

	constructor() {
		this.subscriptionRepository = new SubscriptionRepository();
	}

	async createSubscription(userId: string, serviceId: string): Promise<ISubscription> {

		const start_date = new Date();

		const subscriptionData = {
			user_id: userId,
			service_id: new mongoose.Types.ObjectId(serviceId),
			status: SubscriptionStatus.INACTIVE,
			start_date: start_date,
			auto_renew: true, 
		};

		return await this.subscriptionRepository.create(subscriptionData);
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
