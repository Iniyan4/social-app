'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Coins, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PointsPanel({ onTransactionComplete }: { onTransactionComplete: () => void }) {
    const { user, token } = useAuth();
    const [recipient, setRecipient] = useState('');
    const [points, setPoints] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const res = await fetch('http://localhost:5000/api/questions/transfer-points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipientUsername: recipient, pointsToTransfer: points })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Transfer failed.');

            setSuccess(data.message);
            setRecipient('');
            setPoints('');
            onTransactionComplete(); // Instantly sync profile point counter in the header
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (!user) return null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Coins size={14} className="text-yellow-500" /> Reward Vault
                </h4>
                <span className="bg-yellow-50 border border-yellow-200 rounded-full px-2.5 py-0.5 text-xs font-bold text-yellow-700">
          {user.rewardPoints || 0} Points
        </span>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3">
                <input
                    type="text"
                    placeholder="Recipient's username"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                />
                <input
                    type="number"
                    placeholder="Points to transfer"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                />

                {error && (
                    <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-center gap-2 text-[10px] font-bold text-rose-700">
                        <AlertCircle size={12} /> {error}
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 size={12} /> {success}
                    </div>
                )}

                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1">
                    Transfer Points <Send size={12} />
                </button>
            </form>
        </div>
    );
}