import { Schema, model, Document } from 'mongoose';

export interface IAnswer {
    _id: Schema.Types.ObjectId;
    user: Schema.Types.ObjectId;
    username: string;
    text: string;
    upvotes: Schema.Types.ObjectId[];   // Array of User IDs who upvoted
    downvotes: Schema.Types.ObjectId[]; // Array of User IDs who downvoted
    hasAchievedBonus: boolean;          // Tracks if the 5-upvote milestone was hit
    createdAt: Date;
}

export interface IQuestion extends Document {
    user: Schema.Types.ObjectId;
    title: string;
    body: string;
    tags?: string[];
    answers: IAnswer[]; // Added for Stage 4
    createdAt: Date;
}

const AnswerSchema = new Schema<IAnswer>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    text: { type: String, required: true },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    hasAchievedBonus: { type: Boolean, default: false }
}, { timestamps: true });

const QuestionSchema = new Schema<IQuestion>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    tags: [{ type: String }],
    answers: [AnswerSchema] // Nested Subdocuments
}, { timestamps: true });

export const Question = model<IQuestion>('Question', QuestionSchema);