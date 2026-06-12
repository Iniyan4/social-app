'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Award, ArrowBigUp, ArrowBigDown, MessageSquare, CornerDownRight } from 'lucide-react';

// ... keep interfaces up to date ...

export default function QuestionFeed({ questions, onVoteUpdate }: { questions: any[], onVoteUpdate: () => void }) {
    const { user, token } = useAuth();
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState('');

    // Get the centralized API Base URL from environment variables
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    const handleVote = async (qId: string, aId: string, action: 'upvote' | 'downvote') => {
        if (!token) return alert('Please sign in to vote.');
        const res = await fetch(`${API_BASE_URL}/questions/${qId}/answers/${aId}/${action}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) onVoteUpdate();
    };

    const handleAnswerSubmit = async (e: React.FormEvent, qId: string) => {
        e.preventDefault();
        if (!answerText.trim() || !user) return;

        const res = await fetch(`${API_BASE_URL}/questions/${qId}/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ username: user.username, text: answerText })
        });

        if (res.ok) {
            setAnswerText('');
            onVoteUpdate();
        }
    };

    return (
        <div className="space-y-4">
            {questions.map((q) => (
                <div key={q._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-700">@{q.user?.username}</span>
                        {q.user?.subscriptionPlan && q.user.subscriptionPlan !== 'free' && (
                            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-[9px] uppercase font-bold">
                                {q.user.subscriptionPlan}
                            </span>
                        )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">{q.title}</h4>
                    <p className="text-xs text-slate-600 mb-4">{q.body}</p>

                    {/* Collapsible Solution Expansion Bar Trigger */}
                    <button
                        onClick={() => setActiveQuestionId(activeQuestionId === q._id ? null : q._id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                    >
                        <MessageSquare size={14} /> Solutions ({q.answers?.length || 0})
                    </button>

                    {activeQuestionId === q._id && (
                        <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
                            {/* Existing Answers Array Loop Rendering */}
                            {q.answers?.map((ans: any) => {
                                const hasUpvoted = user ? ans.upvotes?.includes(user.id) : false;
                                const hasDownvoted = user ? ans.downvotes?.includes(user.id) : false;

                                return (
                                    <div key={ans._id} className="flex gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                                        {/* Voting Column Controls block */}
                                        <div className="flex flex-col items-center text-slate-400">
                                            <button
                                                onClick={() => handleVote(q._id, ans._id, 'upvote')}
                                                className={`hover:text-emerald-600 transition ${hasUpvoted ? 'text-emerald-600' : ''}`}
                                            >
                                                <ArrowBigUp size={20} fill={hasUpvoted ? 'currentColor' : 'none'} />
                                            </button>
                                            <span className="text-xs font-bold my-0.5 text-slate-700">
                                                {(ans.upvotes?.length || 0) - (ans.downvotes?.length || 0)}
                                            </span>
                                            <button
                                                onClick={() => handleVote(q._id, ans._id, 'downvote')}
                                                className={`hover:text-rose-600 transition ${hasDownvoted ? 'text-rose-600' : ''}`}
                                            >
                                                <ArrowBigDown size={20} fill={hasDownvoted ? 'currentColor' : 'none'} />
                                            </button>
                                        </div>

                                        {/* Solution content detail wrapper block text string */}
                                        <div className="flex-1 text-xs">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-slate-700">@{ans.username}</span>
                                                {ans.hasAchievedBonus && (
                                                    <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md">
                                                        ★ Top Contributor
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-600 leading-relaxed">{ans.text}</p>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Submit a New Solution Form Input row */}
                            <form onSubmit={(e) => handleAnswerSubmit(e, q._id)} className="flex gap-2 items-center border-t border-slate-100 pt-3">
                                <CornerDownRight size={16} className="text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Contribute your solution answer..."
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                    className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                                    required
                                />
                                <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition">
                                    Submit
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}