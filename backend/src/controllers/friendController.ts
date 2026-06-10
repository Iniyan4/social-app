import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { Friendship } from '../models/Friendship.js';
import { Types } from 'mongoose';

// 1. SEND FRIEND REQUEST
export const sendFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const requesterId = req.userId;
        const { recipientId } = req.body;

        if (!requesterId || !recipientId) {
            res.status(400).json({ message: 'Missing parameters.' });
            return;
        }

        if (requesterId === recipientId) {
            res.status(400).json({ message: 'You cannot add yourself as a friend.' });
            return;
        }

        const reqObjId = new Types.ObjectId(requesterId);
        const recObjId = new Types.ObjectId(recipientId);

        const existingRequest = await Friendship.findOne({
            $or: [
                { requester: reqObjId, recipient: recObjId },
                { requester: recObjId, recipient: reqObjId }
            ]
        });

        if (existingRequest) {
            res.status(400).json({ message: 'A friendship record or pending invite already exists between these users.' });
            return;
        }

        const newInvite = new Friendship({
            requester: reqObjId,
            recipient: recObjId,
            status: 'pending'
        });

        await newInvite.save();
        res.status(201).json({ message: 'Friend invitation sent successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error handling friend request connection.', error });
    }
};

// 2. ACCEPT / DECLINE FRIEND REQUEST
export const respondToRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { friendshipId, action } = req.body;

        if (!['accepted', 'declined'].includes(action)) {
            res.status(400).json({ message: 'Invalid action parameter.' });
            return;
        }

        const invite = await Friendship.findById(friendshipId);
        if (!invite || invite.status !== 'pending') {
            res.status(404).json({ message: 'No valid pending invitation found.' });
            return;
        }

        if (invite.recipient.toString() !== userId) {
            res.status(403).json({ message: 'Unauthorized. You are not the recipient of this invitation.' });
            return;
        }

        invite.status = action;
        await invite.save();

        if (action === 'accepted') {
            await User.updateMany(
                { _id: { $in: [invite.requester, invite.recipient] } },
                { $inc: { friendCount: 1 } }
            );
        }

        res.status(200).json({ message: `Friendship ${action} successfully.` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating connection graph.', error });
    }
};

// 3. GET SYSTEM DIRECTORY LIST
export const getDiscoverUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.userId;
        if (!currentUserId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }

        const userObjId = new Types.ObjectId(currentUserId);
        const users = await User.find({ _id: { $ne: userObjId } }).select('username friendCount');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user space.', error });
    }
};

// 4. GET PENDING INCOMING REQUESTS FOR LOGGED IN USER
export const getPendingRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }

        // Cast to ObjectId to satisfy strict type mappings and eliminate 'undefined' type possibilities
        const userObjId = new Types.ObjectId(userId);

        const requests = await Friendship.find({ recipient: userObjId, status: 'pending' })
            .populate('requester', 'username email avatarUrl');

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending requests.', error });
    }
};

// 5. GET ACCEPTED FRIENDS LIST
export const getFriendsList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }

        // Convert the string to a proper ObjectId for strict alignment inside the query matrix
        const userObjId = new Types.ObjectId(userId);

        const friendships = await Friendship.find({
            $or: [{ requester: userObjId }, { recipient: userObjId }],
            status: 'accepted'
        }).populate('requester recipient', 'username email avatarUrl');

        const friends = friendships.map(f => {
            const isRequester = (f.requester as any)._id.toString() === userId;
            return isRequester ? f.recipient : f.requester;
        });

        res.status(200).json(friends);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching friends list.', error });
    }
};

export const getPublicUserProfileDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;

        // 1. Guard clause: Ensure username exists and is a single string
        if (!username || typeof username !== 'string') {
            res.status(400).json({ message: 'Invalid or missing username parameter.' });
            return;
        }

        // 2. The query is now type-safe because 'username' is guaranteed to be a string
        const targetUser = await User.findOne({ username });
        if (!targetUser) {
            res.status(404).json({ message: 'User profile not found.' });
            return;
        }

        // Fallback calculation for legacy accounts lacking a join timestamp
        const actualJoinDate = targetUser.createdAt || new Date('2026-01-01T00:00:00.000Z');

        res.status(200).json({
            username: targetUser.username,
            bio: targetUser.bio || 'No bio provided.',
            avatarUrl: targetUser.avatarUrl || '',
            subscriptionPlan: targetUser.subscriptionPlan || 'free',
            dateRegistered: actualJoinDate.toISOString(),
            email: targetUser.isEmailPublic ? targetUser.email : undefined,
            phoneNumber: targetUser.isPhonePublic ? targetUser.phoneNumber : undefined
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving public profile layout matrices.', error });
    }
};