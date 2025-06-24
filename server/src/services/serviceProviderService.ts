
import { ServiceProviderRepository } from '../repositories/service-provider.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { IServiceProvider } from '../models/service-provider.model';
import { IService } from '../models/services.model';
import { logger } from '../logger/winston';

export class ServiceProviderService {
  private serviceProviderRepository: ServiceProviderRepository;
  private serviceRepository: ServiceRepository;

  constructor() {
    this.serviceProviderRepository = new ServiceProviderRepository();
    this.serviceRepository = new ServiceRepository();
  }

  async createProvider(providerData: {
    name: string;
    wallet_address: string;
    webhook_url?: string;
  }): Promise<IServiceProvider> {
    try {
      // Check if provider already exists
      const existingProvider = await this.serviceProviderRepository.findByWalletAddress(providerData.wallet_address);
      if (existingProvider) {
        throw new Error('Service provider with this email already exists');
      }

      const provider = await this.serviceProviderRepository.create({
        ...providerData,
      });

      logger.info(`Service provider created: ${provider.name} (${provider.wallet_address})`);
      return provider;
    } catch (error) {
      logger.error('Error creating service provider:', error);
      throw error;
    }
  }


  async getProviderById(id: string): Promise<IServiceProvider | null> {
    return await this.serviceProviderRepository.findById(id);
  }

  async getProviderServices(providerId: string): Promise<IService[]> {
    return await this.serviceRepository.findByProviderId(providerId);
  }

  async updateProvider(providerId: string, updates: Partial<IServiceProvider>): Promise<IServiceProvider | null> {
    return await this.serviceProviderRepository.updateProvider(providerId, updates);
  }

  async findByWalletAddress(walletAddress: string): Promise<IServiceProvider | null> {
    return await this.serviceProviderRepository.findByWalletAddress(walletAddress);
  }

  async getAllProviders(page: number = 1, limit: number = 10): Promise<{ providers: IServiceProvider[], total: number }> {
    return await this.serviceProviderRepository.findAll(page, limit);
  }
}