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
        green: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)]",
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
    const isAdmin = !authLoading ? true : serverIsAdmin
    const { settings } = useSettings()

    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data || {})
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#f8fafc] font-sans">
            <Header />
            
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,1)]" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Executive Terminal Live</span>
                        </div>
                        <h1 className="text-7xl font-black text-slate-950 tracking-tighter italic leading-none">
                            Welcome <span className="text-blue-600 NOT-italic font-black">{(user as any)?.displayName || 'Admin'}</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-[11px] italic">Strategic Resource Allocation Hub</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <Link href="/pos" className="bg-slate-950 text-white px-10 py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                            Launch Terminal
                        </Link>
                        <div className="bg-white/50 backdrop-blur-md px-8 py-6 rounded-3xl border border-white shadow-xl shadow-gray-100/50 flex flex-col items-center justify-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Audit Date</span>
                            <span className="text-xs font-black text-slate-900 mt-1 italic tracking-widest">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-32 bg-white animate-pulse rounded-3xl border border-gray-100" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* 8-Card Stat Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard currencySymbol={settings.currencySymbol} title="Total Sales" value={(stats?.totalSalesAllTime || 0).toFixed(2)} color="blue" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Net Profit" value={(stats?.profitToday || 0).toFixed(2)} color="green" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 022 2h2a2 2 0 022-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Total Expense" value={(stats?.totalExpenses || 0).toFixed(2)} color="orange" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Sales Return" value={(stats?.totalSalesReturn || 0).toFixed(2)} color="red" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Total Purchase" value={(stats?.totalPurchases || 0).toFixed(2)} color="indigo" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Purchase Due" value={(stats?.totalPurchaseDue || 0).toFixed(2)} color="orange" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Purchase Return" value={(stats?.totalPurchaseReturn || 0).toFixed(2)} color="red" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                            <StatCard currencySymbol={settings.currencySymbol} title="Expense" value={(stats?.expensesToday || 0).toFixed(2)} color="red" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                        </div>

                        {/* Chart Section */}
                        <div className="bg-white/80 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white shadow-2xl shadow-gray-200/50">
                            <div className="flex justify-between items-center mb-12">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-950 tracking-tighter italic uppercase">Revenue <span className="text-blue-600 NOT-italic">Analytics</span></h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">Global Currency Flow: Last 30 Cycles</p>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Live Spectrum</span>
                                </div>
                            </div>
                            
                            <div className="h-[450px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.chartData}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
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
                                                borderRadius: '1.5rem', 
                                                border: '1px solid #e2e8f0', 
                                                background: 'rgba(255,255,255,0.9)', 
                                                backdropFilter: 'blur(10px)',
                                                boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                                                fontSize: '11px',
                                                fontWeight: 900,
                                                padding: '1.5rem'
                                            }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="sales" 
                                            stroke="#2563eb" 
                                            strokeWidth={6}
                                            fillOpacity={1} 
                                            fill="url(#colorSales)" 
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity Section */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] border border-white shadow-2xl shadow-gray-200/50 overflow-hidden mb-20">
                            <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter italic">Transaction <span className="text-blue-600 NOT-italic">Ledger</span></h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Real-time Acquisition Stream</p>
                                </div>
                                <button className="px-6 py-3 bg-white border border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm">Archive Protocol</button>
                            </div>

                            <div className="divide-y divide-gray-50 bg-white">
                                {stats?.recentSales?.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">No active signatures detected.</p>
                                    </div>
                                ) : (stats?.recentSales || []).map((sale: any) => (
                                    <div key={sale.id} className="p-10 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-10">
                                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex flex-col items-center justify-center border border-white shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">LOG</span>
                                                <span className="text-xs font-black">#{sale.id.slice(-4).toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <div className="font-black text-2xl text-slate-900 tracking-tighter uppercase italic">{sale.customer?.name || 'GUEST PROTOCOL'}</div>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <span>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    <span>{sale.paymentMethod}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-black text-slate-950 italic tracking-tighter group-hover:text-emerald-600 transition-colors">+{settings.currencySymbol}{sale.totalAmount.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
