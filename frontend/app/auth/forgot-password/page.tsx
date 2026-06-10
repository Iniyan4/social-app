'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Mail, AlertTriangle, CheckCircle2, ArrowLeft, Copy } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [identifier, setIdentifier] = useState('');
    const [message, setMessage] = useState('');
    const [generatedPass, setGeneratedPass] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setGeneratedPass('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit recovery request.');
            }

            setMessage(data.message);
            setGeneratedPass(data.temporaryPassword);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyToClipboard = () => {
        if (!generatedPass) return;
        navigator.clipboard.writeText(generatedPass);
        alert('Temporary password copied to clipboard!');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">

                <div className="mb-6">
                    <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition">
                        <ArrowLeft size={14} /> Back to Sign In
                    </Link>
                </div>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <KeyRound size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Recover Password</h3>
                    <p className="text-xs text-slate-500 mt-1.5">Enter your registered email address or phone number to reset your account credentials.</p>
                </div>

                {!generatedPass ? (
                    <form onSubmit={handleResetSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Account Identifier</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    placeholder="Email or phone number"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                />
                            </div>
                        </div>

                        {/* Error Notification Block (e.g. Rate Limit Warning) */}
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Reset Blocked: </span>
                                    {error}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center transition disabled:opacity-50 shadow-md shadow-indigo-100"
                        >
                            {loading ? 'Processing Recovery...' : 'Generate New Password'}
                        </button>
                    </form>
                ) : (
                    /* Success Screen displaying the compliant randomly generated alphabetic sequence key string */
                    <div className="space-y-5 animate-fade-in">
                        <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs">
                            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Success: </span>
                                {message}
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center relative overflow-hidden group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Temporary Password</p>
                            <span className="text-xl font-mono font-bold text-indigo-700 select-all tracking-wide block my-2">
                {generatedPass}
              </span>
                            <button
                                onClick={handleCopyToClipboard}
                                className="mt-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mx-auto bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm transition"
                            >
                                <Copy size={12} /> Copy Password
                            </button>
                        </div>

                        <p className="text-[11px] text-slate-400 text-center leading-relaxed italic">
                            Note: This temporary password contains only uppercase and lowercase alphabetical letters ensuring simple entry.
                        </p>

                        <Link
                            href="/auth/login"
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center transition text-center block"
                        >
                            Proceed to Sign In
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}