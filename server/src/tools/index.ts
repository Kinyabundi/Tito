import { tool } from "@langchain/core/tools";
import { RunnableConfig } from "@langchain/core/runnables";
import { z } from "zod";
import { createCDPAccount, importCDPAccount } from "src/helpers/cdp";
import { ServiceProviderService } from "src/services/serviceProviderService";
import { ServiceManagementService } from "src/services/serviceManagementService";
import { SubscriptionManagementService } from "src/services/subscriptionManagementService";
import { UserService } from "src/services/userService";
import mongoose from "mongoose";
import { axiosPaymentApi } from "src/lib/axios";
import { decodeXPaymentResponse } from "x402-axios";
import { PaymentTransactionRepository } from "src/repositories/payment-transaction.repository";

export const fetchAllServiceProvidersTool = tool(
	async ({}, config: RunnableConfig) => {
		const service = new ServiceProviderService();
		const { providers, total } = await service.getAllProviders(1, 1000);
		if (!providers.length) {
			return "No service providers found.";
		}
		let response = `Service Providers (${total} total):\n`;
		providers.forEach((provider) => {
			response += `- ${provider.name || "N/A"}\n`;
		});
		return response;
	},
	{
		name: "fetchAllServiceProvidersTool",
		description: "Fetches and lists the names of all available service providers for Tito AI agent. No pagination.",
		schema: z.object({}),
	}
);

export const fetchServicesByProviderNameTool = tool(
	async ({ providerName, query }, config: RunnableConfig) => {
		const serviceMngr = new ServiceManagementService();
		const services = await serviceMngr.searchServicesByProviderName(providerName, query || "");
		if (!services.length) {
			return `No services found for provider '${providerName}' with query '${query || ""}'.`;
		}
		let response = `Services offered by '${providerName}' matching '${query || "all"}':\n`;
		services.forEach((service, idx) => {
			response += `#${idx + 1}: ${service.name}\n`;
			if (service.description) response += `  Description: ${service.description}\n`;
			if (service.pricing) {
				response += `  Pricing: $${service.pricing.amount} per ${service.pricing.billing_cycle}\n`;
			}
			if (service.trial_period_days && service.trial_period_days > 0) {
				response += `  Trial: Yes (${service.trial_period_days} days)\n`;
			} else {
				response += `  Trial: No\n`;
			}
			response += `-----------------------------\n`;
		});
		return response;
	},
	{
		name: "fetchServicesByProviderNameTool",
		description: "Fetches services offered by a given service provider (by name, natural language). Optionally filter by service name/description. Returns detailed info including pricing, billing, and trial.",
		schema: z.object({
			providerName: z.string().describe("The name of the service provider, e.g., 'Netflix'."),
			query: z.string().optional().describe("Text to search for in the service name/description."),
		}),
	}
);

export const setupServiceSubscriptionTool = tool(
	async ({ providerName, serviceName, startDate }, config: RunnableConfig) => {
		let userTelegramId = config["configurable"]["user_id"];
		if (!userTelegramId) {
			return "Missing user Telegram ID. Please provide your Telegram user ID.";
		}
		// 2. Preload user info
		const userService = new UserService();
		const user = await userService.getUserByTelegramId(userTelegramId);
		if (!user) {
			return `No user found for Telegram ID '${userTelegramId}'. Please register first.`;
		}
		// 3. Check providerName
		if (!providerName) {
			return "Missing provider name. Please specify the service provider (e.g., 'Netflix').";
		}
		// 4. Find provider
		const providerService = new ServiceProviderService();
		const providers = await providerService.searchProvidersByName(providerName);
		if (!providers.length) {
			return `No provider found matching '${providerName}'. Please provide the provider name.`;
		}
		const provider = providers[0];
		// 5. Check serviceName
		if (!serviceName) {
			return `Missing service name. Please specify the service you want to subscribe to from '${provider.name}'.`;
		}
		// 6. Find service for provider
		const serviceMngr = new ServiceManagementService();
		const services = await serviceMngr.searchServicesByProviderName(provider.name, serviceName);
		if (!services.length) {
			return `No service found matching '${serviceName}' for provider '${provider.name}'.`;
		}
		const service = services[0];
		// 7. Check startDate
		if (!startDate) {
			return "Missing start date. Please provide when you want your subscription to start (e.g., 'tomorrow', 'June 1', 'next Monday').";
		}
		// 8. Create subscription
		const subMngr = new SubscriptionManagementService();
		const subscription = await subMngr.createSubscription({ userId: (user as any)._id.toString(), serviceId: (service as any)._id.toString(), startDate });
		return `Subscription created!\n- User: ${user.tg_user_id}\n- Provider: ${provider.name}\n- Service: ${service.name}\n- Status: ${subscription.status}\n- Start Date (as provided): ${startDate}`;
	},
	{
		name: "setupServiceSubscriptionTool",
		description: "Sets up a subscription for a service. Requires provider name, service name, start date. Validates all data.",
		schema: z.object({
			providerName: z.string().describe("The name of the service provider, e.g., 'Netflix'."),
			serviceName: z.string().describe("The name of the service to subscribe to, e.g., 'Premium Plan'."),
			startDate: z.string().describe("Start date for the subscription in ISO format (e.g., 2024-06-01T00:00:00.000Z)."),
		}),
	}
);

