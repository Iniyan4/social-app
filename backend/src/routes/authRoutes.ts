import { Router } from 'express';
// 1. Explicitly import Response from express alongside Router
import type { Response } from 'express';
import { register, handleAdaptiveLogin, getUserLoginHistory } from '../controllers/authController.js';
import { verifyToken, type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { handleForgotPassword } from '../controllers/forgotPasswordController.js';

const router = Router();

// 2. Added return rules to ensure the controller returns Promise<void> cleanly to Express
router.get('/me', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Remove '-passwordHash' select exclusion and request explicit profile properties
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,               // Ensure email passes down cleanly
            phoneNumber: user.phoneNumber,   // Ensure phone number passes down cleanly
            friendCount: user.friendCount,
            language: user.language,
            subscriptionPlan: user.subscriptionPlan,
            rewardPoints: user.rewardPoints
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching profile.', error });
    }
});

router.post('/logout', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        await User.findByIdAndUpdate(req.userId, { isOnline: false });
        res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating connection states.' });
    }
});

// Add this active ping endpoint to your router inside src/routes/authRoutes.ts
// Add this route directly inside src/routes/authRoutes.ts
// Add this explicit ping pulse lease handler route inside src/routes/authRoutes.ts
router.post('/heartbeat', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const now = new Date();

        // 1. Mark the active ping target user as online with a fresh timestamp
        await User.findByIdAndUpdate(req.userId, {
            isOnline: true,
            lastActiveAt: now
        });

        // 2. Clear any stale connections from users who missed their heartbeat check
        const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
        await User.updateMany(
            { lastActiveAt: { $lt: fifteenSecondsAgo }, isOnline: true },
            { $set: { isOnline: false } }
        );

        res.status(200).end();
    } catch (err) {
        res.status(500).end();
    }
});

router.post('/register', register);
router.post('/login', handleAdaptiveLogin);
router.get('/login-history', verifyToken, getUserLoginHistory);
router.post('/forgot-password', handleForgotPassword);

export default router;