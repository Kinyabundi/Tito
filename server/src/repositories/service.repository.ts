import { Service, IService } from "../models/services.model";
import mongoose from "mongoose";

export class ServiceRepository {
	async create(serviceData: Omit<IService, "_id" | "createdAt" | "updatedAt" | "features" | "trial_period_days" | "status" | "metadata">): Promise<IService> {
		const service = new Service({
			_id: new mongoose.Types.ObjectId(),
			...serviceData,
		});
		return await service.save();
	}

	async findById(id: string): Promise<IService | null> {
		return await Service.findById(new mongoose.Types.ObjectId(id)).exec();
	}

	async findByProviderId(providerId: string): Promise<IService[]> {
		return await Service.find({ provider_id: new mongoose.Types.ObjectId(providerId) })
			.exec();
	}
	async findByEndpoint(endpoint: string): Promise<IService | null> {
		return await Service.findOne({ "x402_config.endpoint": endpoint }).exec();
	}

	async findActiveServices(): Promise<IService[]> {
		return await Service.find({ status: "active" }).exec();
	}

	async updateService(id: string, updates: Partial<IService>): Promise<IService | null> {
		return await Service.findByIdAndUpdate(new mongoose.Types.ObjectId(id), { $set: updates }, { new: true }).exec();
	}

	async deleteService(id: string): Promise<boolean> {
		const result = await Service.deleteOne({ _id: new mongoose.Types.ObjectId(id) }).exec();
		return result.deletedCount > 0;
	}

	async searchServices(query: string, category?: string): Promise<IService[]> {
		const searchCriteria: any = {
			status: "active",
			$or: [{ name: { $regex: query, $options: "i" } }, { description: { $regex: query, $options: "i" } }],
		};

		if (category) {
			searchCriteria.category = category;
		}

		return await Service.find(searchCriteria).exec();
	}

	async searchByProviderAndQuery(providerId: string, query: string): Promise<IService[]> {
		console.log("providerId", providerId);
		const filter: any = {
			provider_id: new mongoose.Types.ObjectId(providerId),
			status: "active",
		};
		if (query && query.trim()) {
			filter.$text = { $search: query };
			return await Service.find(filter, { score: { $meta: "textScore" } })
				.sort({ score: { $meta: "textScore" } })
				.populate("provider_id")
				.exec();
		} else {
			// No text search, just return all services for the provider
			return await Service.find(filter).populate("provider_id").exec();
		}
	}
}
