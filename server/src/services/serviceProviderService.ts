import { ServiceProviderRepository } from "../repositories/service-provider.repository";
import { ServiceRepository } from "../repositories/service.repository";
import { IServiceProvider } from "../models/service-provider.model";
import { IService } from "../models/services.model";
import { logger } from "../logger/winston";
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { CDP_API_KEY, CDP_API_KEY_SECRET, WALLET_MNEMONIC_PHRASE } from "src/constants";
import Decimal from "decimal.js";

Coinbase.configure({ apiKeyName: CDP_API_KEY, privateKey: CDP_API_KEY_SECRET.replace(/\\n/g, "\n") });

export class ServiceProviderService {
	private serviceProviderRepository: ServiceProviderRepository;
	private serviceRepository: ServiceRepository;

	constructor() {
		this.serviceProviderRepository = new ServiceProviderRepository();
		this.serviceRepository = new ServiceRepository();
	}

	async createProvider(providerData: { name: string; wallet_address: string; webhook_url?: string }): Promise<IServiceProvider> {
		try {
			// Check if provider already exists
			const existingProvider = await this.serviceProviderRepository.findByWalletAddress(providerData.wallet_address);
			if (existingProvider) {
				throw new Error("Service provider with this email already exists");
			}

			const provider = await this.serviceProviderRepository.create({
				...providerData,
			});

			logger.info(`Service provider created: ${provider.name} (${provider.wallet_address})`);
			return provider;
		} catch (error) {
			logger.error("Error creating service provider:", error);
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

	async getAllProviders(page: number = 1, limit: number = 10): Promise<{ providers: IServiceProvider[]; total: number }> {
		return await this.serviceProviderRepository.findAll(page, limit);
	}

	async searchProvidersByName(name: string): Promise<IServiceProvider[]> {
		return await this.serviceProviderRepository.searchByName(name);
	}

	async withdrawAmounts(wallet_address: string) {
		const walletInfo = await Wallet.import({
			mnemonicPhrase: WALLET_MNEMONIC_PHRASE!,
		});

		const trf = await walletInfo.createTransfer({ amount: new Decimal(1).toNumber(), assetId: Coinbase.assets.Usdc, destination: wallet_address });

		try {
			await trf.wait();

			return trf.getTransaction().getTransactionHash();
		} catch (err) {
			console.log("TRF Error", err);
			return null;
		}
	}
}
