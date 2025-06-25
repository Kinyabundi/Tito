import { required } from "joi";
import mongoose, { Schema, InferSchemaType } from "mongoose";

export enum SubscriptionStatus {
	PENDING='pending',
	ACTIVE = "active",
	EXPIRED = "expired",
	CANCELLED = "cancelled",
	SUSPENDED = "suspended",
	TRIAL = "trial",
	INACTIVE = "inactive",
}
export enum BillingCycle {
	DAILY = "daily",
	WEEKLY = "weekly",
	MONTHLY = "monthly",
	YEARLY = "yearly",
}

const SubscriptionSchema = new Schema(
	{
		_id: {
			type: Schema.Types.ObjectId,
			default: () => new mongoose.Types.ObjectId(),
		},
		user_id: {
			type: Schema.Types.ObjectId, 
			ref: "User",
			required: true,
			index: true,
		},
		service_id: {
			type: Schema.Types.ObjectId,
			ref: "Service",
			required: true,
			index: true,
		},
		status: {
			type: String,
			enum: SubscriptionStatus,
			default: SubscriptionStatus.INACTIVE,
			required: true,
		},
		start_date: {
			type: Date,
			default: Date.now,
			required: true,
		},
		auto_renew: {
			type: Boolean,
			default: true,
			required: false
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

SubscriptionSchema.index({ user_id: 1, status: 1 });
SubscriptionSchema.index({ service_id: 1, status: 1 });
SubscriptionSchema.index({ end_date: 1, status: 1 });

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);
export type ISubscription = InferSchemaType<typeof SubscriptionSchema>;
