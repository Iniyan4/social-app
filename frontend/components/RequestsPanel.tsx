'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Check, X, Bell } from 'lucide-react';

export default function RequestsPanel({ onActionComplete }: { onActionComplete: () => void }) {
    const { token } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);

    // Get the centralized API Base URL from environment variables
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    const fetchRequests = useCallback(async () => {
        if (!token || !API_BASE_URL) return;
        try {
            const res = await fetch(`${API_BASE_URL}/friends/requests/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setRequests(data);
        } catch (err) {
            console.error('Error fetching invitations:', err);
        }
    }, [token, API_BASE_URL]);

    useEffect(() => {
        fetchRequests();

        // Poll for new incoming friend requests every 5 seconds
        const intervalId = setInterval(() => {
            fetchRequests();
        }, 5000);

        return () => clearInterval(intervalId);
    }, [token, fetchRequests]);

    const handleRespond = async (friendshipId: string, action: 'accepted' | 'declined') => {
        try {
            const res = await fetch(`${API_BASE_URL}/friends/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ friendshipId, action })
            });

            if (res.ok) {
                fetchRequests();
                onActionComplete(); // Instantly trigger profile context sync to unlock tiers
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (requests.length === 0) return null;

    return (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 shadow-sm">
            <h5 className="font-bold text-xs text-amber-800 flex items-center gap-1.5 uppercase tracking-wider mb-3">
                <Bell size={14} /> Pending Invites ({requests.length})
            </h5>
            <div className="space-y-2.5">
                {requests.map(req => (
                    <div key={req._id} className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-amber-100 shadow-sm animate-fade-in">
                        <span className="text-xs font-semibold text-slate-700">@{req.requester?.username}</span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleRespond(req._id, 'accepted')}
                                className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={() => handleRespond(req._id, 'declined')}
                                className="p-1 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}