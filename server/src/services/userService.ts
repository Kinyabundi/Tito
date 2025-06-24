import { UserRepository } from '../repositories/user.repository';
import { IUser } from '../models/user.model';
import { createCDPAccount } from 'src/helpers/cdp';


export class UserService {
  private userRepository: UserRepository;
  

  constructor() {
    this.userRepository = new UserRepository();
  }

  // User methods
  async createUser(userData: {
    tg_user_id: string;
    primary_wallet_address: string;
    primary_wallet_private_key: string;
  }): Promise<IUser> {
    try {
      const account = await createCDPAccount(userData.tg_user_id)

    userData.primary_wallet_address = account.account.address;
    userData.primary_wallet_private_key = account.privateKey;

    return await this.userRepository.create(userData);
    } catch (error) {
      console.error('Error creating user:', error);
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