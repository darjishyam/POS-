'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { 
    LayoutDashboard, Users, Package, ShoppingCart, ArrowLeftRight, Settings, 
    BarChart3, UserCircle, Receipt, ListFilter, Truck, MapPin, Layers, Upload, 
    LogOut, ChevronDown, PlusCircle, List, User, ShieldCheck, Zap, TrendingUp,
    Tag, AlertTriangle
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const menuGroups = [
    {
        name: 'Systems',
        items: [
            { name: 'Command Center', icon: LayoutDashboard, path: '/dashboard' },
        ]
    },
    {
        name: 'Human Capital',
        icon: Users,
        items: [
            { name: 'Fleet Operators', icon: List, path: '/dashboard/users' },
            { name: 'Permission Nodes', icon: Layers, path: '/dashboard/roles' },
            { name: 'Field Agents', icon: UserCircle, path: '/dashboard/agents' },
        ]
    },
    {
        name: 'External Nodes',
        icon: Truck,
        items: [
            { name: 'Supply Chain', icon: Truck, path: '/dashboard/suppliers' },
            { name: 'Client Database', icon: UserCircle, path: '/dashboard/customers' },
            { name: 'Segment Groups', icon: Layers, path: '/dashboard/customer-groups' },
        ]
    },
    {
        name: 'Material Assets',
        icon: Package,
        items: [
            { name: 'Inventory Ledger', icon: List, path: '/dashboard/inventory' },
            { name: 'Classifications', icon: ListFilter, path: '/dashboard/categories' },
            { name: 'Brand Setup', icon: Tag, path: '/dashboard/inventory/brands' },
            { name: 'Unit Setup', icon: Layers, path: '/dashboard/inventory/units' },
        ]
    },
    {
        name: 'Sales Hub',
        icon: ShoppingCart,
        items: [
            { name: 'All Sales', icon: List, path: '/dashboard/orders' },
            { name: 'Add Sale', icon: PlusCircle, path: '/dashboard/orders/create' },
            { name: 'Active POS', icon: Zap, path: '/pos' },
            { name: 'Drafts', icon: Receipt, path: '/dashboard/orders?status=draft' },
            // { name: 'Quotations', icon: ListFilter, path: '/dashboard/orders?status=quotation' },
            { name: 'Sales Returns', icon: ArrowLeftRight, path: '/dashboard/orders/returns' },
            // { name: 'Shipments', icon: Truck, path: '/dashboard/orders/shipments' },
        ]
    },
    {
        name: 'Financials',
        icon: Receipt,
        items: [
            { name: 'Purchase Logs', icon: ShoppingCart, path: '/dashboard/purchases' },
            { name: 'Expense Audit', icon: Receipt, path: '/dashboard/expenses' },
            { name: 'Expense Categories', icon: ListFilter, path: '/dashboard/expenses/categories' },
            { name: 'Discounts', icon: Layers, path: '/dashboard/customer-groups' },
        ]
    },
    {
        name: 'Intelligence',
        icon: BarChart3,
        items: [
            { name: 'Reports Hub', icon: LayoutDashboard, path: '/dashboard/reports' },
            { name: 'Profit / Loss', icon: TrendingUp, path: '/dashboard/reports?type=profit-loss' },
            { name: 'Purchase & Sale', icon: ArrowLeftRight, path: '/dashboard/reports?type=purchase-sale' },
            { name: 'Stock Report', icon: Package, path: '/dashboard/reports?type=stock' },
            { name: 'Stock Alerts', icon: AlertTriangle, path: '/dashboard/inventory/stock-limit' },
            { name: 'Expense Audit', icon: Receipt, path: '/dashboard/reports?type=expenses' },
            { name: 'Core Config', icon: Settings, path: '/dashboard/settings' },
        ]
    }
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { user, logout } = useAuth()
    const [openGroups, setOpenGroups] = useState<string[]>(['Human Capital', 'External Nodes', 'Material Assets', 'Intelligence'])

    const toggleGroup = (name: string) => {
        setOpenGroups(prev => 
            prev.includes(name) 
                ? prev.filter(g => g !== name) 
                : [...prev, name]
        )
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-[#0f172a] text-slate-400 flex flex-col z-[41] shadow-[10px_0_50px_-10px_rgba(0,0,0,0.3)] print:hidden overflow-hidden border-r border-slate-800">
            {/* Logo Section */}
            <div className="p-8 pb-10 flex items-center gap-4 group">
                <div className="relative">
                    <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 group-hover:rotate-6 transition-transform duration-500 relative z-10">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-indigo-600/20 blur-xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-white tracking-tighter italic leading-none">Matrix <span className="text-indigo-500 NOT-italic font-black">Core</span></h1>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mt-1 italic">Governance 2.5</p>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar pb-6">
                <div className="mb-6 px-4">
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4 italic">Primary Systems</p>
                </div>
                
                {menuGroups.map((group) => (
                    <div key={group.name} className="space-y-1">
                        {group.icon ? (
                            <>
                                <button 
                                    onClick={() => toggleGroup(group.name)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group hover:bg-white/5 ${
                                        openGroups.includes(group.name) ? 'text-white' : 'text-slate-500'
                                    }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${openGroups.includes(group.name) ? 'bg-indigo-500 scale-100' : 'bg-slate-800 scale-0 group-hover:scale-100'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest flex-1 text-left">{group.name}</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-500 ${openGroups.includes(group.name) ? 'rotate-180 text-indigo-500' : 'opacity-30'}`} />
                                </button>
                                
                                {openGroups.includes(group.name) && (
                                    <div className="ml-5 pl-4 border-l border-slate-900/50 space-y-1 mt-1 animate-in slide-in-from-left-4 duration-500">
                                        {group.items.map((item) => {
                                            const itemPath = item.path.split('?')[0]
                                            const itemType = item.path.includes('type=') ? item.path.split('type=')[1] : null
                                            const currentType = searchParams.get('type')
                                            
                                            const isActive = pathname === itemPath && (itemType === null ? !currentType : itemType === currentType)

                                            return (
                                                <Link 
                                                    key={item.path} 
                                                    href={item.path}
                                                    className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 group/item ${
                                                        isActive ? 'text-white bg-blue-600/10' : 'text-slate-500 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    {isActive && (
                                                        <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
                                                    )}
                                                    <item.icon className={`w-3.5 h-3.5 transition-colors duration-300 ${isActive ? 'text-blue-500' : 'text-slate-700 group-hover/item:text-slate-300'}`} />
                                                    {item.name}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-1 py-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.path
                                    return (
                                        <Link 
                                            key={item.path} 
                                            href={item.path}
                                            className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-500 group/item ${
                                                isActive ? 'bg-blue-600 text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <item.icon className={`w-4 h-4 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover/item:scale-110'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{item.name}</span>
                                            {isActive && (
                                                <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* User Profile & Footer Section */}
            <div className="p-6 bg-slate-900/50 border-t border-slate-800 mt-auto">
                <div className="flex items-center gap-4 mb-6 px-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group cursor-pointer relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <User className="w-5 h-5 text-indigo-400 relative z-10" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{(user as any)?.displayName || 'Admin'}</p>
                            <ShieldCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        </div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest truncate">{user?.email || 'MATRIX OPERATOR'}</p>
                    </div>
                </div>

                <button 
                    onClick={() => logout()}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-slate-950 border border-slate-900 text-slate-500 hover:text-rose-500 hover:border-rose-500/20 hover:bg-rose-500/[0.02] transition-all duration-500 group font-black text-[10px] uppercase tracking-widest italic"
                >
                    <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-500" />
                    Terminate Connection
                </button>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </aside>
    )
}
