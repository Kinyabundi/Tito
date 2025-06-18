export abstract class BaseService {
	protected generateReceipt(prefix: string): string {
		return `${prefix}-${Date.now()}`;
	}

	protected getCurrentDate(): string {
		return new Date().toISOString().split("T")[0];
	}

	protected getNextBillingDate(): string {
		const nextDate = new Date();
		nextDate.setMonth(nextDate.getMonth() + 1);
		return nextDate.toISOString().split("T")[0];
	}

	protected createBasePayment(service: string, amount: string, prefix: string) {
		return {
			service,
			amount,
			paymentDate: this.getCurrentDate(),
			nextBillingDate: this.getNextBillingDate(),
			status: "PAID" as const,
			receipt: this.generateReceipt(prefix),
			period: "30 days",
		};
	}

	protected createRegistration(service: string, amount: string, plan?: string) {
		return {
			message: `${service} registered successfully`,
			serviceId: this.generateReceipt(`${service.toUpperCase()}-REG`),
			status: "REGISTERED" as const,
			monthlyAmount: amount,
			nextPaymentDue: "2025-02-01",
			...(plan && { plan }),
		};
	}
}
