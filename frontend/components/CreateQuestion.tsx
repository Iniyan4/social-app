'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { HelpCircle, Send, AlertTriangle } from 'lucide-react';

export default function CreateQuestion({ onQuestionCreated }: { onQuestionCreated: () => void }) {
    const { token, user } = useAuth();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ title, body })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Submission error.');

            setTitle('');
            setBody('');
            onQuestionCreated();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3 text-slate-800">
                <HelpCircle size={18} className="text-indigo-600" />
                <h4 className="text-sm font-bold">Ask an Academic Question</h4>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    placeholder="What is your core problem statement?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                />
                <textarea
                    placeholder="Provide background context details..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 h-20 bg-white"
                    required
                />

                {error && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2 text-[11px] font-medium text-amber-700">
                        <AlertTriangle size={14} className="shrink-0" /> {error}
                    </div>
                )}

                <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold uppercase text-slate-400">
            Current Tier: <span className="text-indigo-600">{user?.subscriptionPlan || 'free'}</span>
          </span>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition">
                        Ask Question <Send size={12} />
                    </button>
                </div>
            </form>
        </div>
    );
}