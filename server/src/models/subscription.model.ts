import mongoose, { Schema, InferSchemaType } from 'mongoose';

const SubscriptionSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    user_id: {
      type: String, // Telegram user ID
      required: true,
      index: true,
    },
    service_id: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    provider_id: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceProvider',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'suspended', 'trial'],
      default: 'active',
      index: true,
    },
    start_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    end_date: {
      type: Date,
      required: true,
      index: true,
    },
    next_billing_date: {
      type: Date,
      required: true,
      index: true,
    },
    amount_paid: {
      type: Number,
      required: true,
      min: 0,
    },
    auto_renew: {
      type: Boolean,
      default: true,
    },
    trial_end_date: {
      type: Date,
    },
    cancellation_date: {
      type: Date,
    },
    cancellation_reason: {
      type: String,
      trim: true,
    },
    payment_history: [{
      payment_id: {
        type: String,
      },
      amount: {
        type: Number,
      },
      payment_date: {
        type: Date,
      },
      transaction_hash: {
        type: String,
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
      },
      failure_reason: {
        type: String,
      },
      
    }],
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
SubscriptionSchema.index({ next_billing_date: 1, status: 1 });
SubscriptionSchema.index({ end_date: 1, status: 1 });

export const Subscription = mongoose.model('Subscription', SubscriptionSchema);
export type ISubscription = InferSchemaType<typeof SubscriptionSchema>;

