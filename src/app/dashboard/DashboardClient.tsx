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

const StatCard = ({ title, value, icon, color, subtitle }: any) => {
    const colorMap: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-emerald-50 text-emerald-600 border-emerald-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
        red: "bg-red-50 text-red-600 border-red-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100"
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-gray-200">
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorMap[color] || colorMap.blue}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</h3>
                    <p className="text-2xl font-black text-gray-950 tracking-tighter italic">${value}</p>
                </div>
            </div>
            {subtitle && <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{subtitle}</p>}
        </div>
    )
}

export default function DashboardClient({ isAdmin: serverIsAdmin }: DashboardClientProps) {
    const { user, loading: authLoading } = useAuth()
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const isAdmin = !authLoading ? true : serverIsAdmin

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
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">
                            Welcome <span className="text-blue-600 NOT-italic font-black">{(user as any)?.displayName || 'Admin'}</span>, 👋
                        </h1>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px]">Strategic Command Interface active</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <Link href="/pos" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">
                            Launch Terminal
                        </Link>
                        <div className="bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">System Date</span>
                            <span className="text-[10px] font-black text-slate-900">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
                            <StatCard title="Total Sales" value={(stats?.revenueToday || 0).toFixed(2)} color="blue" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                            <StatCard title="Net Profit" value={(stats?.profitToday || 0).toFixed(2)} color="green" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 022 2h2a2 2 0 022-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14" /></svg>} />
                            <StatCard title="Invoice Due" value="0.00" color="orange" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                            <StatCard title="Sales Return" value="0.00" color="red" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>} />
                            <StatCard title="Total Purchase" value={(stats?.totalPurchases || 0).toFixed(2)} color="indigo" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                            <StatCard title="Purchase Due" value="0.00" color="orange" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
                            <StatCard title="Purchase Return" value="0.00" color="red" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                            <StatCard title="Expense" value={(stats?.expensesToday || 0).toFixed(2)} color="red" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                        </div>

                        {/* Chart Section */}
                        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase tracking-widest">Sales <span className="text-gray-400 NOT-italic">Last 30 Days</span></h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 italic">Historical Revenue Analytics</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-blue-600 rounded-full" />
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</span>
                                </div>
                            </div>
                            
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.chartData}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            tickFormatter={(val) => `$${val}`}
                                        />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="sales" 
                                            stroke="#2563eb" 
                                            strokeWidth={4}
                                            fillOpacity={1} 
                                            fill="url(#colorSales)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity Section */}
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mb-20">
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] italic">Transaction <span className="text-gray-400 NOT-italic">Ledger</span></h3>
                                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-black transition-colors">View All Activities</button>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {(stats?.recentSales || []).map((sale: any) => (
                                    <div key={sale.id} className="p-8 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400">
                                                ID
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 uppercase tracking-tighter">{sale.customer?.name || 'GUEST'}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(sale.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="text-xl font-black text-slate-900 italic">+${sale.totalAmount.toFixed(2)}</div>
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
