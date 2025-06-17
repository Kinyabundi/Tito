import { Router } from 'express';
import { RentService } from '../services/rentService.js';

const router = Router();
const rentService = new RentService();

router.get('/monthly-payment', (req, res) => {
  const payment = rentService.makeMonthlyPayment();
  res.json(payment);
});


router.post('/register', (req, res) => {
  const registration = rentService.register();
  res.json(registration);
});

export { router as rentRoutes };