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
    PlusCircle,
    Truck
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

interface ProductFormProps {
    initialData?: any
    onSave: (data: any) => void
    onCancel: () => void
    isModal?: boolean
}

export default function ProductForm({ initialData, onSave, onCancel, isModal = false }: ProductFormProps) {
    const [categories, setCategories] = useState<any[]>([])
    const [brands, setBrands] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [taxes, setTaxes] = useState<any[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const docInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isDocUploading, setIsDocUploading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        sku: initialData?.sku || '',
        barcodeType: initialData?.barcodeType || 'CODE128',
        unitId: initialData?.unitId || '',
        brandId: initialData?.brandId || '',
        categoryId: initialData?.categoryId || '',
        alertQuantity: initialData?.alertQuantity || 5,
        manageStock: initialData?.manageStock ?? true,
        price: initialData?.price || '',
        stock: initialData?.stock || 0,
        description: initialData?.description || '',
        image: initialData?.image || '',
        brochureUrl: initialData?.brochureUrl || '',
        supplierId: initialData?.supplierId || '',
        purchaseCost: initialData?.purchaseCost || '',
        taxId: initialData?.taxId || '',
        taxType: initialData?.taxType || 'EXCLUSIVE',
        purchasePriceExcTax: initialData?.purchasePriceExcTax || '',
        purchasePriceIncTax: initialData?.purchasePriceIncTax || '',
        margin: initialData?.margin || '25'
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, brandRes, unitRes, suppRes, taxRes] = await Promise.all([
                    fetch('/api/categories'),
                    fetch('/api/brands'),
                    fetch('/api/units'),
                    fetch('/api/suppliers'),
                    fetch('/api/taxes')
                ])
                const [catData, brandData, unitData, suppData, taxData] = await Promise.all([
                    catRes.json(),
                    brandRes.json(),
                    unitRes.json(),
                    suppRes.json(),
                    taxRes.json()
                ])
                setCategories(Array.isArray(catData) ? catData : [])
                setBrands(Array.isArray(brandData) ? brandData : [])
                setUnits(Array.isArray(unitData) ? unitData : [])
                setSuppliers(Array.isArray(suppData) ? suppData : [])
                setTaxes(Array.isArray(taxData) ? taxData : [])
            } catch (error) {
                console.error('Fetch Error:', error)
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        const taxRate = taxes.find(t => t.id === formData.taxId)?.rate || 0
        const pExc = parseFloat(formData.purchasePriceExcTax.toString()) || 0
        const marginPerc = parseFloat(formData.margin.toString()) || 25
        
        const pInc = pExc * (1 + taxRate / 100)
        const sExc = pExc * (1 + marginPerc / 100)
        // const sInc = sExc * (1 + taxRate / 100)
        
        // Only update if values actually changed to avoid infinite loops
        if (
            Math.abs(pInc - (parseFloat(formData.purchasePriceIncTax.toString()) || 0)) > 0.01 ||
            Math.abs(sExc - (parseFloat(formData.price.toString()) || 0)) > 0.01 ||
            Math.abs(pExc - (parseFloat(formData.purchaseCost.toString()) || 0)) > 0.01
        ) {
            setFormData(prev => ({
                ...prev,
                purchasePriceIncTax: pInc.toFixed(2),
                price: sExc.toFixed(2),
                purchaseCost: pExc.toFixed(2)
            }))
        }
    }, [formData.purchasePriceExcTax, formData.margin, formData.taxId, taxes])

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

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsDocUploading(true)
        const reader = new FileReader()
        reader.onloadend = async () => {
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        image: reader.result, // Reuse existing field name in API for simplicity as I generalized it
                        filename: file.name
                    })
                })
                const data = await res.json()
                if (data.url) {
                    setFormData({ ...formData, brochureUrl: data.url })
                    toast.success('Document Asset Synchronized')
                }
            } catch (error) {
                toast.error('Document Synchronization Failure')
            } finally {
                setIsDocUploading(false)
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
            const selectedBrand = brands.find(b => b.id === formData.brandId)?.name
            const res = await fetch('/api/ai/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    brand: selectedBrand,
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
            alertQuantity: parseInt(formData.alertQuantity.toString()),
            purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost.toString()) : undefined,
            purchasePriceExcTax: parseFloat(formData.purchasePriceExcTax.toString()) || 0,
            purchasePriceIncTax: parseFloat(formData.purchasePriceIncTax.toString()) || 0,
            margin: parseFloat(formData.margin.toString()) || 25,
            supplierId: formData.supplierId || undefined
        })
    }

    return (
        <div className={`${isModal ? 'p-2' : 'min-h-screen p-8 md:p-12'} font-sans selection:bg-emerald-100 bg-transparent custom-scrollbar overflow-y-auto`}>
            {!isModal && <Toaster position="top-right" />}
            
            <form onSubmit={handleSubmit} className={`${isModal ? 'p-4' : 'max-w-7xl mx-auto'} space-y-12 pb-20`}>
                {!isModal && (
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-gray-100 pb-12">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-sm">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Asset Registry: Global Hub</span>
                            </div>
                            <h2 className="text-8xl font-black text-slate-950 tracking-tighter leading-none italic">
                                Asset <span className="text-emerald-600 NOT-italic font-black">Construction</span>
                            </h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-[11px] italic">Strategic Resource Architecture Terminal</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button 
                                type="button"
                                onClick={onCancel}
                                className="px-8 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                            >
                                Abort Protocol
                            </button>
                            <button 
                                type="submit"
                                className="bg-slate-950 text-white px-12 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-900/10 active:scale-95 border border-emerald-500/10 flex items-center gap-3 group"
                            >
                                <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                Transmit to Ledger
                            </button>
                        </div>
                    </div>
                )}

            <div className={`grid grid-cols-1 ${isModal ? 'lg:grid-cols-5' : 'md:grid-cols-3'} gap-10`}>
                {/* Primary Intelligence Section */}
                <div className={`${isModal ? 'lg:col-span-3' : 'md:col-span-2'} space-y-10`}>
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
                                <div className="relative">
                                    <select 
                                        className="w-full p-6 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800 appearance-none"
                                        value={formData.unitId}
                                        onChange={(e) => setFormData({...formData, unitId: e.target.value})}
                                    >
                                        <option value="">Select Unit...</option>
                                        {units.map(unit => (
                                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Brand */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Global Brand</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-6 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800 appearance-none"
                                        value={formData.brandId}
                                        onChange={(e) => setFormData({...formData, brandId: e.target.value})}
                                    >
                                        <option value="">Select Brand...</option>
                                        {brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
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
                <div className={`${isModal ? 'lg:col-span-2' : ''} space-y-8`}>
                    {/* Advanced Pricing Strategy */}
                    <div className="bg-emerald-950 rounded-[3rem] shadow-2xl p-10 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Tag className="w-32 h-32 text-emerald-500" />
                        </div>
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between border-b border-emerald-800 pb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tighter italic uppercase">Fiscal Strategy Hub</h3>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Unit Cost & Margin Synchronization</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-emerald-500 uppercase tracking-widest block ml-1">Tax Protocol</label>
                                        <select 
                                            className="bg-emerald-900 text-white text-[10px] font-black p-3 rounded-xl border border-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none min-w-[120px]"
                                            value={formData.taxId}
                                            onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                                        >
                                            <option value="">No Tax Strategy...</option>
                                            {taxes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-emerald-500 uppercase tracking-widest block ml-1">Tax Type</label>
                                        <select 
                                            className="bg-emerald-900 text-white text-[10px] font-black p-3 rounded-xl border border-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none min-w-[120px]"
                                            value={formData.taxType}
                                            onChange={(e) => setFormData({...formData, taxType: e.target.value})}
                                        >
                                            <option value="EXCLUSIVE">Exclusive</option>
                                            <option value="INCLUSIVE">Inclusive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Purchase Price Exc Tax */}
                                <div className="bg-emerald-900/40 p-6 rounded-[2rem] border border-emerald-800 space-y-3">
                                    <label className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] block">Purc. Exc. Tax</label>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-700 italic">₹</span>
                                        <input 
                                            type="number" step="0.01"
                                            className="w-full bg-transparent pl-4 text-xl font-black text-white italic outline-none"
                                            value={formData.purchasePriceExcTax}
                                            onChange={(e) => setFormData({...formData, purchasePriceExcTax: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Purchase Price Inc Tax */}
                                <div className="bg-emerald-900/20 p-6 rounded-[2rem] border border-emerald-800/50 space-y-3 opacity-80">
                                    <label className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] block">Purc. Inc. Tax</label>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-800 italic">₹</span>
                                        <input 
                                            readOnly
                                            type="number"
                                            className="w-full bg-transparent pl-4 text-xl font-black text-emerald-400 italic outline-none cursor-not-allowed"
                                            value={formData.purchasePriceIncTax}
                                        />
                                    </div>
                                </div>

                                {/* Margin */}
                                <div className="bg-emerald-900/40 p-6 rounded-[2rem] border border-emerald-500/20 space-y-3 bg-gradient-to-br from-emerald-900/40 to-teal-900/40">
                                    <label className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] block">Profit Margin (%)</label>
                                    <div className="relative">
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-700 italic">%</span>
                                        <input 
                                            type="number" step="0.1"
                                            className="w-full bg-transparent pr-6 text-xl font-black text-white italic outline-none"
                                            value={formData.margin}
                                            onChange={(e) => setFormData({...formData, margin: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Final Sell Exc Tax */}
                                <div className="bg-white p-6 rounded-[2rem] shadow-xl space-y-3">
                                    <label className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] block">Sell Exc. Tax</label>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-200 italic">₹</span>
                                        <input 
                                            type="number" step="0.01"
                                            className="w-full bg-transparent pl-4 text-2xl font-black text-emerald-600 italic tracking-tighter outline-none"
                                            value={formData.price}
                                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <p className="text-[8px] font-bold text-emerald-700 uppercase tracking-widest text-center italic">
                                * Pricing telemetry synchronized with {formData.taxType} tax protocol
                            </p>
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

                    {/* Quick Buy Purchase Integration (Optional) - Hidden in Multi-Procurement Modals */}
                    {!isModal && (
                        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-[3rem] border border-indigo-100 shadow-2xl p-8 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Truck className="w-24 h-24 text-indigo-900" />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div>
                                    <h3 className="text-xl font-black text-indigo-900 tracking-tighter italic uppercase flex items-center gap-2">
                                        Quick Buy <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-black NOT-italic tracking-widest">OPTIONAL</span>
                                    </h3>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Simultaneously originate vendor purchase order</p>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest ml-2">Primary Vendor (Supplier)</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full p-6 bg-white/60 backdrop-blur-sm border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 appearance-none shadow-sm"
                                                value={formData.supplierId}
                                                onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                                            >
                                                <option value="">No Initial Purchase...</option>
                                                {suppliers.map(sup => (
                                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {formData.supplierId && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest ml-2">Unit Purchase Cost</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300 italic">₹</span>
                                                <input 
                                                    required
                                                    type="number" step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full p-6 pl-12 bg-white/60 backdrop-blur-sm border-none rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-black text-xl text-indigo-900 italic tracking-tighter shadow-sm"
                                                    value={formData.purchaseCost}
                                                    onChange={(e) => setFormData({...formData, purchaseCost: e.target.value})}
                                                />
                                            </div>
                                            <p className="text-[9px] font-bold text-indigo-500 text-center uppercase tracking-widest mt-2">
                                                Logs as <span className="text-rose-500">UNPAID</span> purchase order in ledger
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

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
                            <input 
                                type="file" 
                                ref={docInputRef} 
                                className="hidden" 
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleDocUpload}
                            />
                            <button 
                                type="button" 
                                onClick={() => docInputRef.current?.click()}
                                disabled={isDocUploading}
                                className={`w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isDocUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isDocUploading ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Upload Local File'
                                )}
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
    </div>
    )
}
