'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Heart, MessageCircle, Share2, Send, X, Calendar } from 'lucide-react';

interface Comment {
    username: string;
    text: string;
    createdAt: string;
}

interface Post {
    _id: string;
    caption?: string;
    mediaUrl?: string;
    mediaType?: 'photo' | 'video';
    user: { username: string };
    likes: string[];
    comments: Comment[];
    sharesCount: number;
    createdAt: string;
}

export default function PublicFeed({ posts, onInteractionUpdate }: { posts: Post[], onInteractionUpdate: () => void }) {
    const { user, token } = useAuth();
    const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');

    // Modal Inspection States
    const [inspectedProfile, setInspectedProfile] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleLike = async (postId: string) => {
        if (!token) return alert('Please sign in to interact with posts!');
        const res = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) onInteractionUpdate();
    };

    const triggerProfileInspection = async (targetUsername: string) => {
        if (!targetUsername) return;
        try {
            const res = await fetch(`http://localhost:5000/api/friends/profile/${targetUsername}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setInspectedProfile(data);
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error('Failed to parse user space profile records.');
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent, postId: string) => {
        e.preventDefault();
        if (!commentText.trim() || !user) return;

        const res = await fetch(`http://localhost:5000/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ username: user.username, text: commentText })
        });

        if (res.ok) {
            setCommentText('');
            onInteractionUpdate();
        }
    };

    const handleShare = async (postId: string) => {
        const res = await fetch(`http://localhost:5000/api/posts/${postId}/share`, { method: 'POST' });
        if (res.ok) {
            navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
            alert('Link copied to clipboard! Share count updated.');
            onInteractionUpdate();
        }
    };

    return (
        <div className="space-y-5">
            {posts.map((post) => {
                const hasLiked = user ? post.likes?.includes(user.id) : false;
                const isCommentOpen = activeCommentBox === post._id;

                return (
                    <article key={post._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Header Section with Reactive Image Evaluator */}
                        <div className="p-4 flex items-center gap-2.5">
                            <button
                                onClick={() => triggerProfileInspection(post.user?.username)}
                                className="w-8 h-8 rounded-full bg-indigo-600 overflow-hidden flex items-center justify-center font-bold text-white text-sm shadow-inner transition transform hover:scale-105"
                            >
                                {(post.user as any)?.avatarUrl ? (
                                    <img
                                        src={(post.user as any).avatarUrl}
                                        alt="Avatar Asset"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to text initials if image link breaks
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    post.user?.username ? post.user.username[0].toUpperCase() : 'U'
                                )}
                            </button>
                            <div className="text-left">
                                <button
                                    onClick={() => triggerProfileInspection(post.user?.username)}
                                    className="text-sm font-semibold text-slate-800 hover:text-indigo-600 hover:underline block text-left"
                                >
                                    {post.user?.username || 'Unknown User'}
                                </button>
                                <p className="text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Caption */}
                        {post.caption && <p className="px-4 pb-3 text-sm text-slate-700">{post.caption}</p>}

                        {/* Media Container Frame */}
                        {post.mediaUrl && (
                            <div className="bg-slate-900 flex justify-center max-h-[400px] overflow-hidden border-y border-slate-100">
                                {post.mediaType === 'video' ? (
                                    <video src={post.mediaUrl} controls className="w-full object-contain" />
                                ) : (
                                    <img src={post.mediaUrl} alt="Media Asset" className="w-full object-contain" />
                                )}
                            </div>
                        )}

                        {/* Interaction Utility Controls Action Strip */}
                        <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs font-semibold">
                            {/* STYLED INTERACTIVE LIKE BUTTON */}
                            <button
                                onClick={() => handleLike(post._id)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition ${
                                    hasLiked
                                        ? 'text-rose-600 fill-rose-600 bg-rose-50 border-rose-200 shadow-sm shadow-rose-100/50 font-bold'
                                        : 'hover:text-rose-500 border-transparent'
                                }`}
                            >
                                <Heart size={15} fill={hasLiked ? 'currentColor' : 'none'} />
                                <span>Like ({post.likes?.length || 0})</span>
                            </button>

                            {/* Comment Control */}
                            <button
                                onClick={() => setActiveCommentBox(isCommentOpen ? null : post._id)}
                                className={`flex items-center gap-1.5 hover:text-indigo-600 transition ${isCommentOpen ? 'text-indigo-600' : ''}`}
                            >
                                <MessageCircle size={16} /> Comment ({post.comments?.length || 0})
                            </button>

                            {/* Share Control */}
                            <button
                                onClick={() => handleShare(post._id)}
                                className="flex items-center gap-1.5 hover:text-emerald-600 transition"
                            >
                                <Share2 size={16} /> Share ({post.sharesCount || 0})
                            </button>
                        </div>

                        {/* Collapsible Comments Area */}
                        {isCommentOpen && (
                            <div className="bg-slate-50/50 border-t border-slate-100 p-4 space-y-3">
                                {post.comments?.length > 0 && (
                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                                        {post.comments.map((c, idx) => (
                                            <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-100 text-xs">
                                                <span className="font-bold text-slate-700">@{c.username}: </span>
                                                <span className="text-slate-600">{c.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {user ? (
                                    <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add a public comment..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        />
                                        <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                            <Send size={14} />
                                        </button>
                                    </form>
                                ) : (
                                    <p className="text-[11px] text-slate-400 text-center italic">Sign in to leave a comment response.</p>
                                )}
                            </div>
                        )}
                    </article>
                );
            })}

            {/* FLOATING PRIVACY-FILTERED USER PROFILE DETAILED MODAL OVERLAY */}
            {isModalOpen && inspectedProfile && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative overflow-hidden">

                        <button
                            onClick={() => { setIsModalOpen(false); setInspectedProfile(null); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-lg transition"
                        >
                            <X size={16} />
                        </button>

                        <div className="text-center mt-2 mb-5">
                            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-black shadow-lg shadow-indigo-100 mb-3">
                                {inspectedProfile.username ? inspectedProfile.username[0].toUpperCase() : 'U'}
                            </div>
                            <h3 className="text-base font-bold text-slate-800">@{inspectedProfile.username}</h3>
                            <span className="inline-block mt-1 bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-md">
                                Tier: {inspectedProfile.subscriptionPlan || 'FREE'}
                            </span>
                        </div>

                        <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
                            {inspectedProfile.bio && (
                                <div>
                                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Biography</span>
                                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed italic">{inspectedProfile.bio}</p>
                                </div>
                            )}

                            {/* Upgraded Date-Rendering Section with Fallback Safeguards */}
                            <div className="flex items-center gap-2 text-slate-600 font-medium bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                                <Calendar size={14} className="text-indigo-500" />
                                <span>
                                    Member Since:{' '}
                                    <strong className="text-slate-700">
                                        {inspectedProfile.dateRegistered
                                            ? new Date(inspectedProfile.dateRegistered).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                                            : 'January 1, 2026' // Elegant explicit fallback protection
                                        }
                                    </strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}