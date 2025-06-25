import mongoose, { Document, Schema, InferSchemaType } from "mongoose";

const ServiceSchema = new Schema(
	{
		_id: {
			type: Schema.Types.ObjectId,
			default: () => new mongoose.Types.ObjectId(),
		},
		provider_id: {
			ref: "ServiceProvider",
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},

		pricing: {
			amount: {
				type: Number,
				required: true,
				min: 0,
			},
			billing_cycle: {
				type: String,
				enum: ["daily", "weekly", "monthly", "yearly"],
				required: true,
				default: "monthly",
			},
		},
		x402_config: {
			price: {
				type: String,
				required: true, // e.g., "$9.99"
			},
			network: {
				type: String,
				required: true,
				default: "base-sepolia",
			},
			endpoint: {
				type: String,
				required: true, // e.g., "/subscription/netflix/monthly"
			},
		},
		features: [
			{
				type: String,
				trim: true,
			},
		],
		trial_period_days: {
			type: Number,
			default: 0,
			min: 0,
		},
		status: {
			type: String,
			enum: ["active", "inactive", "deprecated"],
			default: "active",
		},
		metadata: {
			type: Map,
			of: String,
		},
	},
	{
		timestamps: true,
	}
);

ServiceSchema.index({ provider_id: 1, status: 1 });
ServiceSchema.index({ status: 1 });
ServiceSchema.index({ "x402_config.endpoint": 1 });

export const Service = mongoose.model("Service", ServiceSchema);
export type IService = InferSchemaType<typeof ServiceSchema>;
