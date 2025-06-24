// src/services/subscriptionManagementService.ts - Final Fixed Version
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { PaymentTransactionRepository } from '../repositories/payment-transaction.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { ISubscription } from '../models/subscription.model';
import { IPaymentTransaction } from '../models/payment-transaction.model';
import { logger } from '../logger/winston';
import mongoose from 'mongoose';

export class SubscriptionManagementService {
  private subscriptionRepository: SubscriptionRepository;
  private paymentTransactionRepository: PaymentTransactionRepository;
  private serviceRepository: ServiceRepository;

  constructor() {
    this.subscriptionRepository = new SubscriptionRepository();
    this.paymentTransactionRepository = new PaymentTransactionRepository();
    this.serviceRepository = new ServiceRepository();
  }

  async createSubscription(subscriptionData: {
    user_id: string;
    service_id: string;
    payment_amount: number; // Amount actually paid via X402
    transaction_hash?: string; // X402 transaction hash
    trial_period?: boolean;
  }): Promise<ISubscription> {
    try {
      const service = await this.serviceRepository.findById(subscriptionData.service_id);
      if (!service) {
        throw new Error('Service not found');
      }

      // Check if user already has active subscription
      const existingSubscription = await this.subscriptionRepository.findUserServiceSubscription(
        subscriptionData.user_id,
        subscriptionData.service_id
      );
      if (existingSubscription) {
        throw new Error('User already has an active subscription to this service');
      }

      // Calculate dates
      const startDate = new Date();
      const isTrialPeriod = subscriptionData.trial_period && service.trial_period_days > 0;
      
      let endDate = new Date(startDate);
      let nextBillingDate = new Date(startDate);
      let trialEndDate: Date | undefined;

      if (isTrialPeriod) {
        trialEndDate = new Date(startDate);
        trialEndDate.setDate(trialEndDate.getDate() + service.trial_period_days);
        endDate = new Date(trialEndDate);
        nextBillingDate = new Date(trialEndDate);
      } else {
        // Set billing cycle for paid subscription
        switch (service.pricing.billing_cycle) {
          case 'daily':
            endDate.setDate(endDate.getDate() + 1);
            nextBillingDate.setDate(nextBillingDate.getDate() + 1);
            break;
          case 'weekly':
            endDate.setDate(endDate.getDate() + 7);
            nextBillingDate.setDate(nextBillingDate.getDate() + 7);
            break;
          case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            break;
          case 'yearly':
            endDate.setFullYear(endDate.getFullYear() + 1);
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
            break;
        }
      }

      // Create subscription data without payment_history (let Mongoose handle initialization)
      const subscriptionCreateData = {
        user_id: subscriptionData.user_id,
        service_id: new mongoose.Types.ObjectId(service._id.toString()),
        provider_id: new mongoose.Types.ObjectId(service.provider_id.toString()),
        status: isTrialPeriod ? 'trial' as 'trial' : 'active' as 'active',
        start_date: startDate,
        end_date: endDate,
        next_billing_date: nextBillingDate,
        amount_paid: subscriptionData.payment_amount,
        trial_end_date: trialEndDate,
        auto_renew: true,
        payment_history: [
            
        ], 
      };

      const subscription = await this.subscriptionRepository.create(subscriptionCreateData);

      // Record the initial payment transaction (X402 payment)
      await this.paymentTransactionRepository.create({
        subscription_id: new mongoose.Types.ObjectId(subscription._id.toString()),
        user_id: subscriptionData.user_id,
        service_id: new mongoose.Types.ObjectId(service._id.toString()),
        provider_id: new mongoose.Types.ObjectId(service.provider_id.toString()),
        amount: subscriptionData.payment_amount,
        status: 'completed',
        payment_method: 'x402',
        billing_period_start: startDate,
        billing_period_end: endDate,
        transaction_hash: subscriptionData.transaction_hash,
        processed_at: new Date(),
      });

      logger.info(`Subscription created for user ${subscriptionData.user_id} to service ${service.name}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  async getUserSubscriptions(userId: string): Promise<ISubscription[]> {
    return await this.subscriptionRepository.findByUserId(userId);
  }

  async getActiveUserSubscriptions(userId: string): Promise<ISubscription[]> {
    return await this.subscriptionRepository.findActiveByUserId(userId);
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<ISubscription | null> {
    const subscription = await this.subscriptionRepository.cancelSubscription(subscriptionId, reason);
    if (subscription) {
      logger.info(`Subscription cancelled: ${subscriptionId} - Reason: ${reason || 'User requested'}`);
    }
    return subscription;
  }

  // For renewals - agent will call this after processing payment
  async renewSubscriptionAfterPayment(
    subscriptionId: string, 
    paymentAmount: number,
    transactionHash?: string
  ): Promise<ISubscription | null> {
    try {
      const subscription = await this.subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const service = await this.serviceRepository.findById(subscription.service_id.toString());
      if (!service) {
        throw new Error('Service not found');
      }

      // Calculate new dates
      const currentEndDate = subscription.end_date;
      const newEndDate = new Date(currentEndDate);
      const newNextBillingDate = new Date(currentEndDate);

      switch (service.pricing.billing_cycle) {
        case 'daily':
          newEndDate.setDate(newEndDate.getDate() + 1);
          newNextBillingDate.setDate(newNextBillingDate.getDate() + 1);
          break;
        case 'weekly':
          newEndDate.setDate(newEndDate.getDate() + 7);
          newNextBillingDate.setDate(newNextBillingDate.getDate() + 7);
          break;
        case 'monthly':
          newEndDate.setMonth(newEndDate.getMonth() + 1);
          newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);
          break;
        case 'yearly':
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          newNextBillingDate.setFullYear(newNextBillingDate.getFullYear() + 1);
          break;
      }

      // Update subscription
      const updatedSubscription = await this.subscriptionRepository.updateSubscription(subscriptionId, {
        status: 'active',
        end_date: newEndDate,
        next_billing_date: newNextBillingDate,
      });

      // Record payment transaction
      await this.paymentTransactionRepository.create({
        subscription_id: new mongoose.Types.ObjectId(subscription._id.toString()),
        user_id: subscription.user_id,
        service_id: new mongoose.Types.ObjectId(subscription.service_id.toString()),
        provider_id: new mongoose.Types.ObjectId(subscription.provider_id.toString()),
        amount: paymentAmount,
        status: 'completed',
        payment_method: 'x402',
        billing_period_start: currentEndDate,
        billing_period_end: newEndDate,
        transaction_hash: transactionHash,
        processed_at: new Date(),
      });

      logger.info(`Subscription renewed: ${subscriptionId}`);
      return updatedSubscription;
    } catch (error) {
      logger.error('Error renewing subscription:', error);
      throw error;
    }
  }

  // Check which subscriptions need renewal (for agent to process)
  async getSubscriptionsNeedingRenewal(): Promise<ISubscription[]> {
    const now = new Date();
    return await this.subscriptionRepository.findSubscriptionsDueForBilling(now);
  }

  // Check expiring subscriptions (for notifications)
  async getExpiringSubscriptions(daysAhead: number = 3): Promise<ISubscription[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return await this.subscriptionRepository.findExpiringSubscriptions(futureDate);
  }

  async getSubscriptionById(id: string): Promise<ISubscription | null> {
    return await this.subscriptionRepository.findById(id);
  }

  async getSubscriptionTransactions(subscriptionId: string): Promise<IPaymentTransaction[]> {
    return await this.paymentTransactionRepository.findBySubscriptionId(subscriptionId);
  }

  async getUserTransactions(userId: string, page: number = 1, limit: number = 10): Promise<{ transactions: IPaymentTransaction[], total: number }> {
    return await this.paymentTransactionRepository.findByUserId(userId, page, limit);
  }

  // Expose repositories for cron jobs
  getSubscriptionRepository(): SubscriptionRepository {
    return this.subscriptionRepository;
  }

  getPaymentTransactionRepository(): PaymentTransactionRepository {
    return this.paymentTransactionRepository;
  }
}