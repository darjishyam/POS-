'use client'

import { useState, useEffect, useRef } from 'react'
import { 
    Package, 
    Save, 
    X, 
    Sparkles, 
    Barcode, 
    Layers, 
    Upload, 
    FileText, 
    AlertTriangle,
    Image as ImageIcon,
    Tag,
    ChevronDown,
    PlusCircle
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

interface ProductFormProps {
    initialData?: any
    onSave: (data: any) => void
    onCancel: () => void
}

export default function ProductForm({ initialData, onSave, onCancel }: ProductFormProps) {
    const [categories, setCategories] = useState<any[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        sku: initialData?.sku || '',
        barcodeType: initialData?.barcodeType || 'CODE128',
        unit: initialData?.unit || 'Piece',
        brand: initialData?.brand || '',
        categoryId: initialData?.categoryId || '',
        alertQuantity: initialData?.alertQuantity || 5,
        manageStock: initialData?.manageStock ?? true,
        price: initialData?.price || '',
        stock: initialData?.stock || 0,
        description: initialData?.description || '',
        image: initialData?.image || '',
        brochureUrl: initialData?.brochureUrl || ''
    })

    useEffect(() => {
        const fetchCategories = async () => {
            const res = await fetch('/api/categories')
            const data = await res.json()
            setCategories(Array.isArray(data) ? data : [])
        }
        fetchCategories()
    }, [])

    const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const reader = new FileReader()
        reader.onloadend = async () => {
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        image: reader.result,
                        filename: file.name
                    })
                })
                const data = await res.json()
                if (data.url) {
                    setFormData({ ...formData, image: data.url })
                    toast.success('Visual Asset Synchronized')
                }
            } catch (error) {
                toast.error('Asset Synchronization Failure')
            } finally {
                setIsUploading(false)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleAIAssist = async () => {
        if (!formData.name) {
            toast.error('Identity protocol incomplete: Asset Name required')
            return
        }

        setIsGenerating(true)
        try {
            const selectedCat = categories.find(c => c.id === formData.categoryId)?.name
            const res = await fetch('/api/ai/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    brand: formData.brand,
                    category: selectedCat
                })
            })
            const data = await res.json()
            if (data.description) {
                setFormData({ ...formData, description: data.description })
                toast.success('Narrative Protocol Optimized')
            }
        } catch (error) {
            toast.error('AI Synchronization Failure')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({
            ...formData,
            price: parseFloat(formData.price.toString()),
            stock: parseInt(formData.stock.toString()),
            alertQuantity: parseInt(formData.alertQuantity.toString())
        })
    }

    return (
        <form onSubmit={handleSubmit} className="p-8 md:p-12 font-sans selection:bg-emerald-100 max-w-7xl mx-auto space-y-12">
            <Toaster position="bottom-right" />
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-8">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-gray-950 tracking-tighter italic">
                        {initialData ? 'Update' : 'Add new'} <span className="text-emerald-600 NOT-italic uppercase">Product</span>
                    </h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Asset Ledger Protocol v2.0</p>
                </div>
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Primary Intelligence Section */}
                <div className="md:col-span-2 space-y-10">
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Product Name */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                    Product Name<span className="text-rose-500">*</span>
                                </label>
                                <input 
                                    required
                                    type="text"
                                    placeholder="e.g. Wireless Pro Headset"
                                    className="w-full p-6 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            {/* SKU */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center justify-between">
                                    <span>SKU Code</span>
                                    <Barcode className="w-3 h-3 text-slate-300" />
                                </label>
                                <input 
                                    type="text"
                                    placeholder="SKU-AUTO-GEN"
                                    className="w-full p-6 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                />
                            </div>

                            {/* Barcode Type */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Barcode Symbology</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-6 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800 appearance-none"
                                        value={formData.barcodeType}
                                        onChange={(e) => setFormData({...formData, barcodeType: e.target.value})}
                                    >
                                        <option value="CODE128">Code 128 (C128)</option>
                                        <option value="EAN13">EAN-13</option>
                                        <option value="UPCA">UPC-A</option>
                                    </select>
                                    <ChevronDown className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Unit */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Unit of Measure</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Piece, Box"
                                    className="w-full p-6 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                                />
                            </div>

                            {/* Brand */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Global Brand</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Sony, Apple"
                                    className="w-full p-6 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Classification</label>
                                <div className="relative">
                                    <select 
                                        required
                                        className="w-full p-6 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800 appearance-none"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Stock Management Toggle */}
                        <div className="p-8 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${formData.manageStock ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                                    <Layers className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">Active Stock Management</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enable real-time inventory tracking</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, manageStock: !formData.manageStock})}
                                className={`w-16 h-8 rounded-full relative transition-all duration-500 ${formData.manageStock ? 'bg-emerald-600' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-500 ${formData.manageStock ? 'left-9 shadow-lg' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Alert Quantity */}
                        <div className="space-y-3 max-w-xs">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                Alert Quantity <AlertTriangle className="w-3 h-3 text-amber-500" />
                            </label>
                            <input 
                                type="number"
                                className="w-full p-6 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                value={formData.alertQuantity}
                                onChange={(e) => setFormData({...formData, alertQuantity: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <label className="text-xl font-black text-gray-900 italic tracking-tighter uppercase">Product Narrative</label>
                            <button 
                                type="button"
                                onClick={handleAIAssist}
                                disabled={isGenerating}
                                className={`px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                {isGenerating ? 'Generating Narrative...' : 'Use AI Assistant'}
                            </button>
                        </div>
                        <textarea 
                            rows={8}
                            placeholder="Describe the essence of this product..."
                            className="w-full p-8 bg-slate-50 border-none rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700 leading-relaxed"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                </div>

                {/* Logistics & Visual Section */}
                <div className="space-y-8">
                    {/* Market Configuration */}
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-8 space-y-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Market Configuration</p>
                        <div className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">$</span>
                                <input 
                                    required
                                    type="number" step="0.01"
                                    placeholder="0.00"
                                    className="w-full p-6 pl-12 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-black text-2xl text-slate-800 italic tracking-tighter"
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logistics Allocation */}
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-8 space-y-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Logistics Allocation</p>
                        <div className="space-y-4">
                            <div className="relative">
                                <Package className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                                <input 
                                    required
                                    type="number"
                                    placeholder="0 Units"
                                    className="w-full p-6 pl-16 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-black text-2xl text-slate-800 italic tracking-tighter"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visual Asset */}
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Visual Asset</p>
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                                <PlusCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleLocalUpload}
                        />
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square bg-slate-100 rounded-[2rem] overflow-hidden group relative border-2 border-dashed border-slate-200 cursor-pointer hover:border-emerald-500/30 transition-all"
                        >
                            {isUploading ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-emerald-500 gap-4">
                                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[8px] font-black uppercase tracking-widest">Ingesting Asset...</p>
                                </div>
                            ) : formData.image ? (
                                <img src={formData.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Preview" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                    <ImageIcon className="w-12 h-12" />
                                    <p className="text-[8px] font-black uppercase tracking-widest">No Image Linked</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Manual Asset Sync (URL)</p>
                             <input 
                                type="text"
                                placeholder="https://..."
                                className="w-full p-4 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-slate-600 focus:bg-white outline-none transition-all"
                                value={formData.image}
                                onChange={(e) => setFormData({...formData, image: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Document Registry */}
                    <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Brochure/Specs</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-4">Multi-Entity Ingestion</p>
                            <input 
                                type="text"
                                placeholder="Link PDF Brochure..."
                                className="w-full p-4 bg-white/5 border-none rounded-xl text-[10px] font-bold text-white focus:bg-white/10 outline-none transition-all mb-4"
                                value={formData.brochureUrl}
                                onChange={(e) => setFormData({...formData, brochureUrl: e.target.value})}
                            />
                            <button type="button" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                                Upload Local File
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submission Section */}
            <div className="flex items-center gap-6 pt-12 border-t border-gray-100">
                <button 
                    type="submit"
                    className="flex-[2] py-8 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3 border border-emerald-500/20 group"
                >
                    <Save className="w-5 h-5 group-hover:scale-110 transition-all font-black" />
                    Archive & Globalize Asset
                </button>
            </div>
        </form>
    )
}
