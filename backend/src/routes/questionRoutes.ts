import { Router, type Response } from 'express';
import { Types } from 'mongoose';
import { verifyToken, type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { checkQuestionLimit } from '../middleware/checkQuestionLimit.js';
import { Question } from '../models/Question.js';
import { adjustUserPoints } from '../services/rewardService.js';
import { User } from '../models/User.js';

const router = Router();

// 1. CREATE SUBSCRIPTION-GATED QUESTION
router.post('/', verifyToken, checkQuestionLimit, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title, body, tags } = req.body;
        const userRecord = (req as any).currentUserField;

        if (!title || !body) {
            res.status(400).json({ message: 'Title and body are required fields.' });
            return;
        }

        const newQuestion = new Question({
            user: req.userId,
            title,
            body,
            tags: Array.isArray(tags) ? tags : []
        });

        await newQuestion.save();

        userRecord.questionsPostedToday += 1;
        userRecord.lastQuestionPostedDate = new Date();
        await userRecord.save();

        res.status(201).json({ message: 'Question posted successfully!', question: newQuestion });
    } catch (error) {
        res.status(500).json({ message: 'Internal error posting premium query.', error });
    }
});

// 2. GET ALL QUESTIONS FOR THE QUESTIONS FEED
router.get('/', async (req, res) => {
    try {
        const questions = await Question.find()
            .populate('user', 'username subscriptionPlan')
            .sort({ createdAt: -1 });
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch academic queries.', error });
    }
});

// 3. SUBMIT AN ANSWER (Earns +5 Points instantly)
router.post('/:id/answer', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { text, username } = req.body;
        if (!text) {
            res.status(400).json({ message: 'Answer body cannot be empty.' });
            return;
        }

        const question = await Question.findById(req.params.id);
        if (!question) {
            res.status(404).json({ message: 'Question thread not found.' });
            return;
        }

        const answerId = new Types.ObjectId();
        const newAnswer = {
            _id: answerId as any,
            user: req.userId as any,
            username,
            text,
            upvotes: [],
            downvotes: [],
            hasAchievedBonus: false,
            createdAt: new Date()
        };

        question.answers.push(newAnswer as any);
        await question.save();

        // Safe conversion to pure string format
        await adjustUserPoints(req.userId!.toString(), 5);

        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ message: 'Error processing answer submission.', error });
    }
});

// 4. TOGGLE UPVOTE ON AN ANSWER (+5 points on reaching 5 upvotes, or -5 points if dropped below 5)
router.post('/:questionId/answers/:answerId/upvote', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { questionId, answerId } = req.params;
        const userId = req.userId as any;

        const question = await Question.findById(questionId);
        if (!question) {
            res.status(404).json({ message: 'Question not found.' });
            return;
        }

        const answer = question.answers.find((ans: any) => ans._id.toString() === answerId);
        if (!answer) {
            res.status(404).json({ message: 'Answer node not found.' });
            return;
        }

        // Remove downvote if it exists
        const dvIndex = answer.downvotes.indexOf(userId);
        if (dvIndex !== -1) {
            answer.downvotes.splice(dvIndex, 1);
            // Safe conversion to string format clears compiler conflicts
            await adjustUserPoints(answer.user.toString(), 1);
        }

        const uvIndex = answer.upvotes.indexOf(userId);
        if (uvIndex === -1) {
            answer.upvotes.push(userId);
        } else {
            answer.upvotes.splice(uvIndex, 1);
        }

        // CHECK MILESTONE STATUS (5 Upvotes = +5 point bonus)
        const totalUpvotes = answer.upvotes.length;
        if (totalUpvotes >= 5 && !answer.hasAchievedBonus) {
            answer.hasAchievedBonus = true;
            await adjustUserPoints(answer.user.toString(), 5);
        } else if (totalUpvotes < 5 && answer.hasAchievedBonus) {
            answer.hasAchievedBonus = false;
            await adjustUserPoints(answer.user.toString(), -5);
        }

        question.markModified('answers');
        await question.save();
        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({ message: 'Error updating upvote metrics.', error });
    }
});

// 5. TOGGLE DOWNVOTE ON AN ANSWER (Deducts 1 point for a downward review/quality penalty)
router.post('/:questionId/answers/:answerId/downvote', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { questionId, answerId } = req.params;
        const userId = req.userId as any;

        const question = await Question.findById(questionId);
        if (!question) {
            res.status(404).json({ message: 'Question not found.' });
            return;
        }

        const answer = question.answers.find((ans: any) => ans._id.toString() === answerId);
        if (!answer) {
            res.status(404).json({ message: 'Answer not found.' });
            return;
        }

        // Remove upvote if it exists
        const uvIndex = answer.upvotes.indexOf(userId);
        if (uvIndex !== -1) {
            answer.upvotes.splice(uvIndex, 1);
            if (answer.upvotes.length < 5 && answer.hasAchievedBonus) {
                answer.hasAchievedBonus = false;
                await adjustUserPoints(answer.user.toString(), -5);
            }
        }

        const dvIndex = answer.downvotes.indexOf(userId);
        if (dvIndex === -1) {
            answer.downvotes.push(userId);
            await adjustUserPoints(answer.user.toString(), -1);
        } else {
            answer.downvotes.splice(dvIndex, 1);
            await adjustUserPoints(answer.user.toString(), 1);
        }

        question.markModified('answers');
        await question.save();
        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({ message: 'Error registry handling downvotes.', error });
    }
});

// 6. PEER-TO-PEER POINT TRANSFER TRANSACTION ENDPOINT
router.post('/transfer-points', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const senderId = req.userId;
        const { recipientUsername, pointsToTransfer } = req.body;
        const amount = parseInt(pointsToTransfer, 10);

        if (!recipientUsername || isNaN(amount) || amount <= 0) {
            res.status(400).json({ message: 'Invalid target parameters or point quantity.' });
            return;
        }

        const sender = await User.findById(senderId);
        if (!sender) {
            res.status(404).json({ message: 'Sender details not found.' });
            return;
        }

        if (sender.rewardPoints <= 10) {
            res.status(403).json({
                message: 'Point transfer blocked. You must have more than 10 points in your account balance to transfer points.'
            });
            return;
        }

        if (sender.rewardPoints < amount) {
            res.status(400).json({ message: `Insufficient points balance. You only have ${sender.rewardPoints} points available.` });
            return;
        }

        const recipient = await User.findOne({ username: recipientUsername.trim() });
        if (!recipient) {
            res.status(404).json({ message: `Target user @${recipientUsername} does not exist.` });
            return;
        }

        if (sender._id.toString() === recipient._id.toString()) {
            res.status(400).json({ message: 'You cannot transfer points to your own account profile.' });
            return;
        }

        sender.rewardPoints -= amount;
        recipient.rewardPoints += amount;

        await sender.save();
        await recipient.save();

        res.status(200).json({
            message: `Successfully transferred ${amount} points to @${recipientUsername}!`,
            currentBalance: sender.rewardPoints
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal error updating balance ledger transaction indices.', error });
    }
});

export default router;