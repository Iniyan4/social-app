import { Schema, model, Document } from 'mongoose';

export interface ILoginHistory extends Document {
    user: Schema.Types.ObjectId;
    ipAddress: string;
    browserType: string;
    operatingSystem: string;
    deviceType: 'desktop' | 'laptop' | 'mobile';
    loginTimestamp: Date;
}

const LoginHistorySchema = new Schema<ILoginHistory>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ipAddress: { type: String, required: true },
    browserType: { type: String, required: true },
    operatingSystem: { type: String, required: true },
    deviceType: { type: String, enum: ['desktop', 'laptop', 'mobile'], required: true },
    loginTimestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export const LoginHistory = model<ILoginHistory>('LoginHistory', LoginHistorySchema);