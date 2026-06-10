'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, CheckCircle2 } from 'lucide-react';

interface DiscoveryUser {
    _id: string;
    username: string;
    friendCount: number;
}

export default function ConnectPanel() {
    const { token, user } = useAuth();
    const [people, setPeople] = useState<DiscoveryUser[]>([]);
    const [sentIds, setSentIds] = useState<string[]>([]);

    useEffect(() => {
        if (!token) return;
        fetch('http://localhost:5000/api/friends/discover', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => Array.isArray(data) && setPeople(data))
            .catch(err => console.error(err));
    }, [token]);

    const handleAddFriend = async (recipientId: string) => {
        try {
            const res = await fetch('http://localhost:5000/api/friends/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ recipientId })
            });

            if (res.ok) {
                setSentIds(prev => [...prev, recipientId]);
            } else {
                const d = await res.json();
                alert(d.message);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (!user || people.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="font-bold text-sm text-slate-800 mb-4">Discover Connections</h4>
            <div className="space-y-3.5">
                {people.map(person => (
                    <div key={person._id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                                {person.username[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700">@{person.username}</p>
                                <p className="text-[10px] text-slate-400">{person.friendCount} friends</p>
                            </div>
                        </div>

                        {sentIds.includes(person._id) ? (
                            <span className="text-emerald-600 text-xs flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                <CheckCircle2 size={12} /> Sent
              </span>
                        ) : (
                            <button
                                onClick={() => handleAddFriend(person._id)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                            >
                                <UserPlus size={12} /> Connect
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}