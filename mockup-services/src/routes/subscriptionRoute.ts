// src/routes/subscriptionRoutes.ts
import { Router } from 'express';
import { SubscriptionService } from '../services/subscriptionService.js';

const router = Router();
const subscriptionService = new SubscriptionService();

router.get('/netflix/monthly-subscription', (req, res) => {
  const payment = subscriptionService.makeNetflixPayment();
  res.json(payment);
});

router.post('/netflix/register', (req, res) => {
  const registration = subscriptionService.registerNetflix();
  res.json(registration);
});

router.get('/spotify/premium-subscription', (req, res) => {
  const payment = subscriptionService.makeSpotifyPayment();
  res.json(payment);
});


router.post('/spotify/register', (req, res) => {
  const registration = subscriptionService.registerSpotify();
  res.json(registration);
});


export { router as subscriptionRoutes };