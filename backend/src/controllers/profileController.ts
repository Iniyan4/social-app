import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { ProfileVerify } from '../models/ProfileVerify.js';

const generateOtpCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();

// =======================================================
// 1. UPDATE BASE METADATA (Username, Bio, Avatar)
// =======================================================
export const updateBaseProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { username, bio, avatarUrl } = req.body;

        // Guard check to satisfy typescript that userId is present
        if (!req.userId) {
            res.status(401).json({ message: 'Unauthorized: Session missing identifier reference.' });
            return;
        }

        const user = await User.findById(req.userId);
        if (!user) { res.status(404).json({ message: 'User not found.' }); return; }

        if (username && username.trim() !== user.username) {
            const taken = await User.findOne({ username: username.trim() });
            if (taken) { res.status(400).json({ message: 'Username is already taken.' }); return; }
            user.username = username.trim();
        }

        if (bio !== undefined) user.bio = bio;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

        await user.save();
        res.status(200).json({ message: 'Profile metadata updated successfully.', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update profile info.', error });
    }
};

// =======================================================
// 2. INITIATE PHONE UPDATE REQUEST (Requires Email OTP)
// =======================================================
export const requestPhoneUpdate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { newPhoneNumber } = req.body;
        if (!newPhoneNumber) { res.status(400).json({ message: 'New phone number required.' }); return; }

        if (!req.userId) {
            res.status(401).json({ message: 'Unauthorized: Session missing identifier reference.' });
            return;
        }

        const user = await User.findById(req.userId);
        if (!user) { res.status(404).json({ message: 'User reference missing.' }); return; }

        const otp = generateOtpCode();
        const expiration = new Date(Date.now() + 10 * 60 * 1000);

        // 🧠 FIXED: Pass strict field type verification explicitly to dropping the undefined type path
        await ProfileVerify.deleteMany({
            userId: req.userId as string,
            updateType: 'phone_update'
        });

        const session = new ProfileVerify({
            userId: req.userId,
            updateType: 'phone_update',
            emailOtpCode: otp,
            metaData: JSON.stringify({ newPhoneNumber: newPhoneNumber.trim() }),
            expiresAt: expiration
        });
        await session.save();

        console.log(`
            =======================================================
            [PROFILE SECURITY] PHONE UPDATE - EMAIL VERIFICATION DISPATCH
            =======================================================
            To: ${user.email}
            Code: ${otp}
            Attempting to bind phone: ${newPhoneNumber}
            =======================================================
        `);

        res.status(200).json({ message: 'Verification security code dispatched to your registered email.' });
    } catch (error) {
        res.status(500).json({ message: 'Error establishing configuration session.', error });
    }
};

// =======================================================
// 3. CONFIRM PHONE UPDATE
// =======================================================
export const verifyPhoneUpdate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { otpToken } = req.body;

        if (!req.userId) {
            res.status(401).json({ message: 'Unauthorized: Session missing identifier reference.' });
            return;
        }

        // 🧠 FIXED: Assert string verification explicitly down to drop the exactOptionalPropertyTypes compilation block
        const session = await ProfileVerify.findOne({
            userId: req.userId as string,
            updateType: 'phone_update'
        });

        if (!session || new Date() > session.expiresAt) {
            res.status(400).json({ message: 'No active verification window found or code expired.' });
            return;
        }

        if (session.emailOtpCode !== otpToken?.trim()) {
            res.status(400).json({ message: 'Invalid verification code matching sequence.' });
            return;
        }

        const payload = JSON.parse(session.metaData || '{}');
        const user = await User.findById(req.userId);
        if (!user) { res.status(404).json({ message: 'User registry error.' }); return; }

        user.phoneNumber = payload.newPhoneNumber;
        await user.save();
        await ProfileVerify.deleteOne({ _id: session._id });

        res.status(200).json({ message: 'Phone contact settings successfully applied.', user });
    } catch (error) {
        res.status(500).json({ message: 'Error processing validation checks.', error });
    }
};