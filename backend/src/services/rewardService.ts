import { User } from '../models/User.js';
import { Types } from 'mongoose';

export const adjustUserPoints = async (userId: Types.ObjectId | string, amount: number): Promise<number> => {
    try {
        const user = await User.findById(userId);
        if (!user) return 0;

        user.rewardPoints = (user.rewardPoints || 0) + amount;

        // Prevent point balances from dropping into negative numbers
        if (user.rewardPoints < 0) {
            user.rewardPoints = 0;
        }

        await user.save();
        return user.rewardPoints;
    } catch (error) {
        console.error('Points ledger system adjustment failure:', error);
        return 0;
    }
};