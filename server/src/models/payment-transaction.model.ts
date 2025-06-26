import mongoose, { Schema, InferSchemaType } from "mongoose";

const PaymentTransactionSchema = new Schema(
	{
		_id: {
			type: Schema.Types.ObjectId,
			default: () => new mongoose.Types.ObjectId(),
		},
		subscription_id: {
			type: Schema.Types.ObjectId,
			ref: "Subscription",
			required: true,
			index: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		transaction_hash: {
			type: String,
			index: true,
		},
		status: {
			type: String,
			enum: ["pending", "completed", "failed", "refunded"],
			required: true,
			default: "pending",
			index: true,
		},
		payment_method: {
			type: String,
			enum: ["x402"], // Only X402 since agent handles all payments
			required: true,
			default: "x402",
		},
		billing_period_start: {
			type: Date,
			required: true,
		},
		billing_period_end: {
			type: Date,
			required: true,
		},
		failure_reason: {
			type: String,
			trim: true,
		},
		processed_at: {
			type: Date,
		},
		metadata: Object
	},
	{
		timestamps: true,
	}
);

PaymentTransactionSchema.index({ subscription_id: 1, createdAt: -1 });
PaymentTransactionSchema.index({ user_id: 1, status: 1 });
PaymentTransactionSchema.index({ status: 1, createdAt: 1 });

export const PaymentTransaction = mongoose.model("PaymentTransaction", PaymentTransactionSchema);
export type IPaymentTransaction = InferSchemaType<typeof PaymentTransactionSchema>;
