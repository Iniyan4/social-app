'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Image, Video, Send, Lock } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api'; // FIXED: Imported centralized gateway routes

export default function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
    const { user, token } = useAuth();
    const [caption, setCaption] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
    const [error, setError] = useState('');

    if (!user) return null;

    const friends = user.friendCount;
    const isLocked = friends === 0;

    const getTierMessage = () => {
        if (friends === 0) return "🔒 Posting locked. Add a friend to unlock public spaces!";
        if (friends >= 10) return "✨ Elite Tier: Unlimited posting unlocked!";
        return `🚀 Connection Tier: You have ${friends} friends, allowing you to publish ${friends} posts per 24 hours.`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // FIXED: Replaced hardcoded localhost reference with environmental API gateway path
            const res = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: getAuthHeaders(), // FIXED: Automated passing authenticated token strings via global helpers
                body: JSON.stringify({ caption, mediaUrl, mediaType })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to publish post.');
            }

            setCaption('');
            setMediaUrl('');
            onPostCreated();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                    {user.username[0].toUpperCase()}
                </div>
                <div>
                    <h4 className="font-semibold text-slate-800">Create a Post</h4>
                    <p className="text-xs text-slate-500 font-medium">{getTierMessage()}</p>
                </div>
            </div>

            {isLocked ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 text-center">
                    <Lock className="mx-auto text-slate-400 mb-2" size={24} />
                    <p className="text-sm font-medium text-slate-600">Public posting is unavailable.</p>
                    <p className="text-xs text-slate-400 mt-1">Building social connections rewards you! Connect with at least 1 friend to post.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder={`What's on your mind, ${user.username}?`}
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                        required
                    />

                    <div className="grid grid-cols-3 gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Media Link (URL)"
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                            className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <select
                            value={mediaType}
                            onChange={(e) => setMediaType(e.target.value as 'photo' | 'video')}
                            className="border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white text-slate-700"
                        >
                            <option value="photo">📷 Photo</option>
                            <option value="video">🎥 Video</option>
                        </select>
                    </div>

                    {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition"
                        >
                            <Send size={14} /> Publish Post
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}