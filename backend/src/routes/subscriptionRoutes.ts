import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createCheckoutSession } from '../controllers/paymentController.js';
import { handlePaymentSuccessNotification } from '../controllers/webhookController.js';

const router = Router();

router.post('/checkout', verifyToken, createCheckoutSession);
router.post('/success-webhook-sim', handlePaymentSuccessNotification);

export default router;