'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, FileText, Camera, Phone, Mail, Smartphone, LockKeyhole, X } from 'lucide-react';

interface ProfilePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
    const { token, user, updateUser } = useAuth();

    // Base Profile State Management
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState((user as any)?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState((user as any)?.avatarUrl || '');
    const [metaMsg, setMetaMsg] = useState('');

    // Phone Configuration State Management
    const [newPhone, setNewPhone] = useState(user?.phoneNumber || '');
    const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
    const [phoneOtp, setPhoneOtp] = useState('');
    const [phoneMsg, setPhoneMsg] = useState('');

    // Password Configuration State Management
    const [passStep, setPassStep] = useState<'input' | 'verify'>('input');
    const [strategy, setStrategy] = useState<'single_factor' | 'dual_factor'>('single_factor');
    const [isForgotten, setIsForgotten] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [emailOtpAttempt, setEmailOtpAttempt] = useState('');
    const [mobileOtpAttempt, setMobileOtpAttempt] = useState('');
    const [passMsg, setPassMsg] = useState('');

    // Get the centralized API Base URL from environment variables
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    const handleMetaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMetaMsg('');
        try {
            const res = await fetch(`${API_BASE_URL}/profile/meta-update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ username, bio, avatarUrl })
            });
            const data = await res.json();
            if (res.ok) {
                updateUser(data.user);
                setMetaMsg('Profile settings updated successfully.');
            } else {
                setMetaMsg(data.message);
            }
        } catch (err) {
            setMetaMsg('Failed to update core info.');
        }
    };

    const handlePhoneRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setPhoneMsg('');
        try {
            const res = await fetch(`${API_BASE_URL}/profile/phone/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ newPhoneNumber: newPhone })
            });
            const data = await res.json();
            if (res.ok) {
                setPhoneStep('otp');
                setPhoneMsg(data.message);
            } else {
                setPhoneMsg(data.message);
            }
        } catch (err) {
            setPhoneMsg('Failed to initialize phone verification.');
        }
    };

    const handlePhoneVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setPhoneMsg('');
        try {
            const res = await fetch(`${API_BASE_URL}/profile/phone/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ otpToken: phoneOtp })
            });
            const data = await res.json();
            if (res.ok) {
                updateUser(data.user);
                setPhoneStep('input');
                setPhoneOtp('');
                setPhoneMsg('Phone number updated successfully.');
            } else {
                setPhoneMsg(data.message);
            }
        } catch (err) {
            setPhoneMsg('Verification error.');
        }
    };

    const handlePasswordRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassMsg('');
        try {
            const res = await fetch(`${API_BASE_URL}/profile/password/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isForgotten, oldPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setStrategy(data.strategy);
                setPassStep('verify');
                setPassMsg(data.message);
            } else {
                setPassMsg(data.message);
            }
        } catch (err) {
            setPassMsg('Failed to initiate password change request.');
        }
    };

    const handlePasswordVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassMsg('');
        try {
            const res = await fetch(`${API_BASE_URL}/profile/password/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    strategy,
                    emailTokenAttempt: emailOtpAttempt,
                    mobileTokenAttempt: mobileOtpAttempt
                })
            });
            const data = await res.json();
            if (res.ok) {
                setPassStep('input');
                setOldPassword('');
                setNewPassword('');
                setEmailOtpAttempt('');
                setMobileOtpAttempt('');
                setPassMsg('Password updated successfully.');
            } else {
                setPassMsg(data.message);
            }
        } catch (err) {
            setPassMsg('Failed to finalize password verification.');
        }
    };

    if (!isOpen || !user) return null;

    const hasExistingMobileNumber = !!user.phoneNumber;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
            <div className="absolute inset-0 -z-10" onClick={onClose} />

            <div className="w-full max-w-lg bg-slate-50 h-full shadow-2xl flex flex-col overflow-y-auto border-l border-slate-200">
                <div className="bg-white px-6 py-4 border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight">My Settings</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Manage personal information, connectivity credentials and privacy factors.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200/80 transition cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* CARD 1: GENERAL PERSONAL INFORMATION */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2 mb-3.5 uppercase tracking-wider">
                            <User size={14} className="text-indigo-600" /> Personal Information
                        </h4>
                        <form onSubmit={handleMetaSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Registered Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-slate-300" size={14} />
                                    <input type="email" value={user.email} disabled className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-400 cursor-not-allowed select-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">About Me / Bio</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                    <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs h-16 bg-white text-slate-800 resize-none focus:ring-1 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Profile Picture URL</label>
                                <div className="relative">
                                    <Camera className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                    <input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.png" className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800" />
                                </div>
                            </div>
                            {metaMsg && <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg">{metaMsg}</p>}
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm cursor-pointer">
                                Save Details Updates
                            </button>
                        </form>
                    </div>

                    {/* CARD 2: PHONE CONTACT CONFIGURATION */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2 mb-3.5 uppercase tracking-wider">
                            <Phone size={14} className="text-emerald-600" /> Contact Configuration
                        </h4>
                        {phoneStep === 'input' ? (
                            <form onSubmit={handlePhoneRequest} className="space-y-3.5">
                                <div className={`p-2.5 rounded-xl border text-[10px] font-semibold flex items-center gap-1.5 ${hasExistingMobileNumber ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                    <Smartphone size={14} />
                                    <span>{hasExistingMobileNumber ? `Current Status: Linked (${user.phoneNumber})` : 'Current Status: No Mobile Linked'}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 italic">Adding or changing your phone number requires email OTP authorization checks.</p>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Target Phone Number</label>
                                    <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="e.g. +919876543210" className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800" required />
                                </div>
                                {phoneMsg && <p className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 p-2 rounded-lg">{phoneMsg}</p>}
                                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer">
                                    {hasExistingMobileNumber ? 'Request Mobile Change' : 'Link New Mobile Number'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handlePhoneVerify} className="space-y-3.5">
                                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-800 flex items-start gap-1.5 font-medium">
                                    <Mail size={14} className="shrink-0 mt-0.5" />
                                    <div>{phoneMsg}</div>
                                </div>
                                <input type="text" maxLength={6} required placeholder="Enter 6-Digit Email OTP" value={phoneOtp} onChange={e => setPhoneOtp(e.target.value)} className="w-full text-center tracking-widest font-mono border border-slate-200 rounded-xl py-2 text-xs bg-white text-slate-800" />
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setPhoneStep('input')} className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600">Cancel</button>
                                    <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">Verify & Bind Contact</button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* CARD 3: PASSWORD SECURITY */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2 mb-3.5 uppercase tracking-wider">
                            <LockKeyhole size={14} className="text-rose-600" /> Password Security
                        </h4>
                        {passStep === 'input' ? (
                            <form onSubmit={handlePasswordRequest} className="space-y-3.5">
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                    <input type="checkbox" id="forgottenBox" checked={isForgotten} onChange={e => setIsForgotten(e.target.checked)} className="rounded" />
                                    <label htmlFor="forgottenBox" className="text-[11px] font-bold text-slate-600 select-none cursor-pointer">I forgot my old password (Requires Dual-Factor Verification)</label>
                                </div>
                                {!isForgotten && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Old Password</label>
                                        <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800" required />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">New Password</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800" required />
                                </div>
                                {passMsg && <p className="text-[10px] font-bold text-rose-600 bg-rose-50 p-2 rounded-lg">{passMsg}</p>}
                                <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm cursor-pointer">
                                    Initiate Password Verification
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handlePasswordVerify} className="space-y-4">
                                <p className="text-[11px] text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">{passMsg}</p>
                                {strategy === 'dual_factor' ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wide mb-1"><Mail size={12}/> Email Verification OTP</label>
                                            <input type="text" maxLength={6} required value={emailOtpAttempt} onChange={e => setEmailOtpAttempt(e.target.value)} className="w-full text-center font-mono border border-slate-200 rounded-xl py-1.5 text-xs bg-white text-slate-800" placeholder="6-Digit Code" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wide mb-1"><Smartphone size={12}/> Mobile SMS Verification OTP</label>
                                            <input type="text" maxLength={6} required value={mobileOtpAttempt} onChange={e => setMobileOtpAttempt(e.target.value)} className="w-full text-center font-mono border border-slate-200 rounded-xl py-1.5 text-xs bg-white text-slate-800" placeholder="6-Digit Code" />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Verification Code (Enter code received on either Email or SMS)</label>
                                        <input type="text" maxLength={6} required value={emailOtpAttempt} onChange={e => { setEmailOtpAttempt(e.target.value); setMobileOtpAttempt(e.target.value); }} className="w-full text-center font-mono border border-slate-200 rounded-xl py-2 text-xs bg-white text-slate-800" placeholder="6-Digit Code" />
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setPassStep('input')} className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600">Cancel</button>
                                    <button type="submit" className="flex-1 bg-rose-600 text-white font-bold py-2 rounded-xl text-xs shadow-md cursor-pointer">Apply New Password</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}