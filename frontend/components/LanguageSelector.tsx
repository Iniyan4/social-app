'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Globe, ShieldCheck, Mail, Smartphone, RefreshCw } from 'lucide-react';

export default function LanguageSelector({ onLanguageUpdated }: { onLanguageUpdated: (lang: string) => void }) {
    const { token, user } = useAuth();
    const [selectedLang, setSelectedLang] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const [step, setStep] = useState<'select' | 'otp'>('select');
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const languagesList = [
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Español (Spanish)' },
        { code: 'hi', label: 'हिन्दी (Hindi)' },
        { code: 'pt', label: 'Português (Portuguese)' },
        { code: 'zh', label: '中文 (Chinese)' },
        { code: 'fr', label: 'Français (French)' },
        { code: 'ta', label: 'தமிழ் (Tamil)' },  // Added
        { code: 'te', label: 'తెలుగు (Telugu)' }
    ];

    const handleInitiateSwitch = async (langCode: string) => {
        setError('');
        setNotice('');
        setLoading(true);
        setSelectedLang(langCode);

        try {
            const res = await fetch('http://localhost:5000/api/languages/request-switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ targetLanguage: langCode })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Verification initialization error.');

            setNotice(data.message);
            setStep('otp');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/languages/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ otpToken })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Invalid validation challenge match.');

            alert(`Language updated successfully to ${selectedLang.toUpperCase()}!`);
            onLanguageUpdated(data.language); // Sync local application state framework parameters
            setStep('select');
            setOtpToken('');
            setNotice('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                <Globe size={14} className="text-indigo-600" /> Language Customization
            </h4>

            {step === 'select' ? (
                <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 leading-normal italic mb-1">
                        Note: Conversions require SMS or Email authorization checks based on selected region metrics.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {languagesList.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleInitiateSwitch(lang.code)}
                                disabled={loading}
                                className={`text-left px-3 py-2 text-xs font-semibold rounded-lg border transition ${user?.language === lang.code ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'}`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                    {error && <p className="text-[10px] font-bold text-rose-600 mt-2">{error}</p>}
                </div>
            ) : (
                /* OTP Step Challenge Form Screen Section Frame */
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-3 mt-2 animate-fade-in">
                    <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[11px] text-indigo-800 flex gap-2 items-start">
                        {selectedLang === 'fr' ? <Mail size={16} className="mt-0.5 shrink-0" /> : <Smartphone size={16} className="mt-0.5 shrink-0" />}
                        <div>{notice}</div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Enter 6-Digit Security OTP</label>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="e.g. 540912"
                            value={otpToken}
                            onChange={(e) => setOtpToken(e.target.value)}
                            className="w-full text-center tracking-widest font-mono border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                    </div>

                    {error && <p className="text-[10px] font-bold text-rose-600">{error}</p>}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setStep('select')}
                            className="flex-1 py-2 text-xs font-bold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
                        >
                            {loading ? 'Verifying...' : 'Confirm Switch'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}