import { Schema, model, Document } from 'mongoose';

export interface IComment {
    username: string;
    text: string;
    createdAt: Date;
}

export interface IPost extends Document {
    user: Schema.Types.ObjectId;
    mediaUrl?: string;
    mediaType?: 'photo' | 'video';
    caption?: string;
    likes: Schema.Types.ObjectId[]; // Array of User IDs who liked the post
    comments: IComment[];           // Nested array of comments
    sharesCount: number;
    createdAt: Date;
}

const CommentSchema = new Schema<IComment>({
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const PostSchema = new Schema<IPost>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mediaUrl: { type: String, default: '' },
    mediaType: { type: String, enum: ['photo', 'video'] },
    caption: { type: String, trim: true, default: '' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
    sharesCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

PostSchema.index({ user: 1, createdAt: -1 });

export const Post = model<IPost>('Post', PostSchema);