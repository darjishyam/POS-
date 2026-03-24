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
    FileText
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ReportData {
    date: string
    sales: number
    expenses: number
    netProfit: number
}

export default function ReportsClient() {
    const [salesData, setSalesData] = useState<ReportData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/reports')
            .then(res => res.json())
            .then(data => {
                setSalesData(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(err => {
                toast.error('Intelligence gathering failure')
                setLoading(false)
            })
    }, [])

    const totalRevenue = (salesData || []).reduce((sum, d) => sum + (d?.sales || 0), 0)
    const totalExpenses = (salesData || []).reduce((sum, d) => sum + (d?.expenses || 0), 0)
    const netProfit = totalRevenue - totalExpenses
    
    const maxAmount = Math.max(...(salesData || []).map(d => d?.sales || 0), 100)
    const displayData = Array.isArray(salesData) ? salesData : []

    const exportToCSV = () => {
        const headers = ['Date', 'Sales ($)', 'Expenses ($)', 'Net Profit ($)']
        const rows = displayData.map(d => [
            `"${new Date(d.date).toLocaleDateString()}"`,
            d.sales.toFixed(2),
            d.expenses.toFixed(2),
            d.netProfit.toFixed(2)
        ])
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `BardPOS_Intelligence_${new Date().toISOString().split('T')[0]}.csv`)
        link.click()
        toast.success('CSV Dossier Generated')
    }

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(displayData.map(d => ({
            'Date': d.date,
            'Sales ($)': d.sales,
            'Expenses ($)': d.expenses,
            'Net Profit ($)': d.netProfit
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Performance")
        XLSX.writeFile(workbook, `BardPOS_Intelligence_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Excel Spreadsheet Generated')
    }

    const exportToPDF = () => {
        const doc = new jsPDF() as any
        doc.setFontSize(20)
        doc.text('BardPOS Enterprise Intelligence Matrix', 14, 22)
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
        
        const tableData = displayData.map(d => [
            new Date(d.date).toLocaleDateString(),
            `$${d.sales.toFixed(2)}`,
            `$${d.expenses.toFixed(2)}`,
            `$${d.netProfit.toFixed(2)}`
        ])

        autoTable(doc, {
            head: [['Date', 'Gross Sales', 'Operational Exp', 'Net Performance']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }
        })

        doc.save(`BardPOS_Dossier_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success('High-Fidelity PDF Generated')
    }


    return (
        <div className="p-8 md:p-12 font-sans selection:bg-blue-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)]">
                            <Activity className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Enterprise Intelligence Matrix</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Performance <span className="text-emerald-600 NOT-italic font-black">Analytics</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-6 relative">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-sans">Net Performance (7D)</p>
                            <p className={`text-4xl font-black italic tracking-tighter drop-shadow-sm ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {/* CSV Export */}
                            <button 
                                onClick={exportToCSV}
                                title="Export CSV Dossier"
                                className="p-5 bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all border border-slate-100 hover:border-emerald-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">CSV</span>
                                <Download className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>

                            {/* Excel Export */}
                            <button 
                                onClick={exportToExcel}
                                title="Export Excel Spreadsheet"
                                className="p-5 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 hover:border-blue-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">Excel</span>
                                <FileText className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>

                            {/* PDF Export */}
                            <button 
                                onClick={exportToPDF}
                                title="Export High-Fidelity PDF"
                                className="p-5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all border border-slate-100 hover:border-rose-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">PDF</span>
                                <FileText className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Market Volatility', value: '+12.5%', icon: TrendingUp, color: 'text-emerald-500' },
                        { label: 'Active Sessions', value: '1,280', icon: Globe, color: 'text-blue-500' },
                        { label: 'Target Velocity', value: '88%', icon: Target, color: 'text-indigo-500' },
                        { label: 'Execution Speed', value: '45ms', icon: Zap, color: 'text-amber-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl bg-slate-50 ${stat.color} group-hover:bg-slate-900 group-hover:text-white transition-all`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-gray-200" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-950 italic tracking-tighter">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="h-96 bg-white/50 animate-pulse rounded-[3rem] border border-gray-100" />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Chart */}
                        <div className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] transition-opacity group-hover:opacity-[0.05]">
                                <BarChart3 className="w-64 h-64 text-blue-600" />
                            </div>

                            <div className="flex justify-between items-center mb-16 relative">
                                <div>
                                    <h3 className="text-3xl font-black text-gray-950 tracking-tighter italic uppercase">Revenue Stream</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Temporal Flow Analysis</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-6 py-2.5 rounded-xl bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly</button>
                                    <button className="px-6 py-2.5 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white italic shadow-lg shadow-gray-200">Weekly</button>
                                </div>
                            </div>

                            <div className="relative h-72 flex items-end justify-between gap-6 px-4">
                                {/* Chart Grid Lines */}
                                <div className="absolute inset-x-4 inset-y-0 flex flex-col justify-between pointer-events-none opacity-[0.05]">
                                    { [...Array(6)].map((_, i) => (
                                        <div key={i} className="w-full border-t border-gray-950" />
                                    )) }
                                </div>

                                {displayData.map((day, idx) => (
                                    <div key={day.date} className="relative flex-1 group/bar h-full flex flex-col justify-end">
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 bg-gray-950 text-white px-4 py-2 rounded-2xl text-[10px] font-black opacity-0 group-hover/bar:opacity-100 transition-all duration-300 pointer-events-none z-20 shadow-2xl border border-white/10 uppercase tracking-widest italic">
                                            Sales: ${day.sales.toFixed(2)} | Exp: ${day.expenses.toFixed(2)}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-gray-950" />
                                        </div>

                                        {/* Bar */}
                                        <div
                                            className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-2xl transition-all duration-700 ease-out group-hover/bar:from-emerald-500 group-hover/bar:to-emerald-300 shadow-xl shadow-emerald-100/50 cursor-pointer relative overflow-hidden"
                                            style={{
                                                height: `${Math.max((day.sales / maxAmount) * 100, 8)}%`,
                                                animation: `growUp 1s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.1}s both`
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                                            <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
                                        </div>

                                        <p className="text-center mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary List */}
                        <div className="bg-white p-12 rounded-[3.5rem] shadow-xl shadow-slate-200/50 text-slate-900 relative overflow-hidden border border-slate-100">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-600/5 rounded-full blur-[80px]" />
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-600/5 rounded-full blur-[80px]" />
                            
                            <h3 className="text-2xl font-black tracking-tighter italic uppercase mb-10 relative text-slate-950">Operational <span className="text-emerald-600 NOT-italic">Ledger</span></h3>
                            
                            <div className="space-y-6 relative">
                                {[...displayData].reverse().slice(0, 5).map((day, i) => (
                                    <div key={day.date} className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="font-bold text-xs uppercase tracking-tighter text-slate-700">Day Operations Complete</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black italic tracking-tighter text-slate-900">${day.netProfit.toFixed(2)}</p>
                                            <p className={`text-[8px] font-black uppercase tracking-widest ${day.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {day.netProfit >= 0 ? 'Surplus' : 'Deficit'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl shadow-slate-200">
                                View Archival Logs
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes growUp {
                    from { height: 0; opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
