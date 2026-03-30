'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import Header from '@/components/Header'

interface DashboardClientProps {
    isAdmin: boolean
}

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { useSettings } from '@/context/SettingsContext'

const StatCard = ({ title, value, icon, color, subtitle, currencySymbol }: any) => {
    const colorMap: any = {
        blue: "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-[0_4px_12px_-4px_rgba(37,99,235,0.2)]",
        green: "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-[0_4px_12px_-4px_rgba(37,99,235,0.2)]",
        orange: "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-[0_4px_12px_-4px_rgba(245,158,11,0.2)]",
        red: "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-[0_4px_12px_-4px_rgba(225,29,72,0.2)]",
        indigo: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 shadow-[0_4px_12px_-4px_rgba(79,70,229,0.2)]"
    }

    return (
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl shadow-gray-200/50 transition-all hover:scale-[1.02] hover:shadow-2xl group cursor-default">
            <div className="flex items-center justify-between mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform group-hover:rotate-6 ${colorMap[color] || colorMap.blue}`}>
                    {icon}
                </div>
                {subtitle && <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] italic">{subtitle}</span>}
            </div>
            <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{title}</h3>
                <p className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">{currencySymbol}{value}</p>
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
    const isAdmin = !authLoading ? true : serverIsAdmin
    const { settings } = useSettings()

    useEffect(() => {
        setMounted(true)
        setLoading(true)
        fetch(`/api/dashboard/stats?range=${range}`)
            .then(res => res.json())
            .then(data => {
                setStats(data || {})
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
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

            <div className="max-w-[1700px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

                    {/* Left Column: Transaction Pillar */}
                    <div className="lg:col-span-1 border-r border-slate-100 pr-10">
                        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] border border-white shadow-2xl shadow-gray-200/50 overflow-hidden sticky top-8">
                            <div className="p-10 border-b border-gray-100 bg-slate-50/50">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/10 mb-4">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Live Stream</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter italic leading-none">
                                    Recent <span className="text-blue-600 NOT-italic">Ledger</span>
                                </h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic">Acquisition History</p>
                            </div>

                            <div className="divide-y divide-gray-50 bg-white max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <div key={i} className="p-10 animate-pulse space-y-4">
                                            <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                                            <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                                        </div>
                                    ))
                                ) : (stats?.recentSales?.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">No signatures recorded.</p>
                                    </div>
                                ) : (stats?.recentSales || []).map((sale: any) => (
                                    <div key={sale.id} className="p-8 hover:bg-slate-50 transition-all flex flex-col gap-4 border-l-4 border-transparent hover:border-blue-600 group cursor-default">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex flex-col items-center justify-center border border-white group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                    <span className="text-[8px] font-black">#{sale.id.slice(-3).toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <div className="font-black text-lg text-slate-900 uppercase italic tracking-tighter leading-none">{sale.customer?.name || 'GUEST'}</div>
                                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.paymentMethod}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xl font-black text-slate-950 italic tracking-tighter">+{settings.currencySymbol}{sale.totalAmount.toFixed(2)}</div>
                                        </div>
                                    </div>
                                )))}
                            </div>

                            <div className="p-10 border-t border-gray-100">
                                <Link
                                    href="/dashboard/orders"
                                    className="block w-full py-5 bg-slate-950 text-white text-center text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 transition-all rounded-2xl shadow-xl shadow-blue-500/10 italic"
                                >
                                    View Repository
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Execution Hub (Stats + Chart) */}
                    <div className="lg:col-span-3 space-y-12">

                        {/* Header & Filter */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-sm">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,1)]" />
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Strategic Interface Online</span>
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

                        {/* Stat Matrices */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard currencySymbol={settings.currencySymbol} title="Net Revenue" subtitle="GLOBAL INFLOW" value={(stats?.revenue || 0).toFixed(2)} color="blue" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Net Profit" subtitle="NET YIELD" value={(stats?.profit || 0).toFixed(2)} color="green" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 022 2h2a2 2 0 022-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Operational Cost" subtitle="TOTAL EXPENSES" value={(stats?.expenses || 0).toFixed(2)} color="orange" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Sales Return" subtitle="HISTORICAL REFUND" value={(stats?.totalSalesReturn || 0).toFixed(2)} color="red" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Procurement" subtitle="STOCK VALUE" value={(stats?.totalPurchases || 0).toFixed(2)} color="indigo" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Purchase Due" subtitle="UNPAID DEBT" value={(stats?.totalPurchaseDue || 0).toFixed(2)} color="orange" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Vendor Refund" subtitle="CREDIT NOTES" value={(stats?.totalPurchaseReturn || 0).toFixed(2)} color="red" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Activity Load" subtitle="TRAFFIC LOAD" value={(stats?.ordersCount || 0).toString()} color="blue" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
                        </div>

                        {/* Market Intelligence (Chart) */}
                        <div className="bg-white/80 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white shadow-2xl shadow-gray-200/50">
                            <div className="flex justify-between items-center mb-12">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-950 tracking-tighter italic uppercase">Revenue <span className="text-blue-600 NOT-italic">Intelligence</span></h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">Currency Velocity Profile: Last 30 Cycles</p>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Live Neural Link</span>
                                </div>
                            </div>

                            <div className="h-[450px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.chartData}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                                            dy={15}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                                            tickFormatter={(val) => `${settings.currencySymbol}${val}`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '2rem',
                                                border: 'none',
                                                background: 'rgba(2,6,23,0.95)',
                                                backdropFilter: 'blur(10px)',
                                                boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
                                                fontSize: '11px',
                                                fontWeight: 900,
                                                padding: '2rem',
                                                color: '#fff'
                                            }}
                                            itemStyle={{ color: '#60a5fa' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#2563eb"
                                            strokeWidth={8}
                                            fillOpacity={1}
                                            fill="url(#colorSales)"
                                            animationDuration={3000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
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
