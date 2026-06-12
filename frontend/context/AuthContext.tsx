'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    username: string;
    email: string;
    friendCount: number;
    subscriptionPlan : 'free' | 'bronze' | 'silver' | 'gold';
    rewardPoints: number;
    language: 'en' | 'es' | 'hi' | 'pt' | 'zh' | 'fr' | 'ta' | 'te';
    phoneNumber?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// FIXED: Clean client-side JWT parser logic to evaluate expiration claims without massive dependencies
const isTokenExpired = (tokenString: string): boolean => {
    try {
        const payloadBase64 = tokenString.split('.')[1];
        if (!payloadBase64) return true;
        const decodedJson = JSON.parse(window.atob(payloadBase64));
        if (!decodedJson.exp) return false;

        const currentTimestampSec = Math.floor(Date.now() / 1000);
        return decodedJson.exp < currentTimestampSec;
    } catch {
        return true; // Assume corrupted sessions are expired
    }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            // FIXED: Intercept local mount state and invalidate profile maps if session lifecycle expired
            if (isTokenExpired(storedToken)) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setUser(null);
            } else {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        }
    }, []);

    const updateUser = (newUser: User) => {
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};