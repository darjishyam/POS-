'use client'

import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { 
    Layers, 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    FileText, 
    Activity,
    ChevronRight,
    Zap
} from 'lucide-react'

interface Category {
    id: string
    name: string
    description: string | null
    _count?: {
        expenses: number
    }
}

export default function ExpenseCategoryClient() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [formData, setFormData] = useState({ name: '', description: '' })

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/expenses/categories')
            const data = await res.json()
            setCategories(data)
        } catch (error) {
            toast.error('Failed to load categories')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const method = editingCategory ? 'PUT' : 'POST'
        const url = editingCategory 
            ? `/api/expenses/categories/${editingCategory.id}` 
            : '/api/expenses/categories'

        const loadingToast = toast.loading(editingCategory ? 'Updating...' : 'Creating...')
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast.success(`Category ${editingCategory ? 'updated' : 'created'}`, { id: loadingToast })
                setIsModalOpen(false)
                setEditingCategory(null)
                setFormData({ name: '', description: '' })
                fetchCategories()
            }
        } catch (error) {
            toast.error('Operation failed', { id: loadingToast })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will not delete the expenses but they will be uncategorized.')) return
        
        const loadingToast = toast.loading('Deleting...')
        try {
            const res = await fetch(`/api/expenses/categories/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Category deleted', { id: loadingToast })
                fetchCategories()
            }
        } catch (error) {
            toast.error('Delete failed', { id: loadingToast })
        }
    }

    const openEditModal = (category: Category) => {
        setEditingCategory(category)
        setFormData({ name: category.name, description: category.description || '' })
        setIsModalOpen(true)
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-rose-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-full border border-rose-500/20 shadow-[0_4px_12px_-4px_rgba(244,63,94,0.2)]">
                            <Layers className="w-3 h-3 text-rose-600" />
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Financial Classification Registry</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Expense <span className="text-rose-600 NOT-italic font-black">Categories</span>
                        </h2>
                    </div>

                    <button
                        onClick={() => {
                            setEditingCategory(null)
                            setFormData({ name: '', description: '' })
                            setIsModalOpen(true)
                        }}
                        className="bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3 group border border-rose-500/20"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 group-hover:text-rose-400 transition-all duration-500" />
                        Define New Classification
                    </button>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        <div className="col-span-full py-24 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Syncing Classifications...</div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <span className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Zero Classifications Found</span>
                        </div>
                    ) : categories.map((cat) => (
                        <div key={cat.id} className="group bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-100/50 hover:border-rose-500/30 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <Activity className="w-24 h-24 text-rose-600" />
                            </div>

                            <div className="flex justify-between items-start mb-6 relative">
                                <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(cat)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <h3 className="text-xl font-black text-gray-950 uppercase italic tracking-tight">{cat.name}</h3>
                                <p className="text-xs text-gray-400 line-clamp-2 min-h-[2.5rem]">{cat.description || 'No specialized mission defined for this classification.'}</p>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between relative">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-amber-500" />
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{cat._count?.expenses || 0} Records</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-12">
                            <h3 className="text-3xl font-black text-gray-950 tracking-tighter italic mb-10">
                                {editingCategory ? 'Modify' : 'Define'} <span className="text-rose-600 NOT-italic font-black">Classification</span>
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Classification Identity</label>
                                    <input
                                        type="text" required
                                        className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-bold text-slate-800"
                                        placeholder="e.g. INFRASTRUCTURE RENT"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logic Description</label>
                                    <textarea
                                        className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-bold text-slate-800 h-32 resize-none"
                                        placeholder="Define the scope of this financial bucket..."
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
                                        className="flex-[2] py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95"
                                    >
                                        Finalize Classification
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
