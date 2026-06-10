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
import {User} from "./models/User.js";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social_app_db';

app.use(cors());
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
    .then(async () => {
        console.log('🍃 Connected to MongoDB via Compass successfully!');

        // SELF HEALING HISTORIC DATA MIGRATION
        const historicFallbackDate = new Date('2026-01-01T00:00:00.000Z');
        const result = await User.updateMany(
            { createdAt: { $exists: false } },
            { $set: { createdAt: historicFallbackDate } }
        );
        if (result.modifiedCount > 0) {
            console.log(`🔧 Data Migration Engine: Patched ${result.modifiedCount} historic profiles with standard fallback join dates.`);
        }
    })
    .catch((err) => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('Social App Backend with MongoDB is running!');
});

app.listen(PORT, () => {
    console.log(`🚀 Server navigating smoothly on port ${PORT}`);
});