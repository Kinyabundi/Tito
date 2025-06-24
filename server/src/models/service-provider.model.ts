import mongoose, { Document, Schema, InferSchemaType } from 'mongoose';

const ServiceProviderSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    name: {
      type: String,
      trim: true,
    },
    wallet_address: {
      type: String,
      required: true,
      index: true,
    },
    webhook_url: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ServiceProvider = mongoose.model('ServiceProvider', ServiceProviderSchema);
export type IServiceProvider = InferSchemaType<typeof ServiceProviderSchema>;