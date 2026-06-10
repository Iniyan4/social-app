'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Monitor, Smartphone, Laptop, History } from 'lucide-react';

export default function LoginHistoryPanel() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        if (!token) return;
        fetch('http://localhost:5000/api/auth/login-history', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setLogs(data); })
            .catch(err => console.error(err));
    }, [token]);

    const getDeviceIcon = (type: string) => {
        if (type === 'mobile') return <Smartphone size={14} className="text-emerald-600" />;
        if (type === 'laptop') return <Laptop size={14} className="text-indigo-600" />;
        return <Monitor size={14} className="text-slate-600" />;
    };

    if (logs.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                <History size={14} /> Device Access Transparency Log
            </h4>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {logs.map((log) => (
                    <div key={log._id} className="flex items-center justify-between gap-3 p-2 border border-slate-50 rounded-lg bg-slate-50/40 text-[11px]">
                        <div className="flex items-center gap-2">
                            {getDeviceIcon(log.deviceType)}
                            <div>
                                <p className="font-bold text-slate-700">{log.browserType} ({log.operatingSystem})</p>
                                <p className="text-[10px] text-slate-400 font-medium">IP Address: {log.ipAddress}</p>
                            </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
              {new Date(log.loginTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
}