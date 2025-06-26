import mongoose, { Schema, InferSchemaType } from "mongoose";

const WithdrawalSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    provider_id: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      required: true,
      default: "pending",
      index: true,
    },
    transaction_hash: {
      type: String,
      index: true,
    },
    requested_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
    paid_at: {
      type: Date,
    },
    metadata: Object,
  },
  {
    timestamps: true,
  }
);

WithdrawalSchema.index({ provider_id: 1, status: 1 });

export const Withdrawal = mongoose.model("Withdrawal", WithdrawalSchema);
export type IWithdrawal = InferSchemaType<typeof WithdrawalSchema>; 