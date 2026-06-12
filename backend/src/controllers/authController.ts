import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { LoginHistory } from '../models/LoginHistory.js';
import { parseUserAgentDetails } from '../utils/uaParser.js';
import {LoginVerify} from "../models/LoginVerify.js";

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// ==========================================
// REGISTER USER
// ==========================================
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password, phoneNumber } = req.body;

        // Validate inputs
        if (!username || !email || !password || !phoneNumber) {
            res.status(400).json({ message: 'All fields are required, including phone number.' });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            res.status(400).json({ message: 'Username or Email already registered.' });
            return;
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Save user along with their phone number
        const newUser = new User({
            username,
            email,
            passwordHash,
            phoneNumber
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.', error });
    }
};

// ==========================================
// ADAPTIVE LOGIN USER
// ==========================================
export const handleAdaptiveLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, incomingOtpAttempt } = req.body;
        const userAgentRaw = req.headers['user-agent'];
        const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required fields.' });
            return;
        }

        const cleanEmail = email.trim().toLowerCase();

        // 1. Environmental Fingerprinting
        const environment = parseUserAgentDetails(userAgentRaw);

        // 2. Mobile Time-Fence Restriction Check
        if (environment.deviceType === 'mobile') {
            const currentUtcTime = new Date();
            // Offset calculation to derive Indian Standard Time (UTC +5:30) precisely
            const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
            const istDate = new Date(currentUtcTime.getTime() + istOffsetMs);
            const currentIstHour = istDate.getUTCHours();

            if (currentIstHour < 10 || currentIstHour >= 13) {
                res.status(403).json({
                    message: 'Mobile access denied. Mobile device login is restricted to the window between 10:00 AM and 1:00 PM IST.'
                });
                return;
            }
        }

        // 3. Find User Document
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials provided.' });
            return;
        }

        // 4. Verify Password Core Integrity
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials provided.' });
            return;
        }

        // 5. GOOGLE CHROME MULTI-FACTOR ENGINE
        if (environment.browserType === 'Google Chrome') {

            // STEP A: No OTP provided yet -> Create and save OTP session record
            if (!incomingOtpAttempt) {
                const generatedLoginOtp = Math.floor(100000 + Math.random() * 900000).toString();
                const expirationWindow = new Date(Date.now() + 5 * 60 * 1000); // 5 minute window

                // Clear out any stale verification data for this user first
                await LoginVerify.deleteMany({ email: cleanEmail });

                // Save fresh verification record
                const verificationSession = new LoginVerify({
                    email: cleanEmail,
                    otpCode: generatedLoginOtp,
                    expiresAt: expirationWindow
                });
                await verificationSession.save();

                console.log(`
          =======================================================
          [SECURITY ALARM] CHROME LOGIN TWO-FACTOR STEP REQUIRED
          =======================================================
          To: ${user.email}
          Subject: Secure Login OTP Verification Challenge
          Code: ${generatedLoginOtp}
          =======================================================
        `);

                res.status(202).json({
                    stepCheckRequired: true,
                    message: 'Google Chrome access requires second-factor authorization. An OTP has been sent to your email.'
                });
                return;
            }

            // STEP B: OTP is provided -> Validate against our session collection
            const activeSession = await LoginVerify.findOne({ email: cleanEmail });

            if (!activeSession) {
                res.status(401).json({ message: 'No active verification sequence initiated for this profile.' });
                return;
            }

            if (new Date() > activeSession.expiresAt) {
                await LoginVerify.deleteOne({ _id: activeSession._id });
                res.status(401).json({ message: 'Security token has expired. Please try signing in again.' });
                return;
            }

            if (activeSession.otpCode !== incomingOtpAttempt.trim()) {
                res.status(401).json({ message: 'Invalid or expired multi-factor token string.' });
                return;
            }

            // Clear verification data on successful match
            await LoginVerify.deleteOne({ _id: activeSession._id });
        }

        // 6. LOGIN SUCCESS: Track log activity history and issue token
        const newHistoryRecord = new LoginHistory({
            user: user._id,
            ipAddress: clientIp,
            browserType: environment.browserType,
            operatingSystem: environment.operatingSystem,
            deviceType: environment.deviceType
        });
        await newHistoryRecord.save();

        user.isOnline = true;
        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                friendCount: user.friendCount,
                friends: (user as any).friends || [],
                subscriptionPlan: user.subscriptionPlan,
                rewardPoints: user.rewardPoints,
                language: user.language
            },
            environmentLogged: newHistoryRecord
        });

    } catch (error) {
        res.status(500).json({ message: 'Internal error processing conditional authentication logic.', error });
    }
};

// ==========================================
// RETRIEVE LOGIN HISTORY FOR PROFILE DISPLAY
// ==========================================
export const getUserLoginHistory = async (req: any, res: Response): Promise<void> => {
    try {
        const logs = await LoginHistory.find({ user: req.userId }).sort({ loginTimestamp: -1 }).limit(10);
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to extract account logs history data.' });
    }
};