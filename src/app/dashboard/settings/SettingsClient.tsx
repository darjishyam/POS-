'use client'

import { useState, useEffect } from 'react'
import { 
    Settings, 
    Save, 
    Store, 
    Globe, 
    DollarSign, 
    Percent, 
    MapPin, 
    Phone, 
    Mail, 
    Plus,
    Loader2,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

export default function SettingsClient() {
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [settings, setSettings] = useState<any>({
        storeName: 'BardPOS',
        currency: 'USD',
        currencySymbol: '$',
        taxRate: 0,
        address: '',
        phone: '',
        email: '',
        logo: ''
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings')
            if (res.ok) {
                const data = await res.json()
                setSettings(data)
            }
        } catch (error) {
            toast.error('Failed to synchronize system parameters')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const loadingToast = toast.loading('Synchronizing System Configuration...')
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...settings,
                    taxRate: parseFloat(settings.taxRate)
                })
            })
            if (res.ok) {
                toast.success('System Parameters Secured', { id: loadingToast })
                fetchSettings()
            }
        } catch (error) {
            toast.error('Configuration Synchronization Failure', { id: loadingToast })
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-emerald-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)]">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Global Configuration Protocol</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            System <span className="text-emerald-600 NOT-italic font-black">Parameters</span>
                        </h2>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-[#020617] hover:bg-black text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/10 transition-all active:scale-95 flex items-center gap-3 group border border-emerald-500/20"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> : <Save className="w-5 h-5 group-hover:text-emerald-400 transition-all" />}
                        Deploy Configuration
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Brand & Identity */}
                    <section className="bg-white rounded-[3.5rem] p-12 border border-gray-100 shadow-xl shadow-gray-100/30">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 bg-emerald-500 text-white rounded-[1.5rem] shadow-xl shadow-emerald-200">
                                <Store className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Brand Identity</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store naming and visual presence</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Legal Entity Name</label>
                                <input
                                    type="text"
                                    value={settings.storeName}
                                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800 text-lg tracking-tight"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Visual Asset URL (Logo)</label>
                                <input
                                    type="text"
                                    value={settings.logo}
                                    onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Financial Matrix */}
                    <section className="bg-white rounded-[3.5rem] p-12 border border-gray-100 shadow-xl shadow-gray-100/30">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 bg-emerald-500 text-white rounded-[1.5rem] shadow-xl shadow-emerald-200">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Financial Matrix</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency and taxation parameters</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Currency Code</label>
                                <input
                                    type="text"
                                    value={settings.currency}
                                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                    placeholder="USD"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Symbol</label>
                                <input
                                    type="text"
                                    value={settings.currencySymbol}
                                    onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                    placeholder="$"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Taxation Protocol (%)</label>
                                <input
                                    type="number"
                                    value={settings.taxRate}
                                    onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Operational Coordinates */}
                    <section className="bg-white rounded-[3.5rem] p-12 border border-gray-100 shadow-xl shadow-gray-100/30">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 bg-emerald-500 text-white rounded-[1.5rem] shadow-xl shadow-emerald-200">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Operational Coordinates</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact and address registry</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Physical Address</label>
                                <textarea
                                    value={settings.address}
                                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800 h-32 resize-none"
                                    placeholder="Global HQ Address..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Support Hotline</label>
                                    <input
                                        type="text"
                                        value={settings.phone}
                                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                        className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                        placeholder="+1..."
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">System Email Registry</label>
                                    <input
                                        type="email"
                                        value={settings.email}
                                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                        className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                        placeholder="admin@bardpos.hq"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </form>
            </div>
        </div>
    )
}
