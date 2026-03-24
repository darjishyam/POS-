"use client";

import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  ArrowRight,
  Loader2,
  ShieldCheck,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

const CustomSignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetMode, setResetMode] = useState(false);
    const router = useRouter();

    const handleSocialSignIn = async (strategy: string) => {
        if (strategy !== 'oauth_google') return;
        
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            
            // Set session cookie
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });

            toast.success("Security Handshake Complete.");
            if (result.user.email === "professorshyam123@gmail.com") {
                router.push('/dashboard');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            console.error("Social Sign-In Error", err);
            toast.error(err.message || "Authentication Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await result.user.getIdToken();

            // Set session cookie
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });

            toast.success("Uplink Established.");
            if (email === "professorshyam123@gmail.com") {
                router.push('/dashboard');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            console.error("Sign-In Error", err);
            toast.error(err.message || "Credentials Denied");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Uplink address required for recovery");
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success("Recovery Link Dispatched. Check your uplink.");
            setResetMode(false);
        } catch (err: any) {
            console.error("Reset Password Error", err);
            toast.error(err.message || "Recovery Protocol Failed");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !email) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synching with Matrix...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Third Party Handshake */}
            <div className="space-y-8 mb-10">
                <button 
                    onClick={() => handleSocialSignIn('oauth_google')}
                    className="w-full flex items-center justify-between group relative px-6 py-5 bg-white border-2 border-slate-200 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_45px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 active:scale-[0.98] overflow-hidden hover:border-slate-900"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-purple-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorization Matrix</p>
                            <p className="text-xs font-bold text-slate-900">Access via Google Terminal</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all relative z-10" />
                </button>

                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <span className="relative px-6 bg-white text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Secure Uplink</span>
                </div>
            </div>

            <form onSubmit={resetMode ? handleResetPassword : handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    {/* Email */}
                    <div className="space-y-2 group">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2 group-focus-within:text-slate-900 transition-colors duration-300">Uplink Address</label>
                        <div className="relative group/input">
                            <input
                                required
                                type="email"
                                placeholder="hq@wayneent.com"
                                className="w-full bg-slate-100/50 border-2 border-slate-100 focus:border-slate-900 rounded-2xl p-5 pl-12 text-[12px] font-bold text-slate-900 focus:bg-white transition-all duration-300 outline-none lowercase placeholder:text-slate-400 shadow-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Mail className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 group-focus-within:scale-110 transition-all duration-300" />
                        </div>
                    </div>

                    {/* Password */}
                    {!resetMode && (
                        <div className="space-y-2 group animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-focus-within:text-slate-900 transition-colors duration-300">Secure Key-Phrase</label>
                                <button type="button" onClick={() => setResetMode(true)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors italic">Lost Key?</button>
                            </div>
                            <div className="relative group/input">
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••••••"
                                    className="w-full bg-slate-100/50 border-2 border-slate-100 focus:border-slate-900 rounded-2xl p-5 pl-12 text-[12px] font-bold text-slate-900 focus:bg-white transition-all duration-300 outline-none placeholder:text-slate-400 shadow-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Lock className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 group-focus-within:scale-110 transition-all duration-300" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-6 bg-slate-950 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-black transition-all hover:shadow-2xl hover:shadow-slate-200 active:scale-[0.98] disabled:opacity-50 group shadow-xl"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>{resetMode ? "Initialize Recovery" : "System Authentication"}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    {resetMode && (
                        <button 
                            type="button" 
                            onClick={() => setResetMode(false)}
                            className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors py-2"
                        >
                            Return to Authentication
                        </button>
                    )}
                </div>

                <div className="pt-4 text-center space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        New Operator? <a href="/sign-up" className="text-slate-900 font-black hover:underline px-1">Register Terminal</a>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default CustomSignIn;
