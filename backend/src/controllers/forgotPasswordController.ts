import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

// Helper function to generate an alphabetical-only random password (uppercase + lowercase, no numbers/special characters)
const generateAlphabeticalPassword = (length: number = 10): string => {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * letters.length);
        result += letters[randomIndex];
    }
    return result;
};

export const handleForgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { identifier } = req.body; // This can be either an email address or a phone number

        if (!identifier) {
            res.status(400).json({ message: 'Email address or phone number is required.' });
            return;
        }

        // 1. Look up the user by email OR phone number
        const user = await User.findOne({
            $or: [
                { email: identifier.trim().toLowerCase() },
                { phoneNumber: identifier.trim() }
            ]
        });

        if (!user) {
            res.status(404).json({ message: 'No account found with that email or phone number.' });
            return;
        }

        // 2. Enforce the rate limit rule (Only once per 24 hours)
        const now = new Date();
        if (user.lastPasswordResetRequest) {
            const liveDifferenceInMs = now.getTime() - user.lastPasswordResetRequest.getTime();
            const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

            if (liveDifferenceInMs < twentyFourHoursInMs) {
                res.status(429).json({
                    message: 'You can use this option only one time per day.'
                });
                return;
            }
        }

        // 3. Generate a compliant alphabetical-only password
        const temporaryPassword = generateAlphabeticalPassword(12);

        // 4. Encrypt the generated temporary password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(temporaryPassword, salt);

        // 5. Update user record with the new hash and timestamp
        user.passwordHash = newPasswordHash;
        user.lastPasswordResetRequest = now;
        await user.save();

        // In a production application, you would mail or SMS this password to the user.
        // For this implementation, we return it securely in the JSON response payload.
        res.status(200).json({
            message: 'Password reset successful!',
            temporaryPassword: temporaryPassword,
            instructions: 'Use this temporary password to log in. Change it immediately inside your profile configuration settings.'
        });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error during password reset routing.', error });
    }
};