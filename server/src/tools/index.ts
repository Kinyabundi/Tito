import { tool } from "@langchain/core/tools";
import { RunnableConfig } from "@langchain/core/runnables";
import { z } from "zod";
import { createCDPAccount } from "src/helpers/cdp";
import { ServiceProviderService } from "src/services/serviceProviderService";
import { ServiceManagementService } from "src/services/serviceManagementService";
import { SubscriptionManagementService } from "src/services/subscriptionManagementService";
import { UserService } from "src/services/userService";
import mongoose from "mongoose";
import { IService } from "src/models/services.model";

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
				console.log('sub', sub)
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
		description: "Fetches the user's active or pending subscriptions, listing the provider and service involved.",
		schema: z.object({}),
	}
);
