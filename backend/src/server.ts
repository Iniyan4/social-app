import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import postRoutes from "./routes/postRoutes.js";
import friendRoutes from './routes/friendRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import languageRoutes from './routes/languageRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social_app_db';

// 2. FIXED: Restricted CORS configuration to safe origins instead of permissive defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5000', 'https://social-app-zeta-livid.vercel.app'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/profile', profileRoutes);

// Establish MongoDB Connection
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('🍃 Connected to MongoDB via Compass successfully!');
        // NOTE: Historic data migration engine has been decoupled from app startup process
        // to support multi-instance horizontal scaling without concurrency collision.
    })
    .catch((err) => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('Social App Backend with MongoDB is running!');
});

app.listen(PORT, () => {
    console.log(`🚀 Server navigating smoothly on port ${PORT}`);
});