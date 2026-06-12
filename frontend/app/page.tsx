'use client';

import React, { useEffect, useState, useCallback } from 'react';
import CreatePost from '@/components/CreatePost';
import PublicFeed from '@/components/PublicFeed';
import ConnectPanel from '@/components/ConnectPanel';
import RequestsPanel from '@/components/RequestsPanel';
import CreateQuestion from '@/components/CreateQuestion';
import QuestionFeed from '@/components/QuestionFeed';
import PointsPanel from '@/components/PointsPanel';
import LanguageSelector from '@/components/LanguageSelector';
import { localizationDictionary } from '@/utils/translations';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Compass, Users, HelpCircle, CreditCard, Sparkles, LogOut, Radio, User } from 'lucide-react';
import LoginHistoryPanel from "@/components/LoginHistoryPanel";
import UserProfilePanelComponent from "@/components/UserProfilePanel";

// Cast the component to any to resolve the missing IntrinsicAttributes/props error
const UserProfilePanel = UserProfilePanelComponent as any;

export default function Home() {
    const { user, token, logout } = useAuth();
    const [posts, setPosts] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [friends, setFriends] = useState([]);
    const [activeTab, setActiveTab] = useState<'public' | 'questions' | 'friends'>('public');

    // UI Interface Overlay States
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false);

    // Get the centralized API Base URL from environment variables
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    // Safely look up the dictionary key by casting the string representation
    const activeLanguageCode = (((user as any)?.language as string) || 'en') as keyof typeof localizationDictionary;
    const dictionary = localizationDictionary[activeLanguageCode] || localizationDictionary.en;

    const fetchFeed = useCallback(async () => {
        if (!API_BASE_URL) return;
        try {
            const res = await fetch(`${API_BASE_URL}/posts`);
            if (res.ok) setPosts(await res.json());
        } catch (err) {
            console.error(err);
        }
    }, [API_BASE_URL]);

    const fetchQuestions = useCallback(async () => {
        if (!API_BASE_URL) return;
        try {
            const res = await fetch(`${API_BASE_URL}/questions`);
            if (res.ok) setQuestions(await res.json());
        } catch (err) {
            console.error(err);
        }
    }, [API_BASE_URL]);

    const fetchFriends = useCallback(async () => {
        if (!token || !API_BASE_URL) return;
        try {
            const res = await fetch(`${API_BASE_URL}/friends/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setFriends(await res.json());
        } catch (err) {
            console.error(err);
        }
    }, [token, API_BASE_URL]);

    // Ensure the background syncing function matches this layout format exactly:
    const fireHeartbeatAndSync = useCallback(async () => {
        if (!token || !API_BASE_URL) return;
        try {
            // Asynchronously dispatch the heartbeat ping ahead of data fetches
            fetch(`${API_BASE_URL}/auth/heartbeat`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => {/* Handle silent connection drop safely */});

            // Fetch remaining structural component streams via standard environment configurations
            const feedRes = await fetch(`${API_BASE_URL}/posts`);
            if (feedRes.ok) setPosts(await feedRes.json());

            const qRes = await fetch(`${API_BASE_URL}/questions`);
            if (qRes.ok) setQuestions(await qRes.json());

            const friendRes = await fetch(`${API_BASE_URL}/friends/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (friendRes.ok) setFriends(await friendRes.json());
        } catch (e) {
            console.error("Connection stream synchronization suspended: ", e);
        }
    }, [token, API_BASE_URL]);

    useEffect(() => {
        if (token) {
            fireHeartbeatAndSync();

            // High-frequency polling loop ensures active lease metrics stay completely accurate
            const intervalId = setInterval(fireHeartbeatAndSync, 4000);
            return () => clearInterval(intervalId);
        } else {
            fetchFeed();
            fetchQuestions();
        }
    }, [token, fireHeartbeatAndSync, fetchFeed, fetchQuestions]);

    const displayPlan = ((user as any)?.subscriptionPlan || 'free').toUpperCase();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-indigo-50/30 text-slate-800">
            {/* Catchy Upper Navigation Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between shadow-sm">
                <Link href="/" className="text-xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-1.5 tracking-tight hover:opacity-95 transition">
                    <Sparkles size={20} className="text-indigo-600" /> Social Space
                </Link>

                {user ? (
                    <div className="flex items-center gap-4 relative">
                        <span className="hidden sm:flex bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-xl items-center gap-1">
                            <Radio size={12} className="text-indigo-500 animate-pulse" /> Active Session
                        </span>

                        <Link href="/billing" className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition shadow-sm shadow-amber-100">
                            <CreditCard size={13} /> {displayPlan} Tier
                        </Link>

                        {/* Interactive Profile Dropdown Trigger Icon Element */}
                        <div className="relative">
                            <button
                                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                                className="w-9 h-9 rounded-full bg-indigo-600 border-2 border-white shadow-md cursor-pointer overflow-hidden flex items-center justify-center font-bold text-white text-sm transition transform hover:scale-105 active:scale-95"
                            >
                                {(user as any)?.avatarUrl ? (
                                    <img src={(user as any).avatarUrl} alt="Me" className="w-full h-full object-cover" />
                                ) : (
                                    user.username ? user.username[0].toUpperCase() : 'U'
                                )}
                            </button>

                            {/* DROPDOWN OPTIONS OVERLAY */}
                            {isHeaderMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsHeaderMenuOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-20 animate-fade-in">
                                        <button
                                            onClick={() => {
                                                setIsHeaderMenuOpen(false);
                                                setIsProfileOverlayOpen(true);
                                            }}
                                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                                        >
                                            <User size={14} className="text-indigo-500" /> User Profile
                                        </button>
                                        <hr className="border-slate-100 my-1" />
                                        <button
                                            onClick={() => {
                                                setIsHeaderMenuOpen(false);
                                                logout();
                                            }}
                                            className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50/50 flex items-center gap-2 transition cursor-pointer"
                                        >
                                            <LogOut size={14} /> Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Link href="/auth/login" className="text-xs font-bold text-slate-600 py-2 px-3 hover:text-indigo-600 transition">Sign In</Link>
                        <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition">Get Started</Link>
                    </div>
                )}
            </header>

            {/* Core Split-Screen Grid System Layout */}
            <main className="max-w-6xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    {user ? (
                        <>
                            {/* Linear Main Interface Filtering Tab Strip */}
                            <div className="flex border border-slate-200/60 mb-4 bg-white/90 shadow-sm backdrop-blur-xs rounded-2xl p-1 gap-1">
                                <button onClick={() => setActiveTab('public')} className={`flex-1 py-2 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition ${activeTab === 'public' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    <Compass size={14} /> Feed
                                </button>
                                <button onClick={() => setActiveTab('questions')} className={`flex-1 py-2 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition ${activeTab === 'questions' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    <HelpCircle size={14} /> Questions
                                </button>
                                <button onClick={() => setActiveTab('friends')} className={`flex-1 py-2 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition ${activeTab === 'friends' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    <Users size={14} /> Contacts ({friends.length})
                                </button>
                            </div>

                            {activeTab === 'public' && (
                                <>
                                    <CreatePost onPostCreated={fireHeartbeatAndSync} />
                                    <PublicFeed posts={posts} onInteractionUpdate={fireHeartbeatAndSync} />
                                </>
                            )}

                            {activeTab === 'questions' && (
                                <>
                                    <CreateQuestion onQuestionCreated={fireHeartbeatAndSync} />
                                    <QuestionFeed questions={questions} onVoteUpdate={fireHeartbeatAndSync} />
                                </>
                            )}

                            {activeTab === 'friends' && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h4 className="font-extrabold text-sm text-slate-800 mb-4 tracking-tight">Active Connection Directory</h4>
                                    {friends.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-6 text-center italic">Discover and link up with users via the recommendation panel!</p>
                                    ) : (
                                        <div className="flex flex-col space-y-2.5">
                                            {friends.map((f: any) => (
                                                <div key={f._id} className="flex items-center justify-between p-3 border border-slate-100 bg-gradient-to-r from-slate-50 to-white rounded-xl transition hover:shadow-xs">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-indigo-600 overflow-hidden flex items-center justify-center font-bold text-white text-xs shadow-inner">
                                                            {f.avatarUrl ? <img src={f.avatarUrl} className="w-full h-full object-cover" /> : (f.username ? f.username[0].toUpperCase() : 'U')}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700">@{f.username}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">
                                                        <span className={`w-2 h-2 rounded-full ${f.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                            {f.isOnline ? 'Online' : 'Offline'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xl max-w-md mx-auto mt-12 bg-gradient-to-b from-white to-slate-50/50">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Welcome to Social Space</h3>
                            <p className="text-xs text-slate-500 mb-6 leading-relaxed">Join our dynamic community hub to interact on public spaces, submit premium academic question streams, and earn reward vault points.</p>
                            <Link href="/auth/login" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-8 py-3 rounded-xl inline-block shadow-lg shadow-indigo-100 transition transform hover:-translate-y-0.5">Sign In to Your Space</Link>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {user && (
                        <>
                            <LoginHistoryPanel />
                            <LanguageSelector onLanguageUpdated={() => fireHeartbeatAndSync()} />
                            <PointsPanel onTransactionComplete={fireHeartbeatAndSync} />
                            <RequestsPanel onActionComplete={fireHeartbeatAndSync} />
                            <ConnectPanel />
                        </>
                    )}
                </div>
            </main>

            {/* LIGHTWEIGHT PROFILE OVERLAY SCREEN COMPONENT MODAL MOUNT */}
            {isProfileOverlayOpen && (
                <UserProfilePanel isOpen={isProfileOverlayOpen} onClose={() => setIsProfileOverlayOpen(false)} />
            )}
        </div>
    );
}