export const fetchUserActiveSubscriptionsTool = tool(
	async ({}, config: RunnableConfig) => {
		let userTelegramId = config["configurable"]["user_id"];
		try {
			if (!userTelegramId) {
				return "Missing user Telegram ID. Please provide your Telegram user ID.";
			}
			// Preload user info
			const userService = new UserService();
			const user = await userService.getUserByTelegramId(userTelegramId);
			if (!user) {
				return `No user found for Telegram ID '${userTelegramId}'. Please register first.`;
			}
			// Get active subscriptions
			const subMngr = new SubscriptionManagementService();
			const activeSubs = await subMngr.getActiveUserSubscriptions((user as any)._id.toString());
			if (!activeSubs.length) {
				return "You have no active or pending subscriptions.";
			}
			// For each subscription, fetch service and provider
			const serviceMngr = new ServiceManagementService();
			const providerService = new ServiceProviderService();
			let response = `Your active/pending subscriptions:\n`;
			for (const sub of activeSubs) {
				console.log("sub", sub);
				const service = await serviceMngr.getServiceById(String(sub.service_id));
				let providerName = "Unknown";
				if (service && service.provider_id) {
					let provider;
					if (mongoose.isValidObjectId(service.provider_id)) {
						provider = await providerService.getProviderById(service.provider_id.toString());
					} else if (typeof service.provider_id === "object" && "name" in service.provider_id) {
						provider = service.provider_id;
					}
					if (provider && provider.name) providerName = provider.name;
				}
				response += `- Provider: ${providerName}\n  Service: ${service ? service.name : "Unknown"}\n  Status: ${sub.status}\n-----------------------------\n`;
			}
			return response;
		} catch (err) {
			console.log("Errorro", err);
			return "Something went wrong";
		}
	},
	{
		name: "fetchUserActiveSubscriptionsTool",
		description: "Fetches all active or pending subscriptions for the user, including provider and service details, and returns them in a user-friendly format.",
		schema: z.object({}),
	}
);

