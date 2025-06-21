import { UserRepository } from '../repositories/user.repository';
// import { RecurringPaymentRepository } from '../repositories/recurring-payment.repository';
// import { PaymentHistoryRepository } from '../repositories/payment-history.repository';
import { IUser } from '../models/user.model';
// import { IRecurringPayment } from '../models/recurring-payment.model';
// import { IPaymentHistory } from '../models/payment-history.model';

export class DatabaseService {
  private userRepository: UserRepository;
  // private recurringPaymentRepository: RecurringPaymentRepository;
  // private paymentHistoryRepository: PaymentHistoryRepository;

  constructor() {
    this.userRepository = new UserRepository();
    // this.recurringPaymentRepository = new RecurringPaymentRepository();
    // this.paymentHistoryRepository = new PaymentHistoryRepository();
  }

  // User methods
  async createUser(userData: {
    username: string;
    tg_user_id: string;
    primary_wallet_address: string;
    primary_wallet_private_key: string;
  }): Promise<IUser> {
    return await this.userRepository.create(userData);
  }

  async getUserByTelegramId(tg_user_id: string): Promise<IUser | null> {
    return await this.userRepository.findByTelegramId(tg_user_id);
  }

  async getUserById(id: string): Promise<IUser | null> {
    return await this.userRepository.findById(id);
  }

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    return await this.userRepository.updateUser(id, updates);
  }

  async deleteUser(id: string): Promise<boolean> {
    return await this.userRepository.deleteUser(id);
  }

//   // Recurring Payment methods
//   async addRecurringPayment(paymentData: {
//     user_id: string;
//     type: string;
//     wallet_address: string;
//     wallet_private_key: string;
//     target_wallet_address: string;
//     due_date: Date;
//     amount: number;
//     next_payment_date?: Date;
//     status?: 'active' | 'paused' | 'cancelled';
//   }): Promise<IRecurringPayment> {
//     return await this.recurringPaymentRepository.create({
//       ...paymentData,
//       status: paymentData.status || 'active',
//     });
//   }

//   async getRecurringPaymentById(id: string): Promise<IRecurringPayment | null> {
//     return await this.recurringPaymentRepository.findById(id);
//   }

//   async getRecurringPaymentsByUserId(user_id: string): Promise<IRecurringPayment[]> {
//     return await this.recurringPaymentRepository.findByUserId(user_id);
//   }

//   async getActiveRecurringPayments(): Promise<IRecurringPayment[]> {
//     return await this.recurringPaymentRepository.findActivePayments();
//   }

//   async updateRecurringPayment(
//     id: string, 
//     updates: Partial<IRecurringPayment>
//   ): Promise<IRecurringPayment | null> {
//     return await this.recurringPaymentRepository.updatePayment(id, updates);
//   }

//   async deleteRecurringPayment(id: string): Promise<boolean> {
//     return await this.recurringPaymentRepository.deletePayment(id);
//   }

//   async getRecurringPaymentsByType(user_id: string, type: string): Promise<IRecurringPayment[]> {
//     return await this.recurringPaymentRepository.findByType(user_id, type);
//   }

//   // Payment History methods
//   async addPaymentHistory(historyData: {
//     recurring_payment_id: string;
//     user_id: string;
//     amount: number;
//     transaction_hash?: string;
//     status: 'pending' | 'completed' | 'failed';
//     payment_date: Date;
//     failure_reason?: string;
//   }): Promise<IPaymentHistory> {
//     return await this.paymentHistoryRepository.create({
//       ...historyData,
//       recurring_payment_id: historyData.recurring_payment_id as any,
//     });
//   }

//   async getPaymentHistoryByUserId(user_id: string): Promise<IPaymentHistory[]> {
//     return await this.paymentHistoryRepository.findByUserId(user_id);
//   }

//   async getPaymentHistoryByRecurringPaymentId(
//     recurring_payment_id: string
//   ): Promise<IPaymentHistory[]> {
//     return await this.paymentHistoryRepository.findByRecurringPaymentId(recurring_payment_id);
//   }

//   async updatePaymentHistory(
//     id: string, 
//     updates: Partial<IPaymentHistory>
//   ): Promise<IPaymentHistory | null> {
//     return await this.paymentHistoryRepository.updateHistory(id, updates);
//   }

//   async getPaymentHistoryByStatus(status: string): Promise<IPaymentHistory[]> {
//     return await this.paymentHistoryRepository.findByStatus(status);
//   }

//   async getPaymentHistoryByDateRange(
//     user_id: string,
//     startDate: Date,
//     endDate: Date
//   ): Promise<IPaymentHistory[]> {
//     return await this.paymentHistoryRepository.findByDateRange(user_id, startDate, endDate);
//   }
}