import { tool } from "@langchain/core/tools";
import { RunnableConfig } from "@langchain/core/runnables";
import { z } from "zod";
import { createCDPAccount } from "src/helpers/cdp";
import { ServiceProviderService } from "src/services/serviceProviderService";
import { ServiceManagementService } from "src/services/serviceManagementService";

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
		console.log(response)
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
