import type { Request, Response } from 'express';
import { User, type SubscriptionPlan } from '../models/User.js';

export const handlePaymentSuccessNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, plan, sessionId } = req.body;

        if (!userId || !plan) {
            res.status(400).json({ message: 'Missing transaction attributes.' });
            return;
        }

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30); // 30-day billing cycle activation

        // Update subscription plan tier mapping settings
        const user = await User.findByIdAndUpdate(
            userId,
            {
                subscriptionPlan: plan as SubscriptionPlan,
                subscriptionExpiresAt: expirationDate
            },
            { new: true }
        );

        if (!user) {
            res.status(404).json({ message: 'User reference not found.' });
            return;
        }

        // SIMULATED AUTOMATED INVOICE EMAIL SEND ENGINE
        console.log(`
      =======================================================
      EMAIL SYSTEM: DISPATCHING INVOICE AND TRANSACTION RECEIPT
      =======================================================
      To: ${user.email}
      Subject: Your UnitySpace Invoice - Upgrade to ${plan.toUpperCase()} Complete!
      
      Receipt Identifier Token: INV-${sessionId?.slice(-8).toUpperCase()}
      Price Paid: ₹${plan === 'bronze' ? '100' : plan === 'silver' ? '300' : '1000'}.00
      Status: Account Subscribed Automatically
      =======================================================
    `);

        res.status(200).json({ message: 'Subscription successfully initialized and invoice issued.', user });
    } catch (error) {
        res.status(500).json({ message: 'Error processing invoicing actions.', error });
    }
};