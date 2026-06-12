'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ShieldCheck, Clock, Zap, Star, ShieldAlert, Loader2 } from 'lucide-react';

// 1. Core Billing Interface separated to safely read Context values during production build tracking
function BillingPageContent() {
    const { token, user } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isWindowOpen, setIsWindowOpen] = useState(true);

    // Get the centralized API Base URL from environment variables
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        // Basic frontend check for current time mapping guidelines helper notification text display
        const checkIstTime = () => {
            const currentHour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours();
            setIsWindowOpen(currentHour === 10);
        };
        checkIstTime();
        const id = setInterval(checkIstTime, 30000);
        return () => clearInterval(id);
    }, []);

    const handlePurchasePlan = async (plan: string) => {
        setLoading(plan);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/subscriptions/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ plan })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Payment gateway configuration fault.');

            if (data.url) window.location.href = data.url; // Boot out directly to Stripe Core checkout portal!
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(null);
        }
    };

    const plans = [
        { name: 'bronze', price: '₹100', limit: '5 Questions / day', icon: <Zap size={20} className="text-amber-600" />, bg: 'bg-white' },
        { name: 'silver', price: '₹300', limit: '10 Questions / day', icon: <Star size={20} className="text-slate-400" />, bg: 'border-2 border-indigo-500 bg-white relative' },
        { name: 'gold', price: '₹1000', limit: 'Unlimited Access', icon: <ShieldCheck size={20} className="text-yellow-500" />, bg: 'bg-gradient-to-b from-yellow-50/30 to-white' }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Account Subscription Desk</h2>
                <p className="text-xs text-slate-500 mt-2">Unlock professional query parameters and increase daily capabilities.</p>

                {/* Time Limit Notice Banner */}
                <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border ${isWindowOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    <Clock size={14} />
                    {isWindowOpen ? 'Payment gateway is currently active.' : 'Transactions restricted. Gateway opens exclusively between 10:00 AM and 11:00 AM IST daily.'}
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-700 max-w-md mx-auto">
                    <ShieldAlert size={16} /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {plans.map((p) => (
                    <div key={p.name} className={`rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between ${p.bg}`}>
                        {p.name === 'silver' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Popular</span>}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-base font-bold text-slate-700 uppercase tracking-wide">{p.name}</h4>
                                {p.icon}
                            </div>
                            <div className="mb-4">
                                <span className="text-3xl font-extrabold text-slate-800">{p.price}</span>
                                <span className="text-xs text-slate-400 font-medium"> / month</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1.5 rounded-lg mb-6">{p.limit}</p>
                        </div>

                        <button
                            onClick={() => handlePurchasePlan(p.name)}
                            disabled={loading !== null}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs tracking-wide transition disabled:opacity-50"
                        >
                            {loading === p.name ? 'Connecting Gateway...' : `Upgrade to ${p.name}`}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 2. Default Router Entry Point wrapping the child view strictly inside the Context and Suspense barriers
export default function BillingPage() {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <Suspense
                    fallback={
                        <div className="max-w-4xl mx-auto min-h-[50vh] flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="text-indigo-600 animate-spin" size={44} />
                            <h3 className="text-base font-bold text-slate-700">Loading Billing Configuration...</h3>
                        </div>
                    }
                >
                    <BillingPageContent />
                </Suspense>
            </div>
        </AuthProvider>
    );
}