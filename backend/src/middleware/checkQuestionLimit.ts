import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authMiddleware.js';
import { User } from '../models/User.js';

export const checkQuestionLimit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.findById(req.userId);
        if (!user) { res.status(404).json({ message: 'User details not found.' }); return; }

        const now = new Date();
        const todayStr = now.toDateString();

        // Reset daily counters if a new calendar day has turned over
        if (user.lastQuestionPostedDate && user.lastQuestionPostedDate.toDateString() !== todayStr) {
            user.questionsPostedToday = 0;
        }

        const planLimits: Record<string, number> = { free: 1, bronze: 5, silver: 10, gold: Infinity };
        const maxAllowed = planLimits[user.subscriptionPlan] || 1;

        if (user.questionsPostedToday >= maxAllowed) {
            res.status(429).json({
                message: `Daily question limit reached for your current plan tier (${user.subscriptionPlan.toUpperCase()}). Upgrade to ask up to ${maxAllowed === 1 ? '5' : '10+'} entries per day!`
            });
            return;
        }

        // Safe to pass along, update values inside the downstream endpoint execution context block
        (req as any).currentUserField = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error processing subscription question boundaries.' });
    }
};