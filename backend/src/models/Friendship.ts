import { Schema, model, Document, Types } from 'mongoose';

export interface IFriendship extends Document {
    requester: Types.ObjectId;
    recipient: Types.ObjectId;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Date;
    updatedAt: Date;
}

const FriendshipSchema = new Schema<IFriendship>({
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Compound index ensures a user pair can only have one unique connection record
FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const Friendship = model<IFriendship>('Friendship', FriendshipSchema);