'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Download, RefreshCw, X, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

interface Brand {
    id: string
    name: string
    description: string | null
    image: string | null
    status: boolean
    _count?: { products: number }
}

export default function BrandClient() {
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        status: true
    })

    useEffect(() => {
        fetchBrands()
    }, [])

    const fetchBrands = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/brands')
            if (res.ok) {
                const data = await res.json()
                setBrands(data)
            }
        } catch (error) {
            toast.error('Failed to fetch brands')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const method = editingBrand ? 'PUT' : 'POST'
        const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success(editingBrand ? 'Brand updated' : 'Brand created')
                setShowModal(false)
                setEditingBrand(null)
                setFormData({ name: '', description: '', image: '', status: true })
                fetchBrands()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Operation failed')
            }
        } catch (error) {
            toast.error('Something went wrong')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this brand?')) return

        try {
            const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Brand removed')
                fetchBrands()
            }
        } catch (error) {
            toast.error('Failed to delete')
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = async () => {
            const base64 = reader.result as string
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file: base64 })
                })
                if (res.ok) {
                    const data = await res.json()
                    setFormData({ ...formData, image: data.url })
                }
            } catch (error) {
                toast.error('Upload failed')
            }
        }
        reader.readAsDataURL(file)
    }

    const filteredBrands = brands.filter(b => 
        b.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header section inspired by 6POS */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Brand <span className="text-blue-500 NOT-italic">Setup</span></h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Manage product origins and identities</p>
                </div>
                <button 
                    onClick={() => { setEditingBrand(null); setFormData({ name: '', description: '', image: '', status: true }); setShowModal(true); }}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                    <Plus className="w-4 h-4" /> New Brand
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Brand Setup Form - (Left side in 6POS) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                        <h2 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tighter italic">Configure <span className="text-blue-500 NOT-italic">Instance</span></h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Name *</label>
                                <input 
                                    required
                                    type="text"
                                    placeholder="e.g. NIKE, APPLE"
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-50 focus:border-blue-500 rounded-2xl outline-none transition-all font-bold text-sm"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Brand details..."
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-50 focus:border-blue-500 rounded-2xl outline-none transition-all font-bold text-sm resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Visual (Logo)</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-blue-500 transition-colors group cursor-pointer relative overflow-hidden">
                                    {formData.image ? (
                                        <img src={formData.image} alt="Preview" className="h-20 mx-auto object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="w-8 h-8 text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" />
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Image Asset</p>
                                        </div>
                                    )}
                                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-5 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-lg shadow-blue-100"
                            >
                                {editingBrand ? 'Update Brand' : 'Register Brand'}
                            </button>
                            {editingBrand && (
                                <button 
                                    type="button"
                                    onClick={() => { setEditingBrand(null); setFormData({ name: '', description: '', image: '', status: true }); }}
                                    className="w-full py-5 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-50 hover:text-rose-500 transition-all"
                                >
                                    Cancel Selection
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                {/* Brand List - (Right side in 6POS) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center sm:flex-row flex-col gap-4">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Active <span className="text-blue-500 NOT-italic">Registry</span></h2>
                            <div className="relative w-full sm:w-64">
                                <input 
                                    type="text"
                                    placeholder="Search registry..."
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold focus:ring-2 ring-blue-500/10"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] italic">
                                    <tr>
                                        <th className="px-8 py-5 text-left">Logo</th>
                                        <th className="px-8 py-5 text-left">Brand Identity</th>
                                        <th className="px-8 py-5 text-center">Products</th>
                                        <th className="px-8 py-5 text-center">Status</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 italic">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Accessing Database...</p>
                                            </td>
                                        </tr>
                                    ) : filteredBrands.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-slate-300">
                                                No brands found in registry.
                                            </td>
                                        </tr>
                                    ) : filteredBrands.map(brand => (
                                        <tr key={brand.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center p-2 group-hover:scale-110 transition-transform shadow-sm">
                                                    {brand.image ? (
                                                        <img src={brand.image} alt={brand.name} className="max-h-full object-contain" />
                                                    ) : (
                                                        <span className="text-[10px] font-black text-slate-200">{brand.name.charAt(0)}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-slate-900 text-sm uppercase mb-1">{brand.name}</div>
                                                <div className="text-[10px] text-slate-400 truncate max-w-[200px] NOT-italic font-bold">{brand.description || 'No description provided.'}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black NOT-italic">
                                                    {brand._count?.products || 0}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest NOT-italic ${brand.status ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${brand.status ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    {brand.status ? 'Active' : 'Offline'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingBrand(brand);
                                                            setFormData({
                                                                name: brand.name,
                                                                description: brand.description || '',
                                                                image: brand.image || '',
                                                                status: brand.status
                                                            });
                                                        }}
                                                        className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(brand.id)}
                                                        className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
