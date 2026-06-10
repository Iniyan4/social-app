import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { ProfileVerify } from '../models/ProfileVerify.js';
import bcrypt from 'bcryptjs';

const generateOtpCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();

// =======================================================
// 1. INITIATE PASSWORD CHANGE REQUEST
// =======================================================
export const requestPasswordChange = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { isForgotten, oldPassword, newPassword } = req.body;
        if (!newPassword) { res.status(400).json({ message: 'New password required.' }); return; }

        // 🧠 FIXED: Security guard check ensures req.userId is defined for TypeScript validation
        if (!req.userId) {
            res.status(401).json({ message: 'Unauthorized: Session reference missing.' });
            return;
        }

        const user = await User.findById(req.userId);
        if (!user) { res.status(404).json({ message: 'User not found.' }); return; }

        const salt = await bcrypt.genSalt(10);
        const targetHash = await bcrypt.hash(newPassword, salt);
        const expiration = new Date(Date.now() + 10 * 60 * 1000);

        if (isForgotten) {
            // Forgotten Flow: Requires both Email AND Mobile OTP channels
            if (!user.phoneNumber) {
                res.status(400).json({ message: 'Profile lacks a mobile number attachment to process dual-channel reset logic.' });
                return;
            }

            const emailOtp = generateOtpCode();
            const mobileOtp = generateOtpCode();

            // 🧠 FIXED: Cast to string explicitly to bypass exactOptionalPropertyTypes restrictions
            await ProfileVerify.deleteMany({
                userId: req.userId as string,
                updateType: 'password_forgotten'
            });

            const session = new ProfileVerify({
                userId: req.userId,
                updateType: 'password_forgotten',
                emailOtpCode: emailOtp,
                mobileOtpCode: mobileOtp,
                metaData: JSON.stringify({ targetHash }),
                expiresAt: expiration
            });
            await session.save();

            console.log(`
                [SECURITY DETECTOR] FORGOTTEN PASSWORD CHALLENGE INITIATED
                --> EMAIL TO [ ${user.email} ] : Code [ ${emailOtp} ]
                --> SMS TO [ ${user.phoneNumber} ] : Code [ ${mobileOtp} ]
            `);

            res.status(202).json({ strategy: 'dual_factor', message: 'Verification challenges sent via email and SMS.' });
        } else {
            // Regular Change Flow: Requires old password verification + choice of either Email OR Mobile OTP
            if (!oldPassword) { res.status(400).json({ message: 'Old validation password required.' }); return; }
            const match = await bcrypt.compare(oldPassword, user.passwordHash);
            if (!match) { res.status(401).json({ message: 'Current password entries do not match.' }); return; }

            const singleOtp = generateOtpCode();

            // 🧠 FIXED: Cast to string explicitly to bypass exactOptionalPropertyTypes restrictions
            await ProfileVerify.deleteMany({
                userId: req.userId as string,
                updateType: 'password_regular'
            });

            const session = new ProfileVerify({
                userId: req.userId,
                updateType: 'password_regular',
                emailOtpCode: singleOtp,
                mobileOtpCode: singleOtp,
                metaData: JSON.stringify({ targetHash }),
                expiresAt: expiration
            });
            await session.save();

            console.log(`
                [SECURITY DETECTOR] REGULAR PASSWORD MODIFICATION INITIATED
                --> EMAIL ROUTE OPTION: ${user.email} -> Code [ ${singleOtp} ]
                --> SMS ROUTE OPTION (If Active): ${user.phoneNumber || 'N/A'} -> Code [ ${singleOtp} ]
            `);

            res.status(202).json({ strategy: 'single_factor', message: 'Identity confirmation token issued over communication networks.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error routing crypto changes.', error });
    }
};

// =======================================================
// 2. VERIFY PASSWORD CHANGE COMMITMENT
// =======================================================
export const verifyPasswordChangeCommit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { strategy, emailTokenAttempt, mobileTokenAttempt } = req.body;

        // 🧠 FIXED: Security guard check ensures req.userId is defined for TypeScript validation
        if (!req.userId) {
            res.status(401).json({ message: 'Unauthorized: Session reference missing.' });
            return;
        }

        if (strategy === 'dual_factor') {
            // 🧠 FIXED: Clear typing cast for Mongoose search conditions
            const session = await ProfileVerify.findOne({
                userId: req.userId as string,
                updateType: 'password_forgotten'
            });
            if (!session || new Date() > session.expiresAt) { res.status(400).json({ message: 'Validation session expired.' }); return; }

            if (session.emailOtpCode !== emailTokenAttempt?.trim() || session.mobileOtpCode !== mobileTokenAttempt?.trim()) {
                res.status(401).json({ message: 'Dual-factor confirmation failed. Token strings mismatch.' });
                return;
            }

            const user = await User.findById(req.userId);
            if (!user) { res.status(404).json({ message: 'Account error.' }); return; }

            user.passwordHash = JSON.parse(session.metaData!).targetHash;
            await user.save();
            await ProfileVerify.deleteOne({ _id: session._id });

            res.status(200).json({ message: 'Forgotten password settings successfully overridden.' });
        } else {
            // 🧠 FIXED: Clear typing cast for Mongoose search conditions
            const session = await ProfileVerify.findOne({
                userId: req.userId as string,
                updateType: 'password_regular'
            });
            if (!session || new Date() > session.expiresAt) { res.status(400).json({ message: 'Validation session expired.' }); return; }

            // Accept either single token verification
            const matched = (session.emailOtpCode === emailTokenAttempt?.trim()) || (session.mobileOtpCode === mobileTokenAttempt?.trim());
            if (!matched) { res.status(401).json({ message: 'Security token mismatch.' }); return; }

            const user = await User.findById(req.userId);
            if (!user) { res.status(404).json({ message: 'Account error.' }); return; }

            user.passwordHash = JSON.parse(session.metaData!).targetHash;
            await user.save();
            await ProfileVerify.deleteOne({ _id: session._id });

            res.status(200).json({ message: 'Password updated successfully.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error writing credential mappings.', error });
    }
};