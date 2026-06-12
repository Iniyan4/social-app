import { Schema, model, Document } from 'mongoose';

export type SubscriptionPlan = 'free' | 'bronze' | 'silver' | 'gold';

export interface IUser extends Document {
    username: string;
    email: string;
    phoneNumber?: string; // Added for flexible reset lookups
    passwordHash: string;
    friendCount: number;
    lastPasswordResetRequest?: Date; // Added to enforce the 24-hour limit rule
    subscriptionPlan: SubscriptionPlan;
    subscriptionExpiresAt?: Date;
    questionsPostedToday: number;
    lastQuestionPostedDate?: Date;
    rewardPoints: number;
    language: 'en' | 'es' | 'hi' | 'pt' | 'zh' | 'fr';
    languageVerificationOtp?: string;
    languageVerificationExpiresAt?: Date;
    pendingLanguageChange?: 'en' | 'es' | 'hi' | 'pt' | 'zh' | 'fr';
    bio: string;
    avatarUrl: string;
    isOnline: boolean;
    isEmailPublic: boolean;
    isPhonePublic: boolean;
    createdAt: Date;
    lastActiveAt: Date;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phoneNumber: { type: String, required: true, unique: true, trim: true }, // FIXED: Enforced matching registration requirement
    passwordHash: { type: String, required: true },
    friendCount: { type: Number, default: 0 },
    lastPasswordResetRequest: { type: Date },
    subscriptionPlan: { type: String, enum: ['free', 'bronze', 'silver', 'gold'], default: 'free' },
    subscriptionExpiresAt: { type: Date },
    questionsPostedToday: { type: Number, default: 0 },
    lastQuestionPostedDate: { type: Date },
    rewardPoints: { type: Number, default: 0, min: 0 },
    language: { type: String, enum: ['en', 'es', 'hi', 'pt', 'zh', 'fr', 'ta', 'te'], default: 'en' },
    languageVerificationOtp: { type: String },
    languageVerificationExpiresAt: { type: Date },
    pendingLanguageChange: { type: String },
    bio: { type: String, default: '', trim: true },
    avatarUrl: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    isEmailPublic: { type: Boolean, default: false }, // Defaults to hidden
    isPhonePublic: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export const User = model<IUser>('User', UserSchema);