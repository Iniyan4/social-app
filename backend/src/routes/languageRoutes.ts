import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requestLanguageSwitch, verifyLanguageOtp } from '../controllers/languageController.js';

const router = Router();
router.post('/request-switch', verifyToken, requestLanguageSwitch);
router.post('/verify-otp', verifyToken, verifyLanguageOtp);

export default router;