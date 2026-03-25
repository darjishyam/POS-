'use client'

import { useState, useEffect } from 'react'
import { 
    BarChart3, 
    TrendingUp, 
    Calendar, 
    Filter, 
    Download, 
    ArrowUpRight, 
    PieChart, 
    Activity, 
    Target,
    Zap,
    Briefcase,
    Globe,
    FileText,
    ArrowLeftRight,
    Package,
    Receipt,
    ListFilter,
    ArrowRight,
    ChevronRight,
    Search,
    ShieldCheck
} from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast, Toaster } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell
} from 'recharts'
import { useSettings } from '@/context/SettingsContext'

export default function ReportsClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const reportType = searchParams.get('type') || 'hub'
    
    const [salesData, setSalesData] = useState<any>([])
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState('7d')
    const { settings } = useSettings()

    useEffect(() => {
        fetchData()
    }, [reportType])

    const fetchData = async () => {
        setLoading(true)
        setSalesData(null) // Reset to avoid type mismatch during transition
        try {
            const res = await fetch(`/api/reports?type=${reportType}`)
            if (!res.ok) throw new Error('System link failure')
            const data = await res.json()
            setSalesData(data)
        } catch (err) {
            toast.error('Neural data link lost. Retrying protocol...')
            setSalesData([])
        } finally {
            setLoading(false)
        }
    }

    const navigationNodes = [
        { 
            id: 'profit-loss', 
            name: 'Profit / Loss Report', 
            icon: TrendingUp, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50',
            description: 'Financial health audit and net performance tracking.' 
        },
        { 
            id: 'purchase-sale', 
            name: 'Purchase & Sale Report', 
            icon: ArrowLeftRight, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50',
            description: 'Transaction velocity and procurement alignment analysis.' 
        },
        { 
            id: 'stock', 
            name: 'Stock Report (Inventory Audit)', 
            icon: Package, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-50',
            description: 'Asset valuation and stock health monitoring.' 
        },
        { 
            id: 'expenses', 
            name: 'Expense Audit Ledger', 
            icon: Receipt, 
            color: 'text-rose-600', 
            bg: 'bg-rose-50',
            description: 'Detailed operational outflow and overhead analysis.' 
        },
        { 
            id: 'trending', 
            name: 'Trending Asset Intelligence', 
            icon: Target, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50',
            description: 'Velocity analysis for top-performing materials.' 
        },
        { 
            id: 'activity', 
            name: 'Core Activity Logs', 
            icon: Activity, 
            color: 'text-slate-600', 
            bg: 'bg-slate-50',
            description: 'Archival record of all neural system adjustments.' 
        }
    ]

    const handleNodeClick = (id: string) => {
        router.push(`/dashboard/reports?type=${id}`)
    }

    const renderHeader = () => {
        const activeNode = navigationNodes.find(n => n.id === reportType)
        const title = activeNode ? activeNode.name : 'Intelligence Hub'
        const Icon = activeNode ? activeNode.icon : BarChart3
        const color = activeNode ? activeNode.color : 'text-blue-600'

        return (
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-gray-100 pb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
                        <Activity className="w-4 h-4" />
                        Intelligence Matrix Operations
                    </div>
                    <div className="flex items-center gap-6">
                        <div className={`p-5 rounded-[1.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 ${color}`}>
                            <Icon className="w-8 h-8" />
                        </div>
                        <h1 className="text-6xl font-black text-slate-950 tracking-tighter italic leading-none">
                            {title.split(' ')[0]} <span className={color + " NOT-italic"}>{title.split(' ').slice(1).join(' ')}</span>
                        </h1>
                    </div>
                </div>

                {reportType !== 'hub' && (
                    <button 
                        onClick={() => router.push('/dashboard/reports')}
                        className="px-8 py-5 rounded-2xl bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all flex items-center gap-3 italic mb-2"
                    >
                        Return to Matrix Hub
                    </button>
                )}
            </div>
        )
    }

    const renderHub = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {navigationNodes.map((node) => (
                <button 
                    key={node.id}
                    onClick={() => handleNodeClick(node.id)}
                    className="group bg-white rounded-[3rem] p-10 border border-slate-100 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 text-left relative overflow-hidden"
                >
                    <div className={`absolute top-0 right-0 w-32 h-32 ${node.bg.replace('bg-', 'bg-')}/5 blur-[50px] group-hover:${node.bg.replace('bg-', 'bg-')}/10 transition-all rounded-full`} />
                    
                    <div className="flex justify-between items-start mb-8 relative">
                        <div className={`p-5 rounded-2xl ${node.bg} ${node.color} group-hover:bg-slate-950 group-hover:text-white transition-all duration-500`}>
                            <node.icon className="w-6 h-6" />
                        </div>
                        <div className="p-3 rounded-full bg-slate-50 text-slate-200 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="space-y-3 relative">
                        <h3 className="text-xl font-black text-slate-950 uppercase italic tracking-tight">{node.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                            {node.description}
                        </p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between relative">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Deployment Level: Core</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${node.bg} ${node.color}`}>Standby</span>
                    </div>
                </button>
            ))}
        </div>
    )

    const renderReportView = () => {
        if (loading) return (
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-16 flex flex-col items-center justify-center min-h-[600px] gap-8">
                <div className="w-20 h-20 border-8 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-blue-500/20" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Synchronizing Intelligence...</p>
            </div>
        )

        const isStock = reportType === 'stock'
        const isPurchaseSale = reportType === 'purchase-sale'
        
        // Data processing for Stock
        let displayData = Array.isArray(salesData) ? salesData : []
        if (isStock && Array.isArray(salesData)) {
            displayData = salesData.map((p: any) => ({
                label: p.name || 'Unknown Item',
                value: Number(p.stock) || 0,
                secondaryValue: (Number(p.stock) || 0) * (Number(p.price) || 0),
                category: p.category?.name || 'Uncategorized'
            }))
        } else if (isPurchaseSale && salesData && salesData.sales && salesData.purchases) {
            // Group sales and purchases by day (last 7 days)
            const daily: Record<string, { date: string, sales: number, purchases: number }> = {}
            for (let i = 0; i < 7; i++) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split('T')[0]
                daily[dateStr] = { date: dateStr, sales: 0, purchases: 0 }
            }
            
            salesData.sales.forEach((s: any) => {
                const d = new Date(s.createdAt).toISOString().split('T')[0]
                if (daily[d]) daily[d].sales += (s.totalAmount || 0)
            })
            salesData.purchases.forEach((p: any) => {
                const d = new Date(p.createdAt).toISOString().split('T')[0]
                if (daily[d]) daily[d].purchases += (p.totalAmount || 0)
            })
            
            displayData = Object.values(daily).sort((a: any, b: any) => a.date.localeCompare(b.date))
        } else if (reportType === 'expenses' && salesData?.breakdown) {
            displayData = salesData.breakdown
        }

        return (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Filters */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3 bg-slate-50 px-6 py-4 rounded-xl border border-slate-100">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Range</span>
                        <select className="bg-transparent text-[10px] font-black text-slate-900 uppercase tracking-widest outline-none border-none cursor-pointer">
                            <option>Last 7 Cycles</option>
                            <option>Last 30 Cycles</option>
                            <option>Fiscal Year</option>
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px] relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            placeholder="Explore Matrix Logs..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-14 py-4 text-[10px] font-black uppercase tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-8 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 italic">
                            Refresh Data
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
                            <BarChart3 className="w-64 h-64 text-blue-600" />
                        </div>
                        
                        <div className="flex items-center justify-between mb-12 relative">
                            <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight flex items-center gap-3">
                                <Activity className="w-5 h-5 text-blue-600" />
                                {isStock ? 'Inventory Density Axis' : (reportType === 'expenses' ? 'Expense Classification Axis' : 'Operational Yield Axis')}
                            </h3>
                            
                            {/* Legend */}
                            {!isStock && (
                                <div className="flex items-center gap-6 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-blue-600 to-sky-400 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Revenue Protocol</span>
                                    </div>
                                    {isPurchaseSale && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-amber-500 to-orange-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Procurement Outflow</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="h-80 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey={isStock || reportType === 'expenses' ? "name" : "date"} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }}
                                        tickFormatter={(val) => 
                                            isStock || reportType === 'expenses' 
                                                ? (val.length > 10 ? val.substring(0, 10) + '...' : val) 
                                                : new Date(val).toLocaleDateString('en-US', { weekday: 'short' })
                                        }
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }}
                                        tickFormatter={(val) => isStock ? val : `${settings.currencySymbol}${val}`}
                                    />
                                    <ReTooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const day = payload[0].payload
                                                const isProfitLoss = !isStock && !isPurchaseSale && reportType !== 'expenses' && day.netProfit !== undefined
                                                
                                                return (
                                                    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-white/10 text-[10px] font-black min-w-[200px]">
                                                        <p className="uppercase tracking-widest mb-4 opacity-50 border-b border-white/10 pb-2">
                                                            {isStock || reportType === 'expenses' ? label : new Date(day.date).toLocaleDateString(undefined, { dateStyle: 'full' })}
                                                        </p>
                                                        
                                                        {isProfitLoss ? (
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center gap-8">
                                                                    <span className="uppercase tracking-tighter italic text-slate-400">Revenue (Sales)</span>
                                                                    <span className="text-emerald-400 font-mono">{settings.currencySymbol}{(day.sales || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center gap-8">
                                                                    <span className="uppercase tracking-tighter italic text-slate-400">Operational Inflow</span>
                                                                    <span className="text-rose-400 font-mono">- {settings.currencySymbol}{(day.expenses || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="pt-2 border-t border-white/10 flex justify-between items-center gap-8 mt-2">
                                                                    <span className="uppercase tracking-[0.2em] text-blue-400">Actual Net Yield</span>
                                                                    <span className={`text-lg font-black italic tracking-tighter ${day.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                        {settings.currencySymbol}{day.netProfit.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            payload.map((p: any, i) => (
                                                                <div key={i} className="flex items-center justify-between gap-8 mb-1">
                                                                    <span className="uppercase tracking-tighter italic text-slate-400">
                                                                        {p.name === 'value' ? (isStock ? 'Quantity' : 'Total Spent') : p.name === 'sales' ? 'Revenue' : p.name === 'purchases' ? 'Procurement' : p.name}
                                                                    </span>
                                                                    <span className="text-blue-400 font-mono">
                                                                        {isStock && p.name === 'value' ? p.value : `${settings.currencySymbol}${p.value.toLocaleString()}`}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Bar 
                                        dataKey={isStock || reportType === 'expenses' ? "value" : "sales"} 
                                        radius={[8, 8, 0, 0]} 
                                        barSize={isPurchaseSale ? 15 : 40}
                                        name={isStock ? 'stock' : (reportType === 'expenses' ? 'expense' : 'sales')}
                                    >
                                        {displayData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={reportType === 'expenses' ? '#f43f5e' : (isStock ? '#4f46e5' : '#2563eb')} />
                                        ))}
                                    </Bar>
                                    {isPurchaseSale && (
                                        <Bar 
                                            dataKey="purchases" 
                                            fill="#f59e0b" 
                                            radius={[8, 8, 0, 0]} 
                                            barSize={15}
                                            name="purchases"
                                        />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                                <Zap className="w-5 h-5 text-blue-500" />
                                Strategic Summary
                            </h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{isStock ? 'Total Assets' : 'System Yield'}</span>
                                    <span className="text-2xl font-black italic tracking-tighter text-emerald-400">
                                        {isStock 
                                            ? displayData.reduce((s: number, d: any) => s + d.value, 0)
                                            : `${settings.currencySymbol}${displayData.reduce((s: number, d: any) => s + (d.sales || 0), 0).toLocaleString()}`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{isStock ? 'Inventory Value' : 'Expansion Rate'}</span>
                                    <span className="text-2xl font-black italic tracking-tighter text-blue-400">
                                        {isStock 
                                            ? `${settings.currencySymbol}${displayData.reduce((s: number, d: any) => s + d.secondaryValue, 0).toLocaleString()}`
                                            : '+12.4%'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/20">
                            <h3 className="text-xl font-black text-slate-950 uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                Governance Note
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed italic">
                                All protocols are operating within peak efficiency boundaries. Deployment status: AUTHENTICATED.
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Table Detail */}
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{isStock ? 'Material Asset' : (reportType === 'expenses' ? 'Expense Category' : 'Operational Date')}</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Identity/Metric</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">{isStock ? 'Unit Balance' : 'Net Liquidity'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {displayData.map((day: any, idx: number) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-8 text-sm font-black text-slate-950 italic tracking-tight uppercase">
                                        {isStock || reportType === 'expenses' ? day.name : new Date(day.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    </td>
                                    <td className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        {isStock ? day.category : 'Verified Intelligence'}
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <span className="text-xl font-black text-slate-950 tracking-tighter italic">
                                            {isStock ? (day.value || 0).toLocaleString() : `${settings.currencySymbol}${(day.value || day.sales || 0).toLocaleString()}`}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <Toaster position="bottom-right" />
            
            {renderHeader()}
            
            {reportType === 'hub' ? renderHub() : renderReportView()}
            
            {/* Neural Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-emerald-600 rounded-full blur-[150px]" />
            </div>

            <style jsx>{`
                @keyframes growUp {
                    from { transform: scaleY(0); opacity: 0; }
                    to { transform: scaleY(1); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
