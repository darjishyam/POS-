'use client'

import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { format } from 'date-fns'
import { 
    Receipt, 
    Plus, 
    Calendar, 
    Tag, 
    FileText, 
    IndianRupee,
    ArrowDownRight,
    TrendingDown,
    Calculator,
    MoreHorizontal,
    Download
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Category {
    id: string
    name: string
}

interface Expense {
    id: string
    amount: number
    description: string
    categoryId: string
    date: string
    category: Category | null
}

export default function ExpensesClient() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        categoryId: '',
        date: format(new Date(), 'yyyy-MM-dd')
    })

    useEffect(() => {
        const loadInitialData = async () => {
            await Promise.all([fetchExpenses(), fetchCategories()])
        }
        loadInitialData()
    }, [])

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/expenses')
            const data = await res.json()
            setExpenses(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error('Failed to load expenses')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/expenses/categories')
            const data = await res.json()
            setCategories(data)
            if (data.length > 0 && !formData.categoryId) {
                setFormData(prev => ({ ...prev, categoryId: data[0].id }))
            }
        } catch (error) {
            console.error('Failed to fetch categories')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const loadingToast = toast.loading('Recording expense...')
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast.success('Expense recorded successfully', { id: loadingToast })
                setIsModalOpen(false)
                setFormData({ 
                    amount: '', 
                    description: '', 
                    categoryId: categories[0]?.id || '', 
                    date: format(new Date(), 'yyyy-MM-dd') 
                })
                fetchExpenses()
            }
        } catch (error) {
            toast.error('Failed to record expense', { id: loadingToast })
        }
    }

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e?.amount || 0), 0)

    const exportToCSV = () => {
        const headers = ['Date', 'Category', 'Description', 'Amount']
        const rows = expenses.map(e => [
            format(new Date(e.date), 'yyyy-MM-dd'),
            e.category?.name || 'Uncategorized',
            e.description,
            e.amount.toFixed(2)
        ])
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `BardPOS_Expenses_${new Date().toISOString().split('T')[0]}.csv`)
        link.click()
        toast.success('Expenses Exported to CSV')
    }

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(expenses.map(e => ({
            'Date': format(new Date(e.date), 'yyyy-MM-dd'),
            'Category': e.category?.name || 'Uncategorized',
            'Description': e.description,
            'Amount': e.amount
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses")
        XLSX.writeFile(workbook, `BardPOS_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Expenses Exported to Excel')
    }

    const exportToPDF = () => {
        const doc = new jsPDF() as any
        doc.setFontSize(20)
        doc.text('BardPOS Operating Expenses Ledger', 14, 22)
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
        
        const tableData = expenses.map(e => [
            format(new Date(e.date), 'MMM dd, yyyy'),
            e.category?.name || 'Uncategorized',
            e.description,
            `₹${e.amount.toFixed(2)}`
        ])

        autoTable(doc, {
            head: [['Date', 'Category', 'Description', 'Amount']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] }
        })

        doc.save(`BardPOS_Expenses_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success('Expenses Exported to PDF')
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-blue-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-sm">
                            <TrendingDown className="w-3 h-3 text-blue-600" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Financial Outflow Registry</span>
                        </div>
                        <h2 className="text-7xl font-black text-slate-950 tracking-tighter leading-none italic uppercase">
                            Operating <span className="text-blue-600 NOT-italic font-black">Expenses</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={exportToCSV}
                                title="Export CSV"
                                className="p-5 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 hover:border-blue-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">CSV Ledger</span>
                                <Download className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>

                            <button 
                                onClick={exportToExcel}
                                title="Export Excel"
                                className="p-5 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 hover:border-blue-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">Excel</span>
                                <FileText className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>

                            <button 
                                onClick={exportToPDF}
                                title="Export PDF"
                                className="p-5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all border border-slate-100 hover:border-rose-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">PDF</span>
                                <FileText className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Periodic Outflow</p>
                            <p className="text-3xl font-black text-gray-950 italic tracking-tighter">₹{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-950 text-white px-10 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-900/10 active:scale-95 flex items-center gap-4 group border border-blue-500/10 overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/5 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Plus className="w-5 h-5 group-hover:rotate-90 group-hover:text-sky-400 transition-all duration-500 relative z-10" />
                            <span className="relative z-10">Record New Expense</span>
                        </button>
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-gray-50 uppercase tracking-widest text-[10px] font-black text-slate-400">
                                <th className="px-8 py-6">Date</th>
                                <th className="px-8 py-6">Classification</th>
                                <th className="px-8 py-6">Description</th>
                                <th className="px-8 py-6 text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Accessing Financial Ledger...</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center">
                                        <span className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Zero Outflows Detected</span>
                                    </td>
                                </tr>
                            ) : (expenses || []).map((expense) => (
                                <tr key={expense.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-slate-300" />
                                            <span className="text-sm font-bold text-gray-500">
                                                {format(new Date(expense.date), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                                {expense.category?.name || 'Uncategorized'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 max-w-md">
                                        <p className="text-sm font-bold text-gray-900 line-clamp-1 italic uppercase tracking-tight">{expense.description}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 group-hover:text-blue-600 transition-colors">
                                            <ArrowDownRight className="w-4 h-4" />
                                            <span className="text-xl font-black text-gray-950 tracking-tighter">₹{expense.amount.toFixed(0)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 font-sans">
                        <div className="p-12">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                                    <Receipt className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-950 tracking-tighter italic">
                                    Record <span className="text-red-600 NOT-italic font-black">Expense</span>
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Value (₹)</label>
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01" required
                                                className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold text-slate-800"
                                                placeholder="0.00"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            />
                                            <Calculator className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Classification</label>
                                        <select
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold text-slate-800 appearance-none shadow-sm"
                                        >
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date Signature</label>
                                    <input
                                        type="date" required
                                        className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold text-slate-800"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logic Description</label>
                                    <textarea
                                        required
                                        className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold text-slate-800 h-32 resize-none"
                                        placeholder="Define the purpose of this outflow..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 transition-all active:scale-95"
                                    >
                                        Finalize Record
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
