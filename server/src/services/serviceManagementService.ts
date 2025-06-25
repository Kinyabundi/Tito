import { ServiceRepository } from "../repositories/service.repository";
import { ServiceProviderRepository } from "../repositories/service-provider.repository";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { IService } from "../models/services.model";
import { logger } from "src/logger/winston";

export class ServiceManagementService {
	private serviceRepository: ServiceRepository;
	private serviceProviderRepository: ServiceProviderRepository;
	private subscriptionRepository: SubscriptionRepository;

	constructor() {
		this.serviceRepository = new ServiceRepository();
		this.serviceProviderRepository = new ServiceProviderRepository();
		this.subscriptionRepository = new SubscriptionRepository();
	}

	async createService(serviceData: {
		provider_id: any;
		name: string;
		description?: string;
		pricing: {
			amount: number;
			billing_cycle: "daily" | "weekly" | "monthly" | "yearly";
		};
		status?: "active" | "inactive";
		features?: string[];
		trial_period_days?: number;
		metadata?: Record<string, string>;
	}): Promise<IService> {
		try {
			// Verify provider exists and is active
			const provider = await this.serviceProviderRepository.findById(serviceData.provider_id);
			if (!provider) {
				throw new Error("Service provider not found");
			}

			const service = await this.serviceRepository.create(serviceData);
			logger.info(`Service created: ${service.name} by provider ${provider.name}`);
			return service;
		} catch (error) {
			logger.error("Error creating service:", error);
			throw error;
		}
	}

	async updateService(serviceId: string, updates: Partial<IService>): Promise<IService | null> {
		return await this.serviceRepository.updateService(serviceId, updates);
	}

	async deleteService(serviceId: string): Promise<boolean> {
		// Check for active subscriptions
		const activeSubscriptions = await this.subscriptionRepository.findByServiceId(serviceId);
		const hasActiveSubscriptions = activeSubscriptions.some((sub) => ["active", "trial"].includes(sub.status));

		if (hasActiveSubscriptions) {
			throw new Error("Cannot delete service with active subscriptions");
		}

		return await this.serviceRepository.deleteService(serviceId);
	}

	async getServiceById(id: string): Promise<IService | null> {
		return await this.serviceRepository.findById(id);
	}

	async getServiceByEndpoint(endpoint: string): Promise<IService | null> {
		return await this.serviceRepository.findByEndpoint(endpoint);
	}

	async getServicesByProvider(providerId: string): Promise<IService[]> {
		return await this.serviceRepository.findByProviderId(providerId);
	}

	async searchServices(query: string, category?: string): Promise<IService[]> {
		return await this.serviceRepository.searchServices(query, category);
	}

	async getActiveServices(): Promise<IService[]> {
		return await this.serviceRepository.findActiveServices();
	}

	async searchServicesByProviderName(providerName: string, query: string): Promise<IService[]> {
		const providers = await this.serviceProviderRepository.searchByName(providerName);
		console.log('providers', providers)
		if (!providers.length) return [];
		// Use the top scoring provider
		const provider = providers[0];
		return await this.serviceRepository.searchByProviderAndQuery(String(provider._id), query);
	}
}
