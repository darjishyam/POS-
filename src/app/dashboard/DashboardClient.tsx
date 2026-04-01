'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import Header from '@/components/Header'

interface DashboardClientProps {
    isAdmin: boolean
}

// import TransactionDetailModal from '@/components/TransactionDetailModal'
import { useSettings } from '@/context/SettingsContext'

const StatCard = ({ title, value, icon, color, subtitle, currencySymbol, onClick }: any) => {
    const colorMap: any = {
        blue: "bg-blue-600/10 text-blue-600 border-blue-600/20 shadow-[0_8px_30px_rgb(37,99,235,0.1)]",
        green: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20 shadow-[0_8px_30px_rgb(5,150,105,0.1)]",
        orange: "bg-amber-600/10 text-amber-600 border-amber-600/20 shadow-[0_8px_30px_rgb(217,119,6,0.1)]",
        red: "bg-rose-600/10 text-rose-600 border-rose-600/20 shadow-[0_8px_30px_rgb(225,29,72,0.1)]",
        indigo: "bg-indigo-600/10 text-indigo-600 border-indigo-600/20 shadow-[0_8px_30px_rgb(79,70,229,0.1)]"
    }

    return (
        <div
            onClick={onClick}
            className={`bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl shadow-gray-200/50 transition-all hover:scale-[1.05] hover:shadow-2xl group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
        >
            <div className="flex items-center justify-between mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${colorMap[color] || colorMap.blue}`}>
                    {icon}
                </div>
                <div className="flex flex-col items-end">
                    {subtitle && <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] italic mb-1">{subtitle}</span>}
                    {onClick && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Reports</span>
                            <svg className="w-2 h-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                        </div>
                    )}
                </div>
            </div>
            <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 italic">{title}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-400 italic">{currencySymbol}</span>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</p>
                </div>
            </div>
        </div>
    )
}

