import { PaymentTransactionRepository } from "src/repositories/payment-transaction.repository";
import { IPaymentTransaction } from "src/models/payment-transaction.model";

export class PaymentService {
    private paymentRepository: PaymentTransactionRepository;

    constructor() {
        this.paymentRepository = new PaymentTransactionRepository();
    }

    async getSubscriptionById(subscriptionId: string): Promise<IPaymentTransaction | null> {
        const results = await this.paymentRepository.findBySubscriptionId(subscriptionId);
        return results.length > 0 ? results[0] : null;
    }
}