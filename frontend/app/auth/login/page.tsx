'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ShieldAlert, KeyRound, Globe, Mail } from 'lucide-react';

// 1. Move your core login and OTP interface to a component safe to consume context
function LoginFormContent() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otpAttempt, setOtpAttempt] = useState('');
    const [otpRequired, setOtpRequired] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, incomingOtpAttempt: otpRequired ? otpAttempt : undefined })
            });

            const data = await res.json();

            if (res.status === 202 && data.stepCheckRequired) {
                // Chrome security gate challenge met
                setOtpRequired(true);
                setLoading(false);
                return;
            }

            if (!res.ok) throw new Error(data.message || 'Login credentials rejected.');

            // Clear logs details into context state management
            login(data.token, data.user);
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Sign In to UnitySpace</h3>

            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl flex gap-2 items-center my-4 font-semibold">
                    <ShieldAlert size={16} /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {!otpRequired ? (
                    <>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-800" placeholder="you@domain.com" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-800" placeholder="••••••••" />
                        </div>
                    </>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl animate-fade-in space-y-3">
                        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs">
                            <Globe size={16} /> Chrome Verification Gate Active
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">Please input the verification code dispatched directly to your inbox below:</p>
                        <input
                            type="text"
                            maxLength={6}
                            required
                            placeholder="6-Digit OTP"
                            value={otpAttempt}
                            onChange={(e) => setOtpAttempt(e.target.value)}
                            className="w-full text-center tracking-widest font-mono border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-800"
                        />
                    </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs transition">
                    {loading ? 'Processing Auth...' : otpRequired ? 'Verify & Authenticate' : 'Log In'}
                </button>
            </form>
        </div>
    );
}

// 2. Main Page Entry Point wrapped directly in AuthProvider to satisfy the compiler
export default function LoginPage() {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Suspense
                    fallback={
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center flex flex-col items-center justify-center space-y-4">
                            <h3 className="text-xl font-bold text-slate-800">Loading UnitySpace...</h3>
                        </div>
                    }
                >
                    <LoginFormContent />
                </Suspense>
            </div>
        </AuthProvider>
    );
}