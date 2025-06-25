import mongoose, { Document, HydratedDocument, InferSchemaType, Schema } from "mongoose";

const UserSchema = new Schema(
	{
		tg_user_id: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		primary_wallet_address: {
			type: String,
			required: true,
			index: true,
		},
		primary_wallet_private_key: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

export const User = mongoose.model("User", UserSchema);

export type IUser = InferSchemaType<typeof UserSchema>;
