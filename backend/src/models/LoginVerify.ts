import { Schema, model, Document } from 'mongoose';

export interface ILoginVerify extends Document {
    email: string;
    otpCode: string;
    expiresAt: Date;
}

const LoginVerifySchema = new Schema<ILoginVerify>({
    email: { type: String, required: true, lowercase: true, trim: true },
    otpCode: { type: String, required: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Automatically delete expired OTP documents after 5 minutes
LoginVerifySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const LoginVerify = model<ILoginVerify>('LoginVerify', LoginVerifySchema);