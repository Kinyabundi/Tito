import mongoose, { Schema, InferSchemaType } from "mongoose";

const ServiceSchema = new Schema(
	{
		_id: {
			type: Schema.Types.ObjectId,
			default: () => new mongoose.Types.ObjectId(),
		},
		provider_id: {
			ref: "ServiceProvider",
			required: true,
			type: Schema.Types.ObjectId,
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

ServiceSchema.index({  status: 1 });
ServiceSchema.index({ name: 'text', description: 'text' });

export const Service = mongoose.model("Service", ServiceSchema);
export type IService = InferSchemaType<typeof ServiceSchema>;
