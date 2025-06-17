export interface PaymentInfo {
  service: string;
  amount: string;
  paymentDate: string;
  nextBillingDate?: string;
  nextDueDate?: string;
  status: 'PAID' | 'ACTIVE' | 'CURRENT' | 'REGISTERED';
  receipt: string;
  period: string;
}

export interface RentPayment extends PaymentInfo {
  property: string;
  landlord: string;
}

export interface SubscriptionPayment extends PaymentInfo {
  plan: string;
  features?: string[];
}

export interface UtilityPayment extends PaymentInfo {
  usage: string;
  rate: string;
  accountNumber: string;
}

export interface InsurancePayment extends PaymentInfo {
  deductible: string;
  policyNumber: string;
  coverage?: string;
}

export interface LoanPayment extends PaymentInfo {
  principal: string;
  interest: string;
  remainingBalance: string;
  loanNumber: string;
}

export interface ServiceRegistration {
  message: string;
  serviceId: string;
  status: 'REGISTERED';
  monthlyAmount: string;
  nextPaymentDue: string;
  plan?: string;
}