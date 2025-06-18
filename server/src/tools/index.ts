import { tool } from "@langchain/core/tools";
import { RunnableConfig } from "@langchain/core/runnables";
import { z } from "zod";
import { RentService } from "src/services/rentService";

export const rentRegisterTool = tool(
	async ({ amount }, config: RunnableConfig) => {
		const rentService = new RentService();
		rentService.register();

		return `Rent Registration completed successfully`;
	},
	{
		name: "rentRegistrationTool",
		description: "Registers a new rent service with amount",
		schema: z.object({ amount: z.number().positive().describe("Rent amount in USD") }),
	}
);
