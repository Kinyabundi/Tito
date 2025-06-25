import { UserRepository } from "../repositories/user.repository";
import { IUser } from "../models/user.model";
import { createCDPAccount } from "src/helpers/cdp";

export class UserService {
	private userRepository: UserRepository;

	constructor() {
		this.userRepository = new UserRepository();
	}

	// User methods
	async createUser(userData: { tg_user_id: string }): Promise<IUser> {
		try {
			// check if user exists
			const userExists = await this.getUserByTelegramId(userData.tg_user_id);

			if (userExists) {
				// dont recreate, just return the existing account
				return userExists;
			}

			const account = await createCDPAccount(userData.tg_user_id);

			let info = {
				...userData,
				primary_wallet_address: account.account.address,
				primary_wallet_private_key: account.privateKey,
			};

			return await this.userRepository.create(info);
		} catch (error) {
			console.error("Error creating user:", error);
			throw new Error(`Failed to create user: ${error.message}`);
		}
	}

	async getUserByTelegramId(tg_user_id: string): Promise<IUser | null> {
		return await this.userRepository.findByTelegramId(tg_user_id);
	}

	async getUserById(id: string): Promise<IUser | null> {
		return await this.userRepository.findById(id);
	}

	async getUserByWalletAddress(primary_wallet_address: string): Promise<IUser | null> {
		return await this.userRepository.findByWalletAddress(primary_wallet_address);
	}

	async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
		return await this.userRepository.updateUser(id, updates);
	}

	async deleteUser(id: string): Promise<boolean> {
		return await this.userRepository.deleteUser(id);
	}
}
