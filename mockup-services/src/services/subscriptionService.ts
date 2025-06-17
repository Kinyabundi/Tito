import { BaseService } from './baseService.js';
import { SubscriptionPayment, ServiceRegistration } from '../types/service.js';

export class SubscriptionService extends BaseService {
  // Netflix
  makeNetflixPayment(): SubscriptionPayment {
    return {
      ...this.createBasePayment('Netflix Premium', '$15.99', 'NETFLIX'),
      status: 'ACTIVE',
      plan: 'Premium (4K + 4 Screens)',
      features: ['4K Ultra HD', '4 screens', 'Downloads', 'No ads']
    };
  }


  registerNetflix(): ServiceRegistration {
    return this.createRegistration('Netflix subscription', '$15.99', 'Premium');
  }

  // Spotify
  makeSpotifyPayment(): SubscriptionPayment {
    return {
      ...this.createBasePayment('Spotify Premium', '$9.99', 'SPOTIFY'),
      status: 'ACTIVE',
      plan: 'Individual Premium',
      features: ['Ad-free music', 'Offline downloads', 'High quality audio', 'Unlimited skips']
    };
  }

  registerSpotify(): ServiceRegistration {
    return this.createRegistration('Spotify subscription', '$9.99', 'Premium Individual');
  }
}