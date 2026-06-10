import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { updateBaseProfile, requestPhoneUpdate, verifyPhoneUpdate } from '../controllers/profileController.js';
import { requestPasswordChange, verifyPasswordChangeCommit } from '../controllers/profilePasswordController.js';

const router = Router();

// Base details configuration
router.put('/meta-update', verifyToken, updateBaseProfile);

// Phone modification gateway channels
router.post('/phone/request', verifyToken, requestPhoneUpdate);
router.post('/phone/verify', verifyToken, verifyPhoneUpdate);

// Structural password modification paths
router.post('/password/request', verifyToken, requestPasswordChange);
router.post('/password/verify', verifyToken, verifyPasswordChangeCommit);

export default router;