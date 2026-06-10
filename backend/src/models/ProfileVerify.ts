import { Schema, model, Document } from 'mongoose';

export interface IProfileVerify extends Document {
    userId: string;
    updateType: 'phone_update' | 'password_forgotten' | 'password_regular';
    emailOtpCode?: string;
    mobileOtpCode?: string;
    emailVerified: boolean;
    mobileVerified: boolean;
    metaData?: string; // Stringified object holding temporary phone numbers, new password hashes, etc.
    expiresAt: Date;
}

const ProfileVerifySchema = new Schema<IProfileVerify>({
    userId: { type: String, required: true },
    updateType: { type: String, enum: ['phone_update', 'password_forgotten', 'password_regular'], required: true },
    emailOtpCode: { type: String },
    mobileOtpCode: { type: String },
    emailVerified: { type: Boolean, default: false },
    mobileVerified: { type: Boolean, default: false },
    metaData: { type: String },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

ProfileVerifySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ProfileVerify = model<IProfileVerify>('ProfileVerify', ProfileVerifySchema);