export const payForActiveSubscriptionsTool = tool(
	async ({}, config: RunnableConfig) => {
		let userTelegramId = config["configurable"]["user_id"];
		try {
			if (!userTelegramId) {
				return "Missing user Telegram ID. Please provide your Telegram user ID.";
			}
			// Preload user info
			const userService = new UserService();
			const user = await userService.getUserByTelegramId(userTelegramId);
			if (!user) {
				return `No user found for Telegram ID '${userTelegramId}'. Please register first.`;
			}
			// Get active subscriptions
			const subMngr = new SubscriptionManagementService();
			const activeSubs = await subMngr.getActiveUserSubscriptions((user as any)._id.toString());
			if (!activeSubs.length) {
				return "You have no active or pending subscriptions.";
			}
			// For each subscription, fetch service and provider
			const serviceMngr = new ServiceManagementService();
			const providerService = new ServiceProviderService();
			const account = await importCDPAccount({ address: user.primary_wallet_address });
			const balances = await account.listTokenBalances({ network: "base-sepolia" });

			const results = [];
			const USDC_CONTRACT = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
			const usdcBalanceObj = balances.balances.find(
				(b: any) =>
					b.token.network === "base-sepolia" &&
					b.token.contractAddress.toLowerCase() === USDC_CONTRACT.toLowerCase()
			);
			const usdcBalance = usdcBalanceObj ? BigInt(usdcBalanceObj.amount.amount) : 0n;

			// Helper to calculate billing period end
			function calculateBillingPeriodEnd(start: Date, billingCycle: string): Date {
				switch (billingCycle) {
					case "daily":
						return new Date(start.getTime() + 24 * 60 * 60 * 1000);
					case "weekly":
						return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
					case "monthly": {
						const d = new Date(start);
						d.setMonth(d.getMonth() + 1);
						return d;
					}
					case "yearly": {
						const d = new Date(start);
						d.setFullYear(d.getFullYear() + 1);
						return d;
					}
					default:
						return start;
				}
			}

			const paymentTxRepo = new PaymentTransactionRepository();

			for (const sub of activeSubs) {
				const service = await serviceMngr.getServiceById(String(sub.service_id));
				let providerName = "Unknown";
				if (service && service.provider_id) {
					let provider;
					if (mongoose.isValidObjectId(service.provider_id)) {
						provider = await providerService.getProviderById(service.provider_id.toString());
					} else if (typeof service.provider_id === "object" && "name" in service.provider_id) {
						provider = service.provider_id;
					}
					if (provider && provider.name) providerName = provider.name;
				}
				if (!service) {
					results.push({ subscriptionId: sub._id, status: "Service not found" });
					continue;
				}
				const requiredAmount = BigInt(Math.floor(service.pricing.amount * 10 ** 6)); // USDC 6 decimals
				if (usdcBalance < requiredAmount) {
					results.push({ subscriptionId: sub._id, status: `Insufficient USDC balance. You have ${Number(usdcBalance) / 1e6} USDC, need ${service.pricing.amount} USDC.` });
					continue;
				}
				try {
					const rawResp = await axiosPaymentApi(account).get(`/subscriptions-k/pay/${sub._id.toString()}`);
					const resp = rawResp.data;
					const paymentResponse = decodeXPaymentResponse(rawResp.headers["x-payment-response"]);
					console.log('paymentResponse',paymentResponse)
					if (paymentResponse && paymentResponse.success) {
						// Record payment transaction
						const now = new Date();
						const billing_period_start = now;
						const billing_period_end = calculateBillingPeriodEnd(billing_period_start, service.pricing.billing_cycle);
						await paymentTxRepo.create({
							subscription_id: sub._id,
							amount: service.pricing.amount,
							transaction_hash: paymentResponse.transaction,
							status: "completed",
							payment_method: "x402",
							billing_period_start,
							billing_period_end,
							processed_at: now,
							metadata: {
								network: paymentResponse.network,
								payer: paymentResponse.payer,
							},
						});
						results.push({
							subscriptionId: sub._id,
							status: `Your subscription has been paid to ${providerName} for ${service.name} with transaction hash: ${paymentResponse.transaction}`
						});
					} else {
						results.push({ subscriptionId: sub._id, status: "Payment failed (unknown error)" });
					}
				} catch (err) {
					results.push({ subscriptionId: sub._id, status: `Payment failed: ${err}` });
				}
			}
			return results.map(r => `Subscription ${r.subscriptionId}: ${r.status}`).join("\n");
		} catch (err) {
			console.log("Errorro", err);
			return "Something went wrong";
		}
	},
	{
		name: "payForActiveSubscriptionsTool",
		description: "Automates payment for all of a user's active or pending subscriptions by checking their wallet balance and programmatically calling the payment API for each subscription. Returns a summary of the payment results.",
		schema: z.object({}),
	}
);

