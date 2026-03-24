'use client'

import { useState, useEffect } from 'react'
import { 
    LayoutGrid, 
    Plus, 
    FolderPlus, 
    Tag, 
    Hash,
    MoreHorizontal,
    Box
} from 'lucide-react'

export default function CategoriesClient() {
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({ name: '', description: '', icon: 'Package' })

    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                setCategories(Array.isArray(data) ? data : [])
                setLoading(false)
            })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                const newCat = await res.json()
                setCategories([...categories, newCat])
                setIsModalOpen(false)
                setFormData({ name: '', description: '', icon: 'Package' })
            }
        } catch (error) {
            console.error('Network failure.')
        }
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-indigo-100 min-h-screen bg-transparent">
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)]">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Inventory Architecture</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Category <span className="text-emerald-600 NOT-italic font-black">Classification</span>
                        </h2>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3 group border border-emerald-500/20"
                    >
                        <FolderPlus className="w-5 h-5 group-hover:scale-110 group-hover:text-emerald-400 transition-all duration-500" />
                        Initialize New Segment
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-64 bg-white/50 animate-pulse rounded-[3rem] border border-gray-100" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {(categories || []).map(cat => (
                            <div key={cat.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-slate-300 hover:text-indigo-600">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all transform group-hover:rotate-6 shadow-inner border border-emerald-100/50">
                                    <Box className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-950 tracking-tight uppercase mb-3 line-clamp-1 italic">{cat.name}</h3>
                                <p className="text-gray-400 text-xs font-bold leading-relaxed mb-8 line-clamp-2 h-8 uppercase tracking-wide">{cat.description || 'No system definition provided.'}</p>
                                
                                <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-3 h-3 text-slate-300" />
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                            {cat.id.slice(-8).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active nodes</span>
                                        <span className="text-lg font-black text-slate-900 leading-none mt-1">--</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Empty Slate for Quick Add */}
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-50 border-2 border-dashed border-gray-200 p-8 rounded-[3rem] flex flex-col items-center justify-center gap-4 group hover:bg-white hover:border-indigo-200 transition-all"
                        >
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-300 group-hover:text-emerald-600 shadow-sm transition-colors border border-gray-100 group-hover:border-emerald-200">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Append Module</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Creation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-12">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <LayoutGrid className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-950 tracking-tighter italic">Segment <span className="text-indigo-600 NOT-italic">Initialization</span></h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. LUXURY ELECTRONICS"
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        <Tag className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logic Description</label>
                                    <textarea
                                        placeholder="Define the scope of this category module..."
                                        className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 h-32 resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-95"
                                    >
                                        Finalize Logic
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
