import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
    sendFriendRequest, respondToRequest, getDiscoverUsers, getPendingRequests, getFriendsList,
    getPublicUserProfileDetails
} from '../controllers/friendController.js';

const router = Router();

router.get('/discover', verifyToken, getDiscoverUsers);
router.post('/request', verifyToken, sendFriendRequest);
router.post('/respond', verifyToken, respondToRequest);
router.get('/requests/pending', verifyToken, getPendingRequests);
router.get('/list', verifyToken, getFriendsList);
router.get('/profile/:username', verifyToken, getPublicUserProfileDetails);
export default router;