'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ShieldCheck, RefreshCw, LogOut, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
    const { user, sendOTP, refreshUser, logout } = useAuth()
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (!user) {
            router.push('/sign-in')
        } else if (user.emailVerified) {
            if (user.email === "professorshyam123@gmail.com") {
                router.push('/dashboard')
            } else {
                router.push('/')
            }
        }
    }, [user, router])

    const handleRefresh = async () => {
        setVerifying(true)
        try {
            await refreshUser()
            if (user?.emailVerified) {
                toast.success("Identity Signature Authenticated.")
                if (user?.email === "professorshyam123@gmail.com") {
                    router.push('/dashboard')
                } else {
                    router.push('/')
                }
            } else {
                toast.error("Verification Status: PENDING")
            }
        } catch (error) {
            toast.error("Uplink Synchronization Error")
        } finally {
            setVerifying(false)
        }
    }

    const handleResend = async () => {
        setResending(true)
        try {
            await sendOTP()
            toast.success("New Verification Link Dispatched.")
        } catch (error) {
            toast.error("Dispatched Protocol Failed")
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 selection:bg-emerald-100">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-lg relative z-10">
                <div className="bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-12 text-center space-y-10 group">
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-slate-900/20 group-hover:rotate-6 transition-transform duration-700">
                            <Mail className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center animate-bounce">
                            <ShieldCheck className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-slate-950 tracking-tighter italic">Verify Your <br/><span className="text-emerald-600 NOT-italic">Uplink.</span></h1>
                        <p className="text-gray-400 font-medium text-xs uppercase tracking-widest leading-relaxed">
                            We have dispatched a secure activation link to <br/>
                            <span className="text-slate-900 font-black lowercase">{user?.email}</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleRefresh}
                            disabled={verifying}
                            className="w-full py-6 bg-slate-950 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-black transition-all hover:shadow-2xl hover:shadow-emerald-900/20 active:scale-[0.98] group italic"
                        >
                            {verifying ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Check Verification Status
                                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="w-full py-6 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {resending ? "Dispatching..." : "Resend Security Link"}
                        </button>
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex flex-col gap-6">
                        <button 
                            onClick={() => logout()}
                            className="inline-flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Terminate Session & Re-login
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] italic">
                    Universal POS Governance Protocol v2.5
                </p>
            </div>
        </div>
    )
}