export default function DashboardClient({ isAdmin: serverIsAdmin }: DashboardClientProps) {
    const { user, loading: authLoading } = useAuth()
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [range, setRange] = useState('all')
    const [mounted, setMounted] = useState(false)
    // const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
    // const [selectedTransactionType, setSelectedTransactionType] = useState<'SALE' | 'PURCHASE'>('SALE')
    const isAdmin = !authLoading ? true : serverIsAdmin
    const { settings } = useSettings()

    useEffect(() => {
        setMounted(true)
        
        const fetchStats = async (isBackground = false) => {
            if (!isBackground) setLoading(true)
            try {
                const res = await fetch(`/api/dashboard/stats?range=${range}`)
                const data = await res.json()
                setStats(data || {})
            } catch (err) {
                console.error('Magic Sync Error:', err)
            } finally {
                if (!isBackground) setLoading(false)
            }
        }

        // Initial fetch block
        fetchStats()

        // Magic Sync Polling: Silently fetches new data every cycle
        const syncInterval = setInterval(() => {
            fetchStats(true)
        }, 3500)

        // Cleanup interval on unmount
        return () => clearInterval(syncInterval)
    }, [range])

    const ranges = [
        { id: 'today', label: 'TODAY' },
        { id: 'week', label: 'WEEK' },
        { id: 'month', label: 'MONTH' },
        { id: 'all', label: 'ALL-TIME' },
    ]

    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#f8fafc] font-sans">
            <Header />

            <div className="max-w-[1700px] mx-auto space-y-12">
                {/* Header & Filter Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,1)]" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Operational Hub Active</span>
                        </div>
                        <h1 className="text-8xl font-black text-slate-950 tracking-tighter italic leading-none">
                            Control <span className="text-blue-600 NOT-italic font-black">Matrix</span>
                        </h1>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-[2rem] border border-white shadow-xl flex gap-1">
                            {ranges.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => setRange(r.id)}
                                    className={`px-8 py-3 rounded-[1.5rem] text-[9px] font-black tracking-[0.2em] transition-all duration-500 ${range === r.id
                                        ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                                        : "text-slate-400 hover:text-slate-900 hover:bg-white"
                                        }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <div className="bg-white/50 backdrop-blur-md px-8 py-5 rounded-[2rem] border border-white shadow-xl flex flex-col items-center justify-center">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">SYNC</span>
                            <span className="text-xs font-black text-slate-900 mt-0.5 italic">
                                {mounted ? new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-- --'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Primary Stat Pillars (Mission Control) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Shopkeeper Hero Card: Total Balance */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-white flex flex-col justify-between h-full transition-all hover:scale-[1.02] hover:shadow-2xl">
                        <div>
                            <div className="flex items-center gap-1.5 justify-start">
                                <span className="text-xl font-black text-slate-400 italic">{settings.currencySymbol}</span>
                                <span className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">
                                    {(stats?.cashBalance || 0).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3 italic">Total Balance</p>
                        </div>
                        <div className="mt-8 space-y-3">
                            <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Cash Balance</span>
                                </div>
                                <span className="font-black text-emerald-600 italic tracking-tighter text-lg">{settings.currencySymbol}{(stats?.trueCashBalance || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Bank Balance</span>
                                </div>
                                <span className="font-black text-blue-600 italic tracking-tighter text-lg">{settings.currencySymbol}{(stats?.trueBankBalance || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Standard Metrics Grid */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard 
                            currencySymbol={settings.currencySymbol} 
                            title="To Collect" 
                            subtitle="TO COLLECT" 
                            value={(stats?.toCollectProfit || 0).toLocaleString()} 
                            color="green" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>} 
                            onClick={() => window.location.href = '/dashboard/orders'}
                        />
                        <StatCard 
                            currencySymbol={settings.currencySymbol} 
                            title="To Pay" 
                            subtitle="TO PAY" 
                            value={(stats?.toPayDues || 0).toLocaleString()} 
                            color="red" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>} 
                            onClick={() => window.location.href = '/dashboard/purchases'}
                        />
                        <StatCard 
                            currencySymbol={settings.currencySymbol} 
                            title="Stock Value" 
                            subtitle="VALUE OF ITEMS" 
                            value={(stats?.stockValue || 0).toLocaleString()} 
                            color="indigo" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} 
                            onClick={() => window.location.href = '/dashboard/inventory'}
                        />
                        <StatCard 
                            currencySymbol={settings.currencySymbol} 
                            title="Sales" 
                            subtitle="THIS WEEK'S SALE" 
                            value={(stats?.thisWeekSales || 0).toLocaleString()} 
                            color="blue" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} 
                            onClick={() => window.location.href = '/dashboard/reports?type=profit-loss'}
                        />
                    </div>
                </div>

                {/* Primary Operational Context */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

                    {/* Primary Focus: Unified Ledger (Expanded) */}
                    <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl rounded-[3.5rem] border border-white shadow-2xl shadow-gray-200/50 overflow-hidden">
                        <div className="p-10 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-950 tracking-tighter italic uppercase leading-none">
                                        Unified <span className="text-blue-600 NOT-italic">Ledger</span>
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">Real-Time Operational Flux</p>
                                </div>
                            </div>
                            <Link href="/dashboard/orders" className="px-6 py-3 bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-blue-600 transition-all">
                                View Full Repository
                            </Link>
                        </div>

                        <div className="divide-y divide-gray-50 bg-white max-h-[800px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                [...Array(8)].map((_, i) => (
                                    <div key={i} className="p-12 animate-pulse flex justify-between gap-10">
                                        <div className="flex gap-4 w-1/2">
                                            <div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0" />
                                            <div className="space-y-3 w-full">
                                                <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                                                <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                                            </div>
                                        </div>
                                        <div className="w-24 h-6 bg-gray-100 rounded-full" />
                                    </div>
                                ))
                            ) : (stats?.recentSales?.length === 0 ? (
                                <div className="p-32 text-center">
                                    <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.5em] italic">No transaction signatures recorded.</p>
                                </div>
                            ) : (stats?.recentSales || []).map((sale: any) => (
                                <div
                                    key={`${sale.type}-${sale.id}`}
                                    onClick={() => {
                                        window.location.href = `/dashboard/${sale.type === 'SALE' ? 'orders' : 'purchases'}/${sale.id}`
                                    }}
                                    className={`p-10 hover:bg-slate-50 transition-all flex items-center justify-between border-l-8 border-transparent hover:border-blue-600 group cursor-pointer ${sale.type === 'PURCHASE' ? 'bg-orange-50/10' : ''}`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border border-white group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm ${sale.type === 'PURCHASE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{sale.type === 'SALE' ? 'SL' : 'PR'}</span>
                                        </div>
                                        <div>
                                            <div className="font-black text-2xl text-slate-900 uppercase italic tracking-tighter leading-none">
                                                {sale.type === 'SALE' ? (sale.customer?.name || 'GUEST ASSET') : (sale.supplier?.name || 'VETTED VENDOR')}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                                                {new Date(sale.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })} • <span className="text-blue-600/60 uppercase">{sale.paymentMethod || sale.paymentStatus}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <div className={`text-3xl font-black italic tracking-tighter leading-none ${sale.type === 'SALE' ? 'text-slate-950' : 'text-amber-600'}`}>
                                            {sale.type === 'SALE' ? '+' : '-'}{settings.currencySymbol}{sale.totalAmount.toFixed(2)}
                                        </div>
                                        <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                            <Link
                                                href={`/dashboard/${sale.type === 'SALE' ? 'orders' : 'purchases'}/${sale.id}`}
                                                className="text-[9px] font-black text-blue-600 hover:text-slate-950 uppercase tracking-widest italic underline underline-offset-4"
                                            >
                                                Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )))}
                        </div>
                    </div>

                    {/* Secondary Column: Reporting Transition + Weekly Goal */}
                    <div className="lg:col-span-1 space-y-8">

                        {/* Intelligence Center Transition */}
                        <Link
                            href="/dashboard/reports?type=profit-loss"
                            className="block bg-blue-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/30 group hover:-translate-y-2 transition-all duration-500"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] rounded-full group-hover:bg-white/20 transition-all" />
                            <div className="relative z-10 space-y-6">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-[0.4em] mb-2 italic">Strategic Hub</h4>
                                    <p className="text-4xl font-black italic tracking-tighter uppercase leading-none">Intelligence <br /> Reports</p>
                                </div>
                                <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest italic pt-4 border-t border-white/10 w-full group-hover:gap-4 transition-all">
                                    Open Analytical Suite <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </span>
                            </div>
                        </Link>

                        {/* Weekly Goal Status */}
                        <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full" />

                            <div className="relative space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-4 italic">Material Execution</h4>
                                    <p className="text-5xl font-black italic tracking-tighter leading-none">
                                        {settings.currencySymbol}{(stats?.thisWeekSales || 0).toFixed(0)}
                                    </p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3 italic">7-Day Revenue Velocity</p>
                                </div>

                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (stats?.thisWeekSales / 10000) * 100)}%` }}
                                    />
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Flux Frequency</span>
                                        <span className="text-white">Optimal</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Asset Signatures</span>
                                        <span className="text-white">{stats?.ordersCount} SL</span>
                                    </div>
                                    <Link href="/dashboard/reports?type=profit-loss" className="w-full flex items-center justify-center py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-[8px] font-black uppercase tracking-widest transition-all">
                                        Deep Audit Hub
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Aesthetic Filter */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] -z-10">
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-600 rounded-full blur-[200px]" />
                <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-blue-500 rounded-full blur-[200px]" />
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    )
}
