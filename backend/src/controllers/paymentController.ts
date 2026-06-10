import { type Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'mock_key', {
    apiVersion: '2023-10-16' as any,
});

// Helper function to check if the current time is within 10:00 AM - 11:00 AM IST
export const isPaymentWindowOpen = (): boolean => {
    const now = new Date();

    // Convert current system time to Indian Standard Time (IST) strings
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);

    const currentHour = istDate.getHours(); // 0 - 23 scale

    // Open strictly between 10:00 AM and 11:00 AM (Hour must be exactly 10)
    return currentHour === 10;
};

export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // 1. Enforce user authentication checkpoint
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized. Missing user session credentials.' });
            return;
        }

        // 2. Enforce the time-restricted operation window
        if (!isPaymentWindowOpen()) {
            res.status(403).json({
                message: 'Payment gateway closed. Subscriptions can only be purchased between 10:00 AM and 11:00 AM IST.'
            });
            return;
        }

        const { plan } = req.body; // expect 'bronze', 'silver', or 'gold'
        const planPrices: Record<string, number> = { bronze: 10000, silver: 30000, gold: 100000 }; // Price in paise (INR)

        if (!planPrices[plan]) {
            res.status(400).json({ message: 'Invalid subscription plan selection.' });
            return;
        }

        // 3. Generate Stripe Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'inr',
                    product_data: { name: `UnitySpace ${plan.toUpperCase()} Tier Subscription` },
                    unit_amount: planPrices[plan],
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
            cancel_url: 'http://localhost:3000/billing',
            client_reference_id: userId, // 🧠 Now guaranteed to be a pure string!
        });

        res.status(200).json({ id: session.id, url: session.url });
    } catch (error) {
        res.status(500).json({ message: 'Failed to clear payment gateway connection.', error });
    }
};