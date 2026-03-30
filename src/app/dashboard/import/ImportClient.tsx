'use client'

import { useState } from 'react'
import { 
    Upload, 
    FileText, 
    Download, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight,
    Search,
    ShieldCheck,
    Database,
    CloudUpload
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'

export default function ImportClient() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [step, setStep] = useState(1)
    const [importType, setImportType] = useState<'products' | 'customers'>('products')
    const [previewData, setPreviewData] = useState<any[]>([])
    const [isValidating, setIsValidating] = useState(false)

    const handleUpload = () => {
        if (!file) return
        setUploading(true)
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setPreviewData(results.data)
                setUploading(false)
                setStep(2)
                toast.success(`Matrix Analyzed: ${results.data.length} Entities Found`)
            },
            error: (error) => {
                setUploading(false)
                toast.error(`Ingestion Failure: ${error.message}`)
            }
        })
    }

    const handleCommit = async () => {
        setIsValidating(true)
        try {
            const res = await fetch('/api/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: importType, data: previewData })
            })
            const result = await res.json()
            
            if (res.ok) {
                toast.success(`Success: ${result.created.length} Records Committed`)
                if (result.skipped.length > 0) {
                    toast.error(`${result.skipped.length} Records Skipped (Duplicates/Invalid)`)
                }
                setTimeout(() => {
                    router.push(importType === 'products' ? '/dashboard/inventory' : '/dashboard/customers')
                }, 2000)
            } else {
                toast.error(result.error || 'Ingestion Protocol Fault')
            }
        } catch (error) {
            toast.error('System Synchronization Failure')
        } finally {
            setIsValidating(false)
        }
    }

    const downloadTemplate = () => {
        let headers = []
        let fileName = ""
        if (importType === 'products') {
            headers = ['name', 'price', 'stock', 'sku', 'image', 'description']
            fileName = "BardPOS_Product_Template.csv"
        } else {
            headers = ['name', 'email', 'phone']
            fileName = "BardPOS_Customer_Template.csv"
        }
        
        const csv = headers.join(",")
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", fileName)
        link.click()
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-emerald-100 min-h-screen bg-transparent">
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)]">
                            <CloudUpload className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Data Ingestion Protocol</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Import <span className="text-emerald-600 NOT-italic font-black">Registry</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 p-1 rounded-2xl mr-4">
                            <button 
                                onClick={() => setImportType('products')}
                                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${importType === 'products' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Products
                            </button>
                            <button 
                                onClick={() => setImportType('customers')}
                                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${importType === 'customers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Customers
                            </button>
                        </div>
                        <button 
                            onClick={downloadTemplate}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            <Download className="w-4 h-4" />
                            Template .CSV
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl p-16 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03]">
                            <Database className="w-64 h-64 text-emerald-600" />
                        </div>

                        {step === 1 ? (
                            <div className="space-y-12 relative">
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-gray-950 tracking-tighter italic uppercase">Upload Manifest</h3>
                                    <p className="text-xs font-bold text-gray-400 max-w-lg leading-relaxed uppercase tracking-widest">
                                        Select your entity registry file (CSV or XLSX). Ensure all columns match the industrial specification for seamless ingestion.
                                    </p>
                                </div>

                                <div 
                                    className={`border-4 border-dashed border-slate-100 rounded-[3rem] p-24 flex flex-col items-center justify-center gap-8 group hover:border-emerald-200 transition-all cursor-pointer ${file ? 'bg-emerald-50/30' : 'bg-slate-50/30'}`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault()
                                        if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0])
                                    }}
                                >
                                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all ${file ? 'bg-emerald-600 text-white shadow-xl rotate-0' : 'bg-white text-slate-300 group-hover:-rotate-6'}`}>
                                        <CloudUpload className="w-12 h-12" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                                            {file ? file.name : 'Drop Manifest Here'}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            {file ? `${(file.size / 1024).toFixed(2)} KB detected` : 'or click to browse local storage'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        disabled={!file || uploading}
                                        onClick={handleUpload}
                                        className="flex-[2] py-6 bg-slate-900 hover:bg-black text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 border border-emerald-500/20"
                                    >
                                        {uploading ? 'Analyzing...' : 'Execute Ingestion'}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-12 relative animate-in slide-in-from-bottom-8 duration-500">
                                <div className="flex items-center gap-6 p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-emerald-950 tracking-tighter italic uppercase leading-none mb-2">Validation Success</p>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">342 contacts authorized for ingestion</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Preview (First 5 Records)</h4>
                                    <div className="bg-slate-50 rounded-[2rem] border border-gray-100 overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    {previewData[0] && Object.keys(previewData[0]).slice(0, 3).map(key => (
                                                        <th key={key} className="px-6 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">{key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.slice(0, 5).map((row, i) => (
                                                    <tr key={i} className="border-b border-gray-100 last:border-0">
                                                        {Object.values(row).slice(0, 3).map((val: any, j) => (
                                                            <td key={j} className="px-6 py-4 text-[10px] font-bold text-slate-700">{val}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-12">
                                    <button
                                        onClick={() => { setStep(1); setFile(null); }}
                                        className="flex-1 py-6 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel Protocol
                                    </button>
                                    <button
                                        onClick={handleCommit}
                                        disabled={isValidating}
                                        className="flex-[2] py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isValidating ? 'Synchronizing...' : 'Commit to Database'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
