'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Smartphone, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ username: '', email: '', password: '', phoneNumber: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed.');
            router.push('/auth/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent mb-6">Create UnitySpace Account</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username and Email fields match previous layouts */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Username</label>
                        <div className="relative"><User className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="text" required placeholder="johndoe" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" /></div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                        <div className="relative"><Mail className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="email" required placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" /></div>
                    </div>

                    {/* NEW INPUT FOR THE REQUIRED PHONE NUMBER ENTRY ASSET */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Phone Number</label>
                        <div className="relative">
                            <Smartphone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                required
                                placeholder="+919894509595"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
                        <div className="relative"><Lock className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="password" required placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" /></div>
                    </div>

                    {error && <p className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-indigo-100">
                        {loading ? 'Creating Account...' : 'Sign Up'} <ArrowRight size={16} />
                    </button>
                </form>
                <div className="mt-6 text-center text-xs text-slate-500">Already have an account? <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign In</Link></div>
            </div>
        </div>
    );
}