import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { LanguageVerify } from '../models/LanguageVerify.js';

const generateOtpCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();

// 1. INITIATE LANGUAGE SWITCH REQUEST
export const requestLanguageSwitch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { targetLanguage } = req.body;
        // Added 'ta' (Tamil) and 'te' (Telugu)
        const supportedLanguages = ['en', 'es', 'hi', 'pt', 'zh', 'fr', 'ta', 'te'];

        if (!supportedLanguages.includes(targetLanguage)) {
            res.status(400).json({ message: 'Requested language configuration is not supported.' });
            return;
        }

        const user = await User.findById(req.userId);
        if (!user) { res.status(404).json({ message: 'User reference not found.' }); return; }

        const otp = generateOtpCode();
        const expirationWindow = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 🧠 FIXED: Used a type casted query object to satisfy exactOptionalPropertyTypes
        await LanguageVerify.deleteMany({ userId: req.userId } as any);

        // Save session payload to the dedicated collection
        const languageSession = new LanguageVerify({
            userId: req.userId,
            targetLanguage,
            otpCode: otp,
            expiresAt: expirationWindow
        });
        await languageSession.save();

        // MANDATORY ROUTING POLICY SECURITY GATEWAY
        if (targetLanguage === 'fr') {
            // French Rule Trigger -> Targets Email
            console.log(`
        [SECURITY ENGINE] Channel Selection: EMAIL GATEWAY (French Rule Triggered)
        To Email: ${user.email}
        Message: Your localization security access token is [ ${otp} ].
      `);
            res.status(200).json({
                message: 'Security check triggered. A verification OTP has been dispatched to your registered email address.',
                channel: 'email'
            });
        } else {
            // English, Spanish, Hindi, Portuguese, Chinese, Tamil, Telugu Rule Trigger -> Targets Mobile
            if (!user.phoneNumber) {
                res.status(400).json({ message: 'A registered mobile number is required to perform language switching for this profile.' });
                return;
            }
            console.log(`
        [SECURITY ENGINE] Channel Selection: SMS MOBILE GATEWAY (Standard Rule Triggered)
        To Mobile Number: ${user.phoneNumber}
        Message: Security Alert - Use code [ ${otp} ] to authorize your profile language change to [ ${targetLanguage.toUpperCase()} ].
      `);
            res.status(200).json({
                message: 'Security check triggered. A verification OTP has been sent to your registered mobile number.',
                channel: 'sms'
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal error initializing localization check.', error });
    }
};

// 2. VERIFY LANGUAGE OTP AND COMMIT CHANGES
export const verifyLanguageOtp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { otpToken } = req.body;

        // 🧠 FIXED: Used a type casted query object to satisfy exactOptionalPropertyTypes
        const activeSession = await LanguageVerify.findOne({ userId: req.userId } as any);

        if (!activeSession) {
            res.status(400).json({ message: 'No active language conversion request found for this session profile.' });
            return;
        }

        if (new Date() > activeSession.expiresAt) {
            await LanguageVerify.deleteOne({ _id: activeSession._id });
            res.status(400).json({ message: 'Security token has expired. Please request a new language switch authorization.' });
            return;
        }

        if (activeSession.otpCode !== otpToken.trim()) {
            res.status(400).json({ message: 'Invalid verification token sequence. Access denied.' });
            return;
        }

        // Update the User record with the validated language code
        const user = await User.findById(req.userId);
        if (!user) { res.status(404).json({ message: 'User reference missing.' }); return; }

        user.language = activeSession.targetLanguage as any;
        await user.save();

        // Clean up verification session
        await LanguageVerify.deleteOne({ _id: activeSession._id });

        res.status(200).json({
            message: 'Identity authenticated successfully. Localization applied.',
            language: user.language
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating session language mappings.', error });
    }
};