export const fetchUserPaymentHistoryTool = tool(
	async ({ page = 1, limit = 10 }, config: RunnableConfig) => {
		let userTelegramId = config["configurable"]["user_id"];
		if (!userTelegramId) {
			return "Missing user Telegram ID. Please provide your Telegram user ID.";
		}
		// Preload user info
		const userService = new UserService();
		const user = await userService.getUserByTelegramId(userTelegramId);
		if (!user) {
			return `No user found for Telegram ID '${userTelegramId}'. Please register first.`;
		}
		const paymentTxRepo = new PaymentTransactionRepository();
		// Find all subscriptions for this user
		const subMngr = new SubscriptionManagementService();
		const userSubs = await subMngr.getUserSubscriptions((user as any)._id.toString());
		const subIds = userSubs.map(s => s._id);
		// Fetch payment transactions for these subscriptions
		const allTxs = [];
		for (const subId of subIds) {
			const txs = await paymentTxRepo.findBySubscriptionId(subId.toString());
			allTxs.push(...txs);
		}
		// Sort by createdAt desc
		allTxs.sort((a, b) => b.createdAt - a.createdAt);
		// Paginate
		const pagedTxs = allTxs.slice((page - 1) * limit, page * limit);
		// For each transaction, fetch service and provider
		const serviceMngr = new ServiceManagementService();
		const providerService = new ServiceProviderService();
		let response = `Your payment transactions (page ${page}):\n`;
		for (const tx of pagedTxs) {
			let providerName = "Unknown";
			let serviceName = "Unknown";
			let service;
			if (tx.subscription_id) {
				const sub = userSubs.find(s => s._id.toString() === tx.subscription_id.toString());
				if (sub) {
					service = await serviceMngr.getServiceById(String(sub.service_id));
					if (service) {
						serviceName = service.name;
						if (service.provider_id) {
							let provider;
							if (mongoose.isValidObjectId(service.provider_id)) {
								provider = await providerService.getProviderById(service.provider_id.toString());
							} else if (typeof service.provider_id === "object" && "name" in service.provider_id) {
								provider = service.provider_id;
							}
							if (provider && provider.name) providerName = provider.name;
						}
					}
				}
			}
			response += `- Provider: ${providerName}\n  Service: ${serviceName}\n  Amount: $${tx.amount}\n  Status: ${tx.status}\n  Tx Hash: ${tx.transaction_hash || "N/A"}\n  Paid: ${tx.processed_at ? new Date(tx.processed_at).toLocaleString() : "N/A"}\n-----------------------------\n`;
		}
		if (!pagedTxs.length) response += "No payment transactions found.";
		return response;
	},
	{
		name: "fetchUserPaymentHistoryTool",
		description: "Fetches a paginated list of the user's payment transactions, including provider, service, amount, status, and transaction hash.",
		schema: z.object({
			page: z.number().optional().describe("Page number for pagination, default 1."),
			limit: z.number().optional().describe("Number of transactions per page, default 10."),
		}),
	}
);

export const fetchUserSubscriptionHistoryTool = tool(
	async ({}, config: RunnableConfig) => {
		let userTelegramId = config["configurable"]["user_id"];
		if (!userTelegramId) {
			return "Missing user Telegram ID. Please provide your Telegram user ID.";
		}
		// Preload user info
		const userService = new UserService();
		const user = await userService.getUserByTelegramId(userTelegramId);
		if (!user) {
			return `No user found for Telegram ID '${userTelegramId}'. Please register first.`;
		}
		const subMngr = new SubscriptionManagementService();
		const userSubs = await subMngr.getUserSubscriptions((user as any)._id.toString());
		if (!userSubs.length) {
			return "You have no subscriptions.";
		}
		const serviceMngr = new ServiceManagementService();
		const providerService = new ServiceProviderService();
		let response = `Your subscription history:\n`;
		for (const sub of userSubs) {
			let providerName = "Unknown";
			let serviceName = "Unknown";
			let service = await serviceMngr.getServiceById(String(sub.service_id));
			if (service) {
				serviceName = service.name;
				if (service.provider_id) {
					let provider;
					if (mongoose.isValidObjectId(service.provider_id)) {
						provider = await providerService.getProviderById(service.provider_id.toString());
					} else if (typeof service.provider_id === "object" && "name" in service.provider_id) {
						provider = service.provider_id;
					}
					if (provider && provider.name) providerName = provider.name;
				}
			}
			response += `- Provider: ${providerName}\n  Service: ${serviceName}\n  Status: ${sub.status}\n  Start Date: ${sub.start_date ? new Date(sub.start_date).toLocaleString() : "N/A"}\n-----------------------------\n`;
		}
		return response;
	},
	{
		name: "fetchUserSubscriptionHistoryTool",
		description: "Fetches all subscriptions (active, expired, cancelled, etc.) for the user, including provider, service, status, and start date.",
		schema: z.object({}),
	}
);
