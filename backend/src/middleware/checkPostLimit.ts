import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authMiddleware.js';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';

export const checkPostLimit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ message: 'User profile tracking signature missing.' });
            return;
        }

        // Fetch current user and track friend counts directly
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User profile tracking signature missing.' });
            return;
        }

        const friends = user.friendCount || 0;

        // 1. Structural Block if User has 0 Friends
        if (friends === 0) {
            res.status(403).json({
                message: 'Posting locked. Add a friend to unlock public spaces!'
            });
            return;
        }

        // 2. Direct Bypass if User has reached or exceeded 10 friends (Unlimited Tier)
        if (friends >= 10) {
            return next();
        }

        // 3. Sliding Threshold Evaluator for n friends (where 1 <= n <= 9)
        const allowedDailyLimit = friends;
        const rolling24HoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Bypassing strict model-type validation by casting the filter payload
        const currentWindowPostCount = await Post.countDocuments({
            user: userId as any,
            createdAt: { $gte: rolling24HoursAgo }
        } as any);

        if (currentWindowPostCount >= allowedDailyLimit) {
            res.status(429).json({
                message: `Posting limit reached! As you have ${friends} friends, you can only publish ${allowedDailyLimit} posts every 24 hours. Connect with more friends to unlock your tier restrictions!`
            });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Error computing public posting limit barriers.', error });
    }
};