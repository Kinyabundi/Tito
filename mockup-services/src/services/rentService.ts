import { BaseService } from './baseService.js';
import { RentPayment, ServiceRegistration } from '../types/service';

export class RentService extends BaseService {
  makeMonthlyPayment(): RentPayment {
    const currentDate = new Date();
    const nextPaymentDate = new Date(currentDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    return {
      ...this.createBasePayment('Rent Payment', '$1000', 'RENT'),
      nextDueDate: nextPaymentDate.toISOString().split('T')[0],
      property: '123 Main St, Apt 4B',
      landlord: 'Property Management LLC'
    };
  }


  register(): ServiceRegistration {
    return this.createRegistration('Rent payment service', '$1000');
  }
}