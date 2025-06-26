import { ServiceProviderRepository } from "../repositories/service-provider.repository";
import { ServiceRepository } from "../repositories/service.repository";
import { IServiceProvider } from "../models/service-provider.model";
import { IService } from "../models/services.model";
import { logger } from "../logger/winston";
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { CDP_API_KEY, CDP_API_KEY_SECRET, WALLET_MNEMONIC_PHRASE } from "src/constants";
import Decimal from "decimal.js";
import { WithdrawalRepository } from "../repositories/withdrawal.repository";
import { PaymentTransactionRepository } from "../repositories/payment-transaction.repository";

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

	async withdrawAmounts(wallet_address: string, amount: number) {
		const withdrawalRepo = new WithdrawalRepository();
		const paymentTxRepo = new PaymentTransactionRepository();
		// Find provider by wallet address
		const provider = await this.serviceProviderRepository.findByWalletAddress(wallet_address);
		if (!provider) throw new Error("Provider not found");
		// Find all completed, unwithdrawn payment transactions for this provider
		const eligibleTxs = await paymentTxRepo.findCompletedUnwithdrawnByProviderId(provider._id.toString());
		const totalAvailable = eligibleTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
		if (totalAvailable <= 0) throw new Error("No eligible funds available for withdrawal.");
		if (amount > totalAvailable) throw new Error(`Requested amount exceeds available funds. Max: $${totalAvailable}`);
		// Record withdrawal request as pending
		const withdrawal = await withdrawalRepo.create({
			provider_id: provider._id,
			amount,
			status: "pending",
			requested_at: new Date(),
			metadata: {},
		});
		const walletInfo = await Wallet.import({
			mnemonicPhrase: WALLET_MNEMONIC_PHRASE!,
		});
		const trf = await walletInfo.createTransfer({ amount, assetId: Coinbase.assets.Usdc, destination: wallet_address });
		try {
			await trf.wait();
			const txHash = trf.getTransaction().getTransactionHash();
			// Mark withdrawal as paid
			await withdrawalRepo.updateStatus(withdrawal._id.toString(), "paid", txHash, new Date());
			// Mark all included payment transactions as withdrawn
			const includedTxIds = eligibleTxs.map(tx => tx._id.toString());
			await paymentTxRepo.bulkSetWithdrawalId(includedTxIds, withdrawal._id.toString());
			return txHash;
		} catch (err) {
			// Mark withdrawal as failed
			await withdrawalRepo.updateStatus(withdrawal._id.toString(), "failed");
			console.log("TRF Error", err);
			return null;
		}
	}
}
