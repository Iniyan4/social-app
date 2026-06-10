import { Schema, model, Document } from 'mongoose';

export interface ILanguageVerify extends Document {
    userId: string;
    targetLanguage: string;
    otpCode: string;
    expiresAt: Date;
}

const LanguageVerifySchema = new Schema<ILanguageVerify>({
    userId: { type: String, required: true },
    targetLanguage: { type: String, required: true },
    otpCode: { type: String, required: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Auto-destruct session records after 10 minutes
LanguageVerifySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const LanguageVerify = model<ILanguageVerify>('LanguageVerify', LanguageVerifySchema);