import { tool } from "@langchain/core/tools";
import { RunnableConfig } from "@langchain/core/runnables";
import { z } from "zod";
import { addRecurringPayment, updateRecurringPayment } from "src/helpers/db";
import { createCDPAccount } from "src/helpers/cdp";

export const rentRegisterTool = tool(
	async ({ amount }, config: RunnableConfig) => {
		const user_id = config["configurable"]["user_id"];
		// const rentService = new RentService();
		// rentService.register();

		return `Rent Registration completed successfully`;
	},
	{
		name: "rentRegistrationTool",
		description: "Registers a new rent service with amount",
		schema: z.object({ amount: z.number().positive().describe("Rent amount in USD") }),
	}
);

export const setupRecurringPaymentTool = tool(
	async ({ type, amount, due_date, target_wallet_address }, config: RunnableConfig) => {
		const user_id = config["configurable"]["user_id"];
		const paymentItem = await addRecurringPayment({
			user_id,
			type,
			amount,
			due_date,
			target_wallet_address,
		});

		const { account: recurringAccount, privateKey } = await createCDPAccount(paymentItem._id);

		const wallet_address = recurringAccount.address.toString();
		const wallet_private_key = privateKey;

		let updatedPayment = {
			...paymentItem,
			wallet_address,
			wallet_private_key,
		};

		// update db
		await updateRecurringPayment(updatedPayment);

		return `Recurring payment for '${type}' set up successfully.`;
	},
	{
		name: "setupRecurringPayment",
		description: "Sets up a new recurring payment for a user (e.g., rent, Netflix, Spotify, etc.)",
		schema: z.object({
			type: z.string().describe("Type of recurring payment, e.g., 'rent', 'netflix', 'spotify'"),
			amount: z.number().positive().describe("Payment amount in USD"),
			due_date: z.string().describe("Due date in ISO format (e.g., 2024-07-01)"),
			target_wallet_address: z.string().describe("The wallet address where the payment will be sent"),
		}),
	}
);
