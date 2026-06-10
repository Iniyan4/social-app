'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function BillingSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    // Prevent duplicate automated API requests running in React StrictMode
    const requestDispatched = useRef(false);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const plan = searchParams.get('plan');
        const token = localStorage.getItem('token'); // Get auth context reference

        if (!sessionId || !plan) {
            setStatus('error');
            setErrorMessage('Missing required checkout transaction attributes.');
            return;
        }

        if (requestDispatched.current) return;
        requestDispatched.current = true;

        const finalizeSubscription = async () => {
            try {
                // Simulate/Forward payload tracking information to the backend endpoint
                const res = await fetch('http://localhost:5000/api/subscriptions/success-webhook-sim', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        sessionId,
                        plan
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Webhook verification handling failed.');

                setStatus('success');

                // Bounce back safely to home dashboard after brief victory display
                setTimeout(() => {
                    router.push('/');
                }, 3000);

            } catch (err: any) {
                console.error('Subscription sync error:', err);
                setStatus('error');
                setErrorMessage(err.message || 'Failed to update account tier status flags.');
            }
        };

        finalizeSubscription();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center animate-fade-in">
                {status === 'verifying' && (
                    <div className="space-y-4">
                        <Loader2 className="mx-auto text-indigo-600 animate-spin" size={48} />
                        <h2 className="text-xl font-bold text-slate-800">Verifying Payment...</h2>
                        <p className="text-sm text-slate-500">
                            Securing your transaction assets and provisioning your workspace account.
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4">
                        <CheckCircle className="mx-auto text-emerald-500 animate-bounce" size={48} />
                        <h2 className="text-2xl font-bold text-slate-800">Payment Successful!</h2>
                        <p className="text-sm text-slate-500">
                            Your workspace layout is updated. Redirecting to your main dashboard space...
                        </p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full animate-[loading-bar_3s_ease-out-forwards]" style={{ width: '100%' }} />
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <AlertCircle className="mx-auto text-rose-500" size={48} />
                        <h2 className="text-xl font-bold text-slate-800">Sync Pipeline Blocked</h2>
                        <p className="text-sm text-rose-500 bg-rose-50 border border-rose-100 p-3 rounded-xl font-medium">
                            {errorMessage}
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-xl text-sm transition"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}