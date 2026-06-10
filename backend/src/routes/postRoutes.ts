import { Router, type Response } from 'express';
import { verifyToken, type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { checkPostLimit } from '../middleware/checkPostLimit.js';
import { Post } from '../models/Post.js';

const router = Router();

// CREATE A POST
router.post('/', verifyToken, checkPostLimit, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { caption, mediaUrl, mediaType } = req.body;
        const newPost = new Post({ user: req.userId, caption, mediaUrl, mediaType });
        await newPost.save();
        res.status(201).json({ message: 'Published successfully!', post: newPost });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create post.', error });
    }
});

// GET ALL PUBLIC POSTS (Populates comments along with users)
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user', 'username avatarUrl')
            .sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch public feed.', error });
    }
});

// TOGGLE LIKE / UNLIKE
router.post('/:id/like', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) { res.status(404).json({ message: 'Post not found.' }); return; }

        const userId = req.userId as any;
        const index = post.likes.indexOf(userId);

        if (index === -1) {
            post.likes.push(userId); // Add like
        } else {
            post.likes.splice(index, 1); // Remove like
        }

        await post.save();
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Error handling like toggle.', error });
    }
});

// ADD A COMMENT
router.post('/:id/comment', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { username, text } = req.body; // Expecting username from front-end auth context status
        if (!text) { res.status(400).json({ message: 'Comment text is required.' }); return; }

        const post = await Post.findById(req.params.id);
        if (!post) { res.status(404).json({ message: 'Post not found.' }); return; }

        post.comments.push({ username, text, createdAt: new Date() });
        await post.save();

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Error saving comment.', error });
    }
});

// INCREMENT SHARE COUNT
router.post('/:id/share', async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $inc: { sharesCount: 1 } },
            { new: true }
        );
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Error processing share calculation.', error });
    }
});

export default router;