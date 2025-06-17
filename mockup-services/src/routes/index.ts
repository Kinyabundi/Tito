import { Router } from 'express';
import { rentRoutes } from './rentRoute';
import { subscriptionRoutes } from './subscriptionRoute';


const router = Router();

router.use('/rent', rentRoutes);
router.use('/subscriptions', subscriptionRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: [
      'Rent', 'Netflix', 'Spotify'
    ]
  });
});

router.get('/services', (req, res) => {
  res.json({
    availableServices: {
      rent: ['monthly-payment'],
      netflix: ['monthly-subscription'],
      spotify: ['premium-subscription'],
    },
    allServicesRequirePayment: true,
    paymentPeriod: '30 days',
    acceptedCurrency: 'USDC'
  });
});

export { router as routes };